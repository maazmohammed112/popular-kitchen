import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const WelcomeModal = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasBeenWelcomed = localStorage.getItem('pk_welcomed');
    if (!hasBeenWelcomed) {
      // Delay slightly for smooth transition after GlobalLoader
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSkip = () => {
    localStorage.setItem('pk_welcomed', 'true');
    setShow(false);
  };

  const handleAction = (type) => {
    localStorage.setItem('pk_welcomed', 'true');
    setShow(false);
    window.dispatchEvent(new CustomEvent('show-auth-modal', { detail: type }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-pk-bg-primary/80 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-sm bg-pk-surface rounded-2xl p-6 shadow-2xl animate-[slideUp_0.4s_ease-out]">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center mb-4 bg-white/5 p-2 rounded-xl w-max">
             <img src="/logo.png" alt="Primkart Kitchenware Logo" className="h-16 object-contain" onError={(e) => e.target.style.display='none'} />
          </div>
          <h2 className="text-xl font-bold text-pk-text-main mb-2">Welcome to Primkart Kitchenware!</h2>
          <p className="text-pk-text-muted text-sm leading-relaxed">
            Discover premium kitchenware to elevate your culinary experience. Join us for exclusive offers.
          </p>
        </div>
        
        <div className="space-y-3 flex flex-col">
          <button 
            onClick={() => handleAction('signin')}
            className="w-full py-3 rounded-xl bg-pk-accent text-white font-medium hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => handleAction('signup')}
            className="w-full py-3 rounded-xl bg-pk-bg-secondary text-pk-text-main font-medium border border-pk-bg-secondary hover:border-pk-text-muted transition-colors"
          >
            Create Account
          </button>
          <button 
            onClick={handleSkip}
            className="w-full py-2 text-pk-text-muted font-medium hover:text-pk-text-main transition-colors text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
