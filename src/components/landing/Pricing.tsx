import { Check, Crown, Phone, BarChart3, Headphones, Users, Mail, Sparkles, ArrowRight, Calendar, Brain, Globe, Palette, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmbeddedCheckoutModal from '@/components/checkout/EmbeddedCheckoutModal';
import { motion } from 'framer-motion';

const PRICE_IDS = {
  starter: { monthly: 'price_1SnZt6JnrCo2ucK9XL1FGEEn', yearly: 'price_1SnZtYJnrCo2ucK9KDk4xZd6' },
  growth: { monthly: 'price_1SnZtFJnrCo2ucK95hcj2Gqy', yearly: 'price_1SnZtiJnrCo2ucK9kXjVEPkf' },
  empire: { monthly: 'price_1SnZtOJnrCo2ucK9zta7lV0A', yearly: 'price_1SnZtrJnrCo2ucK9Md9j1egd' },
};

const Pricing = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(true);
  const [checkoutModal, setCheckoutModal] = useState<{ isOpen: boolean; priceId: string; planName: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useTranslation();

  const getPlans = (yearly: boolean) => [
    {
      id: 'starter', name: 'Основен', price: yearly ? '15' : '25', yearlyTotal: '180',
      minutes: '500', callsPerDay: '~25 обаждания/ден',
      description: 'За малки бизнеси, които не искат да пропускат обаждания.',
      features: [
        { text: '500 минути / месец', icon: Phone },
        { text: 'Отговаря 24/7 на чат и телефон', icon: Headphones },
        { text: 'Говори на български и английски', icon: Globe },
        { text: 'Уиджет за сайта Ви', icon: Palette },
        { text: 'Виждате всеки разговор и резултата от него', icon: BarChart3 },
        { text: 'Учи се от Вашия сайт автоматично', icon: Brain },
      ],
      cta: 'Изберете Основен', featured: false,
      priceId: yearly ? PRICE_IDS.starter.yearly : PRICE_IDS.starter.monthly,
    },
    {
      id: 'growth', name: 'Растеж', price: yearly ? '23' : '33', yearlyTotal: '276',
      minutes: '2500', callsPerDay: '~125 обаждания/ден',
      description: 'За растящи бизнеси с повече клиенти и нужда от автоматизация.',
      features: [
        { text: '2 500 минути / месец', icon: Phone },
        { text: 'Всичко от Основен +', icon: Check },
        { text: 'Записва часове автоматично в Google Calendar', icon: Calendar },
        { text: 'Отговаря на имейли, които не може да затвори по телефон', icon: Mail },
        { text: 'Детайлни графики и анализ на разговори', icon: TrendingUp },
        { text: 'Улавя и записва всеки потенциален клиент', icon: Users },
        { text: 'Приоритетна поддръжка', icon: Headphones },
      ],
      cta: 'Изберете Растеж', featured: true,
      priceId: yearly ? PRICE_IDS.growth.yearly : PRICE_IDS.growth.monthly,
    },
    {
      id: 'empire', name: 'Мащаб', price: yearly ? '50' : '60', yearlyTotal: '600',
      minutes: '10000', callsPerDay: '500+ обаждания/ден',
      description: 'За бизнеси с голям обем обаждания и нужда от пълен контрол.',
      features: [
        { text: '10 000 минути / месец', icon: Phone },
        { text: 'Всичко от Растеж +', icon: Check },
        { text: 'Без NEO брандиране — изглежда изцяло Ваш', icon: Palette },
        { text: 'Персонален мениджър', icon: Users },
        { text: 'Поддръжка на български, английски и руски', icon: Globe },
        { text: 'Приоритетна поддръжка 24/7', icon: Headphones },
      ],
      cta: 'Изберете Мащаб', featured: false,
      priceId: yearly ? PRICE_IDS.empire.yearly : PRICE_IDS.empire.monthly,
    },
  ];

  const plans = getPlans(isYearly);

  const handleCheckout = async (plan: typeof plans[0]) => {
    setLoadingPlan(plan.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = `/auth?plan=${plan.id}&priceId=${plan.priceId}`; return; }
      const { error } = await supabase.functions.invoke('activate-test-plan', { body: { tier: plan.id } });
      if (error) throw error;
      toast({ title: 'Планът е активиран!', description: `${plan.name} е активен (тестов режим)` });
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ title: 'Грешка', description: 'Нещо се обърка. Опитайте пак.', variant: "destructive" });
    } finally { setLoadingPlan(null); }
  };

  const getYearlySavings = (monthlyPrice: string, yearlyPrice: string) => {
    return Math.round(((parseFloat(monthlyPrice) - parseFloat(yearlyPrice)) / parseFloat(monthlyPrice)) * 100);
  };

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="pricing" 
      className="neo-section-spacing relative overflow-visible"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 opacity-30 rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-secondary text-accent text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Ценови планове
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-5 max-w-3xl mx-auto font-mono">
            Изберете план. <span className="text-secondary">Променете по всяко време.</span>
          </h2>
          <p className="neo-subheading text-muted-foreground mb-8">
            Всички планове включват 14 дни безплатен период. Без карта. Без автоматично таксуване.
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="inline-flex items-center p-1 rounded-full neo-glass-premium">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  !isYearly ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Месечно
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isYearly ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Годишно
              </button>
            </div>
            {isYearly && (
               <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full border"
                style={{ color: 'hsl(142 71% 45%)', backgroundColor: 'hsla(142, 71%, 45%, 0.1)', borderColor: 'hsla(142, 71%, 45%, 0.2)' }}
              >
                Спестете до 40% с годишен план
              </motion.span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-6 max-w-6xl mx-auto overflow-visible">
          {plans.map((plan, i) => {
            const monthlyPrices = { starter: '25', growth: '33', empire: '60' };
            const yearlySavings = getYearlySavings(monthlyPrices[plan.id as keyof typeof monthlyPrices], plan.price);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex flex-col rounded-2xl p-5 sm:p-7 lg:p-8 transition-all duration-500 overflow-visible ${
                  plan.featured 
                    ? 'neo-glass-premium ring-1 lg:scale-[1.04] mt-5' 
                    : 'neo-glass-subtle border border-border/20 hover:border-border/40 mt-5'
                }`}
                style={plan.featured ? {
                  boxShadow: '0 0 60px hsla(142, 71%, 45%, 0.15), 0 0 120px hsla(142, 71%, 45%, 0.05)',
                  borderColor: 'hsla(142, 71%, 45%, 0.3)',
                } : undefined}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-white px-5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(160 64% 40%))', boxShadow: '0 4px 20px hsla(142, 71%, 45%, 0.35)' }}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Най-популярен
                  </div>
                )}

                {isYearly && yearlySavings > 0 && (
                  <div className="absolute -top-2 -right-2 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg text-white" style={{ backgroundColor: 'hsl(142 71% 45%)' }}>
                    -{yearlySavings}%
                  </div>
                )}

                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={`text-4xl lg:text-5xl font-black tracking-tight ${plan.featured ? '' : 'text-foreground'}`}
                    style={plan.featured ? { color: 'hsl(142 71% 45%)' } : undefined}
                  >
                    {plan.price} EUR
                  </span>
                  <span className="text-sm lg:text-lg text-muted-foreground font-medium">/мес</span>
                </div>

                {isYearly && (
                  <p className="text-xs text-muted-foreground/80 mb-3">
                    Годишно: {plan.yearlyTotal} EUR
                  </p>
                )}

                <div className="flex items-center gap-2 mb-5">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">{plan.minutes} минути</span>
                  <span className="text-xs text-muted-foreground">({plan.callsPerDay})</span>
                </div>

                <div className="h-px bg-border/20 mb-5" />

                <ul className="space-y-3 mb-6 lg:mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-foreground/80">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <feature.icon className="w-3 h-3 text-primary" />
                      </div>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className={`w-full py-4 text-sm lg:text-base font-bold rounded-xl transition-all duration-300 font-mono ${
                    plan.featured 
                      ? 'neo-btn-primary shadow-lg shadow-primary/25' 
                      : 'bg-secondary text-foreground border border-border/20 hover:bg-secondary/80 hover:border-primary/20'
                  }`}
                  onClick={() => handleCheckout(plan)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? 'Зареждане...' : plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {checkoutModal && (
        <EmbeddedCheckoutModal
          isOpen={checkoutModal.isOpen}
          onClose={() => setCheckoutModal(null)}
          priceId={checkoutModal.priceId}
          planName={checkoutModal.planName}
        />
      )}
    </section>
  );
};

export default Pricing;
