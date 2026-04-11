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
    q: 'Наистина ли разбира български правилно?',
    a: 'Да. NEO използва най-новите езикови модели, обучени на български. Разбира диалекти, съкращения и дори грешно изписани думи. Ако клиентът Ви каже „Искам час за утре сутринта" — NEO ще го разбере.',
  },
  {
    q: 'Какво става ако NEO сбърка нещо важно?',
    a: 'Всеки разговор се записва в дашборда Ви. Можете да го прегледате, да коригирате поведението на NEO и да добавите инструкции. С времето NEO прави все по-малко грешки.',
  },
  {
    q: 'Мога ли да чуя записите на разговорите?',
    a: 'Да. Всеки гласов и текстов разговор се пази в дашборда с пълен запис. Можете да го прочетете или прослушате по всяко време.',
  },
  {
    q: 'Колко трае докато NEO научи моя бизнес?',
    a: 'Под 1 минута. Въвеждате линка на сайта си, NEO го прочита и е готов. Ако искате да добавите допълнителна информация — можете от дашборда.',
  },
  {
    q: 'Мога ли да използвам моя съществуващ телефонен номер?',
    a: 'В момента можете да закупите нов български номер от дашборда. Пренасочване от съществуващ номер е възможно — свържете се с нас за детайли.',
  },
  {
    q: 'Какво се случва ако искам да откажа?',
    a: 'Отказвате от дашборда с един клик. Няма скрити такси, няма договор, няма обвързване. Данните Ви се изтриват до 30 дни след отказа.',
  },
  {
    q: 'Сигурни ли са данните на клиентите ми?',
    a: 'Да. Използваме криптиране от край до край и сме GDPR-съвместими. Данните Ви не се споделят с трети страни и се съхраняват в Европа.',
  },
  {
    q: 'Работи ли с моята система за резервации?',
    a: 'NEO се свързва директно с Google Calendar. За други системи — свържете се с нас. Работим по интеграции с най-популярните платформи.',
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
