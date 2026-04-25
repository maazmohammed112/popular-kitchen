import { Link } from 'react-router-dom';
import { FiHome, FiAlertCircle } from 'react-icons/fi';
import { SEO } from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-[slideUp_0.4s_ease-out]">
      <SEO 
        title="404 - Page Not Found" 
        description="The page you are looking for does not exist." 
      />
      
      {/* Branding / Logo */}
      <div className="mb-8 p-4 bg-pk-surface rounded-3xl shadow-xl border border-pk-bg-secondary">
        <img 
          src="/logo.png" 
          alt="Primkart Kitchenware Logo" 
          className="h-20 w-20 object-contain mx-auto"
          onError={e => e.target.style.display='none'}
        />
      </div>

      <div className="max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <span className="text-9xl font-black text-pk-bg-secondary leading-none select-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiAlertCircle size={48} className="text-pk-accent animate-pulse" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-pk-text-main mb-4 tracking-tight">Oops! Page not found</h1>
        <p className="text-pk-text-muted mb-10 leading-relaxed">
          The page you're looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-pk-accent text-white rounded-2xl font-bold shadow-[0_8px_30px_rgba(30,144,255,0.4)] hover:shadow-[0_12px_40px_rgba(30,144,255,0.5)] hover:-translate-y-1 transition-all active:scale-95"
        >
          <FiHome size={20} />
          Back to Home Page
        </Link>
      </div>

      <div className="mt-16 text-[10px] text-pk-text-muted/30 font-mono tracking-widest uppercase">
        Error Code: PK-404-NOT-FOUND
      </div>
    </div>
  );
}
