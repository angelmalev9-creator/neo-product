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
    { icon: Target, title: t('marketingSkills.skill1Title'), description: t('marketingSkills.skill1Desc'), color: 'from-rose-500 to-red-600', bg: 'bg-rose-500/10', text: 'text-rose-400' },
    { icon: MessageSquareText, title: t('marketingSkills.skill2Title'), description: t('marketingSkills.skill2Desc'), color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-400' },
    { icon: UserCheck, title: t('marketingSkills.skill3Title'), description: t('marketingSkills.skill3Desc'), color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    { icon: TrendingUp, title: t('marketingSkills.skill4Title'), description: t('marketingSkills.skill4Desc'), color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    { icon: Sparkles, title: t('marketingSkills.skill5Title'), description: t('marketingSkills.skill5Desc'), color: 'from-pink-500 to-rose-600', bg: 'bg-pink-500/10', text: 'text-pink-400' },
    { icon: Clock, title: t('marketingSkills.skill6Title'), description: t('marketingSkills.skill6Desc'), color: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    { icon: Heart, title: t('marketingSkills.skill7Title'), description: t('marketingSkills.skill7Desc'), color: 'from-red-500 to-pink-600', bg: 'bg-red-500/10', text: 'text-red-400' },
    { icon: Shield, title: t('marketingSkills.skill8Title'), description: t('marketingSkills.skill8Desc'), color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="relative py-14 sm:py-24 px-4 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 opacity-25 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 opacity-30 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            {t('marketingSkills.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-4 leading-[1.1] tracking-wide uppercase">
            {t('marketingSkills.title')}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            {t('marketingSkills.subtitle')}
          </p>
        </div>

        {/* Skills Grid - 4x2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative"
            >
              <div className="relative p-4 sm:p-5 rounded-xl sm:rounded-2xl h-full transition-all duration-500 hover:scale-[1.03] bg-card/40  border border-border/20 hover:border-border/40 overflow-hidden">
                {/* Top gradient line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${skill.color} opacity-40 group-hover:opacity-80 transition-opacity duration-500`} />
                
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${skill.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-xl sm:rounded-2xl`} />
                
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${skill.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <skill.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${skill.text}`} />
                </div>
                <h3 className="text-[13px] sm:text-sm font-bold text-foreground mb-1 sm:mb-1.5 leading-tight">
                  {skill.title}
                </h3>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                  {skill.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10 sm:mt-14">
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('marketingSkills.bottomText')} <span className="text-primary font-semibold">{t('marketingSkills.bottomHighlight')}</span>{t('marketingSkills.bottomSuffix')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketingSkills;
