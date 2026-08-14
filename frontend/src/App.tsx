import { useState, useEffect, useCallback } from 'react';
import './theme/global.css';
import { TopBar } from './ui/TopBar';
import { LayerTabs } from './panels/LayerTabs';
import { LayerDocPanel } from './panels/LayerDocPanel';
import { ChatPanel } from './panels/ChatPanel';
import { Canvas } from './canvas/Canvas';
import { StatusSplash } from './ui/StatusSplash';
import { UploadModal } from './ui/UploadModal';
import { LandingScreen } from './ui/LandingScreen';
import { useAppStore } from './store/useAppStore';

function App() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  const {
    session,
    loading,
    polling,
    error,
    pollTimedOut,
    sessionList,
    sessionListLoading,
    fetchSessionList,
    chatLoading,
    chatInput,
    zoom,
    animLayerIndex,
    tracePath,
    viewMode,
    loadSession,
    nextLayer,
    activateLayer,
    sendChat,
    setChatInput,
    setZoom,
    setTracePath,
    setViewMode,
    exportSession,
    uploadSession,
  } = useAppStore();

  // Keyboard shortcut: Shift+N → next layer
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in an input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.shiftKey && e.key === 'N' && session?.status === 'ready') {
        nextLayer();
      }
      // C key toggles the chat sidebar
      if (e.key === 'c' || e.key === 'C') {
        setChatOpen(v => !v);
      }
    },
    [nextLayer, session]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Load the session picker's data once on mount — cheap (summary rows
  // only), and ready before the user ever lands on the "no session" screen.
  useEffect(() => {
    fetchSessionList();
  }, [fetchSessionList]);

  const isLoading = loading || (polling && session?.status !== 'ready');
  const isProcessing = session && session.status !== 'ready' && session.status !== 'failed';
  const showSplash = isLoading || isProcessing;

  const activeLayer = session?.layers?.[session.active_index ?? 0] ?? null;

  // Layout columns by view mode. The chat panel is no longer a permanent
  // grid column — it floats over the canvas as a collapsible sidebar (see
  // below), so the canvas always gets the full remaining width whether or
  // not chat happens to be open.
  const colLayout: Record<string, string> = {
    Document: '436px 1fr',
    Both: '436px 1fr',
    Canvas: '1fr',
  };
  const gridCols = colLayout[viewMode] || colLayout.Both;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% -10%, #151a35 0%, #0b0e1d 45%, #07080f 100%)' }}>
      <TopBar
        title={session?.title || 'Architecture Explainer'}
        subtitle={session?.subtitle}
        status={session?.status || 'ready'}
        sessionId={session?._id}
        zoom={zoom}
        onZoomChange={setZoom}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={exportSession}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Container */}
      {!session && !showSplash ? (
        /* Initial Landing View when no architecture is loaded */
        <LandingScreen
          onUpload={(files, mode, problemStatement, title) => uploadSession(files, mode, problemStatement, title)}
          onLoadDemo={() => loadSession('sess_ref_payments')}
          sessionList={sessionList}
          sessionListLoading={sessionListLoading}
          onSelectSession={(id) => loadSession(id)}
        />
      ) : (
        <>
          {/* Layer Tabs (when session ready) */}
          {session?.status === 'ready' && (
            <LayerTabs
              layers={(session.layers || []).map(l => ({ index: l.index, name: l.name, id: l.id }))}
              activeIndex={session.active_index ?? 0}
              unlockedIndex={session.unlocked_index ?? 0}
              onActivate={activateLayer}
            />
          )}

          {/* Main content grid */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: showSplash ? '1fr' : gridCols,
              gap: showSplash ? 0 : 16,
              padding: showSplash ? 0 : '0 16px 16px',
              overflow: 'hidden',
              transition: 'grid-template-columns .3s ease',
            }}
          >
            {showSplash ? (
              <StatusSplash
                status={session?.status || 'ingesting'}
                error={error}
                pollTimedOut={pollTimedOut}
                onCheckAgain={() => session && loadSession(session._id)}
              />
            ) : (
              <>
                {/* Document panel */}
                {viewMode !== 'Canvas' && (
                  <LayerDocPanel
                    layer={activeLayer}
                    unlockedIndex={session?.unlocked_index ?? 0}
                    onNextLayer={nextLayer}
                  />
                )}

                {/* Canvas */}
                {viewMode !== 'Document' && (
                  <Canvas
                    graph={session?.graph}
                    layers={session?.layers}
                    activeLayerIndex={session?.active_index ?? 0}
                    unlockedIndex={session?.unlocked_index ?? 0}
                    zoom={zoom}
                    animLayerIndex={animLayerIndex}
                    tracePath={tracePath}
                    layoutNodes={session?.layout?.nodes}
                    sessionId={session?._id}
                    isChatOpen={chatOpen && viewMode === 'Both'}
                  />
                )}

                {/* Chat sidebar — floats over the canvas instead of taking a
                    permanent grid column, so it can be collapsed for full
                    diagram width and reopened without reflowing anything. */}
                {viewMode === 'Both' && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 16,
                        width: 404,
                        zIndex: 20,
                        transform: chatOpen ? 'translateX(0)' : 'translateX(calc(100% + 16px))',
                        transition: 'transform .28s cubic-bezier(.2,.7,.2,1)',
                        pointerEvents: chatOpen ? 'auto' : 'none',
                      }}
                    >
                      <ChatPanel
                        sessionId={session?._id}
                        messages={session?.chat || []}
                        chatLoading={chatLoading}
                        chatInput={chatInput}
                        onInputChange={setChatInput}
                        onSend={sendChat}
                        onTraceClick={setTracePath}
                        activeLayerIndex={session?.active_index ?? 0}
                      />
                    </div>

                    {/* Drawer handle — when open: slim arrow tab on left edge of panel.
                        When closed: a prominent floating button so it's easy to find. */}
                    <button
                      onClick={() => setChatOpen(v => !v)}
                      title={chatOpen ? 'Collapse chat (C)' : 'Open chat (C)'}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: chatOpen ? 420 : 0,
                        transform: 'translateY(-50%)',
                        zIndex: 21,
                        width: chatOpen ? 22 : 36,
                        height: chatOpen ? 56 : 80,
                        borderRadius: chatOpen ? '10px 0 0 10px' : '12px 0 0 12px',
                        border: 0,
                        cursor: 'pointer',
                        background: chatOpen
                          ? 'rgba(10,13,26,.82)'
                          : 'linear-gradient(180deg, rgba(146,166,255,.22), rgba(79,214,176,.15))',
                        boxShadow: chatOpen
                          ? 'inset 0 1px 0 rgba(255,255,255,.08), -6px 0 20px rgba(0,0,0,.35)'
                          : 'inset 0 1px 0 rgba(255,255,255,.15), -8px 0 24px rgba(146,166,255,.2), inset 0 0 0 1px rgba(146,166,255,.3)',
                        color: chatOpen ? '#8f97bd' : '#b3c0ff',
                        fontSize: chatOpen ? 11 : 14,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        transition: 'right .28s cubic-bezier(.2,.7,.2,1), width .28s cubic-bezier(.2,.7,.2,1), height .28s cubic-bezier(.2,.7,.2,1)',
                      }}
                    >
                      {chatOpen ? (
                        '›'
                      ) : (
                        <>
                          {/* Chat bubble icon */}
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M2 2h12v9H9l-3 3v-3H2V2z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"/>
                          </svg>
                          {/* Rotated label */}
                          <span style={{
                            fontSize: 7.5,
                            fontFamily: 'Martian Mono, monospace',
                            letterSpacing: '.06em',
                            textTransform: 'uppercase',
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            color: '#92a6ff',
                            lineHeight: 1,
                          }}>Chat</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={(files, mode, problemStatement, title) => {
          uploadSession(files, mode, problemStatement, title);
        }}
      />
    </div>
  );
}

export default App;
