import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheck, FiX, FiClock } from 'react-icons/fi';

export const ConfirmOrderModal = ({ onConfirm, onCancel, isSubmitting }) => {
  const [countdown, setCountdown] = useState(3);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanConfirm(true);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pk-primary/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-pk-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-[slideUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-pk-bg-secondary">
          <div className="w-16 h-16 bg-pk-tertiary/10 text-pk-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
            <FiAlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-pk-text-main">Confirm Your Order</h2>
        </div>

        {/* Content */}
        <div className="p-8 space-y-4">
          <div className="bg-pk-bg-primary p-4 rounded-2xl border-l-4 border-pk-tertiary">
            <p className="text-sm text-pk-text-main font-medium leading-relaxed">
              "Please do not place false orders. Further payment details and order communication will be handled via WhatsApp/Phone after you confirm. Please cooperate for a smooth experience."
            </p>
          </div>
          
          <p className="text-xs text-pk-text-muted text-center italic">
            By clicking confirm, you agree to respond to our team's communication regarding this order.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isSubmitting}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100`}
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                {canConfirm ? <FiCheck size={18} /> : <FiClock size={18} className="animate-spin" />}
                Confirm & Place Order { !canConfirm && `(${countdown}s)` }
              </>
            )}
          </button>

          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl border-2 font-bold text-sm transition-all hover:bg-pk-bg-primary flex items-center justify-center gap-2 active:scale-95"
            style={{ borderColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}
          >
            <FiX size={18} /> Cancel & Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
