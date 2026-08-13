/**
 * Mic capture + gapless playback for the Gemini Live bridge.
 * Gemini expects 16-bit PCM, 16kHz, mono for input and returns the same at 24kHz.
 * https://ai.google.dev/gemini-api/docs/live
 */

function downsampleTo16kMono(input: Float32Array, inputRate: number): Int16Array {
  const targetRate = 16000;
  const ratio = inputRate / targetRate;
  const outLength = Math.floor(input.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = srcIndex - i0;
    const sample = input[i0] * (1 - frac) + input[i1] * frac;
    const s = Math.max(-1, Math.min(1, sample));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function arrayBufferToBase64(buf: ArrayBufferLike): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Captures the mic, downsamples to 16kHz mono PCM16, and streams base64 chunks. */
export class MicStreamer {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async start(onChunk: (base64Pcm16: string) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    // ScriptProcessorNode is deprecated but still the most broadly supported way
    // to get raw PCM samples without shipping a separate AudioWorklet module file.
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    const inputRate = this.ctx.sampleRate;

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = downsampleTo16kMono(input, inputRate);
      onChunk(arrayBufferToBase64(pcm16.buffer));
    };

    this.source.connect(this.processor);
    // onaudioprocess only fires once the node is connected to a destination.
    // Route through a silent gain so the mic is never looped back audibly.
    const silence = this.ctx.createGain();
    silence.gain.value = 0;
    this.processor.connect(silence);
    silence.connect(this.ctx.destination);
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.ctx && this.ctx.state !== 'closed') this.ctx.close();
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.ctx = null;
  }
}

/** Schedules incoming 24kHz PCM16 chunks back-to-back for gapless playback. */
export class LiveAudioPlayer {
  private ctx: AudioContext;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {
    this.ctx = new AudioContext({ sampleRate: 24000 });
  }

  enqueue(base64Pcm16: string): void {
    const buf = base64ToArrayBuffer(base64Pcm16);
    const pcm16 = new Int16Array(buf);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000;

    const audioBuffer = this.ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    const startAt = Math.max(now, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + audioBuffer.duration;

    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
    };
  }

  /** Barge-in: stop everything queued/playing immediately. */
  flush(): void {
    this.activeSources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // already ended
      }
    });
    this.activeSources = [];
    this.nextStartTime = this.ctx.currentTime;
  }

  get isPlaying(): boolean {
    return this.activeSources.length > 0;
  }

  close(): void {
    this.flush();
    if (this.ctx.state !== 'closed') this.ctx.close();
  }
}
