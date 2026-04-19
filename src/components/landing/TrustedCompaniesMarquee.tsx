import { motion } from 'framer-motion';
import { TrendingUp, Clock, PhoneOff, Wallet, Shield, Star, Users, Zap } from 'lucide-react';

const stats = [
  { value: '500+', label: 'бизнеса в България', icon: TrendingUp },
  { value: '24/7', label: 'непрекъснат приём', icon: Clock },
  { value: '1 200 EUR', label: 'средно спестени на месец', icon: Wallet },
  { value: '0', label: 'пропуснати обаждания', icon: PhoneOff },
  { value: '4.9★', label: 'оценка от клиенти', icon: Star },
  { value: '< 2 сек', label: 'време за отговор', icon: Zap },
  { value: '100%', label: 'GDPR съвместим', icon: Shield },
  { value: '50 000+', label: 'обработени разговора', icon: Users },
];

const TrustedCompaniesMarquee = () => {
  // Duplicate for seamless infinite loop
  const loop = [...stats, ...stats];

  return (
    <div className="mt-6 sm:mt-8 relative max-w-3xl mx-auto">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[hsl(220_55%_8%)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[hsl(220_55%_8%)] to-transparent z-10 pointer-events-none" />

      <div className="overflow-hidden py-1">
        <motion.div
          className="flex gap-3 sm:gap-4 w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 30,
              ease: 'linear',
            },
          }}
        >
          {loop.map((stat, i) => (
            <div
              key={`${stat.label}-${i}`}
              className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-primary/15 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-colors min-w-[200px]"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black text-primary-foreground whitespace-nowrap">{stat.value}</span>
                <span className="text-[10px] text-foreground/70 font-medium whitespace-nowrap">{stat.label}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TrustedCompaniesMarquee;
