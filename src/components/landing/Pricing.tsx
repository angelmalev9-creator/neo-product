import { Check, Crown, PiggyBank, ShieldCheck, Phone, BarChart3, Headphones, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { useTranslation } from 'react-i18next';
import EmbeddedCheckoutModal from '@/components/checkout/EmbeddedCheckoutModal';

// Price IDs from Stripe
const PRICE_IDS = {
  starter: {
    monthly: 'price_1SnZt6JnrCo2ucK9XL1FGEEn',
    yearly: 'price_1SnZtYJnrCo2ucK9KDk4xZd6',
  },
  growth: {
    monthly: 'price_1SnZtFJnrCo2ucK95hcj2Gqy',
    yearly: 'price_1SnZtiJnrCo2ucK9kXjVEPkf',
  },
  empire: {
    monthly: 'price_1SnZtOJnrCo2ucK9zta7lV0A',
    yearly: 'price_1SnZtrJnrCo2ucK9Md9j1egd',
  },
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
      id: 'starter',
      name: t('pricing.starter'),
      price: yearly ? '15' : '25',
      yearlyTotal: '180',
      minutes: '500',
      callsPerDay: `~25 ${t('pricing.callsPerDay')}`,
      savings: '97%',
      description: t('pricing.starterDesc'),
      features: [
        { text: t('pricing.feature_minutes', { count: 500 }), icon: Phone },
        { text: t('pricing.feature_247'), icon: Headphones },
        { text: t('pricing.feature_bulgarian'), icon: Check },
        { text: t('pricing.feature_widget'), icon: Check },
        { text: t('pricing.feature_stats'), icon: BarChart3 },
      ],
      cta: t('pricing.ctaStarter'),
      featured: false,
      priceId: yearly ? PRICE_IDS.starter.yearly : PRICE_IDS.starter.monthly,
    },
    {
      id: 'growth',
      name: t('pricing.growth'),
      price: yearly ? '23' : '33',
      yearlyTotal: '276',
      minutes: '2500',
      callsPerDay: `~125 ${t('pricing.callsPerDay')}`,
      savings: '96%',
      description: t('pricing.growthDesc'),
      features: [
        { text: t('pricing.feature_minutes', { count: 2500 }), icon: Phone },
        { text: t('pricing.feature_247'), icon: Headphones },
        { text: t('pricing.feature_bulgarian'), icon: Check },
        { text: t('pricing.feature_widget'), icon: Check },
        { text: t('pricing.feature_stats'), icon: BarChart3 },
        { text: t('pricing.feature_email_automation'), icon: Mail },
        { text: t('pricing.feature_priority'), icon: Users },
      ],
      cta: t('pricing.ctaPopular'),
      featured: true,
      priceId: yearly ? PRICE_IDS.growth.yearly : PRICE_IDS.growth.monthly,
    },
    {
      id: 'empire',
      name: t('pricing.business'),
      price: yearly ? '50' : '60',
      yearlyTotal: '600',
      minutes: '10000',
      callsPerDay: `500+ ${t('pricing.callsPerDay')}`,
      savings: '93%',
      description: t('pricing.businessDesc'),
      features: [
        { text: t('pricing.feature_minutes', { count: 10000 }), icon: Phone },
        { text: t('pricing.feature_247'), icon: Headphones },
        { text: t('pricing.feature_bulgarian'), icon: Check },
        { text: t('pricing.feature_widget'), icon: Check },
        { text: t('pricing.feature_stats'), icon: BarChart3 },
        { text: t('pricing.feature_manager'), icon: Users },
      ],
      cta: t('pricing.ctaBusiness'),
      featured: false,
      priceId: yearly ? PRICE_IDS.empire.yearly : PRICE_IDS.empire.monthly,
    },
  ];

  const plans = getPlans(isYearly);

  const handleCheckout = async (plan: typeof plans[0]) => {
    setLoadingPlan(plan.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = `/auth?plan=${plan.id}&priceId=${plan.priceId}`;
        return;
      }

      // TEMPORARY: Activate plan directly without Stripe payment (for testing)
      const { error } = await supabase.functions.invoke('activate-test-plan', {
        body: { tier: plan.id },
      });

      if (error) throw error;

      toast({ 
        title: '✅ Планът е активиран!', 
        description: `${plan.name} е активен (тестов режим)`,
      });

      // Refresh subscription state
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ 
        title: t('pricing.error'), 
        description: t('pricing.paymentError'), 
        variant: "destructive" 
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const closeCheckoutModal = () => {
    setCheckoutModal(null);
  };

  // Calculate savings percentage for yearly
  const getYearlySavings = (monthlyPrice: string, yearlyPrice: string) => {
    const monthly = parseFloat(monthlyPrice);
    const yearly = parseFloat(yearlyPrice);
    const savings = Math.round(((monthly - yearly) / monthly) * 100);
    return savings;
  };

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="pricing" 
      className={`py-12 sm:py-16 lg:py-24 relative overflow-hidden neo-section-flip-right ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-3 sm:mb-4 max-w-3xl mx-auto leading-[1.1] tracking-wide">
            <PencilUnderline>{t('pricing.title1')}</PencilUnderline> <span className="neo-gradient-text whitespace-nowrap">{t('pricing.title2')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6">
            {t('pricing.subtitle')}
          </p>

          {/* Billing Toggle - Segmented Control */}
          <div className="flex flex-col items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center p-1 rounded-full bg-muted/50 border border-border/30">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  !isYearly 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  isYearly 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('pricing.yearly')}
              </button>
            </div>
            {isYearly && (
              <span className="bg-neo-success/20 text-neo-success text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full animate-fade-in">
                🎉 {t('pricing.saveUpTo')} 40%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 max-w-6xl mx-auto px-1 sm:px-0">
          {plans.map((plan) => {
            const monthlyPrices = { starter: '25', growth: '33', empire: '60' };
            const yearlySavings = getYearlySavings(monthlyPrices[plan.id as keyof typeof monthlyPrices], plan.price);
            
            return (
              <div
                key={plan.id}
                className={`neo-glass-subtle rounded-2xl sm:rounded-xl lg:rounded-2xl p-5 sm:p-6 lg:p-8 relative flex flex-col ${
                  plan.featured ? 'ring-2 ring-primary/40 lg:-mt-4 lg:mb-4 lg:scale-[1.02] shadow-[0_0_40px_hsl(var(--neo-red)/0.1)]' : 'border border-border/20'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-3 sm:px-4 lg:px-5 py-1 lg:py-1.5 rounded-full text-[10px] sm:text-xs lg:text-sm font-bold flex items-center gap-1.5">
                    <Crown className="w-3 h-3 lg:w-4 lg:h-4" />
                    {t('pricing.mostPopular')}
                  </div>
                )}

                {isYearly && yearlySavings > 0 && (
                  <div className="absolute -top-2 -right-2 bg-neo-success text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                    -{yearlySavings}%
                  </div>
                )}

                <h3 className="text-lg sm:text-lg lg:text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-[12px] sm:text-xs lg:text-sm text-muted-foreground mb-4 sm:mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={`text-4xl sm:text-4xl lg:text-5xl font-black tracking-tight ${plan.featured ? 'text-neo-success' : 'text-foreground'}`}>
                    €{plan.price}
                  </span>
                  <span className="text-sm sm:text-base lg:text-lg text-muted-foreground font-medium">/{t('pricing.perMonthShort')}</span>
                </div>

                {isYearly && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('pricing.billedYearly')}: €{plan.yearlyTotal}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">{plan.minutes} {t('pricing.minutes')}</span>
                  <span className="text-xs text-muted-foreground">({plan.callsPerDay})</span>
                </div>

                <div className="text-sm text-neo-success font-medium mb-6 flex items-center gap-2">
                  <PiggyBank className="w-4 h-4" />
                  {t('pricing.savingsPrefix')} {plan.savings} {t('pricing.savingsSuffix')}
                </div>

                <ul className="space-y-3 mb-6 lg:mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <feature.icon className="w-5 h-5 shrink-0 mt-0.5 text-neo-success" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className={`w-full py-3.5 sm:py-3 lg:py-4 text-[15px] sm:text-sm lg:text-base font-bold rounded-xl ${
                    plan.featured 
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20' 
                      : 'bg-secondary text-foreground border border-border/20 hover:bg-secondary/80'
                  }`}
                  onClick={() => handleCheckout(plan)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? t('pricing.loading') : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neo-success" />
            {t('pricing.guarantee')}
          </p>
        </div>
      </div>

      {/* Embedded Checkout Modal */}
      {checkoutModal && (
        <EmbeddedCheckoutModal
          isOpen={checkoutModal.isOpen}
          onClose={closeCheckoutModal}
          priceId={checkoutModal.priceId}
          planName={checkoutModal.planName}
        />
      )}
    </section>
  );
};

export default Pricing;
