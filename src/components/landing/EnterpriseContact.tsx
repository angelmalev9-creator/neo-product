import { useState } from 'react';
import { Send, User, Mail, MessageSquare } from 'lucide-react';
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
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: { name: formData.name, email: formData.email, message: formData.message || 'No message' },
      });
      if (error) throw error;
      toast({ title: t('contact.success'), description: t('contact.successDesc') });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({ title: t('contact.error'), description: t('contact.tryAgain'), variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="contact" 
      className="py-12 sm:py-16 lg:py-24 relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/4 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-5">
              <MessageSquare className="w-3.5 h-3.5" />
              Контакт
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground leading-[1.1] tracking-wide">
              {t('contact.title1')}
              <br />
              <span className="neo-gradient-text">{t('contact.title2')}</span>
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="neo-glass-premium rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-10 space-y-3 sm:space-y-4 lg:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('contact.namePlaceholder')}
                  className="w-full bg-background/30 border border-border/20 rounded-xl py-3.5 lg:py-4 pl-11 pr-4 text-sm placeholder:text-muted-foreground/35 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/15 transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('contact.emailPlaceholder')}
                  className="w-full bg-background/30 border border-border/20 rounded-xl py-3.5 lg:py-4 pl-11 pr-4 text-sm placeholder:text-muted-foreground/35 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/15 transition-all"
                  required
                />
              </div>
            </div>

            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t('contact.messagePlaceholder')}
              rows={4}
              className="w-full bg-background/30 border border-border/20 rounded-xl py-3.5 lg:py-4 px-4 text-sm placeholder:text-muted-foreground/35 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/15 transition-all resize-none"
            />

            <Button
              type="submit"
              size="lg"
              className="w-full neo-btn-primary text-sm lg:text-base py-4 lg:py-5 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('contact.sending') : t('contact.submit')}
              <Send className="ml-2 w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default EnterpriseContact;
