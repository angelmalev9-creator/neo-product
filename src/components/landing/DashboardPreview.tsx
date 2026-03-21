import { 
  Clock, Users, TrendingUp, Settings, Zap, Shield, Sparkles, Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const DashboardPreview = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="dashboard-features" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-5">
            <Activity className="w-3.5 h-3.5" />
            {t('dashboardPreview.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-4 leading-[1.1] tracking-wide">
            {t('dashboardPreview.title')}{' '}
            <span className="neo-gradient-text">{t('dashboardPreview.titleHighlight')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('dashboardPreview.subtitle')}
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center max-w-6xl mx-auto">
          {/* Left side */}
          <div className="space-y-5">
            {[
              { icon: <Zap className="w-5 h-5" />, title: t('dashboardPreview.feature1Title'), description: t('dashboardPreview.feature1Desc') },
              { icon: <Settings className="w-5 h-5" />, title: t('dashboardPreview.feature2Title'), description: t('dashboardPreview.feature2Desc') },
              { icon: <Users className="w-5 h-5" />, title: t('dashboardPreview.feature3Title'), description: t('dashboardPreview.feature3Desc') },
              { icon: <Clock className="w-5 h-5" />, title: t('dashboardPreview.feature4Title'), description: t('dashboardPreview.feature4Desc') },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right side - Mock dashboard */}
          <div className="relative">
            <div className="neo-glass-premium rounded-2xl p-6 border border-border/20">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: <Clock className="w-4 h-4 text-primary" />, value: '2м 41с', label: t('dashboardPreview.statAvgTime') },
                  { icon: <TrendingUp className="w-4 h-4 text-primary" />, value: '342', label: t('dashboardPreview.statUsedMinutes') },
                  { icon: <Users className="w-4 h-4 text-emerald-400" />, value: '48', label: t('dashboardPreview.statQualifiedLeads'), trend: '+31%' },
                  { icon: <Zap className="w-4 h-4 text-primary" />, value: '12', label: t('dashboardPreview.statTrainedPages') },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-background/40 border border-border/15">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/8">{s.icon}</div>
                      {s.trend && <span className="text-[10px] font-bold text-emerald-400">{s.trend}</span>}
                    </div>
                    <p className="text-xl font-black text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Usage bar */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('dashboardPreview.usageLabel')}</span>
                  <span className="font-semibold text-foreground">342 / 1000</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: '34.2%' }} />
                </div>
              </div>

              {/* Knowledge base */}
              <div className="p-4 rounded-xl bg-background/30 border border-border/10">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{t('dashboardPreview.knowledgeBase')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-muted-foreground">{t('dashboardPreview.pagesTrainedCount', { count: 12 })}</span>
                  </span>
                  <span className="text-primary cursor-pointer hover:underline">{t('dashboardPreview.edit')}</span>
                </div>
              </div>

              {/* Live indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">LIVE</span>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -z-10 inset-0 blur-3xl bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-3xl" />
          </div>
        </div>

        {/* Bottom */}
        <div className="text-center mt-14">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full neo-glass-subtle border border-border/15">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-muted-foreground">
              {t('dashboardPreview.gdprNotice')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
