import { FiMapPin, FiPhone, FiMail, FiMessageCircle } from 'react-icons/fi';

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-pk-text-main mb-2">Contact & Support</h1>
      <p className="text-pk-text-muted mb-10">We're here to help. Reach out to us through any of the channels below.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Address */}
        <div className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 flex gap-4 hover:border-pk-accent/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-pk-accent/10 flex items-center justify-center text-pk-accent shrink-0">
            <FiMapPin size={22} />
          </div>
          <div>
            <h3 className="font-bold text-pk-text-main mb-1">Our Address</h3>
            <p className="text-sm text-pk-text-muted leading-relaxed">
              363/3, Jumma Masjid Road, Cross,<br />
              OPH Road, opposite Sana Creation,<br />
              Shivaji Nagar, Bengaluru,<br />
              Karnataka 560001
            </p>
          </div>
        </div>

        {/* Phone */}
        <a
          href="tel:+918892836046"
          className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 flex gap-4 hover:border-pk-accent/50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-pk-success/10 flex items-center justify-center text-pk-success shrink-0 group-hover:scale-110 transition-transform">
            <FiPhone size={22} />
          </div>
          <div>
            <h3 className="font-bold text-pk-text-main mb-1">Call Us</h3>
            <p className="text-sm text-pk-text-muted">+91 88928 36046</p>
            <p className="text-xs text-pk-text-muted mt-1">Mon–Sat, 9 AM – 7 PM</p>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:mma@popularkitchen.store"
          className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 flex gap-4 hover:border-pk-accent/50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-pk-warning/10 flex items-center justify-center text-pk-warning shrink-0 group-hover:scale-110 transition-transform">
            <FiMail size={22} />
          </div>
          <div>
            <h3 className="font-bold text-pk-text-main mb-1">Email Us</h3>
            <p className="text-sm text-pk-text-muted">mma@popularkitchen.store</p>
            <p className="text-xs text-pk-text-muted mt-1">We typically reply within 24 hours</p>
          </div>
        </a>

        {/* WhatsApp */}
        <a
          href="https://wa.me/919108167067?text=Hello%20Popular%20Kitchen!%20I%20need%20support."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 flex gap-4 hover:border-[#25D366]/50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 group-hover:scale-110 transition-transform">
            <FiMessageCircle size={22} />
          </div>
          <div>
            <h3 className="font-bold text-pk-text-main mb-1">WhatsApp Support</h3>
            <p className="text-sm text-pk-text-muted">+91 9108167067</p>
            <p className="text-xs text-pk-text-muted mt-1">Fastest response — usually within minutes</p>
          </div>
        </a>
      </div>

      {/* Map embed placeholder */}
      <div className="bg-pk-surface border border-pk-bg-secondary rounded-3xl overflow-hidden">
        <iframe
          title="Popular Kitchen Location"
          src="https://maps.google.com/maps?q=363%2F3+Jumma+Masjid+Road+Shivaji+Nagar+Bengaluru&output=embed"
          width="100%"
          height="300"
          className="w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
