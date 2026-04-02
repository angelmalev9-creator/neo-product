import { Check, Crown, PiggyBank, ShieldCheck, Phone, BarChart3, Headphones, Users, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
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
      id: 'starter', name: t('pricing.starter'), price: yearly ? '15' : '25', yearlyTotal: '180',
      minutes: '500', callsPerDay: `~25 ${t('pricing.callsPerDay')}`, savings: '97%',
      description: t('pricing.starterDesc'),
      features: [
        { text: `500 ${t('pricing.minutes')} / ${t('pricing.perMonthShort')}`, icon: Phone },
        { text: t('pricing.feature_247'), icon: Headphones },
        { text: t('pricing.feature_bulgarian'), icon: Check },
        { text: t('pricing.feature_widget'), icon: Check },
        { text: 'Базова статистика', icon: BarChart3 },
      ],
      cta: t('pricing.ctaStarter'), featured: false,
      priceId: yearly ? PRICE_IDS.starter.yearly : PRICE_IDS.starter.monthly,
    },
    {
      id: 'growth', name: t('pricing.growth'), price: yearly ? '23' : '33', yearlyTotal: '276',
      minutes: '2500', callsPerDay: `~125 ${t('pricing.callsPerDay')}`, savings: '96%',
      description: t('pricing.growthDesc'),
      features: [
        { text: `2 500 ${t('pricing.minutes')} / ${t('pricing.perMonthShort')}`, icon: Phone },
        { text: t('pricing.feature_247'), icon: Headphones },
        { text: 'Всичко от Старт +', icon: Check },
        { text: 'Автоматични резервации', icon: Sparkles },
        { text: t('pricing.feature_email_automation'), icon: Mail },
        { text: 'Детайлна статистика', icon: BarChart3 },
        { text: t('pricing.feature_priority'), icon: Users },
      ],
      cta: t('pricing.ctaPopular'), featured: true,
      priceId: yearly ? PRICE_IDS.growth.yearly : PRICE_IDS.growth.monthly,
    },
    {
      id: 'empire', name: t('pricing.business'), price: yearly ? '50' : '60', yearlyTotal: '600',
      minutes: '10000', callsPerDay: `500+ ${t('pricing.callsPerDay')}`, savings: '93%',
      description: t('pricing.businessDesc'),
      features: [
        { text: `10 000 ${t('pricing.minutes')} / ${t('pricing.perMonthShort')}`, icon: Phone },
        { text: 'Всичко от Растеж +', icon: Check },
        { text: 'Без NEO брандиране', icon: Sparkles },
        { text: 'Персонален мениджър', icon: Users },
        { text: 'API достъп', icon: BarChart3 },
        { text: 'Приоритетна поддръжка', icon: Headphones },
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
      toast({ title: '✅ Планът е активиран!', description: `${plan.name} е активен (тестов режим)` });
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
    <section ref={ref as React.RefObject<HTMLElement>} id="pricing" className="py-20 sm:py-24 lg:py-28 relative overflow-visible">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/3 blur-[140px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Ценови планове
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-foreground mb-3 max-w-2xl mx-auto leading-tight tracking-tight">
            <PencilUnderline>{t('pricing.title1')}</PencilUnderline> <span className="neo-gradient-text">{t('pricing.title2')}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            {t('pricing.subtitle')}
          </p>

          {/* Toggle */}
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center p-0.5 rounded-full neo-glass-subtle">
              <button onClick={() => setIsYearly(false)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${!isYearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {t('pricing.monthly')}
              </button>
              <button onClick={() => setIsYearly(true)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${isYearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {t('pricing.yearly')}
              </button>
            </div>
            {isYearly && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/12 text-emerald-400 border border-emerald-500/15 text-[10px] font-bold px-3 py-1 rounded-full">
                🎉 {t('pricing.saveUpTo')} 40%
              </motion.span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto overflow-visible">
          {plans.map((plan, i) => {
            const monthlyPrices = { starter: '25', growth: '33', empire: '60' };
            const yearlySavings = getYearlySavings(monthlyPrices[plan.id as keyof typeof monthlyPrices], plan.price);
            
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-xl p-5 sm:p-6 transition-all duration-300 overflow-visible ${
                  plan.featured 
                    ? 'neo-glass-premium ring-1 ring-primary/25 lg:scale-[1.03] mt-4' 
                    : 'neo-glass-subtle border border-border/20 hover:border-border/35 mt-4'
                }`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
                    <Crown className="w-3 h-3" /> {t('pricing.mostPopular')}
                  </div>
                )}
                {isYearly && yearlySavings > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">
                    -{yearlySavings}%
                  </div>
                )}

                <h3 className="text-base font-bold text-foreground mb-0.5">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-black tracking-tight ${plan.featured ? 'neo-gradient-text' : 'text-foreground'}`}>€{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{t('pricing.perMonthShort')}</span>
                </div>
                {isYearly && <p className="text-[10px] text-muted-foreground/50 mb-2">{t('pricing.billedYearly')}: €{plan.yearlyTotal}</p>}

                <div className="flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-foreground font-medium">{plan.minutes} {t('pricing.minutes')}</span>
                  <span className="text-[10px] text-muted-foreground">({plan.callsPerDay})</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium mb-4 flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5" />
                  {t('pricing.savingsPrefix')} {plan.savings} {t('pricing.savingsSuffix')}
                </div>

                <div className="h-px bg-border/15 mb-4" />

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-foreground/75">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <feature.icon className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button size="lg"
                  className={`w-full h-11 text-sm font-bold rounded-lg transition-all ${
                    plan.featured ? 'neo-btn-primary' : 'bg-secondary text-foreground border border-border/20 hover:bg-secondary/80 hover:border-primary/15'
                  }`}
                  onClick={() => handleCheckout(plan)} disabled={loadingPlan === plan.id}>
                  {loadingPlan === plan.id ? t('pricing.loading') : plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {t('pricing.guarantee')}
          </p>
        </div>
      </div>

      {checkoutModal && (
        <EmbeddedCheckoutModal isOpen={checkoutModal.isOpen} onClose={() => setCheckoutModal(null)}
          priceId={checkoutModal.priceId} planName={checkoutModal.planName} />
      )}
    </section>
  );
};

export default Pricing;
