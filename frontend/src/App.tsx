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
      if (e.shiftKey && e.key === 'N' && session?.status === 'ready') {
        nextLayer();
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

  // Layout columns by view mode
  const colLayout: Record<string, string> = {
    Document: '380px 1fr',
    Both: '380px 1fr 340px',
    Canvas: '1fr',
  };
  const gridCols = colLayout[viewMode] || colLayout.Both;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f0f11' }}>
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
                  <div
                    style={{
                      borderRight: '1px solid #1d1d21',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#111113',
                    }}
                  >
                    <LayerDocPanel
                      layer={activeLayer}
                      unlockedIndex={session?.unlocked_index ?? 0}
                      onNextLayer={nextLayer}
                    />
                  </div>
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
                  />
                )}

                {/* Chat panel */}
                {viewMode === 'Both' && (
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
