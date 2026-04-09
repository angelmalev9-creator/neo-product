import { Play, ArrowRight, Mic, Calendar, MessageSquare, Phone, TrendingUp, Star } from 'lucide-react';
import neoLogoImg from '@/assets/neo-logo.png';
import { Button } from '@/components/ui/button';
import TrustedCompaniesMarquee from '@/components/landing/TrustedCompaniesMarquee';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/* ───── Star Rating Badge ───── */
const RatingBadge = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-card/40 border border-border/10 "
  >
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
      ))}
      <Star className="w-3 h-3 text-primary/40" />
    </div>
    <span className="text-foreground/50 text-[10px] sm:text-xs font-semibold tracking-[0.08em] uppercase">
      4.92/5 от над 200 клиенти
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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/40 border border-border/10 "
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <span className="text-[9px] text-foreground/40 font-medium">
        {count} бизнеса използват NEO в момента
      </span>
    </motion.div>
  );
};

/* ───── MacBook Frame ───── */
const MacBookFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {/* Screen */}
    <div className="rounded-t-xl border-[3px] border-foreground/15 bg-background overflow-hidden">
      {/* Menu bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 border-b border-border/10">
        <span className="w-2 h-2 rounded-full bg-[hsl(0,70%,55%)]" />
        <span className="w-2 h-2 rounded-full bg-[hsl(45,80%,55%)]" />
        <span className="w-2 h-2 rounded-full bg-[hsl(120,50%,50%)]" />
        <span className="text-[8px] text-foreground/25 ml-2 font-medium">neo-assistant.com/dashboard</span>
      </div>
      {children}
    </div>
    {/* Bottom hinge */}
    <div className="relative mx-auto">
      <div className="h-[14px] bg-gradient-to-b from-foreground/12 to-foreground/8 rounded-b-md border-x-[3px] border-b-[3px] border-foreground/15" />
      <div className="h-[4px] bg-foreground/10 rounded-b-lg mx-[10%]" />
    </div>
  </div>
);

