import { ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FinalCTA = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`neo-section-spacing relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-secondary bg-card/30 p-10 sm:p-14 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,hsl(200_70%_40%/0.1),transparent_70%)] pointer-events-none" />

          <h2 className="relative text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-4 font-mono leading-tight">
            Всеки изминал ден губите несъзнателно клиенти без NEO
          </h2>
          <p className="relative text-sm sm:text-base text-muted-foreground mb-8">
            Създайте свой NEO Асистент в рамките на 5 минути, без технически знания или чужда намеса.
          </p>
          <Button
            asChild
            className="relative neo-btn-primary text-sm px-8 py-4 h-auto font-bold rounded-full group gap-2"
          >
            <Link to="/auth">
              Пробвайте NEO безплатно
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
          <p className="relative text-xs text-muted-foreground/50 mt-4">
            Или{' '}
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-primary hover:underline font-medium"
            >
              изберете план →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
