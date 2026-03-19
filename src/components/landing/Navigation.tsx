import { useState, useEffect } from 'react';
import { Menu, X, Bot } from 'lucide-react';
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-detect language from IP on first load
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
    { href: '/partners', label: t('nav.partners'), isRoute: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3">
      <div 
        className={`mx-auto max-w-6xl border transition-all duration-500 rounded-full ${
          isScrolled 
            ? 'bg-background/80 backdrop-blur-2xl border-foreground/10 shadow-[0_4px_30px_hsl(0_0%_0%/0.5),0_0_60px_hsl(0_90%_58%/0.06)]' 
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="flex items-center justify-between h-12 sm:h-12 lg:h-14 px-4 sm:px-4 lg:px-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">NEO</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => (
              <button 
                key={link.href} 
                onClick={() => {
                  if ((link as any).isRoute) {
                    navigate(link.href);
                  } else {
                    const element = document.querySelector(link.href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-xs lg:text-sm font-medium text-white/50 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs lg:text-sm h-8 lg:h-9 px-3 lg:px-4 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300" 
              onClick={() => navigate('/auth')}
            >
              {t('nav.login')}
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-red-600 to-rose-500 text-xs lg:text-sm h-8 lg:h-9 px-4 lg:px-5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20" 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('nav.demo')}
            </Button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button className="p-2 text-foreground rounded-full active:bg-foreground/5 transition-colors" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - OUTSIDE the rounded-full container */}
      {isOpen && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 mx-2 rounded-2xl bg-background/95 backdrop-blur-2xl border border-foreground/10 shadow-[0_8px_40px_hsl(0_0%_0%/0.6)] overflow-hidden">
          <div className="py-4 px-5">
            {navLinks.map((link) => (
              <button 
                key={link.href} 
                onClick={() => {
                  setIsOpen(false);
                  if ((link as any).isRoute) {
                    navigate(link.href);
                  } else {
                    const element = document.querySelector(link.href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="block text-[15px] py-3 text-foreground/55 hover:text-foreground active:text-foreground transition-colors text-left w-full font-medium" 
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-3 pt-4 mt-3 border-t border-foreground/8">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[15px] flex-1 h-12 text-foreground/55 rounded-xl font-medium" 
                onClick={() => { setIsOpen(false); navigate('/auth'); }}
              >
                {t('nav.login')}
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-red-600 to-rose-500 text-[15px] flex-1 h-12 rounded-full font-bold shadow-lg shadow-red-500/20" 
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
