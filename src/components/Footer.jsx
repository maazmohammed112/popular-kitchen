import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-pk-surface border-t border-pk-bg-secondary mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start">
          <Link to="/" className="flex items-center gap-2 mb-2">
             <img src="/logo.png" alt="Popular Kitchen Logo" className="h-6 object-contain" onError={(e) => e.target.style.display='none'} />
            <span className="font-bold text-sm tracking-wide">Popular Kitchen</span>
          </Link>
          <p className="text-xs text-pk-text-muted text-center md:text-left">
            Premium kitchenware for your culinary journey. <br/>
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        <div className="flex gap-4 text-xs text-pk-text-muted">
          <Link to="/terms" className="hover:text-pk-text-main">Terms</Link>
          <Link to="/privacy" className="hover:text-pk-text-main">Privacy</Link>
          <Link to="/admin/login" className="hover:text-pk-accent">Admin Staff</Link>
        </div>
      </div>
    </footer>
  );
};
