import { Check, Crown, PiggyBank, ShieldCheck, Phone, BarChart3, Headphones, Users, Mail, Sparkles, Clock, ArrowRight, Calendar, Brain, Globe, Palette, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
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

/* ── Urgency counter — seats left ── */
const SpotsCounter = () => {
  const [spots, setSpots] = useState(7);
  useEffect(() => {
    const t = setInterval(() => {
      setSpots(prev => Math.max(3, prev + (Math.random() > 0.6 ? -1 : 0)));
    }, 12000);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex items-center justify-center gap-2 text-xs text-foreground/40 mt-6"
    >
      <Clock className="w-3.5 h-3.5 text-primary/60" />
      <span>Остават <span className="text-primary font-bold">{spots}</span> места на промоционалната цена тази седмица</span>
    </motion.div>
  );
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
      id: 'starter', name: t('pricing.starter'), price: yearly ? '15' : '25', yearlyTotal: '180',
      minutes: '500', callsPerDay: `~25 ${t('pricing.callsPerDay')}`, savings: '97%',
      description: 'За малки бизнеси, които искат да не пропускат обаждания.',
      anchor: '1 000 EUR/мес за рецепционист',
      upgradeHook: 'Нужда от резервации и имейл автоматизация?',
      features: [
        { text: `500 ${t('pricing.minutes')} / ${t('pricing.perMonthShort')}`, icon: Phone },
        { text: t('pricing.feature_247'), icon: Headphones },
        { text: t('pricing.feature_bulgarian'), icon: Globe },
        { text: t('pricing.feature_widget'), icon: Palette },
        { text: 'Базова статистика', icon: BarChart3 },
        { text: 'База знания с обучение', icon: Brain },
      ],
      cta: t('pricing.ctaStarter'), featured: false,
      priceId: yearly ? PRICE_IDS.starter.yearly : PRICE_IDS.starter.monthly,
    },
    {
      id: 'growth', name: t('pricing.growth'), price: yearly ? '23' : '33', yearlyTotal: '276',
      minutes: '2500', callsPerDay: `~125 ${t('pricing.callsPerDay')}`, savings: '96%',
      description: 'За растящи бизнеси с повече клиенти и нужда от автоматизация.',
      anchor: '2 000 EUR/мес за екип',
      upgradeHook: 'Нужда от собствен брандинг и персонална поддръжка?',
      features: [
        { text: `2 500 ${t('pricing.minutes')} / ${t('pricing.perMonthShort')}`, icon: Phone },
        { text: 'Всичко от Старт +', icon: Check },
        { text: 'Автоматични резервации', icon: Calendar },
        { text: t('pricing.feature_email_automation'), icon: Mail },
        { text: 'Детайлна статистика и графики', icon: TrendingUp },
        { text: 'Улавяне на потенциални клиенти', icon: Users },
        { text: t('pricing.feature_priority'), icon: Headphones },
      ],
      cta: t('pricing.ctaPopular'), featured: true,
      priceId: yearly ? PRICE_IDS.growth.yearly : PRICE_IDS.growth.monthly,
    },
    {
      id: 'empire', name: t('pricing.business'), price: yearly ? '50' : '60', yearlyTotal: '600',
      minutes: '10000', callsPerDay: `500+ ${t('pricing.callsPerDay')}`, savings: '93%',
      description: 'За бизнеси с голям обем обаждания и нужда от пълен контрол.',
      anchor: '5 000+ EUR/мес за цял екип',
      upgradeHook: null,
      features: [
        { text: `10 000 ${t('pricing.minutes')} / ${t('pricing.perMonthShort')}`, icon: Phone },
        { text: 'Всичко от Растеж +', icon: Check },
        { text: 'Без NEO брандиране', icon: Palette },
        { text: 'Персонален мениджър', icon: Users },
        { text: 'Мулти-езикова поддръжка', icon: Globe },
        { text: 'Приоритетна поддръжка 24/7', icon: Headphones },
      ],
      cta: t('pricing.ctaBusiness'), featured: false,
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
      toast({ title: t('pricing.error'), description: t('pricing.paymentError'), variant: "destructive" });
    } finally { setLoadingPlan(null); }
  };

  const getYearlySavings = (monthlyPrice: string, yearlyPrice: string) => {
    return Math.round(((parseFloat(monthlyPrice) - parseFloat(yearlyPrice)) / parseFloat(monthlyPrice)) * 100);
  };

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="pricing" 
      className="py-20 sm:py-28 relative overflow-visible"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Ценови планове
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground mb-4 max-w-3xl mx-auto leading-[1.1] tracking-tight">
            {t('pricing.title1')} <span className="text-primary">{t('pricing.title2')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8">
            {t('pricing.subtitle')}
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
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isYearly ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('pricing.yearly')}
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
                    {t('pricing.mostPopular')}
                  </div>
                )}

                {isYearly && yearlySavings > 0 && (
                  <div className="absolute -top-2 -right-2 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg text-white" style={{ backgroundColor: 'hsl(142 71% 45%)' }}>
                    -{yearlySavings}%
                  </div>
                )}

                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground mb-4">{plan.description}</p>

                {/* Price anchoring — red strikethrough with savings animation */}
                <div className="relative mb-1">
                  <p className="text-[11px] font-medium line-through" style={{ color: 'hsl(0 72% 51%)' }}>{plan.anchor}</p>
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={isVisible ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.15 }}
                    className="absolute -right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: 'hsl(142 71% 45%)', backgroundColor: 'hsla(142, 71%, 45%, 0.1)' }}
                  >
                    Спестявате {plan.savings}
                  </motion.span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={`text-4xl lg:text-5xl font-black tracking-tight ${plan.featured ? 'neo-gradient-text' : 'text-foreground'}`}>
                    {plan.price} EUR
                  </span>
                  <span className="text-sm lg:text-lg text-muted-foreground font-medium">/{t('pricing.perMonthShort')}</span>
                </div>

                {isYearly && (
                  <p className="text-xs text-muted-foreground/60 mb-3">
                    {t('pricing.billedYearly')}: {plan.yearlyTotal} EUR
                  </p>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">{plan.minutes} {t('pricing.minutes')}</span>
                  <span className="text-xs text-muted-foreground">({plan.callsPerDay})</span>
                </div>

                <div className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: 'hsl(142 71% 45%)' }}>
                  <PiggyBank className="w-4 h-4" />
                  Спестявате {plan.savings} спрямо служител
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
                  className={`w-full py-4 text-sm lg:text-base font-bold rounded-xl transition-all duration-300 ${
                    plan.featured 
                      ? 'neo-btn-primary shadow-lg shadow-primary/25' 
                      : 'bg-secondary text-foreground border border-border/20 hover:bg-secondary/80 hover:border-primary/20'
                  }`}
                  onClick={() => handleCheckout(plan)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? t('pricing.loading') : plan.cta}
                </Button>

              </motion.div>
            );
          })}
        </div>

        <SpotsCounter />
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
