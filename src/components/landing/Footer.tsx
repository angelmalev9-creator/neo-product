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
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Top CTA Section */}
      <div className="border-t border-border/20 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl lg:text-3xl font-display font-black text-foreground mb-4">
              {t('footer.ctaTitle')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('footer.ctaSubtitle')}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white px-8 py-4 font-semibold rounded-full"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Zap className="w-4 h-4 mr-2" />
              {t('footer.ctaButton')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="border-t border-border/20 py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-display font-black text-foreground">NEO</span>
                  <span className="text-xl font-display font-black text-primary">-ASSISTANT.COM</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                {t('footer.description')}
              </p>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="mailto:admin@neo-assistant.com" className="flex items-center gap-2 hover:text-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  admin@neo-assistant.com
                </a>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">{t('footer.platform')}</h4>
              <ul className="space-y-3">
                {platformLinks.map((link) => (
                  <li key={link.label}>
                    <button 
                      onClick={() => handleScrollClick(link.href)}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">{t('footer.resources')}</h4>
              <ul className="space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1 group"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">{t('footer.legal')}</h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
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
      <div className="border-t border-border/20 py-6">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              {t('footer.copyright', { year: currentYear })}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {t('footer.madeIn')}
              <span className="text-border">|</span>
              <a 
                href="https://webvision-bg.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
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
