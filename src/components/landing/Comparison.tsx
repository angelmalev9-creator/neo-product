import { X, Zap, Bot, UserX, Check, ArrowRight, MessageSquare } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import NeoLogo from '@/components/ui/NeoLogo';
import { useTranslation } from 'react-i18next';

const Comparison = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeStep, setActiveStep] = useState(0);
  const { t } = useTranslation();
  
  // Auto-advance on mobile
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, [isVisible]);

  const timelineSteps = [
    {
      id: 'employee',
      icon: UserX,
      title: t('comparison.employee'),
      subtitle: t('comparison.employeeSubtitle'),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/15',
      borderColor: 'border-orange-500/40',
      glowColor: 'shadow-orange-500/20',
      features: [
        { text: t('comparison.feature_works8h'), type: 'neutral' },
        { text: t('comparison.feature_1client'), type: 'bad' },
        { text: t('comparison.feature_1000eur'), type: 'bad' },
        { text: t('comparison.feature_tires'), type: 'bad' },
        { text: t('comparison.feature_humanUnderstanding'), type: 'good' },
      ],
      result: t('comparison.result_expensive'),
      resultType: 'warning'
    },
    {
      id: 'chatbot',
      icon: MessageSquare,
      title: t('comparison.chatbot'),
      subtitle: t('comparison.chatbotSubtitle'),
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/15',
      borderColor: 'border-zinc-500/40',
      glowColor: 'shadow-zinc-500/20',
      features: [
        { text: t('comparison.feature_247'), type: 'good' },
        { text: t('comparison.feature_manyClients'), type: 'good' },
        { text: t('comparison.feature_lowPrice'), type: 'good' },
        { text: t('comparison.feature_textOnly'), type: 'bad' },
        { text: t('comparison.feature_scripted'), type: 'bad' },
        { text: t('comparison.feature_noContext'), type: 'bad' },
      ],
      result: t('comparison.result_fastDumb'),
      resultType: 'gray'
    },
    {
      id: 'neo',
      icon: null,
      title: t('comparison.neo'),
      subtitle: t('comparison.neoSubtitle'),
      color: 'text-primary',
      bgColor: 'bg-primary/15',
      borderColor: 'border-primary/50',
      glowColor: 'shadow-primary/30',
      hasBadge: true,
      features: [
        { text: t('comparison.feature_247'), type: 'good', from: 'chatbot' },
        { text: t('comparison.feature_unlimitedClients'), type: 'good', from: 'chatbot' },
        { text: t('comparison.feature_from25'), type: 'super' },
        { text: t('comparison.feature_qualifies'), type: 'super' },
        { text: t('comparison.feature_collectsData'), type: 'super' },
        { text: t('comparison.feature_voiceText'), type: 'good' },
        { text: t('comparison.feature_realAI'), type: 'good' },
        { text: t('comparison.feature_understandsHuman'), type: 'good', from: 'employee' },
      ],
      result: t('comparison.result_perfect'),
      resultType: 'success'
    }
  ];

  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'good': return <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'super': return <Bot className="w-3.5 h-3.5 text-primary shrink-0" />;
      case 'bad': return <X className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      case 'neutral': return <span className="w-3.5 h-3.5 text-muted-foreground shrink-0">•</span>;
      default: return null;
    }
  };

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="comparison"
      className={`py-12 sm:py-20 lg:py-32 neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Title */}
        <div className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground leading-[1.1] mb-3 sm:mb-4 tracking-wide text-center">
            {t('comparison.title')} <br className="sm:hidden" /><span className="neo-gradient-text">{t('comparison.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">{t('comparison.subtitle')}</p>
        </div>

        {/* Mobile: Tab Selector */}
        <div className="flex sm:hidden gap-2 mb-6 justify-center">
          {timelineSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`relative px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                activeStep === index 
                  ? `${step.bgColor} ${step.borderColor} ${step.color} shadow-lg ${step.glowColor}` 
                  : 'bg-secondary/50 border-border/50 text-muted-foreground'
              }`}
            >
              {step.title}
              {step.id === 'neo' && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Desktop: Timeline Navigation */}
        <div className="relative max-w-4xl mx-auto mb-8 sm:mb-12 hidden sm:block">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-border/50 -translate-y-1/2" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-primary -translate-y-1/2 transition-all duration-800 ease-out"
            style={{ width: activeStep >= 2 ? '100%' : activeStep >= 1 ? '50%' : '0%' }}
          />

          <div className="flex justify-between items-center relative z-10">
            {timelineSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              const isPast = activeStep > index;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(index)}
                  className={`relative flex flex-col items-center cursor-pointer group transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'} hover:scale-[1.08] active:scale-[0.97]`}
                >
                  {step.id === 'neo' && (
                    <div className="absolute -top-4 -right-3 z-20">
                      <div className="bg-gradient-to-r from-primary to-rose-500 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-primary/40 whitespace-nowrap">
                        {t('comparison.neoBadge')}
                      </div>
                    </div>
                  )}

                  <div 
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                      isActive 
                        ? `${step.bgColor} ${step.borderColor} shadow-xl ${step.glowColor}` 
                        : isPast 
                          ? `${step.bgColor} ${step.borderColor} opacity-60` 
                          : 'bg-card/40 border-border/50'
                    }`}
                  >
                    {isActive && step.id === 'neo' && <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl" />}
                    {step.id === 'neo' 
                      ? <NeoLogo size="sm" showText={false} className="relative z-10" /> 
                      : Icon && <Icon className={`w-9 h-9 relative z-10 ${isActive || isPast ? step.color : 'text-muted-foreground'}`} />
                    }
                  </div>

                  <div className="mt-3 text-center">
                    <span className={`block text-base font-bold transition-colors ${isActive ? step.color : 'text-muted-foreground'}`}>{step.title}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{step.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Details */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeStep} 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }} 
            className="max-w-4xl mx-auto"
          >
            {(() => {
              const step = timelineSteps[activeStep];
              const Icon = step.icon;

              return (
                <div className={`relative rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border backdrop-blur-sm ${
                  step.id === 'neo' 
                    ? 'border-primary/50 bg-card/90 shadow-xl shadow-primary/10' 
                    : step.borderColor + ' bg-card/80'
                } transition-all duration-500`}>
                  {step.id === 'neo' && (
                    <div className="absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-b from-primary/20 via-transparent to-transparent -z-10" />
                  )}

                  <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                    {step.id === 'neo' ? <NeoLogo size="lg" showText={false} /> : Icon && (
                      <div className={`p-3 sm:p-4 rounded-xl border ${step.bgColor + ' ' + step.borderColor}`}>
                        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${step.color}`} />
                      </div>
                    )}
                    <div>
                      <h4 className={`text-lg sm:text-2xl lg:text-3xl font-bold ${step.color}`}>{step.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">{step.subtitle}</p>
                    </div>
                  </div>

                  {/* Features - single column on mobile, two on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6">
                    {step.features.map((feature, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border ${
                          feature.type === 'super' 
                            ? 'bg-primary/8 border-primary/30' 
                            : 'bg-secondary/40 border-border/40'
                        }`}
                      >
                        {getFeatureIcon(feature.type)}
                        <span className={`text-xs sm:text-sm ${feature.type === 'super' ? 'text-primary font-semibold' : 'text-foreground/90'}`}>
                          {feature.text}
                        </span>
                        {feature.from && (
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-auto shrink-0">
                            {feature.from === 'chatbot' ? t('comparison.from_chatbot') : t('comparison.from_employee')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Result */}
                  <div className={`p-3 sm:p-4 rounded-xl text-center text-sm sm:text-base font-bold border ${
                    step.resultType === 'success' 
                      ? 'bg-primary/15 text-primary border-primary/40 shadow-inner shadow-primary/10' 
                      : step.resultType === 'gray' 
                        ? 'bg-zinc-800/60 text-zinc-300 border-zinc-600/50' 
                        : 'bg-orange-950/40 text-orange-300 border-orange-500/40'
                  }`}>
                    {step.result}
                  </div>

                  {step.id === 'neo' && (
                    <div 
                      className="mt-5 sm:mt-6 p-3 sm:p-5 bg-secondary/40 rounded-xl border border-border/40"
                    >
                      <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                        <div className="flex items-center gap-1.5">
                          <UserX className="w-4 h-4 text-orange-400" />
                          <span className="text-xs text-orange-300 font-medium">{t('comparison.humanUnderstandingLabel')}</span>
                        </div>
                        <span className="text-lg text-muted-foreground">+</span>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-zinc-400" />
                          <span className="text-xs text-zinc-300 font-medium">{t('comparison.automation247Label')}</span>
                        </div>
                        <span className="text-lg text-muted-foreground">=</span>
                        <NeoLogo size="sm" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* Mobile Step Dots */}
        <div className="flex sm:hidden justify-center gap-2 mt-4">
          {timelineSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeStep === index ? 'w-6 bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Key Stats */}
        <div 
          className="mt-10 sm:mt-16 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {[
              { value: '∞', label: t('comparison.stat_simultaneous') },
              { value: '24/7', label: t('comparison.stat_noBreak') },
              { value: '40x', label: t('comparison.stat_cheaper') },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 sm:p-6 bg-card/50 border border-border/40 rounded-xl backdrop-blur-sm">
                <div className="text-2xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10 sm:mt-12">
          <p className="text-muted-foreground text-sm mb-4">{t('comparison.bottomText')}</p>
          <button 
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            {t('comparison.bottomCta')}
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Comparison;