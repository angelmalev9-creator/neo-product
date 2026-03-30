import { Zap, Clock, Users, Play, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100svh-3rem)] sm:min-h-[65vh] lg:min-h-[80vh] flex items-center justify-center py-8 sm:py-12 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 neo-grid-bg opacity-5 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 neo-glass-premium px-5 py-2.5 mb-8 sm:mb-10 lg:mb-14 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-foreground/50 text-[10px] lg:text-xs font-bold tracking-[0.15em] uppercase">
              {t('hero.badge')}
            </span>
          </motion.div>

          {/* Main Headline — large, clean, authoritative */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[2.2rem] leading-[1.08] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-display font-black text-foreground sm:leading-[1.06] mb-5 sm:mb-8 lg:mb-10 tracking-wide">
            <span><PencilUnderline>{t('hero.headline1')}</PencilUnderline></span>
            <br />
            <span className="neo-gradient-text-animated">
              {t('hero.headline2')}
            </span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-[14px] leading-relaxed sm:text-lg md:text-xl lg:text-2xl text-foreground/40 mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-4 lg:px-0 max-w-2xl mx-auto font-medium">
            {t('hero.subheadline')}
          </motion.p>

          {/* Safe AI badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/8 border border-emerald-500/15 mb-8 sm:mb-10 lg:mb-12"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400/80 text-xs sm:text-sm font-semibold">{t('hero.price')}</span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-5 mb-10 sm:mb-14 lg:mb-16 px-2 sm:px-4 lg:px-0">
            <Button
              size="lg"
              className="neo-btn-primary text-[13px] sm:text-sm lg:text-base px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 h-auto font-bold rounded-full w-full sm:w-auto group whitespace-nowrap overflow-hidden"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play className="w-4 h-4 mr-1.5 fill-current" />
              <span>{t('hero.cta')}</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="neo-glass-premium border-0 text-foreground/50 hover:text-foreground text-[13px] sm:text-sm lg:text-base px-5 sm:px-6 lg:px-8 py-3.5 sm:py-4 lg:py-5 h-auto rounded-full w-full sm:w-auto transition-all duration-300 hover:bg-foreground/5 font-bold whitespace-nowrap overflow-hidden"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('hero.ctaSecondary')}
            </Button>
          </motion.div>

          {/* Stats Row — more spacious */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="flex items-stretch justify-center gap-3 sm:gap-5 lg:gap-8 mb-8 sm:mb-12">
            {[
              { value: t('hero.stat1Value'), label: t('hero.stat1Label'), icon: Zap },
              { value: t('hero.stat2Value'), label: t('hero.stat2Label'), icon: Clock },
              { value: t('hero.stat3Value'), label: t('hero.stat3Label'), icon: Users },
            ].map((stat) => (
              <div
                key={stat.label}
                className="neo-glass-premium flex-1 sm:flex-none px-3 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-6 text-center rounded-xl sm:rounded-2xl group hover:scale-[1.03] transition-transform duration-300 min-w-0">
                <div className="text-base sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{stat.value}</div>
                <div className="text-[8px] sm:text-[10px] lg:text-[11px] text-foreground/25 uppercase tracking-[0.1em] sm:tracking-[0.15em] mt-1 sm:mt-2 font-bold leading-tight">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-6 lg:gap-8 text-foreground/20 text-[11px] sm:text-xs lg:text-sm font-medium">
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
