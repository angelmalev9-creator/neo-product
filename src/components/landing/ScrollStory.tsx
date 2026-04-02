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
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
      <div className="flex-1 h-5 rounded-full bg-foreground/4 mx-3" />
    </div>
    <div className="h-3.5 w-3/4 rounded bg-foreground/6" />
    <div className="h-2.5 w-full rounded bg-foreground/4" />
    <div className="h-2.5 w-5/6 rounded bg-foreground/4" />
    <div className="h-2.5 w-2/3 rounded bg-foreground/4" />
    <div className="mt-5 grid grid-cols-3 gap-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 rounded-xl bg-foreground/3 border border-border/8" />
      ))}
    </div>
    <div className="mt-3 flex items-center gap-2">
      <div className="w-5 h-5 rounded-full bg-primary/12 flex items-center justify-center">
        <Globe className="w-2.5 h-2.5 text-primary" />
      </div>
      <div className="h-2 w-28 rounded bg-primary/8" />
      <span className="text-[10px] text-emerald-400/80 font-medium ml-auto">Сканиране...</span>
    </div>
  </div>
);

const MockupDocuments = () => (
  <div className="space-y-2.5">
    {['Ценова листа.pdf', 'Услуги.docx', 'FAQ база данни'].map((name, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/2 border border-border/8">
        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground/80 truncate">{name}</p>
          <p className="text-[10px] text-foreground/25">{(i + 1) * 24} KB</p>
        </div>
        <span className="text-[10px] text-emerald-400/80 font-medium shrink-0">✓ Добавен</span>
      </div>
    ))}
    <div className="mt-3 p-3 rounded-xl border border-dashed border-border/15 text-center">
      <p className="text-xs text-foreground/25 font-light">+ Добавете още файлове</p>
    </div>
  </div>
);

const MockupChat = () => (
  <div className="space-y-2.5">
    <div className="flex justify-end">
      <div className="bg-primary/8 text-foreground/60 text-[13px] px-3.5 py-2 rounded-2xl rounded-tr-md max-w-[200px] font-light">
        Колко струва почистване на климатик?
      </div>
    </div>
    <div className="flex justify-start">
      <div className="bg-foreground/4 text-foreground/50 text-[13px] px-3.5 py-2 rounded-2xl rounded-tl-md max-w-[240px] font-light">
        Почистването на климатик при нас е 89 лв. Включва дезинфекция и проверка на фреон.
      </div>
    </div>
    <div className="flex justify-end">
      <div className="bg-primary/8 text-foreground/60 text-[13px] px-3.5 py-2 rounded-2xl rounded-tr-md font-light">
        Да, утре сутринта.
      </div>
    </div>
    <div className="flex justify-start">
      <div className="bg-foreground/4 text-foreground/50 text-[13px] px-3.5 py-2 rounded-2xl rounded-tl-md max-w-[220px] font-light">
        Записах ви за утре, 10:00. Ще получите потвърждение.
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
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / (sectionH - window.innerHeight)));
      const step = Math.min(2, Math.floor(progress * 3));
      setActiveStep(step);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ActiveMockup = mockups[steps[activeStep].mockup];

  return (
    <section ref={sectionRef} className="relative" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Steps */}
            <div className="space-y-6">
              <span className="neo-badge">
                Как работи NEO
              </span>
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: activeStep === i ? 1 : 0.25 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-4 cursor-pointer"
                  onClick={() => setActiveStep(i)}
                >
                  <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                    activeStep === i ? 'bg-primary/12 text-primary' : 'bg-foreground/4 text-foreground/25'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-[400px]">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right — Mockup */}
            <div className="relative">
              <div className="neo-glass-premium rounded-2xl p-6 sm:p-8 border border-border/8 min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ActiveMockup />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute -z-10 inset-0 blur-[80px] bg-gradient-to-br from-primary/4 via-transparent to-primary/2 rounded-3xl scale-110" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStory;
