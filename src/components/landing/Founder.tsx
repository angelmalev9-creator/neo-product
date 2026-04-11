import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import devOfNeoImg from '@/assets/dev-of-neo.png';

const Founder = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="founder"
      className="neo-section-spacing relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-primary/4 opacity-30 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="neo-glass-premium rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-14 relative overflow-hidden">
            <div className="absolute -z-0 top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/5 to-transparent" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center relative z-10">
              {/* Photo */}
              <div className="lg:col-span-1 flex justify-center">
                <div className="relative">
                  <img 
                    src={devOfNeoImg} 
                    alt="Ангел Малев — създател на NEO" 
                    className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-xl sm:rounded-2xl object-cover shadow-xl shadow-primary/10 border border-primary/15"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-2 text-center lg:text-left">
                <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  Кой стои зад NEO
                </p>
                <h2 className="neo-heading-section font-display font-black text-foreground mb-5">
                  Здравейте, казвам се{' '}
                  <span className="text-primary">Ангел Малев.</span>
                </h2>
                
                <div className="space-y-3 mb-8">
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Направих NEO, защото гледах как баща ми губи клиенти в автосервиза си всеки ден. Звъняха в 7 сутринта, в 9 вечерта, в неделя — а нас ни нямаше до телефона. Всеки пропуснат разговор беше загубена работа.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    NEO не е продукт на голяма фирма — правя го сам, в България, за българските бизнеси. Ако нещо не работи както очаквате, пишете ми директно и отговарям лично.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button variant="outline" className="gap-2 rounded-xl border-border/30 hover:border-primary/30 h-11 w-full sm:w-auto" asChild>
                    <a href="mailto:admin@neo-assistant.com">
                      <Mail className="w-4 h-4" />
                      admin@neo-assistant.com
                    </a>
                  </Button>
                  <Button 
                    className="neo-btn-primary gap-2 rounded-xl h-11 w-full sm:w-auto"
                    onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Пробвайте NEO
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
