import { Zap, Clock, Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100svh-5rem)] flex items-center py-24 sm:py-32 lg:py-40 overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        <div className="max-w-[800px] mx-auto text-center">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-border/30 bg-card/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-foreground/50 text-sm font-medium">
              {t('hero.badge')}
            </span>
          </motion.div>

          {/* Main Headline — 72-96px desktop */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[42px] leading-[1.05] sm:text-[64px] lg:text-[80px] xl:text-[88px] font-display font-extrabold text-foreground mb-6 sm:mb-8 tracking-[-0.03em]">
            <span>{t('hero.headline1')}</span>
            <br />
            <span className="neo-gradient-text-animated">
              {t('hero.headline2')}
            </span>
          </motion.h1>
          
          {/* Subheadline — 18-20px */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-foreground/40 mb-8 sm:mb-10 max-w-[600px] mx-auto font-normal leading-relaxed">
            {t('hero.subheadline')}
            <span className="text-foreground/70 font-semibold"> {t('hero.price')}</span>
          </motion.p>

          {/* CTA Buttons — big lime pills */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-12 sm:mb-16 justify-center">
            <Button
              size="lg"
              className="neo-btn-primary text-lg px-9 py-5 h-14 font-semibold rounded-full w-full sm:w-auto group"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play className="w-4 h-4 mr-2 fill-current" />
              <span>{t('hero.cta')}</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border/30 bg-transparent text-foreground/60 hover:text-foreground text-lg px-8 py-5 h-14 rounded-full w-full sm:w-auto transition-all duration-300 hover:bg-foreground/5 font-medium hover:border-foreground/20"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('hero.ctaSecondary')}
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-8 sm:gap-12 justify-center mb-8">
            {[
              { value: t('hero.stat1Value'), label: t('hero.stat1Label'), icon: Zap },
              { value: t('hero.stat2Value'), label: t('hero.stat2Label'), icon: Clock },
              { value: t('hero.stat3Value'), label: t('hero.stat3Label'), icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-foreground/30 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground/25 text-sm font-medium justify-center">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {t('hero.trust1')}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {t('hero.trust2')}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {t('hero.trust3')}
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
