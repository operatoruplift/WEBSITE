
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
          <p className="text-muted mt-4 font-mono text-sm">Last Updated: April 2026</p>
        </div>

        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-bold mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you create an account, use our interactive features, or communicate with us. This may include your name, email address, and payment information. We also automatically collect log data and usage information when you use the Operator Uplift platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to process your transactions, to send you technical notices and support messages, and to detect and prevent fraud.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">3. Where Your Data Goes</h2>
            <p>
              When you use the web app at operatoruplift.com, your chat content is processed by our servers (Vercel + Supabase) and forwarded to whichever AI provider you select (Anthropic, OpenAI, Google, xAI, DeepSeek). Privy handles authentication. Each link is a real third party we contract with; we don&apos;t resell your data.
            </p>
            <p className="mt-3">
              Your local settings, custom-agent configs, and chat session cache are stored in your browser&apos;s localStorage. Server-side, we store: your account record (Privy DID + email), subscription state, audit-log entries, and uploaded knowledge. You can export or delete this data at any time from <a href="/settings" className="text-[#F97316] hover:underline">Settings → Data</a>.
            </p>
            <p className="mt-3">
              Our roadmap includes a desktop app that runs on your machine and can route to local Ollama for the AI step. That capability is in development; this Privacy Policy will be updated to describe it accurately when it ships.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-bold mb-3">4. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or services (e.g., GitHub, Model Providers) that are not owned or controlled by Operator Uplift. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party services.
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
