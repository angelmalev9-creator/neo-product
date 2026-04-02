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
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-5xl">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-display font-black text-foreground mb-2">
              {t('footer.ctaTitle')}
            </h3>
            <p className="text-muted-foreground mb-5 text-sm">{t('footer.ctaSubtitle')}</p>
            <Button size="lg" className="neo-btn-primary text-sm px-6 h-11 font-bold rounded-full gap-2 w-full sm:w-auto"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <Zap className="w-3.5 h-3.5" /> {t('footer.ctaButton')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="border-t border-border/8 py-10 lg:py-12">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="text-base font-black text-foreground">NEO<span className="text-primary">.</span></span>
              </div>
              <p className="text-muted-foreground text-xs mb-3 max-w-xs leading-relaxed">{t('footer.description')}</p>
              <a href="mailto:admin@neo-assistant.com" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                <Mail className="w-3 h-3 text-primary" /> admin@neo-assistant.com
              </a>
            </div>
            <div>
              <h4 className="font-bold text-foreground/50 mb-3 text-[10px] uppercase tracking-[0.15em]">{t('footer.platform')}</h4>
              <ul className="space-y-2">
                {platformLinks.map(link => (
                  <li key={link.label}>
                    <button onClick={() => handleScrollClick(link.href)} className="text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1 group">
                      {link.label} <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground/50 mb-3 text-[10px] uppercase tracking-[0.15em]">{t('footer.resources')}</h4>
              <ul className="space-y-2">
                {resourceLinks.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1 group">
                      {link.label} <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground/50 mb-3 text-[10px] uppercase tracking-[0.15em]">{t('footer.legal')}</h4>
              <ul className="space-y-2">
                {legalLinks.map(link => (
                  <li key={link.label}><Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-xs">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border/8 py-4">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground/40">{t('footer.copyright', { year: currentYear })}</p>
            <p className="text-[10px] text-muted-foreground/40 flex items-center gap-2">
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
