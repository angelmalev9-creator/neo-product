import { Star, Quote } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { PencilUnderline } from '@/components/ui/PencilUnderline';

const testimonials = [
  {
    name: 'Д-р Мария Петрова',
    role: 'Собственик на стоматологична клиника',
    business: 'ДенталКеър София',
    content: 'NEO отговаря на над 80% от обажданията ни извън работно време. Пациентите записват часове в 2 часа през нощта, а сутринта виждам потвърдени записвания. Спестихме една цяла заплата на рецепционист.',
    rating: 5,
    initials: 'МП',
  },
  {
    name: 'Георги Иванов',
    role: 'Управител на автосервиз',
    business: 'АвтоЕксперт Пловдив',
    content: 'Преди губехме клиенти, защото не вдигахме телефона докато сме под колите. Сега NEO обяснява услугите, дава ориентировъчни цени и записва часове. Приходите ни скочиха с 30% за първия месец.',
    rating: 5,
    initials: 'ГИ',
  },
  {
    name: 'Елена Николова',
    role: 'Собственик на салон за красота',
    business: 'BeautyLab Варна',
    content: 'Клиентките ми обичат, че могат да питат за свободни часове по всяко време. NEO знае всички ни услуги и цени. Най-доброто е, че говори на 3 езика — перфектно за туристите през лятото!',
    rating: 5,
    initials: 'ЕН',
  },
  {
    name: 'Стоян Димитров',
    role: 'Управител на фитнес център',
    business: 'PowerGym Бургас',
    content: 'Имахме проблем с пропуснати обаждания в пиковите часове. Сега NEO поема всичко — от въпроси за абонаменти до записване за персонални тренировки. Инвестицията се изплати за 2 седмици.',
    rating: 5,
    initials: 'СД',
  },
];

const Testimonials = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="testimonials"
      className={`py-16 lg:py-24 relative overflow-hidden neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-4 max-w-3xl mx-auto leading-[1.1] tracking-wide">
            <PencilUnderline>Какво казват</PencilUnderline> <span className="neo-gradient-text">клиентите</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Реални бизнеси. Реални резултати.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="neo-glass-subtle p-6 sm:p-6 lg:p-8 rounded-2xl sm:rounded-xl lg:rounded-2xl border border-border/20 hover:border-primary/30 transition-all relative"
            >
              {/* Quote icon */}
              <Quote className="absolute top-5 right-5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 text-primary/8" />
              
              {/* Rating */}
              <div className="flex gap-1.5 sm:gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-[15px] sm:text-sm lg:text-base text-muted-foreground leading-[1.7] sm:leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3.5 sm:gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center text-sm font-bold text-foreground shadow-inner">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-[15px] sm:text-base text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{testimonial.role}</p>
                  <p className="text-xs text-primary font-medium">{testimonial.business}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
