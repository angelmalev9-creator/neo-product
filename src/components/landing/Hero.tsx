import { Zap, Clock, Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100svh-4rem)] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center py-16 sm:py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 neo-grid-bg opacity-5 pointer-events-none" />

      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[700px] mx-auto lg:mx-0 text-center lg:text-left">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 neo-glass-subtle px-3.5 py-1.5 mb-6 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-foreground/50 text-[10px] font-semibold tracking-[0.12em] uppercase">
              {t('hero.badge')}
            </span>
          </motion.div>

          {/* Main Headline — 48-64px range */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[28px] leading-[1.12] sm:text-[40px] lg:text-[52px] xl:text-[60px] font-display font-black text-foreground mb-4 sm:mb-5 tracking-tight">
            <span><PencilUnderline>{t('hero.headline1')}</PencilUnderline></span>
            <br />
            <span className="neo-gradient-text-animated">
              {t('hero.headline2')}
            </span>
          </motion.h1>
          
          {/* Subheadline — 16-18px */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm leading-relaxed sm:text-base lg:text-lg text-foreground/40 mb-6 sm:mb-8 max-w-[560px] mx-auto lg:mx-0 font-medium">
            {t('hero.subheadline')}
            <span className="text-foreground/80 font-bold"> {t('hero.price')}</span>
          </motion.p>

          {/* CTA Buttons — 44-48px height */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-8 sm:mb-10 lg:justify-start justify-center">
            <Button
              size="lg"
              className="neo-btn-primary text-sm px-6 py-2.5 h-11 font-bold rounded-full w-full sm:w-auto group"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              <span>{t('hero.cta')}</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="neo-glass-subtle border-0 text-foreground/50 hover:text-foreground text-sm px-5 py-2.5 h-11 rounded-full w-full sm:w-auto transition-all duration-300 hover:bg-foreground/5 font-bold"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('hero.ctaSecondary')}
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-stretch gap-3 sm:gap-4 mb-6 lg:justify-start justify-center">
            {[
              { value: t('hero.stat1Value'), label: t('hero.stat1Label'), icon: Zap },
              { value: t('hero.stat2Value'), label: t('hero.stat2Label'), icon: Clock },
              { value: t('hero.stat3Value'), label: t('hero.stat3Label'), icon: Users },
            ].map((stat) => (
              <div
                key={stat.label}
                className="neo-glass-subtle flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 text-center rounded-xl group hover:scale-[1.02] transition-transform duration-300 min-w-0">
                <div className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{stat.value}</div>
                <div className="text-[8px] sm:text-[9px] text-foreground/30 uppercase tracking-[0.1em] mt-0.5 font-semibold leading-tight">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-foreground/25 text-[11px] sm:text-xs font-medium lg:justify-start justify-center">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {t('hero.trust1')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {t('hero.trust2')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {t('hero.trust3')}
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
