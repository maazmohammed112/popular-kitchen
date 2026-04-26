import { FiHelpCircle, FiChevronDown, FiAlertCircle, FiShield, FiTruck, FiRefreshCw } from 'react-icons/fi';
import { useState } from 'react';
import { SEO } from '../components/SEO';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-pk-bg-secondary">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex justify-between items-center text-left hover:text-pk-accent transition-colors group"
      >
        <span className="font-bold text-base md:text-lg pr-8">{question}</span>
        <FiChevronDown className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-pk-accent' : 'text-pk-text-muted group-hover:text-pk-accent'}`} size={20} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] pb-6' : 'max-h-0'}`}>
        <div className="text-pk-text-muted text-sm md:text-base leading-relaxed bg-pk-bg-secondary/30 p-5 rounded-2xl border border-pk-bg-secondary/50">
          {answer}
        </div>
      </div>
    </div>
  );
};

export default function FAQ() {
  const faqs = [
    {
      question: "How do I delete my account and personal data?",
      answer: (
        <>
          We value your privacy. To delete your account:
          <ol className="list-decimal ml-5 mt-3 space-y-2">
            <li>Sign in to your account.</li>
            <li>Click on your name at the top right and select <strong>"Account Settings"</strong>.</li>
            <li>Click the red <strong>"Delete My Account"</strong> button in the Danger Zone.</li>
            <li>An email request will be automatically generated to <strong>info@primkart.app</strong>.</li>
          </ol>
          Your account and all associated order history will be permanently removed within 2-3 business days.
        </>
      )
    },
    {
      question: "Where do you deliver?",
      answer: "We currently deliver exclusively within Bangalore and Outer Bangalore areas. We focus on local distribution to ensure your kitchenware arrives in perfect condition."
    },
    {
      question: "What are your delivery charges?",
      answer: "Delivery is FREE for all orders above ₹25,000 within our Bangalore delivery zones. For orders below this amount, standard delivery charges apply based on your exact location."
    },
    {
      question: "Is my payment information secure?",
      answer: "Absolutely. We use industry-standard encryption. Furthermore, we primarily offer 'Cash on Delivery' and secure bank transfers, meaning we never store your credit card details on our servers."
    },
    {
      question: "How can I track my order?",
      answer: "Once you place an order, you can visit the 'My Orders' section in your profile to see the real-time status. You will also receive updates via WhatsApp or Telegram if you've provided your contact details."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day replacement policy for manufacturing defects. Please inspect your items upon delivery and contact us at info@primkart.app with photos if you find any issues."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-[slideUp_0.4s_ease-out]">
      <SEO 
        title="FAQ - Primkart Kitchenware" 
        description="Frequently Asked Questions about Primkart Kitchenware, including delivery, account deletion, and order tracking."
      />

      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pk-accent/10 text-pk-accent text-xs font-bold uppercase tracking-widest mb-4">
          <FiHelpCircle /> Support Center
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-pk-text-main mb-4 tracking-tight">
          Common Questions
        </h1>
        <p className="text-pk-text-muted max-w-xl mx-auto">
          Everything you need to know about our products, delivery, and your account.
        </p>
      </div>

      <div className="bg-pk-surface rounded-[40px] p-6 md:p-12 shadow-2xl shadow-black/20 border border-pk-bg-secondary">
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} />
          ))}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-pk-bg-secondary/30 p-8 rounded-3xl border border-pk-bg-secondary text-center group hover:bg-pk-accent transition-all duration-500">
          <FiTruck className="mx-auto mb-4 text-pk-accent group-hover:text-white" size={32} />
          <h3 className="font-bold mb-2 group-hover:text-white">Fast Delivery</h3>
          <p className="text-xs text-pk-text-muted group-hover:text-white/80">Within Bangalore & Outer areas.</p>
        </div>
        <div className="bg-pk-bg-secondary/30 p-8 rounded-3xl border border-pk-bg-secondary text-center group hover:bg-pk-success transition-all duration-500">
          <FiShield className="mx-auto mb-4 text-pk-success group-hover:text-white" size={32} />
          <h3 className="font-bold mb-2 group-hover:text-white">Secure Access</h3>
          <p className="text-xs text-pk-text-muted group-hover:text-white/80">Social login for maximum safety.</p>
        </div>
        <div className="bg-pk-bg-secondary/30 p-8 rounded-3xl border border-pk-bg-secondary text-center group hover:bg-pk-secondary transition-all duration-500">
          <FiRefreshCw className="mx-auto mb-4 text-pk-secondary group-hover:text-white" size={32} />
          <h3 className="font-bold mb-2 group-hover:text-white">Easy Deletion</h3>
          <p className="text-xs text-pk-text-muted group-hover:text-white/80">Total control over your data.</p>
        </div>
      </div>

      <div className="mt-20 p-10 rounded-[40px] bg-pk-accent text-white text-center relative overflow-hidden group shadow-2xl shadow-pk-accent/30">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Still have questions?</h2>
          <p className="text-white/90 mb-6 max-w-md mx-auto">We're here to help you build your dream kitchen. Contact our support team directly.</p>
          <a 
            href="mailto:info@primkart.app" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-pk-accent rounded-full font-bold hover:scale-105 transition-transform"
          >
            Contact Support
          </a>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-1000"></div>
      </div>
    </div>
  );
}
