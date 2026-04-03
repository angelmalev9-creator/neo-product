import { useScrollAnimation } from '@/hooks/useScrollAnimation';

import { Mail, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Founder = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="founder"
      className="py-20 sm:py-28 relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="neo-glass-premium rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-14 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute -z-0 top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/5 to-transparent" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center relative z-10">
              {/* Photo */}
              <div className="lg:col-span-1 flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/15 shadow-xl shadow-primary/10">
                    <span className="text-5xl sm:text-6xl lg:text-7xl">👨‍💻</span>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                    <Quote className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-2 text-center lg:text-left">
                <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  Кой стои зад NEO
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground mb-5 leading-[1.1] tracking-tight">
                  Здравейте, казвам се{' '}
                  <span className="text-primary">Ангел Малев</span>
                </h2>
                
                <div className="space-y-3 mb-8">
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Създадох NEO, защото видях колко клиенти губят малките бизнеси просто защото никой не успява да отговори навреме.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    NEO не е продукт на голяма корпорация. Това е проект, който разработвам лично, с идеята да помогне на бизнесите да не изпускат клиенти.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button variant="outline" className="gap-2 rounded-xl border-border/30 hover:border-primary/30 h-11" asChild>
                    <a href="mailto:support@neo-voice.ai">
                      <Mail className="w-4 h-4" />
                      Пишете ми директно
                    </a>
                  </Button>
                  <Button 
                    className="neo-btn-primary gap-2 rounded-xl h-11"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Опитайте NEO
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Founder;
