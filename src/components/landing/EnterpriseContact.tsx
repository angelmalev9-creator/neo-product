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
      className="neo-section-spacing relative overflow-hidden"
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/4 opacity-30 rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              Контакт
            </span>
            <h2 className="neo-heading-section font-display font-black text-foreground mb-2">
              {t('contact.title1')}
            </h2>
            <p className="text-sm text-muted-foreground">
              Имате въпрос или нужда от помощ? Пишете ни.
            </p>
          </div>

          <div className="neo-glass-premium rounded-xl sm:rounded-2xl p-5 sm:p-8 relative overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Вашето име</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('contact.namePlaceholder')}
                      className="w-full bg-card/40 border border-border/30 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Имейл адрес</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('contact.emailPlaceholder')}
                      className="w-full bg-card/40 border border-border/30 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Съобщение</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('contact.messagePlaceholder')}
                  rows={4}
                  className="w-full bg-card/40 border border-border/30 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full neo-btn-primary text-sm lg:text-base py-4 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('contact.sending') : t('contact.submit')}
                <Send className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnterpriseContact;
