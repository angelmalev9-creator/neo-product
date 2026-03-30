import { Zap, Brain, Globe, Clock, Wallet, Calendar, Users, Mail, TrendingUp, Mic, ShieldCheck } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useTranslation();
  
  const bentoItems = [
    { 
      icon: TrendingUp, 
      title: t('features.advancedTitle1'), 
      desc: t('features.advancedDesc1'),
      color: 'text-primary',
      gradient: 'from-primary/10 to-primary/5',
      span: 'md:col-span-2 md:row-span-1',
    },
    { 
      icon: Mic, 
      title: t('features.advancedTitle2'), 
      desc: t('features.advancedDesc2'),
      color: 'text-rose-400',
      gradient: 'from-rose-500/10 to-rose-500/5',
      span: 'md:col-span-1 md:row-span-1',
    },
    { 
      icon: Brain, 
      title: t('features.feature1Title'), 
      desc: t('features.feature1Desc'), 
      color: 'text-violet-400',
      gradient: 'from-violet-500/10 to-violet-500/5',
      span: 'md:col-span-1',
    },
    { 
      icon: Globe, 
      title: t('features.feature2Title'), 
      desc: t('features.feature2Desc'), 
      color: 'text-cyan-400',
      gradient: 'from-cyan-500/10 to-cyan-500/5',
      span: 'md:col-span-1',
    },
    { 
      icon: Clock, 
      title: t('features.feature3Title'), 
      desc: t('features.feature3Desc'), 
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/10 to-emerald-500/5',
      span: 'md:col-span-1',
    },
    { 
      icon: Zap, 
      title: t('features.feature4Title'), 
      desc: t('features.feature4Desc'), 
      color: 'text-amber-400',
      gradient: 'from-amber-500/10 to-amber-500/5',
      span: 'md:col-span-1',
    },
    { 
      icon: Wallet, 
      title: t('features.feature5Title'), 
      desc: t('features.feature5Desc'), 
      color: 'text-green-400',
      gradient: 'from-green-500/10 to-green-500/5',
      span: 'md:col-span-1',
    },
    { 
      icon: Users, 
      title: t('features.feature6Title'), 
      desc: t('features.feature6Desc'), 
      color: 'text-sky-400',
      gradient: 'from-sky-500/10 to-sky-500/5',
      span: 'md:col-span-1',
    },
  ];

  const premiumFeatures = [
    { icon: Calendar, title: t('features.premium1Title'), desc: t('features.premium1Desc'), color: 'text-pink-400' },
    { icon: Mail, title: t('features.premium2Title'), desc: t('features.premium2Desc'), color: 'text-orange-400' },
    { icon: Users, title: t('features.premium3Title'), desc: t('features.premium3Desc'), color: 'text-sky-400' },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className={`py-12 lg:py-20 relative overflow-hidden neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/3 blur-[200px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-5 max-w-3xl mx-auto leading-[1.08] tracking-wide">
            <PencilUnderline>{t('features.title1')}</PencilUnderline>{' '}
            <span className="neo-gradient-text whitespace-nowrap">{t('features.title2')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-5 leading-relaxed">
            {t('features.subtitle')}
          </p>
          
          {/* Safe AI statement */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/8 border border-emerald-500/15">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400/80 text-xs sm:text-sm font-semibold">
              {t('features.safeAI')}
            </span>
          </div>
        </div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 max-w-5xl mx-auto mb-14 lg:mb-20"
        >
          {bentoItems.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={`group relative rounded-2xl border border-border/20 hover:border-border/40 p-6 lg:p-8 transition-all duration-300 hover:scale-[1.02] overflow-hidden ${item.span}`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute inset-0 neo-glass-subtle" />
              
              <div className="relative z-10">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-background/50 border border-border/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${item.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-base lg:text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Premium Features */}
        <div className="text-center mb-6 lg:mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
            {t('features.premiumTitle')}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 max-w-4xl mx-auto">
          {premiumFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + idx * 0.08 }}
              className="neo-glass-subtle p-6 lg:p-8 rounded-2xl text-center border border-border/20 hover:border-border/40 transition-all hover:scale-[1.02] group"
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-background/50 border border-border/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${feature.color}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm lg:text-base font-bold text-foreground mb-1.5">{feature.title}</h3>
              <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="text-center mt-10 lg:mt-14">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-bold">{t('features.guarantee')}</span> {t('features.guaranteeDesc')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
