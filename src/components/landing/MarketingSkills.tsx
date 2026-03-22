import { 
  Target, 
  MessageSquareText, 
  UserCheck, 
  TrendingUp, 
  Sparkles,
  Clock,
  Heart,
  Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const MarketingSkills = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  const skills = [
    { icon: Target, title: t('marketingSkills.skill1Title'), description: t('marketingSkills.skill1Desc'), accent: 'primary' },
    { icon: MessageSquareText, title: t('marketingSkills.skill2Title'), description: t('marketingSkills.skill2Desc'), accent: 'accent' },
    { icon: UserCheck, title: t('marketingSkills.skill3Title'), description: t('marketingSkills.skill3Desc'), accent: 'primary' },
    { icon: TrendingUp, title: t('marketingSkills.skill4Title'), description: t('marketingSkills.skill4Desc'), accent: 'accent' },
    { icon: Sparkles, title: t('marketingSkills.skill5Title'), description: t('marketingSkills.skill5Desc'), accent: 'primary' },
    { icon: Clock, title: t('marketingSkills.skill6Title'), description: t('marketingSkills.skill6Desc'), accent: 'accent' },
    { icon: Heart, title: t('marketingSkills.skill7Title'), description: t('marketingSkills.skill7Desc'), accent: 'primary' },
    { icon: Shield, title: t('marketingSkills.skill8Title'), description: t('marketingSkills.skill8Desc'), accent: 'accent' },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="relative py-14 sm:py-28 px-4 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[150px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            {t('marketingSkills.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-4 leading-[1.1] tracking-wide">
            {t('marketingSkills.title')}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            {t('marketingSkills.subtitle')}
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="group relative"
            >
              <div className="neo-glass-premium p-4 sm:p-6 rounded-xl sm:rounded-2xl h-full transition-all duration-500 hover:scale-[1.03] neo-spotlight-card">
                {/* Top accent line */}
                <div className={`absolute top-0 left-4 right-4 sm:left-6 sm:right-6 h-px bg-gradient-to-r from-transparent ${skill.accent === 'primary' ? 'via-primary/30' : 'via-accent/30'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br ${skill.accent === 'primary' ? 'from-primary/15 to-primary/5' : 'from-accent/15 to-accent/5'} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <skill.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${skill.accent === 'primary' ? 'text-primary' : 'text-accent'}`} />
                </div>
                <h3 className="text-[13px] sm:text-base font-bold text-foreground mb-1.5 sm:mb-2 group-hover:text-foreground transition-colors leading-tight">
                  {skill.title}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  {skill.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('marketingSkills.bottomText')} <span className="text-primary font-semibold">{t('marketingSkills.bottomHighlight')}</span>{t('marketingSkills.bottomSuffix')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketingSkills;
