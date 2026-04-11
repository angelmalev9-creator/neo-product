import { useState } from 'react';
import { Mic, MessageSquare, Calendar, Users, Brain, BarChart3, Globe, Clock, Zap, CheckCircle, Phone, TrendingUp, Star, MicOff } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion, AnimatePresence } from 'framer-motion';

/* ───── Feature Visual Previews (unchanged) ───── */

const VoiceChatPreview = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
        <span className="text-[8px] font-bold text-white">N</span>
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-semibold text-foreground">NEO Асистент</p>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[8px] text-emerald-400">Онлайн</span>
        </div>
      </div>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/15">
        <Globe className="w-2.5 h-2.5 text-primary" />
        <span className="text-[8px] text-primary font-medium">BG</span>
      </div>
    </div>
    <div className="space-y-2 px-1">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex gap-2 items-end">
        <div className="bg-card/80 border border-border/15 rounded-xl rounded-bl-sm px-3 py-2 max-w-[200px]">
          <p className="text-[10px] text-foreground/90">Здравейте! Как мога да Ви помогна днес?</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex justify-end">
        <div className="bg-primary/10 border border-primary/20 rounded-xl rounded-br-sm px-3 py-2 max-w-[180px]">
          <p className="text-[10px] text-foreground/90">Искам информация за услугите Ви.</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }} className="flex gap-2 items-end">
        <div className="bg-card/80 border border-border/15 rounded-xl rounded-bl-sm px-3 py-2 max-w-[220px]">
          <p className="text-[10px] text-foreground/90">Разбира се! Предлагаме три основни пакета...</p>
        </div>
      </motion.div>
    </div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
      <Mic className="w-3 h-3 text-primary" />
      <div className="flex items-center gap-[2px] flex-1 h-3">
        {[3, 8, 5, 12, 7, 14, 6, 10, 4, 11, 8, 5].map((h, i) => (
          <motion.div key={i} className="w-[1.5px] rounded-full bg-primary/40" animate={{ height: [h * 0.3, h, h * 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }} />
        ))}
      </div>
      <span className="text-[8px] text-primary font-medium">NEO говори...</span>
    </motion.div>
  </div>
);

