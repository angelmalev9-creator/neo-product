import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="neo-section-spacing">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border border-border/15 bg-card/20 backdrop-blur-sm p-10 sm:p-16 text-center overflow-hidden"
        >
          {/* Gradient orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-4 font-mono">
              Готови ли сте да не пропускате клиенти?
            </h2>
            <p className="neo-subheading text-muted-foreground mb-8 max-w-md mx-auto">
              Настройте NEO за 30 секунди. Без кредитна карта.
            </p>
            <Button
              size="lg"
              className="neo-btn-primary text-sm sm:text-base px-8 py-5 font-bold rounded-full gap-2 w-full sm:w-auto"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Започнете безплатно
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
