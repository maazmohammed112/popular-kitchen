import { FiFileText } from 'react-icons/fi';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-pk-accent/20 rounded-full flex items-center justify-center text-pk-accent">
          <FiFileText size={24} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-pk-text-main">Terms of Service</h1>
      </div>
      
      <div className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 md:p-10 space-y-8 text-pk-text-main/90 leading-relaxed shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">1. Overview</h2>
          <p>
            This website is operated by Primkart Kitchenware. Throughout the site, the terms “we”, “us” and “our” refer to Primkart Kitchenware. We offer this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">2. Online Store Terms</h2>
          <p>
            By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">3. Products and Pricing</h2>
          <p>
            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold text-pk-text-main mb-4">4. Accuracy of Billing</h2>
          <p>
            We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made.
          </p>
        </section>

        <div className="pt-6 border-t border-pk-bg-secondary text-sm text-pk-text-muted">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
