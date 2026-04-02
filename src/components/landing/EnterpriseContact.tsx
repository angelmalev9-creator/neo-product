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
    <section ref={ref as React.RefObject<HTMLElement>} id="contact" className="py-20 sm:py-24 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-xl">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-3">
            <MessageSquare className="w-3 h-3" /> Контакт
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-foreground leading-tight tracking-tight">
            {t('contact.title1')}<br />
            <span className="neo-gradient-text">{t('contact.title2')}</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="neo-glass-subtle rounded-xl p-5 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35" />
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('contact.namePlaceholder')}
                className="w-full bg-background/30 border border-border/20 rounded-lg py-3 pl-9 pr-3 text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/25 focus:ring-1 focus:ring-primary/10 transition-all"
                required />
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35" />
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('contact.emailPlaceholder')}
                className="w-full bg-background/30 border border-border/20 rounded-lg py-3 pl-9 pr-3 text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/25 focus:ring-1 focus:ring-primary/10 transition-all"
                required />
            </div>
          </div>
          <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t('contact.messagePlaceholder')} rows={3}
            className="w-full bg-background/30 border border-border/20 rounded-lg py-3 px-3.5 text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/25 focus:ring-1 focus:ring-primary/10 transition-all resize-none" />
          <Button type="submit" size="lg" className="w-full neo-btn-primary text-sm h-11 rounded-lg" disabled={isSubmitting}>
            {isSubmitting ? t('contact.sending') : t('contact.submit')} <Send className="ml-1.5 w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </section>
  );
};

export default EnterpriseContact;
