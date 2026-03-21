import { 
  PhoneCall, UserPlus, CalendarCheck, Mail, TrendingUp, 
  Clock, DollarSign, BarChart3, ArrowRight
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';

const BusinessResults = () => {
  const { ref, isVisible } = useScrollAnimation();

  const outcomes = [
    {
      icon: PhoneCall,
      metric: '24/7',
      label: 'Обслужване без почивка',
      description: 'NEO отговаря мигновено на всеки клиент — дори в 3 сутринта.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: UserPlus,
      metric: '+68%',
      label: 'Повече контакти',
      description: 'Събира имена, телефони и имейли автоматично по време на разговора.',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      icon: DollarSign,
      metric: '40x',
      label: 'По-евтино от служител',
      description: 'Същото качество на обслужване за €25/мес вместо €1000/мес.',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      icon: TrendingUp,
      metric: '+35%',
      label: 'Ръст в продажбите',
      description: 'Квалифицира клиенти и ги насочва към покупка — без натиск.',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
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

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="results"
      className={`py-20 sm:py-28 relative overflow-hidden neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-5 sm:px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 sm:mb-24">
          {outcomes.map((item, idx) => (
            <div
              key={idx}
              className="group neo-glass-subtle p-6 rounded-2xl border border-border/30 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <p className={`text-3xl font-black ${item.color} mb-1`}>{item.metric}</p>
              <h3 className="text-base font-bold text-foreground mb-2">{item.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dashboardFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-5 rounded-2xl neo-glass-subtle border border-border/20 hover:border-border/40 transition-all"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="neo-btn-primary text-base px-8 py-6 rounded-full gap-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Опитайте безплатно <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Без регистрация • Без кредитна карта • Готово за 30 секунди
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessResults;
