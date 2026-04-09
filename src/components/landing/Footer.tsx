import { Mail, ArrowRight, ExternalLink } from 'lucide-react';
import NeoLogo from '@/components/ui/NeoLogo';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { label: 'Функции', href: '#features', isScroll: true },
    { label: 'Цени', href: '#pricing', isScroll: true },
    { label: 'Демо', href: '#demo', isScroll: true },
  ];

  const companyLinks = [
    { label: 'Помощен център', href: '/help' },
    { label: 'API документация', href: '/api-docs' },
    { label: 'Блог', href: '/blog' },
  ];

  const legalLinks = [
    { label: 'Условия за ползване', href: '/terms' },
    { label: 'Политика за поверителност', href: '/privacy' },
    { label: 'GDPR', href: '/gdpr' },
    { label: 'Бисквитки', href: '/cookies' },
  ];

  const handleScrollClick = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden border-t border-border/10">
      <div className="py-10 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <NeoLogo size="md" />
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mb-4 max-w-xs leading-relaxed">
                AI рецепционист за вашия бизнес. Отговаря на чат и телефон 24/7 на български.
              </p>
              <a href="mailto:admin@neo-assistant.com" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <Mail className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                admin@neo-assistant.com
              </a>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-foreground/60 mb-4 text-[10px] sm:text-xs uppercase tracking-[0.2em]">Продукт</h4>
              <ul className="space-y-2.5">
                {productLinks.map((link) => (
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

            {/* Company */}
            <div>
              <h4 className="font-bold text-foreground/60 mb-4 text-[10px] sm:text-xs uppercase tracking-[0.2em]">Компания</h4>
              <ul className="space-y-2.5">
                {companyLinks.map((link) => (
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
              <h4 className="font-bold text-foreground/60 mb-4 text-[10px] sm:text-xs uppercase tracking-[0.2em]">Правни</h4>
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
              © {currentYear} NEO Assistant. Всички права запазени.
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/50 flex items-center gap-2">
              Направено в България
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
