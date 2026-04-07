import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

const sizeConfig = {
  xs: {
    container: 'w-6 h-6',
    icon: 'w-3.5 h-3.5',
    text: 'text-sm',
  },
  sm: {
    container: 'w-7 h-7 lg:w-8 lg:h-8',
    icon: 'w-4 h-4 lg:w-5 lg:h-5',
    text: 'text-sm lg:text-base',
  },
  md: {
    container: 'w-8 h-8 sm:w-10 sm:h-10',
    icon: 'w-4 h-4 sm:w-5 sm:h-5',
    text: 'text-lg sm:text-xl',
  },
  lg: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-xl',
  },
  xl: {
    container: 'w-12 h-12 sm:w-14 sm:h-14',
    icon: 'w-6 h-6 sm:w-7 sm:h-7',
    text: 'text-2xl sm:text-3xl',
  },
};

export const NeoLogo = ({ 
  size = 'md', 
  showText = true, 
  textClassName,
  className 
}: NeoLogoProps) => {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20',
        config.container
      )}>
        <Bot className={cn('text-white', config.icon)} />
      </div>
      {showText && (
        <span className={cn(
          'font-bold text-foreground',
          config.text,
          textClassName
        )}>
          NEO
        </span>
      )}
    </div>
  );
};

export default NeoLogo;
