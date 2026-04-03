import { Play, ArrowRight, Mic, Calendar, MessageSquare, Phone, BarChart3, Users, Clock, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrustedCompaniesMarquee from '@/components/landing/TrustedCompaniesMarquee';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/* ───── Live counter — shows real-time activity ───── */
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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/40 border border-border/10 backdrop-blur-sm"
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

/* ───── Dashboard Mockup (behind widget) ───── */
const DashboardMockup = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="absolute inset-0 rounded-2xl border border-border/10 bg-card/30 backdrop-blur-sm overflow-hidden"
  >
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/8 bg-card/40">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-primary/40" />
        <span className="w-2 h-2 rounded-full bg-foreground/10" />
        <span className="w-2 h-2 rounded-full bg-foreground/10" />
      </div>
      <span className="text-[9px] text-foreground/25 font-medium ml-2">NEO Dashboard</span>
    </div>
    <div className="p-3 space-y-2.5">
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MessageSquare, label: 'Разговори', value: '47', color: 'text-primary' },
          { icon: Users, label: 'Клиенти', value: '12', color: 'text-emerald-400' },
          { icon: Calendar, label: 'Резервации', value: '8', color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-card/50 border border-border/8 p-2">
            <s.icon className={`w-3 h-3 ${s.color} mb-1`} />
            <p className="text-sm font-bold text-foreground/80">{s.value}</p>
            <p className="text-[8px] text-foreground/30">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-card/50 border border-border/8 p-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] text-foreground/30 font-medium">Анализи</span>
          <span className="text-[7px] text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="w-2 h-2" /> +23%
          </span>
        </div>
        <div className="flex items-end gap-[3px] h-10">
          {[30, 45, 25, 60, 40, 70, 55, 80, 50, 65, 75, 90].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-primary/20"
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { text: 'Нов клиент: Мария И.', time: '2 мин' },
          { text: 'Час записан: 14:30', time: '5 мин' },
        ].map((a) => (
          <div key={a.text} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-card/40 border border-border/6">
            <span className="text-[8px] text-foreground/40">{a.text}</span>
            <span className="text-[7px] text-foreground/20">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

/* ───── Animated Widget Mockup ───── */
const WidgetMockup = () => (
  <div className="relative w-full max-w-[340px] mx-auto">
    <div className="absolute -inset-6 bg-primary/6 blur-[60px] rounded-full pointer-events-none" />
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-xl border border-border/20 bg-card/70 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/10 bg-gradient-to-r from-primary/8 to-transparent">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
          <Phone className="w-3 h-3 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-foreground">NEO Асистент</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-medium">Онлайн сега</span>
          </div>
        </div>
      </div>
      <div className="px-3 py-3 space-y-2.5 min-h-[200px]">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.35 }} className="flex gap-2 items-end">
          <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-primary">N</span>
          </div>
          <div className="bg-card/80 border border-border/15 rounded-xl rounded-bl-sm px-3 py-2 max-w-[210px]">
            <p className="text-[11px] text-foreground/90 leading-relaxed">Здравейте! Как мога да Ви помогна?</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8, duration: 0.35 }} className="flex gap-2 items-end justify-end">
          <div className="bg-primary/15 border border-primary/20 rounded-xl rounded-br-sm px-3 py-2 max-w-[190px]">
            <p className="text-[11px] text-foreground/90 leading-relaxed">Искам да запиша час за утре.</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8, duration: 0.35 }} className="flex gap-2 items-end">
          <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-primary">N</span>
          </div>
          <div className="space-y-1.5 max-w-[230px]">
            <div className="bg-card/80 border border-border/15 rounded-xl rounded-bl-sm px-3 py-2">
              <p className="text-[11px] text-foreground/90 leading-relaxed">Ето свободните часове:</p>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.4, duration: 0.25 }} className="flex gap-1 flex-wrap">
              {['09:00', '10:30', '14:00', '16:30'].map((time, i) => (
                <div key={time} className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${i === 1 ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-card/60 border-border/15 text-foreground/50'}`}>
                  {time}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.5 }} className="px-3 py-2.5 border-t border-border/10 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Mic className="w-3 h-3 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="flex items-center gap-[2px] flex-1 h-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[2px] rounded-full bg-primary/35"
                animate={{ height: [3, Math.random() * 14 + 5, 3] }}
                transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <span className="text-[9px] text-primary font-medium">NEO говори...</span>
        </div>
      </motion.div>
    </motion.div>

    {/* Floating badges */}
    <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0, duration: 0.4 }} className="absolute -left-3 top-1/4 hidden lg:flex items-center gap-1.5 bg-card/80 backdrop-blur-xl border border-border/20 rounded-lg px-2.5 py-1.5 shadow-lg">
      <Calendar className="w-3 h-3 text-emerald-400" />
      <span className="text-[9px] text-foreground/70 font-medium">Час записан</span>
    </motion.div>
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5, duration: 0.4 }} className="absolute -right-3 bottom-1/3 hidden lg:flex items-center gap-1.5 bg-card/80 backdrop-blur-xl border border-border/20 rounded-lg px-2.5 py-1.5 shadow-lg">
      <MessageSquare className="w-3 h-3 text-primary" />
      <span className="text-[9px] text-foreground/70 font-medium">Контакт събран</span>
    </motion.div>
  </div>
);

/* ───── Hero ───── */
const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100svh-3rem)] flex items-center neo-section-spacing overflow-hidden">
      <div className="absolute inset-0 neo-grid-bg opacity-5 pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* LEFT — Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 neo-glass-premium px-3 py-1.5 mb-6 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-foreground/50 text-[10px] sm:text-xs font-semibold tracking-[0.12em] uppercase">
                AI рецепционист — 24/7
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-foreground tracking-tight mb-5 leading-[1.08]"
            >
              Докато Вие спите, NEO говори с клиенти и{' '}
              <span className="neo-gradient-text">записва часове</span>{' '}
              вместо Вас.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="neo-subheading text-foreground/50 mb-7 max-w-md"
            >
              Отговаря на всеки клиент и не пропуска нито едно запитване — 24/7.
              <br />
              <span className="text-foreground/70 font-medium">Готов за 5 минути. От 25 EUR/месец.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-2.5 mb-5">
              <Button
                className="neo-btn-primary text-xs px-5 py-2.5 h-auto font-bold rounded-full group gap-1.5"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Изпробвайте безплатното демо
              </Button>
              <Button
                variant="outline"
                className="neo-glass-premium border-0 text-foreground/50 hover:text-foreground text-xs px-5 py-2.5 h-auto rounded-full font-bold gap-1.5"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Вижте как работи
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </motion.div>

            {/* Trust indicators — loss aversion + authority */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-foreground/25 text-[10px] font-medium">
                {['Без кредитна карта', 'Без код', '14 дни гаранция'].map((text) => (
                  <span key={text} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary/60" />
                    {text}
                  </span>
                ))}
              </div>
              <LiveActivityTicker />
            </motion.div>
          </div>

          {/* RIGHT — Dashboard + Widget layered */}
          <div className="hidden sm:block">
            <div className="relative w-full max-w-[480px] mx-auto" style={{ minHeight: 420 }}>
              <DashboardMockup />
              <div className="relative z-10 mt-6 ml-auto" style={{ maxWidth: 340 }}>
                <WidgetMockup />
              </div>
            </div>
          </div>
        </div>

        {/* Trust Marquee */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
          <TrustedCompaniesMarquee />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
