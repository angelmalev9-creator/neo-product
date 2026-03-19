import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { Linkedin, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Founder = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="founder"
      className={`py-16 lg:py-24 relative overflow-hidden neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="neo-glass-subtle rounded-2xl lg:rounded-3xl border border-border/20 p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
              {/* Photo placeholder */}
              <div className="lg:col-span-1 flex justify-center">
                <div className="relative">
                  <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                    <span className="text-6xl lg:text-7xl">👨‍💻</span>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10" />
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-2 text-center lg:text-left">
                <p className="text-primary text-sm font-medium uppercase tracking-wider mb-2">
                  Кой стои зад NEO
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black text-foreground mb-4 leading-[1.1] tracking-wide">
                  <PencilUnderline>Здравейте, казвам се</PencilUnderline> <span className="neo-gradient-text">Ангел Малев</span>
                </h2>
                
                <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">
                  Създадох NEO, защото видях колко клиенти губят малките бизнеси просто защото никой не успява да отговори навреме.
                </p>
                
                <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">
                  Затова направих гласов AI асистент, който може да говори с клиентите и да поема запитвания 24/7.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">
                  NEO не е продукт на голяма корпорация. Това е проект, който разработвам лично, с идеята да помогне на бизнесите да не изпускат клиенти.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button variant="outline" className="gap-2" asChild>
                    <a href="mailto:support@neo-voice.ai">
                      <Mail className="w-4 h-4" />
                      Пишете ми директно
                    </a>
                  </Button>
                  <Button className="neo-glow gap-2" asChild>
                    <a href="/#pricing">
                      Опитайте NEO
                      <ArrowRight className="w-4 h-4" />
                    </a>
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
