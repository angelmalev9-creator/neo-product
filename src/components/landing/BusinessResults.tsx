import { 
  PhoneCall, UserPlus, CalendarCheck, Mail, TrendingUp, 
  Clock, DollarSign, BarChart3, ArrowRight, Sparkles
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import dashboardStats from '@/assets/dashboard-stats.png';
import dashboardCalendar from '@/assets/dashboard-calendar.png';
import dashboardEmail from '@/assets/dashboard-email.png';
import dashboardSetup from '@/assets/dashboard-setup.png';

const BusinessResults = () => {
  const { ref, isVisible } = useScrollAnimation();

  const outcomes = [
    { icon: PhoneCall, metric: '24/7', label: 'Обслужване без почивка', description: 'NEO отговаря мигновено на всеки клиент — дори в 3 сутринта.', gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary', metricColor: 'text-primary' },
    { icon: UserPlus, metric: '+68%', label: 'Повече контакти', description: 'Събира имена, телефони и имейли автоматично по време на разговора.', gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', metricColor: 'text-emerald-400' },
    { icon: DollarSign, metric: '40x', label: 'По-евтино от служител', description: 'Същото качество на обслужване за €25/мес вместо €1000/мес.', gradient: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400', metricColor: 'text-amber-400' },
    { icon: TrendingUp, metric: '+35%', label: 'Ръст в продажбите', description: 'Квалифицира клиенти и ги насочва към покупка — без натиск.', gradient: 'from-cyan-500/20 to-cyan-500/5', iconColor: 'text-cyan-400', metricColor: 'text-cyan-400' },
  ];

  const dashboardFeatures = [
    { icon: BarChart3, title: 'Пълна статистика', desc: 'Вижте колко разговора води NEO, колко контакта събира и какъв е ефектът.', image: dashboardStats, accent: 'from-primary/30 via-primary/10 to-transparent', border: 'hover:border-primary/40', iconBg: 'bg-primary/15' },
    { icon: CalendarCheck, title: 'Автоматични резервации', desc: 'NEO записва срещи директно в календара ви — без вашата намеса.', image: dashboardCalendar, accent: 'from-emerald-500/30 via-emerald-500/10 to-transparent', border: 'hover:border-emerald-500/40', iconBg: 'bg-emerald-500/15' },
    { icon: Mail, title: 'Имейл автоматизация', desc: 'След разговор NEO изпраща персонализиран имейл на потенциалния клиент.', image: dashboardEmail, accent: 'from-violet-500/30 via-violet-500/10 to-transparent', border: 'hover:border-violet-500/40', iconBg: 'bg-violet-500/15' },
    { icon: Clock, title: 'Настройка за 5 минути', desc: 'Въведете адреса на сайта си и NEO е готов. Без код, без интеграции.', image: dashboardSetup, accent: 'from-amber-500/30 via-amber-500/10 to-transparent', border: 'hover:border-amber-500/40', iconBg: 'bg-amber-500/15' },
  ];

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="features" className="py-20 sm:py-24 lg:py-28 relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Какво може NEO
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-foreground mb-3 leading-tight tracking-tight max-w-2xl mx-auto">
            Вашият AI асистент за{' '}
            <span className="neo-gradient-text">продажби и резервации</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            NEO не е просто чатбот — той е вашият дигитален търговец, рецепционист и маркетолог в едно.
          </p>
        </div>

        {/* Outcome Cards */}
        <motion.div variants={containerVariants} initial="hidden" animate={isVisible ? 'visible' : 'hidden'}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-14 sm:mb-16">
          {outcomes.map((item, idx) => (
            <motion.div key={idx} variants={itemVariants}
              className="group relative neo-glass-subtle p-4 sm:p-5 rounded-xl hover:scale-[1.02] transition-transform duration-300">
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <p className={`text-xl sm:text-2xl font-black ${item.metricColor} mb-0.5 tracking-tight`}>{item.metric}</p>
                <h3 className="text-xs sm:text-sm font-bold text-foreground mb-1">{item.label}</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Features */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-foreground mb-2 leading-tight">
              Всичко на <span className="neo-gradient-text">едно табло</span>
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Контролирайте NEO, следете резултатите и управлявайте клиентите си от едно място.
            </p>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate={isVisible ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {dashboardFeatures.map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants}
                className={`group relative overflow-hidden rounded-xl border border-border/20 ${feature.border} bg-card/30 backdrop-blur-sm transition-all duration-300`}>
                <div className="relative h-36 sm:h-44 overflow-hidden">
                  <img src={feature.image} alt={feature.title} loading="lazy" className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.accent}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                </div>
                <div className="relative p-4 sm:p-5 -mt-4">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-9 h-9 rounded-lg ${feature.iconBg} flex items-center justify-center border border-border/20`}>
                      <feature.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm mb-0.5">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-8 sm:mt-10">
            <Button size="lg" className="neo-btn-primary text-sm px-6 h-11 rounded-full gap-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              Опитайте безплатно <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <p className="text-[11px] text-muted-foreground/50 mt-3 tracking-wide">
              Без регистрация • Без кредитна карта • Готово за 30 секунди
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessResults;
