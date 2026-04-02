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
  
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => { setActiveStep(prev => (prev + 1) % 3); }, 5000);
    return () => clearInterval(timer);
  }, [isVisible]);

  const timelineSteps = [
    {
      id: 'employee', icon: UserX, title: t('comparison.employee'), subtitle: t('comparison.employeeSubtitle'),
      color: 'text-orange-400', bgColor: 'bg-orange-500/15', borderColor: 'border-orange-500/40', glowColor: 'shadow-orange-500/20',
      features: [
        { text: t('comparison.feature_works8h'), type: 'neutral' },
        { text: t('comparison.feature_1client'), type: 'bad' },
        { text: t('comparison.feature_1000eur'), type: 'bad' },
        { text: t('comparison.feature_tires'), type: 'bad' },
        { text: t('comparison.feature_humanUnderstanding'), type: 'good' },
      ],
      result: t('comparison.result_expensive'), resultType: 'warning'
    },
    {
      id: 'chatbot', icon: MessageSquare, title: t('comparison.chatbot'), subtitle: t('comparison.chatbotSubtitle'),
      color: 'text-zinc-400', bgColor: 'bg-zinc-500/15', borderColor: 'border-zinc-500/40', glowColor: 'shadow-zinc-500/20',
      features: [
        { text: t('comparison.feature_247'), type: 'good' },
        { text: t('comparison.feature_manyClients'), type: 'good' },
        { text: t('comparison.feature_lowPrice'), type: 'good' },
        { text: t('comparison.feature_textOnly'), type: 'bad' },
        { text: t('comparison.feature_scripted'), type: 'bad' },
        { text: t('comparison.feature_noContext'), type: 'bad' },
      ],
      result: t('comparison.result_fastDumb'), resultType: 'gray'
    },
    {
      id: 'neo', icon: null, title: t('comparison.neo'), subtitle: t('comparison.neoSubtitle'),
      color: 'text-primary', bgColor: 'bg-primary/15', borderColor: 'border-primary/50', glowColor: 'shadow-primary/30', hasBadge: true,
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
      result: t('comparison.result_perfect'), resultType: 'success'
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
    <section ref={ref as React.RefObject<HTMLElement>} id="comparison"
      className={`py-20 sm:py-24 lg:py-28 neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}>
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-5xl">
        {/* Title */}
        <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-foreground leading-tight mb-2 tracking-tight">
            {t('comparison.title')} <span className="neo-gradient-text">{t('comparison.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-sm">{t('comparison.subtitle')}</p>
        </div>

        {/* Mobile tabs */}
        <div className="flex sm:hidden gap-2 mb-5 justify-center">
          {timelineSteps.map((step, index) => (
            <button key={step.id} onClick={() => setActiveStep(index)}
              className={`relative px-3.5 py-2 rounded-full text-xs font-bold transition-all border ${
                activeStep === index ? `${step.bgColor} ${step.borderColor} ${step.color}` : 'bg-secondary/50 border-border/50 text-muted-foreground'
              }`}>
              {step.title}
              {step.id === 'neo' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />}
            </button>
          ))}
        </div>

        {/* Desktop timeline */}
        <div className="relative max-w-3xl mx-auto mb-8 hidden sm:block">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/40 -translate-y-1/2" />
          <div className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-primary -translate-y-1/2 transition-all duration-700"
            style={{ width: activeStep >= 2 ? '100%' : activeStep >= 1 ? '50%' : '0%' }} />

          <div className="flex justify-between items-center relative z-10">
            {timelineSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              const isPast = activeStep > index;
              return (
                <button key={step.id} onClick={() => setActiveStep(index)}
                  className={`relative flex flex-col items-center cursor-pointer group transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}>
                  {step.id === 'neo' && (
                    <div className="absolute -top-3.5 -right-2 z-20">
                      <div className="bg-gradient-to-r from-primary to-rose-500 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                        {t('comparison.neoBadge')}
                      </div>
                    </div>
                  )}
                  <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    isActive ? `${step.bgColor} ${step.borderColor}` : isPast ? `${step.bgColor} ${step.borderColor} opacity-50` : 'bg-card/40 border-border/50'
                  }`}>
                    {step.id === 'neo' ? <NeoLogo size="sm" showText={false} className="relative z-10" /> 
                      : Icon && <Icon className={`w-6 h-6 relative z-10 ${isActive || isPast ? step.color : 'text-muted-foreground'}`} />}
                  </div>
                  <div className="mt-2 text-center">
                    <span className={`block text-sm font-bold ${isActive ? step.color : 'text-muted-foreground'}`}>{step.title}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{step.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step */}
        <AnimatePresence mode="wait">
          <motion.div key={activeStep} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }} className="max-w-3xl mx-auto">
            {(() => {
              const step = timelineSteps[activeStep];
              const Icon = step.icon;
              return (
                <div className={`relative rounded-xl sm:rounded-2xl p-5 sm:p-7 border backdrop-blur-sm ${
                  step.id === 'neo' ? 'border-primary/40 bg-card/90' : step.borderColor + ' bg-card/80'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {step.id === 'neo' ? <NeoLogo size="lg" showText={false} /> : Icon && (
                      <div className={`p-2.5 rounded-lg border ${step.bgColor} ${step.borderColor}`}>
                        <Icon className={`w-5 h-5 ${step.color}`} />
                      </div>
                    )}
                    <div>
                      <h4 className={`text-lg sm:text-xl font-bold ${step.color}`}>{step.title}</h4>
                      <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {step.features.map((feature, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${
                        feature.type === 'super' ? 'bg-primary/8 border-primary/25' : 'bg-secondary/30 border-border/30'
                      }`}>
                        {getFeatureIcon(feature.type)}
                        <span className={`text-xs ${feature.type === 'super' ? 'text-primary font-semibold' : 'text-foreground/80'}`}>{feature.text}</span>
                        {feature.from && <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
                          {feature.from === 'chatbot' ? t('comparison.from_chatbot') : t('comparison.from_employee')}
                        </span>}
                      </div>
                    ))}
                  </div>

                  <div className={`p-2.5 rounded-lg text-center text-sm font-bold border ${
                    step.resultType === 'success' ? 'bg-primary/12 text-primary border-primary/30'
                    : step.resultType === 'gray' ? 'bg-zinc-800/50 text-zinc-300 border-zinc-600/40'
                    : 'bg-orange-950/30 text-orange-300 border-orange-500/30'
                  }`}>{step.result}</div>

                  {step.id === 'neo' && (
                    <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/30">
                      <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                        <div className="flex items-center gap-1.5">
                          <UserX className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-[11px] text-orange-300 font-medium">{t('comparison.humanUnderstandingLabel')}</span>
                        </div>
                        <span className="text-muted-foreground">+</span>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-[11px] text-zinc-300 font-medium">{t('comparison.automation247Label')}</span>
                        </div>
                        <span className="text-muted-foreground">=</span>
                        <NeoLogo size="sm" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { value: '∞', label: t('comparison.stat_simultaneous') },
              { value: '24/7', label: t('comparison.stat_noBreak') },
              { value: '40x', label: t('comparison.stat_cheaper') },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 sm:p-4 bg-card/40 border border-border/30 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground text-xs mb-3">{t('comparison.bottomText')}</p>
          <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-semibold transition-colors">
            {t('comparison.bottomCta')} <Zap className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