/* ───── iPhone Frame ───── */
const IPhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div className="rounded-[20px] border-[3px] border-foreground/15 bg-background overflow-hidden">
      {/* Notch / Dynamic Island */}
      <div className="flex justify-center py-1.5 bg-foreground/5">
        <div className="w-16 h-[5px] rounded-full bg-foreground/15" />
      </div>
      {children}
      {/* Home indicator */}
      <div className="flex justify-center py-2 bg-foreground/3">
        <div className="w-10 h-[3px] rounded-full bg-foreground/15" />
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
        <div key={s.label} className="rounded-lg bg-card/60 border border-border/10 p-1.5">
          <s.icon className={`w-2.5 h-2.5 ${s.color} mb-0.5`} />
          <p className="text-sm font-bold text-foreground/85">{s.value}</p>
          <p className="text-[7px] text-foreground/35">{s.label}</p>
        </div>
      ))}
    </div>
    <div className="rounded-lg bg-card/60 border border-border/10 p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[7px] text-foreground/35 font-medium">Анализи</span>
        <span className="text-[7px] text-emerald-400 flex items-center gap-0.5">
          <TrendingUp className="w-2 h-2" /> +23%
        </span>
      </div>
      <div className="flex items-end gap-0.5 h-8">
        {[30, 45, 25, 60, 40, 70, 55, 80, 50, 65, 75, 90].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm bg-primary/25"
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
        <div key={a.text} className="flex items-center justify-between px-2 py-1 rounded-md bg-card/50 border border-border/8">
          <span className="text-[7px] text-foreground/45">{a.text}</span>
          <span className="text-[6px] text-foreground/25">{a.time}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ───── Widget Content (inside iPhone) ───── */
const WidgetContent = () => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/10 bg-gradient-to-r from-primary/8 to-transparent">
      <img src={neoLogoImg} alt="NEO" className="w-6 h-6 rounded-lg object-cover shadow-sm shadow-primary/20" />
      <div className="flex-1">
        <p className="text-[10px] font-bold text-foreground">NEO Асистент</p>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] text-emerald-400 font-medium">Онлайн</span>
        </div>
      </div>
    </div>
    <div className="px-2 py-2 space-y-1.5 min-h-[110px]">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.3 }} className="flex gap-1.5 items-end">
        <img src={neoLogoImg} alt="NEO" className="w-4 h-4 rounded-md object-cover shrink-0" />
        <div className="bg-card/80 border border-border/15 rounded-xl rounded-bl-sm px-2.5 py-1.5 max-w-[160px]">
          <p className="text-[10px] text-foreground/90 leading-relaxed">Здравейте! Как мога да Ви помогна?</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8, duration: 0.3 }} className="flex gap-1.5 items-end justify-end">
        <div className="bg-primary/15 border border-primary/20 rounded-xl rounded-br-sm px-2.5 py-1.5 max-w-[150px]">
          <p className="text-[10px] text-foreground/90 leading-relaxed">Искам час за утре.</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8, duration: 0.3 }} className="flex gap-1.5 items-end">
        <img src={neoLogoImg} alt="NEO" className="w-4 h-4 rounded-md object-cover shrink-0" />
        <div className="space-y-1 max-w-[180px]">
          <div className="bg-card/80 border border-border/15 rounded-xl rounded-bl-sm px-2.5 py-1.5">
            <p className="text-[10px] text-foreground/90 leading-relaxed">Свободни часове:</p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.4, duration: 0.25 }} className="flex gap-1 flex-wrap">
            {['09:00', '10:30', '14:00'].map((time, i) => (
              <div key={time} className={`px-2 py-0.5 rounded-md text-[9px] font-medium border ${i === 1 ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-card/60 border-border/15 text-foreground/50'}`}>
                {time}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.5 }} className="px-2.5 py-2 border-t border-border/10 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
            <Mic className="w-2.5 h-2.5 text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-[2px] flex-1 h-4">
          {[3, 8, 5, 12, 7, 14, 6, 10, 4, 11, 8, 5, 9, 6].map((h, i) => (
            <div
              key={i}
              className="w-[1.5px] rounded-full bg-primary/35"
              style={{ height: `${h}px` }}
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
    <section className="relative min-h-[calc(100svh-3rem)] flex items-center neo-section-spacing overflow-hidden px-4 sm:px-0">
      <div className="absolute inset-0 neo-grid-bg opacity-5 pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* LEFT — Copy */}
          <div className="max-w-xl">
            <RatingBadge />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:text-5xl font-black text-foreground tracking-tight mb-4 sm:mb-5 leading-[1.08] sm:text-2xl text-2xl shadow-none font-mono"
            >
              Докато Вие спите, NEO говори с клиенти и{' '}
              <span className="neo-gradient-text shadow-inner">записва часове</span>{' '}
              вместо Вас.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="neo-subheading text-foreground/50 mb-7 max-w-md opacity-75"
            >
              Отговаря на всеки клиент и не пропуска нито едно запитване — 24/7.
              <br />
              <span className="text-foreground/70 font-medium opacity-70">Готов за 5 минути. От 25 EUR/месец.</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-2.5 mb-5">
              <Button
                className="neo-btn-primary text-[13px] sm:text-xs px-5 py-3 sm:py-2.5 h-auto font-bold rounded-full group gap-1.5 w-full sm:w-auto"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Изпробвайте безплатното демо
              </Button>
              <Button
                variant="outline"
                className="neo-glass-premium border-0 text-foreground/50 hover:text-foreground text-[13px] sm:text-xs px-5 py-3 sm:py-2.5 h-auto rounded-full font-bold gap-1.5 w-full sm:w-auto"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Изберете план
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-foreground/25 text-[10px] font-medium">
                {['Без кредитна карта', 'Без код', '14 дни гаранция'].map((text) => (
                  <span key={text} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                    {text}
                  </span>
                ))}
              </div>
              
            </motion.div>
          </div>

          {/* RIGHT — MacBook + iPhone device mockups */}
          <div className="hidden sm:block">
            <div className="relative w-full max-w-[480px] mx-auto">
              {/* MacBook — Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <MacBookFrame>
                  <DashboardContent />
                </MacBookFrame>
              </motion.div>

              {/* iPhone — Widget, overlapping bottom-right */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute -bottom-8 -right-4 lg:-right-8 w-[180px] z-10"
              >
                <div className="absolute -inset-4 bg-primary/5 blur-[30px] rounded-full pointer-events-none" />
                <IPhoneFrame>
                  <WidgetContent />
                </IPhoneFrame>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trust Marquee */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="mt-8">
          <TrustedCompaniesMarquee />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
