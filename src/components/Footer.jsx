import { Link } from 'react-router-dom';
import { FiMoon, FiSun, FiMapPin, FiPhone, FiMail, FiArrowUpRight } from 'react-icons/fi';

export const Footer = ({ toggleTheme }) => {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <footer className="mt-16 border-t border-pk-bg-secondary" style={{ background: 'var(--color-primary)', color: 'white' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="bg-white p-1.5 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                <img src="/logo.png" alt="Popular Kitchen Logo" className="h-7 w-7 object-contain" onError={e => e.target.style.display='none'} />
              </div>
              <span className="font-bold text-base text-white tracking-tight">Popular Kitchen</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              Premium kitchenware for your culinary journey.<br />
              Trusted distributor based in Bangalore.
            </p>
            {/* Copper accent underline */}
            <div className="mt-4 w-12 h-1 rounded-full" style={{ background: 'var(--color-tertiary)' }} />
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide uppercase" style={{ letterSpacing: '0.08em' }}>
              Contact Us
            </h4>
            <div className="space-y-3">
              <a href="tel:+918892836046" className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/15 group-hover:border-white/30 transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <FiPhone size={13} />
                </div>
                +91 88928 36046
              </a>
              <a href="mailto:mohammed@popularkitchen.store" className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/15 group-hover:border-white/30 transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <FiMail size={13} />
                </div>
                mohammed@popularkitchen.store
              </a>
              <div className="flex items-start gap-3 text-sm text-white/60">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/15" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <FiMapPin size={13} />
                </div>
                <span>363/3, Jumma Masjid Road, Shivaji Nagar, Bengaluru 560001</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide uppercase" style={{ letterSpacing: '0.08em' }}>
              Quick Links
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
              { to: '/about', label: 'About Us' },
                { to: '/my-orders', label: 'My Orders' },
                { to: '/support', label: 'Support' },
                { to: '/terms', label: 'Terms of Service' },
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/sitemap.xml', label: 'Sitemap' },
              ].map(link => (
                <Link key={link.to} to={link.to} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors group">
                  <FiArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 -translate-y-0.5 group-hover:translate-y-0 translate-x-0 group-hover:translate-x-0.5 transition-all" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Popular Kitchen. Built by{' '}
            <a 
              href="https://www.maazportfolio.site/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-mono font-bold hover:opacity-80 transition-opacity" 
              style={{ color: 'var(--color-tertiary)' }}
            >
              &lt;mma/&gt;
            </a>
          </p>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-all hover:bg-white/10 border border-white/15"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <span className="dark:hidden flex items-center gap-2"><FiMoon size={13} /> Dark Mode</span>
            <span className="hidden dark:flex items-center gap-2"><FiSun size={13} /> Light Mode</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
