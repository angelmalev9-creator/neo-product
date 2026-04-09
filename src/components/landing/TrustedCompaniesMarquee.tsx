import { motion } from 'framer-motion';
import { TrendingUp, Clock, PhoneOff, Wallet } from 'lucide-react';

const stats = [
  { value: '500+', label: 'бизнеса в България', icon: TrendingUp },
  { value: '24/7', label: 'непрекъснат приём', icon: Clock },
  { value: '1 200 EUR', label: 'средно спестени на месец', icon: Wallet },
  { value: '0', label: 'пропуснати обаждания', icon: PhoneOff },
];

const TrustedCompaniesMarquee = () => {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 max-w-3xl mx-auto">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
            className="text-center py-3 px-2 rounded-xl border border-border/8 bg-card/20"
          >
            <stat.icon className="w-3.5 h-3.5 text-primary/50 mx-auto mb-1.5" />
            <p className="text-lg sm:text-xl font-black text-primary mb-0.5">{stat.value}</p>
            <p className="text-[10px] text-foreground/35 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrustedCompaniesMarquee;
