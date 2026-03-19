import { useCallback, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

// Initialize Stripe with publishable key
const stripePromise = loadStripe('pk_live_51SYoOmJnrCo2ucK9WBRIRKjqK2ZOO45WHxfD2FwFGPIoPhkFUOYPIH0bLPVMoLRVCNn8TWmBwxHqFLKV4I1j3VCV00TZ0hpQqT');

interface EmbeddedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceId: string;
  planName: string;
}

const EmbeddedCheckoutModal = ({ isOpen, onClose, priceId, planName }: EmbeddedCheckoutModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      setLoading(true);
      return;
    }

    const fetchClientSecret = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            priceId,
            planName,
          },
        });

        if (error) throw error;
        
        if (!data?.clientSecret) {
          throw new Error('No client secret returned');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Failed to create checkout session:', err);
        setError(t('pricing.paymentError'));
      } finally {
        setLoading(false);
      }
    };

    fetchClientSecret();
  }, [isOpen, priceId, planName, t]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-background border-border [&>button]:hidden">
        <DialogTitle className="sr-only">Checkout</DialogTitle>
        {error ? (
          <div className="p-8 text-center">
            <p className="text-destructive">{error}</p>
            <button 
              onClick={onClose}
              className="mt-4 text-primary hover:underline"
            >
              {t('common.close')}
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('pricing.loading')}</p>
          </div>
        ) : clientSecret ? (
          <div className="w-full min-h-[500px]">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default EmbeddedCheckoutModal;
