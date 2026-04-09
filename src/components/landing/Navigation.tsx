import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NeoLogo from '@/components/ui/NeoLogo';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { detectLanguageFromIP, changeLanguage } from '@/i18n';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy
  useEffect(() => {
    const sectionIds = ['features', 'how-it-works', 'pricing', 'faq'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
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
    { href: '#features', label: 'Функции', id: 'features' },
    { href: '#how-it-works', label: 'Как работи', id: 'how-it-works' },
    { href: '#pricing', label: 'Цени', id: 'pricing' },
    { href: '#faq', label: 'FAQ', id: 'faq' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3">
        <div
          className={`mx-auto max-w-6xl border transition-all duration-500 rounded-full ${
            isScrolled
              ? 'bg-background/80 backdrop-blur-2xl shadow-[0_4px_30px_hsl(0_0%_0%/0.5),0_0_60px_hsl(0_90%_58%/0.05)] border-foreground/10'
              : 'bg-background/85 shadow-[0_2px_20px_hsl(0_0%_0%/0.3)] border-foreground/8'
          }`}
        >
          <div className="flex items-center justify-between h-12 sm:h-12 lg:h-14 px-4 sm:px-4 lg:px-6">
            <a href="/" className="flex items-center group">
              <NeoLogo size="sm" />
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 lg:gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })}
                  className={`text-xs lg:text-sm font-medium px-3 lg:px-4 py-2 rounded-full transition-all duration-300 ${
                    activeSection === link.id
                      ? 'text-foreground bg-foreground/5'
                      : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
                  }`}
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
                Започнете безплатно
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <button className="p-2.5 text-foreground rounded-full active:bg-foreground/5 transition-colors" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-2xl md:hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4">
            <NeoLogo size="sm" />
            <button className="p-2.5 text-foreground rounded-full" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  setIsOpen(false);
                  document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-2xl font-bold text-foreground/70 hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
              <Button
                variant="ghost"
                className="text-base h-12 text-foreground/50 rounded-xl font-medium w-full"
                onClick={() => { setIsOpen(false); navigate('/auth'); }}
              >
                {t('nav.login')}
              </Button>
              <Button
                className="neo-btn-primary text-base h-12 rounded-full font-bold w-full gap-2"
                onClick={() => { setIsOpen(false); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Започнете безплатно
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
