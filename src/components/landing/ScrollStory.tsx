import { useRef, useState, useEffect } from 'react';
import { Globe, FileText, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    icon: Globe,
    title: 'NEO започва от сайта ви',
    description: 'Сканира услугите, цените и информацията от вашия уебсайт автоматично.',
    mockup: 'website',
  },
  {
    icon: FileText,
    title: 'Добавяте PDF, документи, база данни',
    description: 'Качвате допълнителни материали — ценови листи, FAQ, наръчници.',
    mockup: 'documents',
  },
  {
    icon: MessageSquare,
    title: 'Говори като вас',
    description: 'Не измисля. Отговаря само с информацията, която сте му дали.',
    mockup: 'chat',
  },
];

const MockupWebsite = () => (
  <div className="space-y-4 p-2">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-3 h-3 rounded-full bg-red-400" />
      <div className="w-3 h-3 rounded-full bg-yellow-400" />
      <div className="w-3 h-3 rounded-full bg-emerald-400" />
      <div className="flex-1 h-6 rounded-full bg-foreground/5 mx-3" />
    </div>
    <div className="h-4 w-3/4 rounded bg-foreground/8 animate-pulse" />
    <div className="h-3 w-full rounded bg-foreground/5" />
    <div className="h-3 w-5/6 rounded bg-foreground/5" />
    <div className="h-3 w-2/3 rounded bg-foreground/5" />
    <div className="mt-6 grid grid-cols-3 gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 rounded-xl bg-foreground/4 border border-border/10" />
      ))}
    </div>
    <div className="mt-4 flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
        <Globe className="w-3 h-3 text-primary" />
      </div>
      <div className="h-2.5 w-32 rounded bg-primary/10" />
      <span className="text-xs text-emerald-400 font-bold ml-auto">Сканиране...</span>
    </div>
  </div>
);

const MockupDocuments = () => (
  <div className="space-y-3 p-2">
    {['Ценова листа.pdf', 'Услуги.docx', 'FAQ база данни'].map((name, i) => (
      <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/3 border border-border/10">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground/80 truncate">{name}</p>
          <p className="text-[11px] text-foreground/30">{(i + 1) * 24} KB</p>
        </div>
        <span className="text-xs text-emerald-400 font-bold shrink-0">✓ Добавен</span>
      </div>
    ))}
    <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-border/20 text-center">
      <p className="text-sm text-foreground/30">+ Добавете още файлове</p>
    </div>
  </div>
);

const MockupChat = () => (
  <div className="space-y-3 p-2">
    <div className="flex justify-end">
      <div className="bg-primary/10 text-foreground/70 text-sm px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[220px]">
        Колко струва почистване на климатик?
      </div>
    </div>
    <div className="flex justify-start">
      <div className="bg-foreground/5 text-foreground/60 text-sm px-4 py-2.5 rounded-2xl rounded-tl-md max-w-[260px]">
        Почистването на климатик при нас е 89 лв. Включва дезинфекция и проверка на фреон.
      </div>
    </div>
    <div className="flex justify-end">
      <div className="bg-primary/10 text-foreground/70 text-sm px-4 py-2.5 rounded-2xl rounded-tr-md">
        Да, утре сутринта.
      </div>
    </div>
    <div className="flex justify-start">
      <div className="bg-foreground/5 text-foreground/60 text-sm px-4 py-2.5 rounded-2xl rounded-tl-md max-w-[240px]">
        Записах ви за утре, 10:00. Ще получите потвърждение. ✓
      </div>
    </div>
  </div>
);

const mockups: Record<string, React.FC> = {
  website: MockupWebsite,
  documents: MockupDocuments,
  chat: MockupChat,
};

const ScrollStory = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionH = sectionRef.current.offsetHeight;
      const viewH = window.innerHeight;
      const scrolled = -rect.top;
      const scrollable = sectionH - viewH;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      const step = Math.min(2, Math.floor(progress * 3));
      setActiveStep(step);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ActiveMockup = mockups[steps[activeStep].mockup];

  return (
    <section ref={sectionRef} className="relative" style={{ height: '250vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — Steps */}
            <div className="space-y-8">
              <span className="neo-badge">Как работи NEO</span>
              {steps.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <motion.div
                    key={i}
                    animate={{ opacity: isActive ? 1 : 0.3, x: isActive ? 0 : -8 }}
                    transition={{ duration: 0.4 }}
                    className="flex gap-4 cursor-pointer group"
                    onClick={() => setActiveStep(i)}
                  >
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-primary/15 text-primary shadow-lg shadow-primary/10'
                        : 'bg-foreground/5 text-foreground/30'
                    }`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-foreground text-lg mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[400px]">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Right — Mockup */}
            <div className="relative hidden lg:block">
              <div className="neo-glass-premium rounded-2xl p-6 sm:p-8 border border-border/10 min-h-[350px]">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/10">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <ActiveMockup />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute -z-10 inset-0 blur-[100px] bg-gradient-to-br from-primary/6 via-transparent to-primary/3 rounded-3xl scale-125" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStory;
