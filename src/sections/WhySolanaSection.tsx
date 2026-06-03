import { Section } from '@/src/components/Section';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

export default function WhySolanaSection() {
  const { title, description, features } = APP_CONTENT.whySolana;

  return (
    <Section id="why-solana">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
        <span className="inline-block text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] text-primary mb-4">
          WHY SOLANA
        </span>
        <h2 className="text-[clamp(30px,4.6vw,64px)] font-bold leading-[1.08] tracking-tight text-foreground mb-5">
          {title}
        </h2>
        <p className="text-[clamp(15px,1.3vw,18px)] text-muted leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
        {features.map((feature, i) => (
          <FadeIn key={feature.title} delay={i * 80} block>
            <div className="group relative bg-surface border border-white/[0.06] rounded-xl p-6 sm:p-8 hover:border-primary/20 transition-all duration-500">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-mono font-bold mb-4">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted leading-relaxed">{feature.description}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
