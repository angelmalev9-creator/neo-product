import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { Mail, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Founder = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="founder" className="py-20 sm:py-24 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
        <div className="neo-glass-subtle rounded-xl sm:rounded-2xl p-5 sm:p-7 lg:p-10 relative overflow-hidden">
          <div className="absolute -z-0 top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/3 to-transparent" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-center relative z-10">
            <div className="lg:col-span-1 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
                  <span className="text-4xl sm:text-5xl">👨‍💻</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Quote className="w-3 h-3 text-primary" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 text-center lg:text-left">
              <p className="text-primary text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Кой стои зад NEO</p>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-foreground mb-4 leading-tight tracking-tight">
                <PencilUnderline>Здравейте, казвам се</PencilUnderline>{' '}
                <span className="neo-gradient-text">Ангел Малев</span>
              </h2>
              
              <div className="space-y-2 mb-6">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Създадох NEO, защото видях колко клиенти губят малките бизнеси просто защото никой не успява да отговори навреме.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  NEO не е продукт на голяма корпорация. Това е проект, който разработвам лично, с идеята да помогне на бизнесите да не изпускат клиенти.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center lg:justify-start">
                <Button variant="outline" className="gap-2 rounded-lg border-border/25 hover:border-primary/25 h-10 text-sm" asChild>
                  <a href="mailto:support@neo-voice.ai">
                    <Mail className="w-3.5 h-3.5" /> Пишете ми директно
                  </a>
                </Button>
                <Button className="neo-btn-primary gap-2 rounded-lg h-10 text-sm"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  Опитайте NEO <ArrowRight className="w-3.5 h-3.5" />
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
