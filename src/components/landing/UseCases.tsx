import { Stethoscope, Scissors, Car, Dumbbell, Building2, Clock, PhoneOff, PhoneCall, CheckCircle2, XCircle } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

import usecaseClinic from '@/assets/usecase-clinic.png';
import usecaseSalon from '@/assets/usecase-salon.png';
import usecaseAuto from '@/assets/usecase-auto.png';
import usecaseFitness from '@/assets/usecase-fitness.png';
import usecaseHotel from '@/assets/usecase-hotel.png';

const industries = [
  {
    icon: Stethoscope, title: 'Клиники', subtitle: 'AI рецепционист за Вашата клиника',
    description: 'NEO записва пациенти, отговаря на въпроси за услуги и цени — без чакане на линия.',
    color: 'text-emerald-400', border: 'border-emerald-500/30', accentBg: 'bg-emerald-500/15',
    image: usecaseClinic, savings: '~1 200 EUR/мес', available: '24/7',
    before: ['Пациенти чакат по 5–10 мин на линия', 'Пропуснати обаждания = загубени часове', 'Рецепцията е натоварена и прави грешки'],
    after: ['Мигновен отговор без чакане', 'Всяко обаждане е обслужено автоматично', 'Точни записвания без човешки грешки'],
    stat: { label: 'по-малко пропуснати', value: '94%' },
  },
  {
    icon: Scissors, title: 'Салони за красота', subtitle: 'Автоматизирайте записванията в салона',
    description: 'NEO управлява записвания, информира за свободни часове и напомня на клиентите.',
    color: 'text-pink-400', border: 'border-pink-500/30', accentBg: 'bg-pink-500/15',
    image: usecaseSalon, savings: '~900 EUR/мес', available: '24/7',
    before: ['Клиенти не могат да се запишат извън работно време', 'Рецепцията пропуска обаждания по време на процедури', 'Ръчно напомняне за часове'],
    after: ['Записване по всяко време — ден и нощ', 'Нито едно обаждане не остава без отговор', 'Автоматични напомняния преди часа'],
    stat: { label: 'повече записвания', value: '+38%' },
  },
  {
    icon: Car, title: 'Автосервизи', subtitle: 'Интелигентен асистент за автосервиза',
    description: 'NEO приема заявки за ремонт, дава ориентировъчни цени и насочва клиентите.',
    color: 'text-amber-400', border: 'border-amber-500/30', accentBg: 'bg-amber-500/15',
    image: usecaseAuto, savings: '~1 000 EUR/мес', available: '24/7',
    before: ['Механиците нямат време да отговарят на телефона', 'Клиенти се обаждат в друг сервиз при липса на отговор', 'Няма система за проследяване на запитвания'],
    after: ['NEO отговаря докато екипът работи', 'Всеки клиент получава бърз отговор', 'Всяко запитване е записано и проследимо'],
    stat: { label: 'спестено време', value: '12ч/сед' },
  },
  {
    icon: Dumbbell, title: 'Фитнеси', subtitle: 'AI рецепция за Вашия фитнес',
    description: 'NEO записва за тренировки, отговаря за абонаменти и графици на треньори.',
    color: 'text-cyan-400', border: 'border-cyan-500/30', accentBg: 'bg-cyan-500/15',
    image: usecaseFitness, savings: '~800 EUR/мес', available: '24/7',
    before: ['Рецепцията е заета с клиенти на място', 'Пропуснати обаждания за записвания за тренировки', 'Информация за абонаменти — само на място'],
    after: ['Обажданията се обработват автоматично', 'Записване за персонална тренировка без чакане', 'Информация за абонаменти — по телефона, 24/7'],
    stat: { label: 'по-доволни клиенти', value: '+45%' },
  },
  {
    icon: Building2, title: 'Хотели', subtitle: 'Виртуален рецепционист за хотела',
    description: 'NEO отговаря на запитвания за стаи, наличност и прави резервации автоматично.',
    color: 'text-violet-400', border: 'border-violet-500/30', accentBg: 'bg-violet-500/15',
    image: usecaseHotel, savings: '~1 500 EUR/мес', available: '24/7',
    before: ['Гости чакат на линия за проверка на наличност', 'Нощна смяна = допълнителни разходи за персонал', 'Езикова бариера с чуждестранни гости'],
    after: ['Мигновена проверка и резервация', 'NEO работи нощна смяна — безплатно', 'Многоезична комуникация без усилие'],
    stat: { label: 'повече резервации', value: '+27%' },
  },
];

const UseCaseCard = ({ industry }: { industry: typeof industries[0] }) => {
  const Icon = industry.icon;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center neo-glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
      {/* Image */}
      <div className={`relative rounded-xl overflow-hidden border ${industry.border}`}>
        <img src={industry.image} alt={industry.title} width={1254} height={1254} className="w-full h-auto" loading="lazy" />
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${industry.color} mb-0.5`}>{industry.subtitle}</p>
          <h3 className="text-base sm:text-lg font-display font-black text-foreground mb-1">{industry.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{industry.description}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2.5">
          <div className={`${industry.accentBg} border ${industry.border} rounded-lg px-3 py-1.5 text-center`}>
            <div className={`text-base font-black ${industry.color}`}>{industry.stat.value}</div>
            <div className="text-[9px] text-muted-foreground font-medium">{industry.stat.label}</div>
          </div>
          <div className={`${industry.accentBg} border ${industry.border} rounded-lg px-3 py-1.5 text-center`}>
            <div className="text-base font-black text-emerald-400">{industry.savings}</div>
            <div className="text-[9px] text-muted-foreground font-medium">спестявате месечно</div>
          </div>
          <div className={`${industry.accentBg} border ${industry.border} rounded-lg px-3 py-1.5 text-center`}>
            <div className="text-base font-black text-primary">24/7</div>
            <div className="text-[9px] text-muted-foreground font-medium">без почивка</div>
          </div>
        </div>

        {/* Before / After */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
            <div className="flex items-center gap-1 mb-1.5">
              <PhoneOff className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-bold text-red-400">Без NEO</span>
            </div>
            <ul className="space-y-1">
              {industry.before.map((item, i) => (
                <li key={i} className="flex items-start gap-1">
                  <XCircle className="w-2.5 h-2.5 text-red-400/70 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-muted-foreground leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
            <div className="flex items-center gap-1 mb-1.5">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">С NEO</span>
            </div>
            <ul className="space-y-1">
              {industry.after.map((item, i) => (
                <li key={i} className="flex items-start gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400/70 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-muted-foreground leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const UseCases = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="use-cases"
      className="neo-section-spacing relative"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="neo-heading-section font-display font-black text-foreground mb-3">
            За всеки бизнес,{' '}
            <span className="text-primary">който говори с клиенти</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            NEO се адаптира към Вашата индустрия за минути.
          </p>
        </div>

        <div className="space-y-5">
          {industries.map((industry) => (
            <UseCaseCard key={industry.title} industry={industry} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
