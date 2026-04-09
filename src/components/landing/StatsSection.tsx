import { Clock, Zap, Settings, Globe } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const stats = [
  { icon: Clock, value: '24/7', label: 'Наличност', desc: 'Без почивки и болнични' },
  { icon: Zap, value: '<2', suffix: 's', label: 'Време за отговор', desc: 'Мигновена реакция' },
  { icon: Settings, value: '30', suffix: ' сек', label: 'Настройка', desc: 'От нула до готово' },
  { icon: Globe, value: 'BG', label: 'На български', desc: 'Естествен разговор' },
];

const CountUp = ({ target, suffix = '' }: { target: string; suffix?: string }) => {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const num = parseInt(target);
        if (isNaN(num)) { setDisplay(target); return; }
        let start = 0;
        const duration = 1200;
        const step = (ts: number) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * num).toString());
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const isNumeric = !isNaN(parseInt(target));

  return (
    <span ref={ref}>
      {isNumeric ? display : target}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="neo-section-spacing">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative rounded-2xl border border-border/15 bg-card/30 backdrop-blur-sm p-5 text-center group hover:border-primary/20 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-foreground font-mono mb-1">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs font-semibold text-foreground/60 mb-0.5">{stat.label}</p>
                <p className="text-[10px] text-foreground/30">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
