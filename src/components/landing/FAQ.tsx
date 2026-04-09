import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Как NEO се обучава за моя бизнес?',
    a: 'Просто въведете линка на сайта си. NEO автоматично анализира съдържанието — услуги, цени, работно време — и се обучава за секунди. Можете и да добавите допълнителна информация ръчно.',
  },
  {
    q: 'На какви езици говори NEO?',
    a: 'NEO говори на български, английски и руски. Автоматично разпознава езика на клиента и отговаря на същия език.',
  },
  {
    q: 'Мога ли да свържа телефонен номер?',
    a: 'Да! Можете да закупите български телефонен номер директно от dashboard-а. NEO ще отговаря на обажданията с гласов AI асистент, обучен за вашия бизнес.',
  },
  {
    q: 'Колко време отнема настройката?',
    a: 'Под 5 минути. Добавяте линка на сайта, избирате глас и поведение, и вграждате един ред код. NEO е готов да работи веднага.',
  },
  {
    q: 'Безопасни ли са данните ми?',
    a: 'Абсолютно. Използваме криптиране от край до край, GDPR-съвместими сме и данните ви никога не се споделят с трети страни.',
  },
  {
    q: 'Мога ли да пробвам безплатно?',
    a: 'Да, демото на началната страница е напълно безплатно и не изисква регистрация. Можете да тествате NEO с вашия собствен сайт веднага.',
  },
];

const FAQ = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="faq"
      className={`neo-section-spacing relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-3 font-mono">
            Често задавани{' '}
            <span className="text-primary">въпроси</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Всичко, което трябва да знаете за NEO.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-foreground/8 rounded-xl px-5 py-1 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors data-[state=open]:bg-foreground/[0.04]"
              >
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
