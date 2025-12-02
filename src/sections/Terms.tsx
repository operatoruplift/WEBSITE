
import React, { useEffect } from 'react';

const Terms: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="w-full min-h-screen bg-background pt-32 pb-24 px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-[800px] text-gray-300 space-y-8">
        <div className="border-b border-white/10 pb-8 mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-4">LEGAL</div>
          <h1 className="text-4xl md:text-5xl text-white font-medium tracking-tight">Terms of Service</h1>
          <p className="text-muted mt-4 font-mono text-sm">Last Updated: October 2025</p>
        </div>

        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-bold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Uplift platform ("Service"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">2. Description of Service</h2>
            <p>
              Uplift provides an agentic AI infrastructure platform that allows users to run, manage, and deploy AI agents in isolated environments. We reserve the right to modify, suspend, or discontinue the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">3. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the security of your account and any API keys or tokens provided. You agree not to use the Service for any illegal or unauthorized purpose. You must not transmit any worms, viruses, or any code of a destructive nature.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">4. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of Uplift and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">5. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

           <section>
            <h2 className="text-xl text-white font-bold mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall Uplift, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
};

export default Terms;
