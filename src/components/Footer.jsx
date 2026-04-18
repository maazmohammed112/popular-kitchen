import { Link } from 'react-router-dom';
import { FiMoon, FiSun, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

export const Footer = ({ toggleTheme }) => {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <footer className="bg-pk-surface border-t border-pk-bg-secondary mt-12 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Popular Kitchen Logo" className="h-7 object-contain" onError={e => e.target.style.display='none'} />
              <span className="font-bold tracking-wide">Popular Kitchen</span>
            </Link>
            <p className="text-xs text-pk-text-muted leading-relaxed">
              Premium kitchenware for your culinary journey.<br />
              Trusted distributor based in Bangalore.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-pk-text-main mb-3 text-sm">Contact Us</h4>
            <div className="space-y-2">
              <a href="tel:+918892836046" className="flex items-start gap-2 text-xs text-pk-text-muted hover:text-pk-text-main transition-colors">
                <FiPhone size={13} className="mt-0.5 shrink-0" />
                +91 88928 36046
              </a>
              <a href="mailto:mohammedusama520@gmail.com" className="flex items-start gap-2 text-xs text-pk-text-muted hover:text-pk-text-main transition-colors">
                <FiMail size={13} className="mt-0.5 shrink-0" />
                mohammedusama520@gmail.com
              </a>
              <div className="flex items-start gap-2 text-xs text-pk-text-muted">
                <FiMapPin size={13} className="mt-0.5 shrink-0" />
                <span>363/3, Jumma Masjid Road, Shivaji Nagar, Bengaluru 560001</span>
              </div>
            </div>
          </div>

          {/* Links + Theme Toggle */}
          <div>
            <h4 className="font-semibold text-pk-text-main mb-3 text-sm">Quick Links</h4>
            <div className="flex flex-col gap-2 text-xs text-pk-text-muted">
              <Link to="/my-orders" className="hover:text-pk-text-main transition-colors">My Orders</Link>
              <Link to="/support" className="hover:text-pk-text-main transition-colors">Support</Link>
              <Link to="/terms" className="hover:text-pk-text-main transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-pk-text-main transition-colors">Privacy Policy</Link>
              <Link to="/admin/login" className="hover:text-pk-accent transition-colors">Admin Staff</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-pk-bg-secondary">
          <p className="text-xs text-pk-text-muted">© {new Date().getFullYear()} Popular Kitchen. Built by &lt;mma/&gt;</p>

          {/* Dark Mode Toggle in footer */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs px-4 py-2 bg-pk-bg-primary border border-pk-bg-secondary rounded-full text-pk-text-muted hover:text-pk-text-main hover:border-pk-accent transition-colors"
          >
            <span className="dark:hidden flex items-center gap-2"><FiMoon size={14} /> Switch to Dark Mode</span>
            <span className="hidden dark:flex items-center gap-2"><FiSun size={14} /> Switch to Light Mode</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
