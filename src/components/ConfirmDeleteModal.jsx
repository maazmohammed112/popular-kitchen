import { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * ConfirmDeleteModal — shared delete confirmation dialog
 * Props:
 *   message    {string}   – body text (default generic message)
 *   onConfirm  {fn}       – called when user clicks Delete
 *   onCancel   {fn}       – called when user clicks Cancel or outside
 *   isDeleting {boolean}  – show loading spinner on Delete button
 */
export function ConfirmDeleteModal({ message, onConfirm, onCancel, isDeleting = false }) {
  const confirmBtnRef = useRef(null);

  // Focus the cancel button by default for safety
  useEffect(() => {
    const timer = setTimeout(() => confirmBtnRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-pk-surface w-full max-w-sm rounded-2xl border border-pk-bg-secondary shadow-2xl p-6 animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pk-error/15 flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle size={20} className="text-pk-error" />
          </div>
          <h2 className="text-lg font-bold text-pk-text-main">Confirm Delete</h2>
          <button
            onClick={onCancel}
            className="ml-auto p-1.5 rounded-full text-pk-text-muted hover:text-pk-text-main hover:bg-pk-bg-secondary transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-pk-text-muted leading-relaxed mb-6">
          {message || 'This product will be permanently deleted. Are you sure?'}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-pk-text-muted hover:text-pk-text-main hover:bg-pk-bg-secondary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-pk-error hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-60 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting…
              </>
            ) : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
