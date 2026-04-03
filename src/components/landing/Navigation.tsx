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
    { href: '#use-cases', label: 'ЗА КОГО Е' },
    { href: '#features', label: t('nav.features') },
    { href: '#calculator', label: 'ВИЖТЕ КОЛКО ГУБИТЕ' },
    { href: '#pricing', label: t('nav.pricing') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3">
      <div 
        className={`mx-auto max-w-6xl border transition-all duration-500 rounded-full bg-background/85 backdrop-blur-2xl border-foreground/8 ${
          isScrolled 
            ? 'shadow-[0_4px_30px_hsl(0_0%_0%/0.5),0_0_60px_hsl(0_90%_58%/0.05)]' 
            : 'shadow-[0_2px_20px_hsl(0_0%_0%/0.3)]'
        }`}
      >
        <div className="flex items-center justify-between h-12 sm:h-12 lg:h-14 px-4 sm:px-4 lg:px-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-black text-foreground tracking-tight">NEO</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1">
            {navLinks.map((link) => (
              <button 
                key={link.href} 
                onClick={() => {
                  if ((link as any).isRoute) navigate(link.href);
                  else document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs lg:text-sm font-medium text-foreground/40 hover:text-foreground px-3 lg:px-4 py-2 rounded-full hover:bg-foreground/5 transition-all duration-300"
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
              className="text-xs lg:text-sm h-8 lg:h-9 px-3 lg:px-4 text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-300 rounded-full" 
              onClick={() => navigate('/auth')}
            >
              {t('nav.login')}
            </Button>
            <Button 
              size="sm" 
              className="neo-btn-primary text-xs lg:text-sm h-8 lg:h-9 px-4 lg:px-5 rounded-full gap-1.5" 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('nav.demo')}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <Button 
              size="sm" 
              className="neo-btn-primary text-[12px] h-9 px-4 rounded-full font-bold" 
              onClick={() => { setIsOpen(false); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              {t('nav.demo')}
            </Button>
            <button className="p-2.5 text-foreground rounded-full active:bg-foreground/5 transition-colors" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 rounded-2xl bg-background/95 backdrop-blur-2xl border border-foreground/8 shadow-[0_8px_40px_hsl(0_0%_0%/0.6)] overflow-hidden">
          <div className="py-3 px-5">
            {navLinks.map((link) => (
              <button 
                key={link.href} 
                onClick={() => {
                  setIsOpen(false);
                  if ((link as any).isRoute) navigate(link.href);
                  else document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block text-[14px] py-3.5 text-foreground/45 hover:text-foreground active:text-foreground transition-colors text-left w-full font-medium" 
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-3 pt-3 mt-2 border-t border-foreground/6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[14px] flex-1 h-12 text-foreground/45 rounded-xl font-medium" 
                onClick={() => { setIsOpen(false); navigate('/auth'); }}
              >
                {t('nav.login')}
              </Button>
              <Button 
                size="sm" 
                className="neo-btn-primary text-[14px] flex-1 h-12 rounded-full font-bold" 
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
