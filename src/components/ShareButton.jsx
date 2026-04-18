import { FiShare2 } from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';

export const ShareButton = ({ product, className = "" }) => {
  const { showSuccess } = useToast();
  
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: product.title,
      text: `Check out this ${product.title} at Popular Kitchen!`,
      url: `${window.location.origin}/product/${product.id}`,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        showSuccess('Product link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50 transition-all shadow-lg ring-1 ring-black/5 ${className}`}
      title="Share Product"
    >
      <FiShare2 size={16} />
    </button>
  );
};
