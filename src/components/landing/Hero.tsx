import { ArrowRight, Mic, Calendar, MessageSquare, Phone, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrustedCompaniesMarquee from '@/components/landing/TrustedCompaniesMarquee';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/* ───── Social proof badge ───── */
const SocialProofBadge = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border"
    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
  >
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    <span className="text-[rgba(255,255,255,0.5)] text-xs font-medium">
      Използван от клиники, салони и сервизи в България
    </span>
  </motion.div>
);

/* ───── Live counter ───── */
const LiveActivityTicker = () => {
  const [count, setCount] = useState(14);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(8, Math.min(23, prev + delta));
      });
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.8, duration: 0.4 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {count} бизнеса използват NEO в момента
      </span>
    </motion.div>
  );
};

/* ───── MacBook Frame ───── */
const MacBookFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div className="rounded-t-xl border-[3px] overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#030014' }}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(0,70%,55%)' }} />
        <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(45,80%,55%)' }} />
        <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(120,50%,50%)' }} />
        <span className="text-[8px] ml-2 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>neo-assistant.com/dashboard</span>
      </div>
      {children}
    </div>
    <div className="relative mx-auto">
      <div className="h-[14px] rounded-b-md border-x-[3px] border-b-[3px]" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.05))', borderColor: 'rgba(255,255,255,0.1)' }} />
      <div className="h-[4px] rounded-b-lg mx-[10%]" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  </div>
);

/* ───── iPhone Frame ───── */
const IPhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div className="rounded-[20px] border-[3px] overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#030014' }}>
      <div className="flex justify-center py-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="w-16 h-[5px] rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
      </div>
      {children}
      <div className="flex justify-center py-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-10 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
      </div>
    </div>
  </div>
);

/* ───── Dashboard Content (inside MacBook) ───── */
const DashboardContent = () => (
  <div className="p-2.5 space-y-2">
    <div className="grid grid-cols-3 gap-1.5">
      {[
        { icon: MessageSquare, label: 'Разговори', value: '47', color: 'text-primary' },
        { icon: Calendar, label: 'Клиенти', value: '12', color: 'text-emerald-400' },
        { icon: Calendar, label: 'Резервации', value: '8', color: 'text-blue-400' },
      ].map((s) => (
        <div key={s.label} className="rounded-lg p-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <s.icon className={`w-2.5 h-2.5 ${s.color} mb-0.5`} />
          <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{s.value}</p>
          <p className="text-[7px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
        </div>
      ))}
    </div>
    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[7px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Анализи</span>
        <span className="text-[7px] text-emerald-400 flex items-center gap-0.5">
          <TrendingUp className="w-2 h-2" /> +23%
        </span>
      </div>
      <div className="flex items-end gap-0.5 h-8">
        {[30, 45, 25, 60, 40, 70, 55, 80, 50, 65, 75, 90].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{ background: 'rgba(99, 102, 241, 0.25)' }}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
          />
        ))}
      </div>
    </div>
    <div className="space-y-1">
      {[
        { text: 'Нов клиент: Мария И.', time: '2 мин' },
        { text: 'Час записан: 14:30', time: '5 мин' },
      ].map((a) => (
        <div key={a.text} className="flex items-center justify-between px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{a.text}</span>
          <span className="text-[6px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{a.time}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ───── Widget Content (inside iPhone) ───── */
const WidgetContent = () => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'linear-gradient(to right, rgba(99,102,241,0.06), transparent)' }}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(263 70% 50%))' }}>
        <span className="text-[8px] font-bold text-white">N</span>
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>NEO Асистент</p>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[8px] text-emerald-400 font-medium">Онлайн</span>
        </div>
      </div>
    </div>
    <div className="px-2 py-2 space-y-1.5 min-h-[110px]">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.3 }} className="flex gap-1.5 items-end">
        <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(263 70% 50%))' }}>
          <span className="text-[6px] font-bold text-white">N</span>
        </div>
        <div className="rounded-xl rounded-bl-sm px-2.5 py-1.5 max-w-[160px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.9)' }}>Здравейте! Как мога да Ви помогна?</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8, duration: 0.3 }} className="flex gap-1.5 items-end justify-end">
        <div className="rounded-xl rounded-br-sm px-2.5 py-1.5 max-w-[150px]" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.9)' }}>Искам час за утре.</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8, duration: 0.3 }} className="flex gap-1.5 items-end">
        <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(263 70% 50%))' }}>
          <span className="text-[6px] font-bold text-white">N</span>
        </div>
        <div className="space-y-1 max-w-[180px]">
          <div className="rounded-xl rounded-bl-sm px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.9)' }}>Свободни часове:</p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.4, duration: 0.25 }} className="flex gap-1 flex-wrap">
            {['09:00', '10:30', '14:00'].map((time, i) => (
              <div key={time} className="px-2 py-0.5 rounded-md text-[9px] font-medium border" style={i === 1 ? { background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.25)', color: 'hsl(239 84% 67%)' } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                {time}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.5 }} className="px-2.5 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'linear-gradient(to right, rgba(99,102,241,0.04), transparent)' }}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Phone className="w-2.5 h-2.5 text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-[2px] flex-1 h-4">
          {[3, 8, 5, 12, 7, 14, 6, 10, 4, 11, 8, 5, 9, 6].map((h, i) => (
            <div
              key={i}
              className="w-[1.5px] rounded-full"
              style={{ height: `${h}px`, background: 'rgba(99,102,241,0.3)' }}
            />
          ))}
        </div>
        <span className="text-[8px] text-primary font-medium">NEO говори...</span>
      </div>
    </motion.div>
  </div>
);

/* ───── Hero ───── */
const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100svh-5rem)] flex items-center neo-section-spacing overflow-hidden px-4 sm:px-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          {/* LEFT — Copy */}
          <div className="max-w-xl">
            <SocialProofBadge />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:text-5xl font-bold tracking-tight mb-4 sm:mb-5 leading-[1.08] sm:text-2xl text-2xl"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Докато Вие спите, <span className="neo-gradient-text">NEO</span> говори с клиенти и записва часове вместо Вас.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="neo-subheading mb-5 max-w-md"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Отговаря на всеки клиент и не пропуска нито едно запитване — 24/7.
              <br />
              <span style={{ color: 'rgba(255,255,255,0.6)' }} className="font-medium">Готов за 5 минути. От 25 EUR/месец.</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <Button
                className="neo-btn-primary text-sm px-6 py-3 h-auto font-bold rounded-full group gap-2 w-full sm:w-auto"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Изпробвайте безплатно
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="neo-glass-premium border-0 hover:text-foreground text-sm px-6 py-3 h-auto rounded-full font-medium gap-2 w-full sm:w-auto"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Вижте демо
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {['Без кредитна карта', 'Без код', '14 дни безплатно'].map((text) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(99,102,241,0.5)' }} />
                    {text}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT — MacBook + iPhone device mockups */}
          <div className="hidden sm:block">
            <div className="relative w-full max-w-[480px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <MacBookFrame>
                  <DashboardContent />
                </MacBookFrame>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute -bottom-8 -right-4 lg:-right-8 w-[180px] z-10"
              >
                <IPhoneFrame>
                  <WidgetContent />
                </IPhoneFrame>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trust Marquee */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="mt-6">
          <TrustedCompaniesMarquee />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
