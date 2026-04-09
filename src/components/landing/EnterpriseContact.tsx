import { useState } from 'react';
import { Send, User, Mail, Quote, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import devOfNeoImg from '@/assets/dev-of-neo.png';

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
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-8 lg:mb-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              Контакт
            </span>
            <h2 className="neo-heading-section font-display font-black text-foreground">
              {t('contact.title1')}
            </h2>
          </div>

          {/* Single unified card */}
          <div className="neo-glass-premium rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-10 relative overflow-hidden">
            <div className="absolute -z-0 top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/5 to-transparent" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 relative z-10">
              {/* Left: Founder */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="relative mb-4">
                  <img 
                    src={devOfNeoImg} 
                    alt="Dev of NEO" 
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl object-cover shadow-xl shadow-primary/10 border border-primary/15"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                    <Quote className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
                
                <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
                  Кой стои зад NEO
                </p>
                <h3 className="text-lg sm:text-xl font-black text-foreground mb-3">
                  Здравейте, казвам се{' '}
                  <span className="text-primary">Ангел Малев</span>
                </h3>
                
                <div className="space-y-2.5">
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Създадох NEO, защото видях колко клиенти губят малките бизнеси просто защото никой не успява да отговори навреме.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    NEO не е продукт на голяма корпорация. Това е проект, който разработвам лично, с идеята да помогне на бизнесите да не изпускат клиенти.
                  </p>
                </div>
              </div>

              {/* Right: Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 flex flex-col justify-center lg:border-l lg:border-border/20 lg:pl-10">
                <h3 className="font-black text-foreground mb-1 text-xl">Контактна форма</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('contact.messagePlaceholder')}
                  rows={4}
                  className="w-full bg-card/40 border border-border/30 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />

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
      </div>
    </section>
  );
};

export default EnterpriseContact;
