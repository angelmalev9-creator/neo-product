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

const MarketingSkills = () => {
  const { t } = useTranslation();

  const skills = [
    {
      icon: Target,
      title: t('marketingSkills.skill1Title'),
      description: t('marketingSkills.skill1Desc'),
      color: 'text-primary'
    },
    {
      icon: MessageSquareText,
      title: t('marketingSkills.skill2Title'),
      description: t('marketingSkills.skill2Desc'),
      color: 'text-accent'
    },
    {
      icon: UserCheck,
      title: t('marketingSkills.skill3Title'),
      description: t('marketingSkills.skill3Desc'),
      color: 'text-primary'
    },
    {
      icon: TrendingUp,
      title: t('marketingSkills.skill4Title'),
      description: t('marketingSkills.skill4Desc'),
      color: 'text-accent'
    },
    {
      icon: Sparkles,
      title: t('marketingSkills.skill5Title'),
      description: t('marketingSkills.skill5Desc'),
      color: 'text-primary'
    },
    {
      icon: Clock,
      title: t('marketingSkills.skill6Title'),
      description: t('marketingSkills.skill6Desc'),
      color: 'text-accent'
    },
    {
      icon: Heart,
      title: t('marketingSkills.skill7Title'),
      description: t('marketingSkills.skill7Desc'),
      color: 'text-primary'
    },
    {
      icon: Shield,
      title: t('marketingSkills.skill8Title'),
      description: t('marketingSkills.skill8Desc'),
      color: 'text-accent'
    }
  ];

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t('marketingSkills.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-4 leading-[1.1] tracking-wide">
            {t('marketingSkills.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('marketingSkills.subtitle')}
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((skill, index) => (
            <div key={index} className="group relative">
              <div className="neo-glass p-6 rounded-2xl h-full transition-all duration-300 hover:bg-card/80 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <skill.icon className={`w-6 h-6 ${skill.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {skill.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {skill.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            {t('marketingSkills.bottomText')} <span className="text-primary font-semibold">{t('marketingSkills.bottomHighlight')}</span>{t('marketingSkills.bottomSuffix')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketingSkills;
