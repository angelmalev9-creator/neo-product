import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES, 
  LANGUAGE_FLAGS,
  changeLanguage,
  type SupportedLanguage 
} from '@/i18n';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal' | 'ghost';
  className?: string;
}

const LanguageSwitcher = ({ variant = 'default', className = '' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = i18n.language as SupportedLanguage;
  
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await changeLanguage(lang);
    setIsOpen(false);
  };

  const renderMenu = (triggerContent: React.ReactNode, triggerProps: any) => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button {...triggerProps}>{triggerContent}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50 min-w-[140px]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang} onClick={() => handleLanguageChange(lang)} className="cursor-pointer flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="text-base">{LANGUAGE_FLAGS[lang]}</span>
              <span>{LANGUAGE_NAMES[lang]}</span>
            </span>
            {currentLang === lang && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (variant === 'minimal') {
    return renderMenu(
      SUPPORTED_LANGUAGES.map((lang) => (
        <span key={lang} className={`text-base transition-opacity ${currentLang === lang ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
          {LANGUAGE_FLAGS[lang]}
        </span>
      )),
      { variant: 'ghost', size: 'sm', className: `h-8 px-2 text-white/60 hover:text-white hover:bg-white/5 gap-1 ${className}` }
    );
  }

  if (variant === 'ghost') {
    return renderMenu(
      <Globe className="w-4 h-4" />,
      { variant: 'ghost', size: 'icon', className: `h-9 w-9 text-muted-foreground hover:text-foreground ${className}` }
    );
  }

  return renderMenu(
    <>
      <Globe className="w-4 h-4" />
      <span className="text-base">{LANGUAGE_FLAGS[currentLang]}</span>
      <span>{LANGUAGE_NAMES[currentLang]}</span>
    </>,
    { variant: 'outline', size: 'sm', className: `gap-2 border-border/30 bg-background/50 ${className}` }
  );
};

export default LanguageSwitcher;
