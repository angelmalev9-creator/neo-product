import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DemoReviewProps {
  onSubmitted: () => void;
}

const DemoReview = ({ onSubmitted }: DemoReviewProps) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t('review.selectRating'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: '023c7423-2a5d-4d82-91b3-816aba5ab016',
          subject: `NEO Demo Ревю - ${rating} звезди`,
          from_name: 'NEO Demo Review',
          rating: `${rating}/5 звезди`,
          review: review || 'Без коментар',
          timestamp: new Date().toLocaleString('bg-BG'),
          source: 'NEO Landing Page Demo'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        toast.success(t('review.thankYou'));
        setTimeout(() => {
          onSubmitted();
        }, 1500);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('review.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-6 animate-in fade-in duration-500">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h4 className="text-lg font-semibold text-foreground">{t('review.thanks')}</h4>
        <p className="text-sm text-muted-foreground">{t('review.sentSuccess')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-foreground mb-1">
          {t('review.howWasNeo')}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t('review.leaveRating')}
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/70'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Review Text */}
      <Textarea
        placeholder={t('review.shareFeedback')}
        value={review}
        onChange={(e) => setReview(e.target.value)}
        className="min-h-[80px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
        maxLength={500}
      />

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full bg-primary hover:bg-primary/90 gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t('review.sending')}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {t('review.submitReview')}
          </>
        )}
      </Button>

      {/* Skip option */}
      <button
        onClick={onSubmitted}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {t('review.skip')}
      </button>
    </div>
  );
};

export default DemoReview;
