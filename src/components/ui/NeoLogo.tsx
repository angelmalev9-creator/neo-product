import { cn } from '@/lib/utils';
import neoLogoImg from '@/assets/neo-logo.png';

interface NeoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

const sizeConfig = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-sm',
  },
  sm: {
    container: 'w-7 h-7 lg:w-8 lg:h-8',
    text: 'text-sm lg:text-base',
  },
  md: {
    container: 'w-8 h-8 sm:w-10 sm:h-10',
    text: 'text-lg sm:text-xl',
  },
  lg: {
    container: 'w-10 h-10',
    text: 'text-xl',
  },
  xl: {
    container: 'w-12 h-12 sm:w-14 sm:h-14',
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
      <img 
        src={neoLogoImg} 
        alt="NEO" 
        className={cn('rounded-full object-cover', config.container)} 
      />
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
