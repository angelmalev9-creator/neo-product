import { motion } from 'framer-motion';
import { Clock, PhoneOff, Wallet, Zap } from 'lucide-react';

const stats = [
  { value: '50+', label: 'бизнеса в България', icon: Zap },
  { value: '24/7', label: 'непрекъснат приём', icon: Clock },
  { value: '∞', label: 'спестени часове всеки ден', icon: Wallet },
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
            className="text-center py-3 px-2 rounded-xl border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="w-6 h-6 rounded-lg mx-auto mb-1.5 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <stat.icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <p className="text-lg sm:text-xl font-bold mb-0.5 neo-gradient-text">{stat.value}</p>
            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrustedCompaniesMarquee;
