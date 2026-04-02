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
    {
      icon: PhoneCall,
      metric: '24/7',
      label: 'Обслужване без почивка',
      description: 'NEO отговаря мигновено на всеки клиент — дори в 3 сутринта.',
      gradient: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      metricColor: 'text-primary',
    },
    {
      icon: UserPlus,
      metric: '+68%',
      label: 'Повече контакти',
      description: 'Събира имена, телефони и имейли автоматично по време на разговора.',
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
      metricColor: 'text-emerald-400',
    },
    {
      icon: DollarSign,
      metric: '40x',
      label: 'По-евтино от служител',
      description: 'Същото качество на обслужване за €25/мес вместо €1000/мес.',
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-400',
      metricColor: 'text-amber-400',
    },
    {
      icon: TrendingUp,
      metric: '+35%',
      label: 'Ръст в продажбите',
      description: 'Квалифицира клиенти и ги насочва към покупка — без натиск.',
      gradient: 'from-cyan-500/20 to-cyan-500/5',
      iconColor: 'text-cyan-400',
      metricColor: 'text-cyan-400',
    },
  ];

  const dashboardFeatures = [
    {
      icon: BarChart3,
      title: 'Пълна статистика',
      desc: 'Вижте колко разговора води NEO, колко контакта събира и какъв е ефектът.',
      image: dashboardStats,
      accent: 'from-primary/30 via-primary/10 to-transparent',
      border: 'hover:border-primary/40',
      iconBg: 'bg-primary/15',
    },
    {
      icon: CalendarCheck,
      title: 'Автоматични резервации',
      desc: 'NEO записва срещи директно в календара ви — без вашата намеса.',
      image: dashboardCalendar,
      accent: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15',
    },
    {
      icon: Mail,
      title: 'Имейл автоматизация',
      desc: 'След разговор NEO изпраща персонализиран имейл на потенциалния клиент.',
      image: dashboardEmail,
      accent: 'from-violet-500/30 via-violet-500/10 to-transparent',
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/15',
    },
    {
      icon: Clock,
      title: 'Настройка за 5 минути',
      desc: 'Въведете адреса на сайта си и NEO е готов. Без код, без интеграции.',
      image: dashboardSetup,
      accent: 'from-amber-500/30 via-amber-500/10 to-transparent',
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className="py-10 sm:py-14 relative overflow-hidden"
    >
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-5 sm:px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Какво може NEO
          </span>
          <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-display font-black text-foreground mb-5 leading-[1.08] tracking-tight max-w-4xl mx-auto">
            Вашият AI асистент за{' '}
            <span className="neo-gradient-text">продажби и резервации</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            NEO не е просто чатбот — той е вашият дигитален търговец, рецепционист и маркетолог в едно.
          </p>
        </div>

        {/* Outcome Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-14"
        >
          {outcomes.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="group relative neo-glass-premium p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:scale-[1.03] transition-transform duration-500"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor}`} />
                </div>
                <p className={`text-2xl sm:text-3xl font-black ${item.metricColor} mb-1 tracking-tight`}>{item.metric}</p>
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5 sm:mb-2">{item.label}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Features with Real Screenshots */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-display font-black text-foreground mb-3 leading-tight">
              Всичко на{' '}
              <span className="neo-gradient-text">едно табло</span>
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Контролирайте NEO, следете резултатите и управлявайте клиентите си от едно място.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
          >
            {dashboardFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`group relative overflow-hidden rounded-2xl border border-border/20 ${feature.border} bg-card/30 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.2)]`}
              >
                {/* Screenshot */}
                <div className="relative h-40 sm:h-56 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-[1.03]"
                  />
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.accent}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative p-5 sm:p-6 -mt-6">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-11 h-11 rounded-xl ${feature.iconBg} flex items-center justify-center border border-border/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-base sm:text-lg mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <div className="text-center mt-8 sm:mt-10">
            <Button
              size="lg"
              className="neo-btn-primary text-base px-8 py-6 rounded-full gap-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Опитайте безплатно <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground/50 mt-4 tracking-wide">
              Без регистрация • Без кредитна карта • Готово за 30 секунди
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessResults;
