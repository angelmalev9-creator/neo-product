import { Play, ArrowRight, Mic, Calendar, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrustedCompaniesMarquee from '@/components/landing/TrustedCompaniesMarquee';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

/* ───── Animated Widget Mockup ───── */
const WidgetMockup = () => {
  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      {/* Glow behind widget */}
      <div className="absolute -inset-8 bg-primary/8 blur-[80px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative rounded-2xl border border-border/20 bg-card/60 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Widget Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/10 bg-gradient-to-r from-primary/8 to-transparent">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Phone className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">NEO Асистент</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Онлайн сега</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="px-4 py-4 space-y-3 min-h-[240px]">
          {/* NEO greeting */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            className="flex gap-2.5 items-end"
          >
            <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">N</span>
            </div>
            <div className="bg-card/80 border border-border/15 rounded-2xl rounded-bl-md px-3.5 py-2.5 max-w-[240px]">
              <p className="text-xs text-foreground/90 leading-relaxed">Здравейте! 👋 Как мога да ви помогна днес?</p>
            </div>
          </motion.div>

          {/* User message */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8, duration: 0.4 }}
            className="flex gap-2.5 items-end justify-end"
          >
            <div className="bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md px-3.5 py-2.5 max-w-[220px]">
              <p className="text-xs text-foreground/90 leading-relaxed">Искам да запиша час за утре.</p>
            </div>
          </motion.div>

          {/* NEO booking response */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.8, duration: 0.4 }}
            className="flex gap-2.5 items-end"
          >
            <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">N</span>
            </div>
            <div className="space-y-2 max-w-[260px]">
              <div className="bg-card/80 border border-border/15 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                <p className="text-xs text-foreground/90 leading-relaxed">Разбира се! Ето свободните часове за утре:</p>
              </div>
              {/* Time slots */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3.4, duration: 0.3 }}
                className="flex gap-1.5 flex-wrap"
              >
                {['09:00', '10:30', '14:00', '16:30'].map((time, i) => (
                  <div
                    key={time}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                      i === 1 
                        ? 'bg-primary/15 border-primary/30 text-primary shadow-sm shadow-primary/10' 
                        : 'bg-card/60 border-border/15 text-foreground/60'
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Voice Waveform Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="px-4 py-3 border-t border-border/10 bg-gradient-to-r from-primary/5 to-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-primary" />
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            {/* Waveform */}
            <div className="flex items-center gap-[3px] flex-1 h-6">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-primary/40"
                  animate={{
                    height: [4, Math.random() * 18 + 6, 4],
                  }}
                  transition={{
                    duration: 0.8 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: i * 0.04,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-primary font-medium">NEO говори...</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.0, duration: 0.5 }}
        className="absolute -left-4 top-1/4 hidden lg:flex items-center gap-2 bg-card/80 backdrop-blur-xl border border-border/20 rounded-xl px-3 py-2 shadow-lg"
      >
        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] text-foreground/80 font-medium">Час записан ✓</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.5, duration: 0.5 }}
        className="absolute -right-4 bottom-1/3 hidden lg:flex items-center gap-2 bg-card/80 backdrop-blur-xl border border-border/20 rounded-xl px-3 py-2 shadow-lg"
      >
        <MessageSquare className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] text-foreground/80 font-medium">Контакт събран</span>
      </motion.div>
    </div>
  );
};

/* ───── Hero ───── */
const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100svh-3rem)] flex items-center py-8 sm:py-12 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 neo-grid-bg opacity-5 pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT — Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 neo-glass-premium px-4 py-2 mb-6 rounded-full"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-foreground/50 text-[10px] lg:text-xs font-semibold tracking-[0.12em] uppercase">
                AI рецепционист • 24/7
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[2rem] leading-[1.05] sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-display font-black text-foreground tracking-tight mb-5"
            >
              Докато Вие спите, NEO говори с клиенти и{' '}
              <span className="neo-gradient-text">записва часове</span>{' '}
              вместо Вас.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-foreground/50 mb-8 leading-relaxed max-w-lg"
            >
              Отговаря на всеки клиент и не пропуска нито едно запитване — 24/7.
              <br />
              <span className="text-foreground/70 font-medium">Готов за 5 минути. От 25€/месец.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <Button
                size="lg"
                className="neo-btn-primary text-sm px-7 py-5 h-auto font-bold rounded-full group gap-2"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-4 h-4 fill-current" />
                Изпробвайте безплатното демо
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="neo-glass-premium border-0 text-foreground/50 hover:text-foreground text-sm px-6 py-5 h-auto rounded-full font-bold gap-2"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Вижте как работи
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-x-5 gap-y-1.5 text-foreground/25 text-[11px] sm:text-xs font-medium"
            >
              {['Без кредитна карта', 'Без код', '14 дни гаранция'].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  {text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Widget Mockup */}
          <div className="hidden sm:block">
            <WidgetMockup />
          </div>
        </div>

        {/* Trust Marquee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <TrustedCompaniesMarquee />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
