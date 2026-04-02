import { Zap, Brain, Globe, Clock, Wallet, Calendar, Users, Mail, TrendingUp, Mic } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { useTranslation } from 'react-i18next';

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useTranslation();
  
  const features = [
    { icon: Brain, title: t('features.feature1Title'), desc: t('features.feature1Desc'), color: 'text-violet-400' },
    { icon: Mic, title: t('features.feature2Title'), desc: t('features.feature2Desc'), color: 'text-primary' },
    { icon: Clock, title: t('features.feature3Title'), desc: t('features.feature3Desc'), color: 'text-emerald-400' },
    { icon: Globe, title: t('features.feature4Title'), desc: t('features.feature4Desc'), color: 'text-cyan-400' },
    { icon: Zap, title: t('features.feature5Title'), desc: t('features.feature5Desc'), color: 'text-amber-400' },
    { icon: Wallet, title: t('features.feature6Title'), desc: t('features.feature6Desc'), color: 'text-green-400' },
  ];

  const advancedFeatures = [
    { 
      icon: TrendingUp, 
      title: t('features.advancedTitle1'), 
      desc: t('features.advancedDesc1'),
      color: 'text-primary' 
    },
    { 
      icon: Mic, 
      title: t('features.advancedTitle2'), 
      desc: t('features.advancedDesc2'),
      color: 'text-rose-400' 
    },
  ];

  const premiumFeatures = [
    { icon: Calendar, title: t('features.premium1Title'), desc: t('features.premium1Desc'), color: 'text-pink-400' },
    { icon: Users, title: t('features.premium2Title'), desc: t('features.premium2Desc'), color: 'text-orange-400' },
    { icon: Mail, title: t('features.premium3Title'), desc: t('features.premium3Desc'), color: 'text-sky-400' },
  ];

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className={`py-10 lg:py-16 relative overflow-hidden neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-5 sm:px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-10 lg:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-display font-black text-foreground mb-4 max-w-3xl mx-auto leading-[1.08] tracking-tight">
            <PencilUnderline>{t('features.title1')}</PencilUnderline> <span className="neo-gradient-text whitespace-nowrap">{t('features.title2')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            {t('features.subtitle')}
          </p>
          <p className="text-[15px] sm:text-base text-muted-foreground max-w-xl mx-auto">
            <span className="text-foreground font-semibold">{t('features.guarantee')}</span> {t('features.guaranteeDesc')}
          </p>
        </div>

        {/* Advanced Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 max-w-4xl mx-auto mb-12 sm:mb-10 lg:mb-16">
          {advancedFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="neo-glass-subtle p-6 sm:p-6 lg:p-8 rounded-2xl sm:rounded-xl lg:rounded-2xl border border-primary/20 hover:border-primary/40 transition-all"
            >
              <feature.icon className={`w-10 h-10 lg:w-12 lg:h-12 ${feature.color} mb-4`} strokeWidth={1.5} />
              <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-[15px] sm:text-sm lg:text-base text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-6 max-w-7xl mx-auto mb-12 sm:mb-10 lg:mb-16">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="neo-glass-subtle p-5 lg:p-6 rounded-2xl sm:rounded-xl lg:rounded-2xl text-center border border-border/20 hover:border-border/40 transition-all hover:scale-[1.02]"
            >
              <feature.icon className={`w-8 h-8 sm:w-7 sm:h-7 lg:w-10 lg:h-10 ${feature.color} mx-auto mb-3 lg:mb-4`} strokeWidth={1.5} />
              <h3 className="text-[13px] sm:text-sm lg:text-base font-bold text-foreground mb-1.5 sm:mb-1 lg:mb-2">{feature.title}</h3>
              <p className="text-[12px] sm:text-xs lg:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Premium Features */}
        <div className="text-center mb-6 lg:mb-8">
          <span className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wider">{t('features.premiumTitle')}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
          {premiumFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="neo-glass-subtle p-5 lg:p-8 rounded-xl lg:rounded-2xl text-center border border-border/20 hover:border-border/40 transition-all relative"
            >
              <feature.icon className={`w-7 h-7 lg:w-10 lg:h-10 ${feature.color} mx-auto mb-3 lg:mb-4`} strokeWidth={1.5} />
              <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-1 lg:mb-2">{feature.title}</h3>
              <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
