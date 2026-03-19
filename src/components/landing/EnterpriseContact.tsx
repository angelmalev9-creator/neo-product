import { useState } from 'react';
import { Send, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const EnterpriseContact = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ title: t('contact.error'), description: t('contact.errorDesc'), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          message: formData.message || 'No message',
        },
      });

      if (error) throw error;
      
      toast({ title: t('contact.success'), description: t('contact.successDesc') });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({ title: t('contact.error'), description: t('contact.tryAgain'), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="contact" 
      className={`py-12 lg:py-20 bg-secondary/10 neo-section-zoom ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground leading-[1.1] tracking-wide">
              {t('contact.title1')}
              <br />
              <span className="neo-gradient-text">{t('contact.title2')}</span>
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="neo-glass-subtle border border-border/20 rounded-xl lg:rounded-2xl p-6 lg:p-10 space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="relative">
                <User className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('contact.namePlaceholder')}
                  className="w-full bg-background/30 border border-border/30 rounded-xl py-3 lg:py-4 pl-10 lg:pl-12 pr-3 lg:pr-4 text-sm lg:text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground/50" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('contact.emailPlaceholder')}
                  className="w-full bg-background/30 border border-border/30 rounded-xl py-3 lg:py-4 pl-10 lg:pl-12 pr-3 lg:pr-4 text-sm lg:text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40"
                  required
                />
              </div>
            </div>

            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t('contact.messagePlaceholder')}
              rows={4}
              className="w-full bg-background/30 border border-border/30 rounded-xl py-3 lg:py-4 px-3 lg:px-4 text-sm lg:text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none"
            />

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-sm lg:text-base py-3 lg:py-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('contact.sending') : t('contact.submit')}
              <Send className="ml-2 w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default EnterpriseContact;
