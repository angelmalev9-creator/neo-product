import { Bot, Mail, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: t('footer.howItWorks'), href: '#demo', isScroll: true },
    { label: t('footer.features'), href: '#features', isScroll: true },
    { label: t('footer.pricing'), href: '#pricing', isScroll: true },
    { label: t('footer.demo'), href: '#demo', isScroll: true },
  ];

  const resourceLinks = [
    { label: t('footer.helpCenter'), href: '/help' },
    { label: t('footer.apiDocs'), href: '/api-docs' },
    { label: t('footer.blog'), href: '/blog' },
  ];

  const legalLinks = [
    { label: t('footer.terms'), href: '/terms' },
    { label: t('footer.privacy'), href: '/privacy' },
    { label: t('footer.gdpr'), href: '/gdpr' },
    { label: t('footer.cookies'), href: '/cookies' },
  ];

  const handleScrollClick = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Top CTA Section */}
      <div className="border-t border-border/10">
        <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-xl sm:text-3xl lg:text-4xl font-display text-foreground mb-3">
              {t('footer.ctaTitle')}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm sm:text-lg">
              {t('footer.ctaSubtitle')}
            </p>
            <Button
              size="lg"
              className="neo-btn-primary text-sm sm:text-base px-8 py-4 sm:py-5 font-bold rounded-full gap-2 w-full sm:w-auto"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Zap className="w-4 h-4" />
              {t('footer.ctaButton')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="border-t border-border/10 py-10 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bot className="w-4.5 h-4.5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-lg font-display font-black text-foreground">NEO</span>
                  <span className="text-lg font-display font-black text-primary">.</span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mb-4 max-w-xs leading-relaxed">
                {t('footer.description')}
              </p>
              <a href="mailto:admin@neo-assistant.com" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <Mail className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                admin@neo-assistant.com
              </a>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-bold text-foreground/60 mb-4 text-[10px] sm:text-xs uppercase tracking-[0.2em]">{t('footer.platform')}</h4>
              <ul className="space-y-2.5">
                {platformLinks.map((link) => (
                  <li key={link.label}>
                    <button 
                      onClick={() => handleScrollClick(link.href)}
                      className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm flex items-center gap-1.5 group"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-foreground/60 mb-4 text-[10px] sm:text-xs uppercase tracking-[0.2em]">{t('footer.resources')}</h4>
              <ul className="space-y-2.5">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm flex items-center gap-1.5 group">
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-foreground/60 mb-4 text-[10px] sm:text-xs uppercase tracking-[0.2em]">{t('footer.legal')}</h4>
              <ul className="space-y-2.5">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/10 py-5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground/50">
              {t('footer.copyright', { year: currentYear })}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/50 flex items-center gap-2">
              {t('footer.madeIn')}
              <span className="text-border/30">|</span>
              <a href="https://webvision-bg.com" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors">
                webvision-bg.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
