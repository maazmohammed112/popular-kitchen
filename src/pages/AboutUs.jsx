import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiShield, FiAward, FiUsers, FiTruck, FiStar, FiArrowRight } from 'react-icons/fi';
import { SEO } from '../components/SEO';

const StatCard = ({ value, label, icon: Icon }) => (
  <div className="bg-pk-bg-primary rounded-2xl p-6 border border-pk-bg-secondary text-center flex flex-col items-center gap-3">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
      <Icon size={22} className="text-white" />
    </div>
    <p className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>{value}</p>
    <p className="text-sm text-pk-text-muted font-medium">{label}</p>
  </div>
);

const ValueCard = ({ title, description, icon: Icon }) => (
  <div className="bg-pk-surface rounded-2xl p-6 border border-pk-bg-secondary hover:border-pk-secondary/40 hover:shadow-md transition-all group">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all" style={{ background: 'var(--color-tertiary)' }}>
      <Icon size={18} className="text-white" />
    </div>
    <h3 className="font-bold text-pk-text-main mb-2">{title}</h3>
    <p className="text-sm text-pk-text-muted leading-relaxed">{description}</p>
  </div>
);

export default function AboutUs() {
  return (
    <div className="animate-[slideUp_0.4s_ease-out] max-w-5xl mx-auto">
      <SEO
        title="About Us – Primkart Kitchenware Bangalore | Shivajinagar"
        description="Learn about Primkart Kitchenware – Bangalore's trusted kitchen equipment supplier in Shivajinagar. Serving homes, hotels and restaurants since day one."
        url="https://primkart.app/about"
      />

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-10 p-8 md:p-14 text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 -translate-y-1/4 translate-x-1/4"
          style={{ background: 'var(--color-tertiary)' }} />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Primkart Kitchenware Logo" className="h-10 w-10 object-contain bg-white rounded-xl p-1" />
            <span className="text-white text-sm font-semibold uppercase tracking-widest">Since 2002</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight text-white">
            Bangalore's Trusted<br />
            <span style={{ color: 'var(--color-tertiary)' }}>Kitchenware</span> Store
          </h1>
          <p className="text-base text-white leading-relaxed max-w-xl">
            Primkart Kitchenware is a premier kitchen equipment supplier based in Shivajinagar, Bangalore — serving homes, restaurants, hotels, and catering businesses across the city with quality products at honest prices.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-95"
              style={{ background: 'var(--color-tertiary)', color: 'white' }}>
              Shop Now <FiArrowRight size={16} />
            </Link>
            <a href="tel:+918892836046" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border border-white/30 bg-white/10 hover:bg-white/20 transition-all text-white">
              <FiPhone size={16} /> Call Us
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard value="20+" label="Years in the Market" icon={FiAward} />
        <StatCard value="1000+" label="Happy Customers" icon={FiUsers} />
        <StatCard value="500+" label="Products Available" icon={FiStar} />
        <StatCard value="2-3" label="Days Delivery Bangalore" icon={FiTruck} />
      </div>

      {/* Our Story */}
      <div className="bg-pk-surface rounded-3xl p-8 border border-pk-bg-secondary mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-tertiary)' }} />
          <h2 className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>Our Story</h2>
        </div>
        <div className="space-y-4 text-pk-text-muted leading-relaxed text-sm">
          <p>
            <strong className="text-pk-text-main">Primkart Kitchenware</strong> was founded with a simple mission: to make professional-grade kitchen equipment accessible to every home, restaurant, and business in Bangalore. Located at the heart of Shivajinagar on Jumma Masjid Road, our store has been a go-to destination for quality kitchenware since we opened our doors.
          </p>
          <p>
            We stock an extensive catalogue — from everyday essentials like induction stoves, hand blenders, and gas lighters to specialized commercial equipment including shawarma machines, barbecue grills, and restaurant-grade cooking tools. Whether you're equipping a home kitchen or a full-scale restaurant, we have everything you need under one roof.
          </p>
          <p>
            Our physical showroom in Shivajinagar allows customers to walk in, see the products firsthand, and get expert advice from our knowledgeable team. We also offer fast online ordering with delivery across Bangalore, making it easy to get the kitchen equipment you need — wherever you are in the city.
          </p>
          <p>
            We believe in transparency, honest pricing, and after-sales support. Every product we sell is carefully selected for quality and durability, whether for home use or commercial operations.
          </p>
        </div>
      </div>

      {/* Why Trust Us */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-tertiary)' }} />
          <h2 className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>Why Customers Trust Us</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ValueCard icon={FiShield}
            title="Physical Store You Can Visit"
            description="We are a real, physical store located in Shivajinagar, Bangalore. Walk in, see the products, and talk to our team in person — anytime during business hours." />
          <ValueCard icon={FiAward}
            title="Verified Quality Products"
            description="Every item in our catalogue is hand-picked and tested for quality. We work directly with manufacturers to ensure you get reliable products at fair prices." />
          <ValueCard icon={FiTruck}
            title="Fast Bangalore Delivery"
            description="We deliver across all Bangalore pin codes within 2–3 business days. Track your order in real-time and get instant support via WhatsApp." />
          <ValueCard icon={FiUsers}
            title="Serving 1000+ Customers"
            description="From home cooks to hotel chains, over 1,000 satisfied customers across Bangalore trust Primkart Kitchenware for their kitchen equipment needs." />
        </div>
      </div>

      {/* Contact / Location */}
      <div className="rounded-3xl overflow-hidden border border-pk-bg-secondary mb-8 bg-pk-surface">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-tertiary)' }} />
            <h2 className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>Find Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--color-primary)' }}>
                  <FiMapPin size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-pk-text-main text-sm">Store Address</p>
                  <p className="text-sm text-pk-text-muted mt-0.5 leading-relaxed">
                    363/3, Jumma Masjid Road, Cross, OPH Road,<br />
                    Opposite Sana Creation, Shivaji Nagar,<br />
                    Bengaluru – 560001, Karnataka
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary)' }}>
                  <FiPhone size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-pk-text-main text-sm">Phone</p>
                  <a href="tel:+918892836046" className="text-sm hover:underline" style={{ color: 'var(--color-secondary)' }}>
                    +91 88928 36046
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary)' }}>
                  <FiMail size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-pk-text-main text-sm">Email</p>
                  <a href="mailto:mohammed@primkart.app" className="text-sm hover:underline" style={{ color: 'var(--color-secondary)' }}>
                    mohammed@primkart.app
                  </a>
                </div>
              </div>
              <div className="rounded-xl p-3.5 border border-pk-bg-secondary bg-pk-bg-primary text-xs text-pk-text-muted leading-relaxed">
                <strong className="text-pk-text-main block mb-1">Business Hours:</strong>
                Mon – Sun: 9:00 AM – 11:00 PM<br />
                <span className="text-[10px] italic opacity-70">* Timing may differ on public holidays</span>
              </div>
            </div>
            {/* Embedded Google Map */}
            <div className="rounded-2xl overflow-hidden border border-pk-bg-secondary h-64 md:h-auto bg-pk-bg-secondary">
              <iframe
                title="Primkart Kitchenware Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9423!2d77.5951!3d12.9815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzUzLjQiTiA3N8KwMzUnNDIuNCJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%" height="100%" style={{ border: 0, minHeight: '200px' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center rounded-3xl p-10 text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }}>
        <h2 className="text-2xl font-black mb-3 text-white">Ready to Upgrade Your Kitchen?</h2>
        <p className="text-white text-sm mb-6 opacity-80">Browse our full catalogue of professional kitchen equipment, available online with fast delivery across Bangalore.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-95"
          style={{ background: 'var(--color-tertiary)', color: 'white' }}>
          Shop All Products <FiArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
