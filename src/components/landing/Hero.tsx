import { Zap, Clock, Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[85vh] flex items-center justify-center py-10 sm:py-12 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 neo-grid-bg opacity-10 pointer-events-none" />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-accent/4 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-5 sm:px-4 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 sm:gap-3 neo-glass-premium px-5 sm:px-5 py-2.5 sm:py-2.5 mb-8 sm:mb-7 lg:mb-10 rounded-full">
            
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-foreground/60 text-[10px] lg:text-xs font-semibold tracking-[0.2em] uppercase">
              {t('hero.badge')}
            </span>
            
            

            
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[1.75rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-display font-black text-foreground leading-[1.1] sm:leading-[1.08] mb-4 sm:mb-6 lg:mb-8 tracking-wide px-0">
            
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
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/40 mb-8 sm:mb-8 lg:mb-12 px-2 sm:px-4 lg:px-0 max-w-2xl mx-auto leading-relaxed font-medium">
            
            {t('hero.subheadline')}
            <span className="text-foreground/80 font-bold"> {t('hero.price')}</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-4 lg:gap-5 mb-12 sm:mb-12 lg:mb-16 px-3 sm:px-4 lg:px-0">
            
            <Button
              size="lg"
              className="neo-btn-primary text-[13px] sm:text-sm lg:text-base px-6 sm:px-7 lg:px-10 py-5 sm:py-4 lg:py-5 h-auto font-bold rounded-full w-full sm:w-auto group"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              
              <Play className="w-4 h-4 mr-1 fill-current" />
              <span>{t('hero.cta')}</span>
              
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="neo-glass-premium border-0 text-foreground/60 hover:text-foreground text-[15px] sm:text-sm lg:text-base px-7 sm:px-6 lg:px-8 py-5 sm:py-4 lg:py-5 h-auto rounded-full w-full sm:w-auto transition-all duration-300 hover:bg-foreground/5 font-bold"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              
              {t('hero.ctaSecondary')}
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex items-stretch justify-center gap-2.5 sm:gap-4 lg:gap-6 mb-8 sm:mb-10 px-0">
            
            {[
            { value: t('hero.stat1Value'), label: t('hero.stat1Label'), icon: Zap },
            { value: t('hero.stat2Value'), label: t('hero.stat2Label'), icon: Clock },
            { value: t('hero.stat3Value'), label: t('hero.stat3Label'), icon: Users }].
            map((stat, i) =>
            <div
              key={stat.label}
              className="neo-glass-premium flex-1 sm:flex-none px-2.5 sm:px-5 lg:px-7 py-3 sm:py-4 lg:py-5 text-center rounded-xl sm:rounded-2xl group hover:scale-[1.03] transition-transform duration-300 min-w-0">
              
                <div className="text-lg sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{stat.value}</div>
                <div className="text-[7px] sm:text-[9px] lg:text-[10px] text-foreground/30 uppercase tracking-[0.1em] sm:tracking-[0.15em] mt-1 sm:mt-1.5 font-semibold leading-tight">{stat.label}</div>
              </div>
            )}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 lg:gap-8 text-foreground/25 text-[13px] sm:text-xs lg:text-sm font-medium">
            
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {t('hero.trust1')}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {t('hero.trust2')}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {t('hero.trust3')}
            </span>
          </motion.div>
        </div>
      </div>
    </section>);

};

export default Hero;