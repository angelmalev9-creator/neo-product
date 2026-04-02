import { Play, ArrowRight, MessageSquare, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100svh-3rem)] flex items-center py-20 sm:py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 neo-grid-bg opacity-5 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 neo-glass-premium px-4 py-2 mb-8 rounded-full"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-foreground/50 text-[10px] lg:text-xs font-semibold tracking-[0.15em] uppercase">
                {t('hero.badge')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[1.75rem] sm:text-4xl md:text-[2.75rem] lg:text-[3.25rem] font-display font-semibold text-foreground leading-[1.1] tracking-[-0.5px] mb-6"
            >
              Отговаря на клиенти и записва часове вместо вас —{' '}
              <span className="neo-gradient-text-animated">24/7</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base lg:text-lg text-foreground/40 leading-[1.6] mb-8 max-w-[480px] font-medium"
            >
              NEO се обучава от вашия сайт и говори с клиентите точно както бихте говорили вие.
              <span className="text-foreground/70 font-semibold"> {t('hero.price')}</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-10"
            >
              <Button
                size="lg"
                className="neo-btn-primary text-sm px-8 py-3 h-12 font-semibold rounded-full group whitespace-nowrap"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                Тествай NEO
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="neo-glass-premium border-0 text-foreground/50 hover:text-foreground text-sm px-7 py-3 h-12 rounded-full transition-all duration-300 hover:bg-foreground/5 font-semibold whitespace-nowrap"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Виж как работи
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-1 text-foreground/25 text-[11px] sm:text-xs font-medium"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                {t('hero.trust1')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                {t('hero.trust2')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                {t('hero.trust3')}
              </span>
            </motion.div>
          </div>

          {/* Right — Widget Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            {/* Floating widget card */}
            <div className="relative neo-glass-premium rounded-3xl p-8 border border-border/10 shadow-[0_20px_80px_-20px_hsl(var(--neo-red)/0.15)]">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">NEO Асистент</p>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Онлайн
                  </p>
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-end">
                  <div className="bg-primary/10 text-foreground/80 text-sm px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[240px]">
                    Здравейте, бих искал да запиша час за утре.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-foreground/5 text-foreground/70 text-sm px-4 py-2.5 rounded-2xl rounded-tl-md max-w-[260px]">
                    Разбира се! Имаме свободни часове утре в 10:00, 14:00 и 16:30. Кой ви е удобен?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary/10 text-foreground/80 text-sm px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[200px]">
                    В 14:00, моля.
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/3 border border-border/10">
                  <Phone className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-xs text-foreground/40">Обади се</span>
                </div>
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/3 border border-border/10">
                  <Calendar className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-xs text-foreground/40">Запиши час</span>
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -z-10 inset-0 blur-[60px] bg-gradient-to-br from-primary/8 via-transparent to-accent/5 rounded-3xl scale-110" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
