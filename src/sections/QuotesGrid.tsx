import { Section } from '@/src/components/Section';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

export default function QuotesGrid() {
  const { title, quotes } = APP_CONTENT.quotes;

  return (
    <Section id="quotes">
      <FadeIn block>
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] text-primary mb-4">
            FROM THE COMMUNITY
          </span>
          <h2 className="text-[clamp(30px,4.6vw,64px)] font-bold leading-[1.08] tracking-tight text-foreground mb-5">
            {title}
          </h2>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {quotes.map((quote, i) => (
          <FadeIn key={`quote-${i}`} delay={(i % 12) * 40} block>
            <div className="group relative bg-surface border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-all duration-300 h-full flex flex-col">
              <div className="flex-1">
                <svg className="w-5 h-5 text-primary/30 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                </svg>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">&ldquo;{quote.text}&rdquo;</p>
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-xs font-bold text-foreground">{quote.author}</p>
                <p className="text-[11px] text-muted">{quote.role}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
