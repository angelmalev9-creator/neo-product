import { Plus, Minus } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const faqs = [
  {
    q: 'Как NEO се обучава за моя бизнес?',
    a: 'Просто добавете линка на вашия сайт. NEO автоматично анализира съдържанието и се обучава за секунди. Не е нужно ръчно въвеждане на информация.',
  },
  {
    q: 'На какви езици говори NEO?',
    a: 'NEO говори свободно на български и английски. Автоматично разпознава езика на клиента и отговаря на същия.',
  },
  {
    q: 'Мога ли да свържа телефонен номер?',
    a: 'Да! В плановете Растеж и Бизнес можете да закупите български телефонен номер (+359) директно от dashboard-а. NEO ще отговаря на обаждания автоматично.',
  },
  {
    q: 'Колко време отнема настройката?',
    a: 'По-малко от минута. Добавете линка на сайта си, изберете глас и тон, и NEO е готов.',
  },
  {
    q: 'Безопасни ли са данните ми?',
    a: 'Абсолютно. Всички данни са криптирани, GDPR-съвместими сме и никога не споделяме информация с трети страни.',
  },
  {
    q: 'Мога ли да пробвам безплатно?',
    a: 'Да, всички планове включват 14 дни безплатен пробен период без кредитна карта.',
  },
];

const FAQ = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="faq" className="neo-section-spacing">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="neo-heading-section font-black text-foreground mb-3 font-mono">
            Често задавани <span className="text-primary">въпроси</span>
          </h2>
          <p className="neo-subheading text-muted-foreground">
            Всичко, което трябва да знаете за NEO.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-border/15 bg-card/30 backdrop-blur-sm hover:border-primary/20 transition-all duration-200 text-left group"
              >
                <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{faq.q}</span>
                <div className="shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  {open === i ? <Minus className="w-3.5 h-3.5 text-primary" /> : <Plus className="w-3.5 h-3.5 text-primary" />}
                </div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 py-3 text-sm text-foreground/50 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
