import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { ReactNode, RefObject } from 'react';

interface PencilUnderlineProps {
  children: ReactNode;
  className?: string;
  underlineClassName?: string;
  delay?: number;
}

export const PencilUnderline = ({ 
  children, 
  className,
  underlineClassName,
  delay = 0 
}: PencilUnderlineProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <span 
      ref={ref as RefObject<HTMLSpanElement>}
      className={cn("relative inline-block", className)}
    >
      {children}
      <svg
        className={cn(
          "absolute -bottom-2 left-0 w-full h-4 overflow-visible",
          underlineClassName
        )}
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        style={{ 
          transitionDelay: `${delay}ms`
        }}
      >
        <path
          d="M0 15 Q 25 5, 50 12 T 100 10 T 150 14 T 200 8"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          className={cn(
            "pencil-underline-path",
            isVisible && "pencil-underline-animate"
          )}
          style={{
            strokeDasharray: 300,
            strokeDashoffset: isVisible ? 0 : 300,
            transition: `stroke-dashoffset 1s cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms`
          }}
        />
      </svg>
    </span>
  );
};
