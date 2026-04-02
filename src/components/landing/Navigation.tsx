import { useState, useEffect } from 'react';
import { Menu, X, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { detectLanguageFromIP, changeLanguage } from '@/i18n';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const autoDetectLanguage = async () => {
      const savedLang = localStorage.getItem('neo_language');
      if (!savedLang) {
        const detectedLang = await detectLanguageFromIP();
        await changeLanguage(detectedLang, false);
      }
    };
    autoDetectLanguage();
  }, []);

  const navLinks = [
    { href: '#features', label: t('nav.features') },
    { href: '#demo', label: t('nav.demo') },
    { href: '#pricing', label: t('nav.pricing') },
    { href: '/blog', label: 'БЛОГ', isRoute: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4">
      <div 
        className={`mx-auto max-w-6xl border transition-all duration-500 rounded-full ${
          isScrolled 
            ? 'nav-glass-scrolled' 
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="flex items-center justify-between h-14 sm:h-16 px-5 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground tracking-tight">NEO</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button 
                key={link.href} 
                onClick={() => {
                  if ((link as any).isRoute) navigate(link.href);
                  else document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[15px] font-medium text-foreground/50 hover:text-primary px-4 py-2 rounded-full transition-colors duration-300"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[15px] h-10 px-4 text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-300 rounded-full font-medium" 
              onClick={() => navigate('/auth')}
            >
              {t('nav.login')}
            </Button>
            <Button 
              size="sm" 
              className="neo-btn-primary text-[15px] h-10 px-6 rounded-full gap-2 font-semibold" 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('nav.demo')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <Button 
              size="sm" 
              className="neo-btn-primary text-sm h-9 px-4 rounded-full font-semibold" 
              onClick={() => { setIsOpen(false); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              {t('nav.demo')}
            </Button>
            <button className="p-2 text-foreground rounded-full active:bg-foreground/5 transition-colors" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 rounded-2xl bg-background/95 backdrop-blur-2xl border border-border/20 shadow-2xl overflow-hidden">
          <div className="py-4 px-6">
            {navLinks.map((link) => (
              <button 
                key={link.href} 
                onClick={() => {
                  setIsOpen(false);
                  if ((link as any).isRoute) navigate(link.href);
                  else document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block text-base py-3.5 text-foreground/50 hover:text-primary active:text-primary transition-colors text-left w-full font-medium border-b border-border/10 last:border-0" 
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-3 pt-4 mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-base flex-1 h-12 text-foreground/50 rounded-xl font-medium" 
                onClick={() => { setIsOpen(false); navigate('/auth'); }}
              >
                {t('nav.login')}
              </Button>
              <Button 
                size="sm" 
                className="neo-btn-primary text-base flex-1 h-12 rounded-full font-semibold" 
                onClick={() => { setIsOpen(false); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                {t('nav.demo')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
