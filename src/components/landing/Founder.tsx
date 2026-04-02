import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Mail, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Founder = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="founder" className="py-24 sm:py-32 lg:py-40 relative overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
        <div className="neo-glass-subtle rounded-2xl p-8 sm:p-10 lg:p-14 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-center relative z-10">
            <div className="lg:col-span-1 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <span className="text-5xl sm:text-6xl">👨‍💻</span>
                </div>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Quote className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 text-center lg:text-left">
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">Кой стои зад NEO</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-5 leading-tight tracking-tight">
                Здравейте, казвам се{' '}
                <span className="neo-gradient-text">Ангел Малев</span>
              </h2>
              
              <div className="space-y-3 mb-8">
                <p className="text-muted-foreground leading-relaxed text-base">
                  Създадох NEO, защото видях колко клиенти губят малките бизнеси просто защото никой не успява да отговори навреме.
                </p>
                <p className="text-muted-foreground leading-relaxed text-base">
                  NEO не е продукт на голяма корпорация. Това е проект, който разработвам лично, с идеята да помогне на бизнесите да не изпускат клиенти.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button variant="outline" className="gap-2 rounded-full border-border/20 hover:border-primary/25 h-12 text-base px-6 font-medium" asChild>
                  <a href="mailto:support@neo-voice.ai">
                    <Mail className="w-4 h-4" /> Пишете ми директно
                  </a>
                </Button>
                <Button className="neo-btn-primary gap-2 rounded-full h-12 text-base px-6 font-semibold"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  Опитайте NEO <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Founder;
