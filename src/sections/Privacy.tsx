
import React, { useEffect } from 'react';

const Privacy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="w-full min-h-screen bg-background pt-32 pb-24 px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-[800px] text-gray-300 space-y-8">
        <div className="border-b border-white/10 pb-8 mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-4">LEGAL</div>
          <h1 className="text-4xl md:text-5xl text-white font-medium tracking-tight">Privacy Policy</h1>
          <p className="text-muted mt-4 font-mono text-sm">Last Updated: October 2025</p>
        </div>

        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-bold mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you create an account, use our interactive features, or communicate with us. This may include your name, email address, and payment information. We also automatically collect log data and usage information when you use the Uplift platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to process your transactions, to send you technical notices and support messages, and to detect and prevent fraud.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">3. Data Security (Local-First)</h2>
            <p>
              Uplift is designed with a local-first architecture. Your agent configurations, session logs, and sensitive context data are processed within your isolated environment. We do not have access to the internal state of your agents unless you explicitly enable cloud logging or diagnostic sharing.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">4. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or services (e.g., GitHub, Model Providers) that are not owned or controlled by Uplift. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">5. Your Rights</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal data. You may also opt out of receiving promotional communications from us.
            </p>
          </section>

           <section>
            <h2 className="text-xl text-white font-bold mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@operatoruplift.com.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