const CalendarPreview = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-foreground">Google Calendar</span>
      </div>
      <span className="text-[8px] text-emerald-400 font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10">Свързан</span>
    </div>
    <div className="grid grid-cols-7 gap-1 px-1">
      {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map((d) => (
        <div key={d} className="text-center text-[8px] text-foreground/70 font-medium">{d}</div>
      ))}
      {[14, 15, 16, 17, 18, 19, 20].map((d) => (
        <motion.div key={d} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: d * 0.04 }}
          className={`text-center text-[9px] py-1 rounded-md ${d === 17 ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20' : d === 19 ? 'bg-primary/10 text-primary' : 'text-foreground/80'}`}>
          {d}
        </motion.div>
      ))}
    </div>
    <div className="space-y-1.5 px-1">
      {[{ time: '09:00', name: 'Мария И.', status: 'Потвърдено' }, { time: '14:30', name: 'Георги П.', status: 'Ново' }].map((a, i) => (
        <motion.div key={a.time} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.2 }}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-card/50 border border-border/10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-emerald-400">{a.time}</span>
            <span className="text-[10px] text-foreground/70">{a.name}</span>
          </div>
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>{a.status}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

const ContactsPreview = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2">
      {[{ label: 'Днес', value: '12', icon: Users }, { label: 'Тази седмица', value: '47', icon: TrendingUp }, { label: 'Конверсия', value: '68%', icon: Star }].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
          className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2 text-center">
          <s.icon className="w-3 h-3 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground/85">{s.value}</p>
          <p className="text-[7px] text-foreground/75">{s.label}</p>
        </motion.div>
      ))}
    </div>
    <div className="space-y-1.5">
      {[
        { name: 'Мария Иванова', email: 'maria@...', phone: '+359 88...', time: '2 мин' },
        { name: 'Георги Петров', email: 'georgi@...', phone: '+359 87...', time: '15 мин' },
        { name: 'Елена Димова', email: 'elena@...', phone: '+359 89...', time: '1 час' },
      ].map((c, i) => (
        <motion.div key={c.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card/50 border border-border/10">
          <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-amber-400">{c.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-foreground/80 truncate">{c.name}</p>
            <p className="text-[8px] text-foreground/75">{c.email} · {c.phone}</p>
          </div>
          <span className="text-[7px] text-foreground/70 shrink-0">{c.time}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

const AIPreview = () => (
  <div className="space-y-3">
    <div className="px-3 py-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-semibold text-foreground">Контекстно разбиране</span>
      </div>
      <div className="space-y-1.5">
        {[
          { q: '"Искам час за утре"', a: 'Разпозна: резервация → отваря календар' },
          { q: '"Колко струва?"', a: 'Разпозна: ценова информация → показва пакети' },
          { q: '"Говорите ли английски?"', a: 'Разпозна: смяна на език → превключва на EN' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.3 }}
            className="px-2.5 py-1.5 rounded-md bg-card/50 border border-border/8">
            <p className="text-[9px] text-cyan-400 font-medium">{item.q}</p>
            <p className="text-[8px] text-foreground/75 mt-0.5">→ {item.a}</p>
          </motion.div>
        ))}
      </div>
    </div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
      <Zap className="w-3 h-3 text-cyan-400" />
      <span className="text-[8px] text-foreground/75">Обучен на Вашия бизнес контекст</span>
    </motion.div>
  </div>
);

const AlwaysOnPreview = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-2">
      {[{ time: '03:14', msg: 'Клиент от Бургас', status: 'Отговорено' }, { time: '06:47', msg: 'Запитване за цена', status: 'Записан час' }].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.2 }}
          className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-2.5">
          <p className="text-[8px] text-cyan-400 font-mono mb-1">{item.time} AM</p>
          <p className="text-[9px] text-foreground/60">{item.msg}</p>
          <p className="text-[8px] text-emerald-400 mt-1">✓ {item.status}</p>
        </motion.div>
      ))}
    </div>
    <div className="px-3 py-2 rounded-lg bg-card/50 border border-border/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-foreground/75 font-medium">Последни 24 часа</span>
        <span className="text-[9px] text-cyan-400 font-medium">100% uptime</span>
      </div>
      <div className="flex items-end gap-[3px] h-8">
        {Array.from({ length: 24 }, (_, i) => {
          const h = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 30;
          return (
            <motion.div key={i} className="flex-1 rounded-sm bg-cyan-500/20" initial={{ height: 0 }} animate={{ height: `${h}%` }}
              transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }} />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[7px] text-foreground/20">00:00</span>
        <span className="text-[7px] text-foreground/20">12:00</span>
        <span className="text-[7px] text-foreground/20">23:59</span>
      </div>
    </div>
  </div>
);

const DashboardPreviewContent = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2">
      {[
        { icon: MessageSquare, label: 'Разговори', value: '47', change: '+12%', color: 'text-primary', bg: 'bg-primary/10' },
        { icon: Users, label: 'Нови клиенти', value: '23', change: '+8%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { icon: Calendar, label: 'Резервации', value: '18', change: '+15%', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      ].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
          className={`rounded-lg ${s.bg} border border-border/10 p-2`}>
          <s.icon className={`w-3 h-3 ${s.color} mb-0.5`} />
          <p className="text-sm font-bold text-foreground/85">{s.value}</p>
          <div className="flex items-center gap-1">
            <p className="text-[7px] text-foreground/75">{s.label}</p>
            <span className="text-[7px] text-emerald-400">{s.change}</span>
          </div>
        </motion.div>
      ))}
    </div>
    <div className="rounded-lg bg-card/50 border border-border/10 p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] text-foreground/75 font-medium">Ефективност</span>
        <span className="text-[8px] text-emerald-400 flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> +23%</span>
      </div>
      <div className="flex items-end gap-[3px] h-10">
        {[30, 45, 25, 60, 40, 70, 55, 80, 50, 65, 75, 90].map((h, i) => (
          <motion.div key={i} className="flex-1 rounded-sm bg-pink-500/20" initial={{ height: 0 }} animate={{ height: `${h}%` }}
            transition={{ delay: 0.4 + i * 0.04, duration: 0.35 }} />
        ))}
      </div>
    </div>
    <div className="space-y-1">
      {[{ text: 'Нов клиент: Мария И.', time: '2 мин', icon: Users }, { text: 'Час записан: 14:30', time: '5 мин', icon: Calendar }].map((a, i) => (
        <motion.div key={a.text} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.15 }}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-card/40 border border-border/8">
          <div className="flex items-center gap-2">
            <a.icon className="w-2.5 h-2.5 text-pink-400" />
            <span className="text-[8px] text-foreground/80">{a.text}</span>
          </div>
          <span className="text-[7px] text-foreground/70">{a.time}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

const featureVisuals: Record<number, React.FC> = {
  0: VoiceChatPreview,
  1: CalendarPreview,
  2: ContactsPreview,
  3: AIPreview,
  4: AlwaysOnPreview,
  5: DashboardPreviewContent,
};

const features = [
  {
    icon: Mic,
    title: 'Говори и пише',
    desc: 'На български, английски и руски, в чат и по телефон, с един и същ глас.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    liveLabel: 'Активно в реално време',
  },
  {
    icon: Calendar,
    title: 'Записва часове сам',
    desc: 'Синхронизира се с Google Calendar. Без двойни записи, без пропуснати срещи.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    liveLabel: 'Свързан с Google Calendar',
  },
  {
    icon: Users,
    title: 'Хваща всеки контакт',
    desc: 'Име, телефон, имейл — влизат автоматично в дашборда Ви.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    liveLabel: 'Автоматично събиране',
  },
  {
    icon: Brain,
    title: 'Разбира от половин дума',
    desc: 'Клиентите говорят нормално, без да се чувстват, че говорят с робот.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    liveLabel: 'Обучен на Вашия бизнес',
  },
  {
    icon: Clock,
    title: 'Не спи, не почива',
    desc: 'Отговаря за 2 секунди, по всяко време на денонощието.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    liveLabel: 'Винаги онлайн',
  },
  {
    icon: BarChart3,
    title: 'Всичко на едно място',
    desc: 'Дашборд с разговори, записи и анализи в реално време.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    liveLabel: 'Данни в реално време',
  },
];

const FeaturesGrid = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [active, setActive] = useState(0);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className={`neo-section-spacing relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="neo-heading-section font-black text-foreground mb-4 font-mono">
            Един инструмент. <span className="text-primary">Работата на трима служители.</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            NEO замества рецепционист, чат на сайта и нощен колцентър.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start max-w-5xl mx-auto">
          {/* Left: Feature list */}
          <div className="lg:col-span-2 space-y-1">
            {features.map((f, i) => (
              <motion.button
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  active === i
                    ? `${f.bg} ${f.border} border shadow-lg`
                    : 'border border-transparent hover:bg-card/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${active === i ? f.bg : 'bg-card/60'} border ${active === i ? f.border : 'border-border/10'} flex items-center justify-center shrink-0 transition-all`}>
                  <f.icon className={`w-3.5 h-3.5 ${active === i ? f.color : 'text-foreground/75'} transition-colors`} strokeWidth={1.5} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${active === i ? 'text-foreground' : 'text-foreground/60'} transition-colors`}>{f.title}</p>
                  <p className={`text-[10px] ${active === i ? 'text-foreground/80' : 'text-foreground/70'} transition-colors leading-snug`}>{f.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right: Interactive visual preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="relative rounded-2xl border border-border/15 bg-card/30 overflow-hidden min-h-[300px]">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/10 bg-card/40">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/30" />
                  <span className="w-2 h-2 rounded-full bg-foreground/10" />
                  <span className="w-2 h-2 rounded-full bg-foreground/10" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={active}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`text-[10px] font-semibold ml-2 ${features[active].color}`}
                  >
                    {features[active].title}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="p-4 sm:p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    {(() => {
                      const Visual = featureVisuals[active];
                      return Visual ? <Visual /> : null;
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="px-4 py-2 border-t border-border/8 bg-card/20">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${features[active].color.replace('text-', 'bg-')} animate-pulse`} />
                  <span className="text-[9px] text-foreground/70 font-medium">{features[active].liveLabel}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
