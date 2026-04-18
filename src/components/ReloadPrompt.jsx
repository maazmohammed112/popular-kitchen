import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { FiRefreshCw, FiX } from 'react-icons/fi';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 right-4 left-4 z-[99] sm:left-auto sm:max-w-sm pointer-events-none animate-[slideUp_0.4s_ease-out]">
      <div className="bg-pk-surface border border-pk-accent/30 rounded-2xl p-5 shadow-2xl pointer-events-auto flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-pk-text-main font-semibold mb-1">
            {needRefresh ? 'New version available!' : 'App ready to work offline'}
          </p>
          <p className="text-xs text-pk-text-muted">
            {needRefresh ? 'Refresh to see the latest premium kitchenware.' : 'You can browse Popular Kitchen even without internet.'}
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-pk-accent text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-pk-accent/20"
            >
              <FiRefreshCw size={14} /> Update
            </button>
          )}
          <button
            onClick={close}
            className="text-pk-text-muted hover:text-pk-text-main p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
