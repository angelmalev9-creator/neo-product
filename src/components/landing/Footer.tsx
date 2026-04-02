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
      {/* CTA */}
      <div className="border-t border-border/8">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-20 lg:py-28 max-w-6xl">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              {t('footer.ctaTitle')}
            </h3>
            <p className="text-muted-foreground mb-8 text-base sm:text-lg">{t('footer.ctaSubtitle')}</p>
            <Button size="lg" className="neo-btn-primary text-lg px-10 h-14 font-semibold rounded-full gap-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <Zap className="w-4 h-4" /> {t('footer.ctaButton')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="border-t border-border/8 py-14 lg:py-16">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-display font-bold text-foreground">NEO<span className="text-primary">.</span></span>
              </div>
              <p className="text-muted-foreground text-sm mb-4 max-w-xs leading-relaxed">{t('footer.description')}</p>
              <a href="mailto:admin@neo-assistant.com" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <Mail className="w-4 h-4 text-primary" /> admin@neo-assistant.com
              </a>
            </div>
            <div>
              <h4 className="font-semibold text-foreground/50 mb-4 text-xs uppercase tracking-widest">{t('footer.platform')}</h4>
              <ul className="space-y-3">
                {platformLinks.map(link => (
                  <li key={link.label}>
                    <button onClick={() => handleScrollClick(link.href)} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1.5 group">
                      {link.label} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground/50 mb-4 text-xs uppercase tracking-widest">{t('footer.resources')}</h4>
              <ul className="space-y-3">
                {resourceLinks.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1.5 group">
                      {link.label} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground/50 mb-4 text-xs uppercase tracking-widest">{t('footer.legal')}</h4>
              <ul className="space-y-3">
                {legalLinks.map(link => (
                  <li key={link.label}><Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border/8 py-6">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/40">{t('footer.copyright', { year: currentYear })}</p>
            <p className="text-xs text-muted-foreground/40 flex items-center gap-2">
              {t('footer.madeIn')} <span className="text-border/20">|</span>
              <a href="https://webvision-bg.com" target="_blank" rel="noopener noreferrer" className="text-primary/50 hover:text-primary transition-colors">webvision-bg.com</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
