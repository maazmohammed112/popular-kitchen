import { FiGift, FiX, FiShield, FiClock } from 'react-icons/fi';

export const SignUpPromptModal = ({ onContinueAsGuest, onSignUp }) => (
  <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-[slideUp_0.35s_ease-out]">

      {/* Top image / icon */}
      <div className="w-16 h-16 bg-gradient-to-br from-pk-accent to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        <FiGift size={32} className="text-white" />
      </div>

      <h2 className="text-xl font-bold text-pk-text-main text-center mb-1">Sign Up for Better Offers!</h2>
      <p className="text-sm text-pk-text-muted text-center mb-5">
        Create a free account to unlock special deals, track all your orders securely, and save your address for faster checkout.
      </p>

      {/* Benefits */}
      <div className="space-y-2.5 mb-6">
        <div className="flex items-center gap-3 text-sm text-pk-text-main">
          <div className="w-7 h-7 rounded-lg bg-pk-success/15 flex items-center justify-center shrink-0">
            <FiShield size={14} className="text-pk-success" />
          </div>
          Secure order history & saved addresses
        </div>
        <div className="flex items-center gap-3 text-sm text-pk-text-main">
          <div className="w-7 h-7 rounded-lg bg-pk-accent/15 flex items-center justify-center shrink-0">
            <FiGift size={14} className="text-pk-accent" />
          </div>
          Exclusive member offers & discounts
        </div>
        <div className="flex items-center gap-3 text-sm text-pk-text-main">
          <div className="w-7 h-7 rounded-lg bg-pk-warning/15 flex items-center justify-center shrink-0">
            <FiClock size={14} className="text-pk-warning" />
          </div>
          Faster checkout on every order
        </div>
      </div>

      <button
        onClick={onSignUp}
        className="w-full py-3 bg-pk-accent text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(30,144,255,0.3)] mb-3"
      >
        Sign Up Free — It's Quick!
      </button>

      <button
        onClick={onContinueAsGuest}
        className="w-full py-2.5 text-sm text-pk-text-muted hover:text-pk-text-main transition-colors flex items-center justify-center gap-2"
      >
        <FiX size={14} /> Continue as Guest
      </button>
    </div>
  </div>
);
