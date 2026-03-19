import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import DemoReview from './DemoReview';

interface DemoEndModalProps {
  onTryAgain: () => void;
}

const DemoEndModal = ({ onTryAgain }: DemoEndModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(true);

  const handleSelectPlan = () => {
    navigate('/#pricing');
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleReviewSubmitted = () => {
    setShowReview(false);
  };

  return (
    <div className="neo-glass-subtle border border-primary/30 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-display font-bold text-foreground mb-2">
        {t('demoEnd.title')}
      </h3>

      {showReview ? (
        <DemoReview onSubmitted={handleReviewSubmitted} />
      ) : (
        <>
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            {t('demoEnd.description')}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSelectPlan}
              className="w-full bg-primary hover:bg-primary/90 neo-glow gap-2 font-semibold"
              size="lg"
            >
              {t('demoEnd.selectPlan')}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={onTryAgain}
              className="w-full gap-2"
              size="default"
            >
              <RotateCcw className="w-4 h-4" />
              {t('demoEnd.tryAgain')}
            </Button>
          </div>

          {/* Features reminder */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              {t('demoEnd.features')}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default DemoEndModal;
