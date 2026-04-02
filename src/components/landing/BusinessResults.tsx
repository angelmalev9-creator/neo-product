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
    { icon: PhoneCall, metric: '24/7', label: 'Обслужване без почивка', description: 'NEO отговаря мигновено на всеки клиент — дори в 3 сутринта.', iconColor: 'text-primary' },
    { icon: UserPlus, metric: '+68%', label: 'Повече контакти', description: 'Събира имена, телефони и имейли автоматично по време на разговора.', iconColor: 'text-emerald-400' },
    { icon: DollarSign, metric: '40x', label: 'По-евтино от служител', description: 'Същото качество на обслужване за €25/мес вместо €1000/мес.', iconColor: 'text-amber-400' },
    { icon: TrendingUp, metric: '+35%', label: 'Ръст в продажбите', description: 'Квалифицира клиенти и ги насочва към покупка — без натиск.', iconColor: 'text-cyan-400' },
  ];

  const dashboardFeatures = [
    { icon: BarChart3, title: 'Пълна статистика', desc: 'Вижте колко разговора води NEO, колко контакта събира и какъв е ефектът.', image: dashboardStats, iconColor: 'text-primary' },
    { icon: CalendarCheck, title: 'Автоматични резервации', desc: 'NEO записва срещи директно в календара ви — без вашата намеса.', image: dashboardCalendar, iconColor: 'text-emerald-400' },
    { icon: Mail, title: 'Имейл автоматизация', desc: 'След разговор NEO изпраща персонализиран имейл на потенциалния клиент.', image: dashboardEmail, iconColor: 'text-violet-400' },
    { icon: Clock, title: 'Настройка за 5 минути', desc: 'Въведете адреса на сайта си и NEO е готов. Без код, без интеграции.', image: dashboardSetup, iconColor: 'text-amber-400' },
  ];

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } } };

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="features" className="py-24 sm:py-32 lg:py-40 relative overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/20 bg-card/50 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Какво може NEO
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4 leading-[1.1] tracking-tight max-w-2xl mx-auto">
            Вашият AI асистент за{' '}
            <span className="neo-gradient-text">продажби и резервации</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            NEO не е просто чатбот — той е вашият дигитален търговец, рецепционист и маркетолог в едно.
          </p>
        </div>

        {/* Outcome Cards */}
        <motion.div variants={containerVariants} initial="hidden" animate={isVisible ? 'visible' : 'hidden'}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-20 sm:mb-24">
          {outcomes.map((item, idx) => (
            <motion.div key={idx} variants={itemVariants}
              className="group relative neo-glass-subtle p-6 rounded-2xl hover:translate-y-[-8px] transition-all duration-500">
              <div className="relative z-10">
                <item.icon className={`w-6 h-6 ${item.iconColor} mb-4`} />
                <p className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-1 tracking-tight">{item.metric}</p>
                <h3 className="text-sm font-semibold text-foreground mb-2">{item.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Features */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3 leading-tight">
              Всичко на <span className="neo-gradient-text">едно табло</span>
            </h3>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Контролирайте NEO, следете резултатите и управлявайте клиентите си.
            </p>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate={isVisible ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardFeatures.map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl border border-border/10 bg-card/30 hover:border-border/25 transition-all duration-500">
                <div className="relative h-44 sm:h-52 overflow-hidden">
                  <img src={feature.image} alt={feature.title} loading="lazy" className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>
                <div className="relative p-6 -mt-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-card/80 border border-border/15 flex items-center justify-center">
                      <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-base mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12 sm:mt-16">
            <Button size="lg" className="neo-btn-primary text-base px-8 h-14 rounded-full gap-2 font-semibold"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              Опитайте безплатно <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-sm text-muted-foreground/50 mt-4">
              Без регистрация • Без кредитна карта • Готово за 30 секунди
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessResults;
