import { useState, useEffect } from 'react';
import { FiDownload, FiX, FiStar, FiZap, FiCheck } from 'react-icons/fi';

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser mini-infobar
      e.preventDefault();
      // Store the event for later trigger
      setInstallPrompt(e);
      
      // Show the prompt after 3 seconds for first-time users
      const hasSeenPrompt = localStorage.getItem('pk_install_prompt_seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setIsInstalled(true);
      localStorage.setItem('pk_install_prompt_seen', 'true');
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the native browser install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install');
    }
    
    // Clear the prompt
    setInstallPrompt(null);
    setIsVisible(false);
    localStorage.setItem('pk_install_prompt_seen', 'true');
  };

  const closePrompt = () => {
    setIsVisible(false);
    // Don't show again for 7 days if they close it
    localStorage.setItem('pk_install_prompt_seen', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="fixed inset-x-4 bottom-6 z-[100] md:left-auto md:right-6 md:w-96 animate-[slideUp_0.5s_ease-out]">
      <div className="bg-pk-surface border border-pk-accent/20 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden group">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-pk-accent/10 rounded-full blur-3xl group-hover:bg-pk-accent/20 transition-all duration-1000"></div>
        
        <button 
          onClick={closePrompt}
          className="absolute top-4 right-4 text-pk-text-muted hover:text-pk-text-main p-1 transition-colors"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-pk-bg-secondary">
            <img src="/logo.png" alt="Primkart" className="w-10 h-10 object-contain" />
          </div>
          <div className="pt-1">
            <h3 className="text-lg font-bold text-pk-text-main tracking-tight leading-tight mb-1">
              Primkart Kitchenware
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-pk-accent uppercase tracking-widest">
              <span className="flex items-center gap-0.5"><FiStar className="fill-current" /> 5.0</span>
              <span className="w-1 h-1 bg-pk-text-muted rounded-full"></span>
              <span>Official App</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-xs text-pk-text-muted">
            <div className="w-5 h-5 rounded-full bg-pk-success/10 flex items-center justify-center text-pk-success">
              <FiZap size={12} />
            </div>
            <span>Fast, lightning-speed browsing</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-pk-text-muted">
            <div className="w-5 h-5 rounded-full bg-pk-success/10 flex items-center justify-center text-pk-success">
              <FiCheck size={12} />
            </div>
            <span>Instant order tracking & notifications</span>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="w-full py-4 bg-pk-accent text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-pk-accent/20"
        >
          <FiDownload size={20} />
          Install App Now
        </button>
        
        <p className="text-[10px] text-center text-pk-text-muted mt-4">
          Takes only 2 seconds • Works offline
        </p>
      </div>
    </div>
  );
}
