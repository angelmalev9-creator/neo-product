import { 
  Clock, 
  Users, 
  TrendingUp,
  Settings,
  Zap,
  Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DashboardPreview = () => {
  const { t } = useTranslation();

  return (
    <section id="dashboard-features" className="py-20 sm:py-32 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t('dashboardPreview.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-4 leading-[1.1] tracking-wide">
            {t('dashboardPreview.title')}{' '}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              {t('dashboardPreview.titleHighlight')}
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('dashboardPreview.subtitle')}
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Features list */}
          <div className="space-y-6">
            <FeatureItem
              icon={<Zap className="w-5 h-5" />}
              title={t('dashboardPreview.feature1Title')}
              description={t('dashboardPreview.feature1Desc')}
            />
            <FeatureItem
              icon={<Settings className="w-5 h-5" />}
              title={t('dashboardPreview.feature2Title')}
              description={t('dashboardPreview.feature2Desc')}
            />
            <FeatureItem
              icon={<Users className="w-5 h-5" />}
              title={t('dashboardPreview.feature3Title')}
              description={t('dashboardPreview.feature3Desc')}
            />
            <FeatureItem
              icon={<Clock className="w-5 h-5" />}
              title={t('dashboardPreview.feature4Title')}
              description={t('dashboardPreview.feature4Desc')}
            />
          </div>

          {/* Right side - Mock dashboard */}
          <div className="relative">
            <div className="neo-glass rounded-2xl p-6 border border-border/30 shadow-2xl">
              {/* Mock stats grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard
                  icon={<Clock className="w-5 h-5 text-primary" />}
                  value="2м 41с"
                  label={t('dashboardPreview.statAvgTime')}
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5 text-primary" />}
                  value="342"
                  label={t('dashboardPreview.statUsedMinutes')}
                />
                <StatCard
                  icon={<Users className="w-5 h-5 text-green-500" />}
                  value="48"
                  label={t('dashboardPreview.statQualifiedLeads')}
                  trend="+31%"
                />
                <StatCard
                  icon={<Zap className="w-5 h-5 text-primary" />}
                  value="12"
                  label={t('dashboardPreview.statTrainedPages')}
                />
              </div>

              {/* Mock usage bar */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('dashboardPreview.usageLabel')}</span>
                  <span className="font-medium text-foreground">342 / 1000</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full"
                    style={{ width: '34.2%' }}
                  />
                </div>
              </div>

              {/* Knowledge base quick edit */}
              <div className="p-4 rounded-xl bg-background/50 border border-border/20">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{t('dashboardPreview.knowledgeBase')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {t('dashboardPreview.pagesTrainedCount', { count: 12 })}
                  </span>
                  <span className="text-primary cursor-pointer hover:underline">{t('dashboardPreview.edit')}</span>
                </div>
              </div>

              {/* Live indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-medium text-green-500">LIVE</span>
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute -z-10 inset-0 blur-3xl bg-gradient-to-r from-primary/20 via-transparent to-primary/10 rounded-3xl" />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/5 border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {t('dashboardPreview.gdprNotice')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
  <div className="flex gap-4">
    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend?: string;
}

const StatCard = ({ icon, value, label, trend }: StatCardProps) => (
  <div className="p-4 rounded-xl bg-background/50 border border-border/20">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-primary/10">
        {icon}
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-500">{trend}</span>
      )}
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default DashboardPreview;
