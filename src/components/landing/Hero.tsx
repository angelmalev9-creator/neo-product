import { ArrowRight, Zap, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[75vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center py-16 sm:py-12 lg:py-16 overflow-hidden">
      <div className="absolute inset-0 neo-grid-bg opacity-10 pointer-events-none" />

      {/* Mobile ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full bg-primary/8 blur-[100px] pointer-events-none sm:hidden" />

      <div className="container mx-auto px-5 sm:px-4 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 sm:gap-3 neo-glass-premium px-4 sm:px-4 py-2.5 sm:py-2 mb-7 sm:mb-6 lg:mb-8 rounded-full">
            <span className="relative flex h-2.5 w-2.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            <span className="text-foreground/70 text-[11px] sm:text-[10px] lg:text-xs font-semibold tracking-[0.15em] uppercase">
              {t('hero.badge')}
            </span>
            <span className="h-4 w-px bg-foreground/15" />
            <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-[10px] sm:text-[9px] lg:text-[10px] font-bold tracking-wider uppercase">
              BETA
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-black text-foreground leading-[1.05] sm:leading-[1.1] mb-5 sm:mb-6 lg:mb-8 tracking-wide px-1 sm:px-0">
            <span><PencilUnderline>{t('hero.headline1')}</PencilUnderline></span>
            <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(var(--neo-red)/0.3)]">
              {t('hero.headline2')}
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/50 mb-8 sm:mb-8 lg:mb-10 px-2 sm:px-4 lg:px-0 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subheadline')}
            <span className="text-foreground/85 font-semibold"> {t('hero.price')}</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-3 lg:gap-4 mb-10 sm:mb-10 lg:mb-12 px-3 sm:px-4 lg:px-0">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 hover:from-red-500 hover:via-red-400 hover:to-rose-400 text-primary-foreground text-[13px] sm:text-sm lg:text-base px-5 sm:px-6 lg:px-8 py-4 sm:py-3 lg:py-4 h-auto font-bold rounded-full shadow-lg shadow-red-500/25 hover:shadow-red-500/35 transition-all duration-300 group w-full sm:w-auto whitespace-normal text-center"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>{t('hero.cta')}</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="neo-glass-premium border-0 text-foreground/70 hover:text-foreground text-[15px] sm:text-sm lg:text-base px-7 sm:px-6 lg:px-8 py-4 sm:py-3 lg:py-4 h-auto rounded-full w-full sm:w-auto transition-all duration-300"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {t('hero.ctaSecondary')}
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex items-stretch justify-center gap-3 sm:gap-3 lg:gap-6 mb-10 px-1 sm:px-0">
            {[
              { value: t('hero.stat1Value'), label: t('hero.stat1Label'), icon: Zap },
              { value: t('hero.stat2Value'), label: t('hero.stat2Label'), icon: Clock },
              { value: t('hero.stat3Value'), label: t('hero.stat3Label'), icon: Users },
            ].map((stat) => (
              <div 
                key={stat.label}
                className="neo-glass-premium flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-3.5 sm:py-3 lg:py-4 text-center rounded-2xl"
              >
                <div className="text-xl sm:text-xl lg:text-2xl font-black text-foreground tracking-tight">{stat.value}</div>
                <div className="text-[9px] sm:text-[9px] lg:text-[10px] text-foreground/35 uppercase tracking-[0.12em] mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-8 text-foreground/35 text-[13px] sm:text-xs lg:text-sm font-medium">
            <span>{t('hero.trust1')}</span>
            <span className="hidden sm:inline text-foreground/15">|</span>
            <span>{t('hero.trust2')}</span>
            <span className="hidden sm:inline text-foreground/15">|</span>
            <span>{t('hero.trust3')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
