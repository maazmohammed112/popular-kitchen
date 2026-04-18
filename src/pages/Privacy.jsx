import { FiShield } from 'react-icons/fi';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-pk-accent/20 rounded-full flex items-center justify-center text-pk-accent">
          <FiShield size={24} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-pk-text-main">Privacy Policy</h1>
      </div>
      
      <div className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 md:p-10 space-y-8 text-pk-text-main/90 leading-relaxed shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">1. Information We Collect</h2>
          <p>
            When you visit Popular Kitchen, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the Site, we collect information about the individual web pages or products that you view.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">2. Order Information</h2>
          <p>
            When you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information (processed securely through our partners), email address, and phone number. We refer to this information as "Order Information".
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">3. How We Use Your Information</h2>
          <p>
            We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to communicate with you and screen our orders for potential risk or fraud.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">4. Third-Party Sharing</h2>
          <p>
             We share your Personal Information with third parties to help us use your Personal Information, as described above. We use Cloudinary, Firebase, and standard analytical software to power our online store and evaluate customer trends securely.
          </p>
        </section>

        <div className="pt-6 border-t border-pk-bg-secondary text-sm text-pk-text-muted">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
