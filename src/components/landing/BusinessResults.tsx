import { 
  PhoneCall, UserPlus, CalendarCheck, Mail, TrendingUp, 
  Clock, DollarSign, BarChart3, ArrowRight, Sparkles
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
    },
    {
      icon: CalendarCheck,
      title: 'Автоматични резервации',
      desc: 'NEO записва срещи директно в календара ви — без вашата намеса.',
    },
    {
      icon: Mail,
      title: 'Имейл автоматизация',
      desc: 'След разговор NEO изпраща персонализиран имейл на потенциалния клиент.',
    },
    {
      icon: Clock,
      title: 'Настройка за 5 минути',
      desc: 'Въведете адреса на сайта си и NEO е готов. Без код, без интеграции.',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="results"
      className="py-14 sm:py-28 relative overflow-hidden"
    >
      <div className="container mx-auto px-5 sm:px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Какво може NEO
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-5 leading-[1.08] tracking-wide max-w-4xl mx-auto">
            Какво може{' '}
            <span className="neo-gradient-text">NEO</span>
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
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-12 sm:mb-24"
        >
          {outcomes.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="group relative neo-glass-premium p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:scale-[1.03] transition-transform duration-500"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <p className={`text-3xl font-black ${item.metricColor} mb-1 tracking-tight`}>{item.metric}</p>
                <h3 className="text-base font-bold text-foreground mb-2">{item.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Explanation */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground mb-3 leading-tight">
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {dashboardFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex gap-4 p-5 rounded-2xl neo-glass-subtle border border-border/20 hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <div className="text-center mt-12">
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
