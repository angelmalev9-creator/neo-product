import { Bot, ArrowLeft, Calendar, Clock, User, ArrowRight, TrendingUp, Phone, Users, MessageCircle, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import heroImage from '@/assets/blog/small-business-sales.jpg';

const SmallBusinessSales = () => {
  return (
    <>
      <Helmet>
        <title>5 начина, по които NEO увеличава продажбите на малкия бизнес | NEO AI Блог</title>
        <meta name="description" content="Научете как AI гласовият асистент NEO помага на малките предприятия да не пропускат обаждания и да конвертират повече потенциални клиенти в реални продажби." />
        <meta name="keywords" content="NEO, продажби, малък бизнес, AI асистент, увеличаване на продажби, пропуснати обаждания, конверсия" />
        <meta property="og:title" content="5 начина, по които NEO увеличава продажбите на малкия бизнес" />
        <meta property="og:description" content="Научете как AI гласовият асистент NEO помага на малките предприятия да увеличат продажбите си." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="https://neo-assistant.com/blog/small-business-sales" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/20 bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Към блога</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-foreground">NEO Блог</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div className="aspect-[21/9] w-full overflow-hidden">
            <img 
              src={heroImage} 
              alt="Собственик на малък бизнес с AI асистент NEO за увеличаване на продажби" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="max-w-4xl">
              <Badge className="mb-4">Бизнес растеж</Badge>
              <h1 className="text-3xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
                5 начина, по които NEO увеличава продажбите на малкия бизнес
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Маркетинг екип
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  8 януари 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  5 мин четене
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-lg prose-invert max-w-none">
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Като собственик на малък бизнес, знаете колко е важно всяко обаждане и всеки потенциален клиент. Но как да сте навсякъде едновременно? <strong>NEO AI гласовият асистент</strong> е решението, което може да трансформира начина, по който генерирате продажби.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">1</span>
                  Никога не пропускайте обаждане
                </h2>
                <div className="flex items-start gap-4 p-6 bg-card rounded-xl border mb-6">
                  <Phone className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Статистиките са безпощадни: <strong>67% от обажданията към малкия бизнес остават без отговор</strong>. Всяко от тези обаждания е потенциална загубена продажба.
                    </p>
                    <p className="text-muted-foreground">
                      <strong>NEO</strong> отговаря на всяко обаждане мигновено - денем и нощем, в почивни дни и празници. Никога повече няма да загубите клиент заради пропуснато обаждане.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">2</span>
                  Квалифицирайте потенциални клиенти автоматично
                </h2>
                <div className="flex items-start gap-4 p-6 bg-card rounded-xl border mb-6">
                  <Users className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Не всички обаждания са еднакво важни. NEO може да:
                    </p>
                    <ul className="text-muted-foreground space-y-2">
                      <li>• Задава квалифициращи въпроси</li>
                      <li>• Идентифицира сериозни купувачи</li>
                      <li>• Събира контактна информация</li>
                      <li>• Изпраща ви само "горещите" клиенти</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">3</span>
                  Предоставяйте моментална информация
                </h2>
                <div className="flex items-start gap-4 p-6 bg-card rounded-xl border mb-6">
                  <MessageCircle className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Клиентите искат отговори <strong>веднага</strong>. Ако не ги получат от вас, ще ги потърсят при конкуренцията.
                    </p>
                    <p className="text-muted-foreground">
                      NEO познава вашия бизнес до детайли - цени, услуги, работно време, местоположение. Отговаря на въпроси мигновено, точно както бихте отговорили вие самите.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">4</span>
                  Увеличете работното си време до 24/7
                </h2>
                <p className="text-muted-foreground">
                  Много клиенти търсят услуги <strong>извън стандартното работно време</strong> - вечер, в почивни дни, рано сутрин. С NEO вашият бизнес е отворен 24 часа, 7 дни в седмицата.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 my-8">
                  <p className="text-foreground font-semibold mb-2">💡 Интересен факт:</p>
                  <p className="text-muted-foreground">
                    42% от запитванията за услуги се случват извън работно време. Това са клиенти, които повечето бизнеси просто губят.
                  </p>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">5</span>
                  Освободете време за същинския бизнес
                </h2>
                <div className="flex items-start gap-4 p-6 bg-card rounded-xl border mb-6">
                  <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Колко часа на ден прекарвате в отговаряне на едни и същи въпроси? "Колко струва?", "Кога работите?", "Къде се намирате?"
                    </p>
                    <p className="text-muted-foreground">
                      <strong>NEO поема тези рутинни въпроси</strong>, за да можете вие да се фокусирате върху това, което правите най-добре - развиването на бизнеса.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Реални резултати от реални бизнеси
                </h2>
                <div className="grid md:grid-cols-2 gap-6 my-8">
                  <div className="p-6 bg-card rounded-xl border">
                    <p className="text-4xl font-display font-black text-primary mb-2">+35%</p>
                    <p className="text-muted-foreground">Увеличение на продажбите при зъболекарски кабинет в София</p>
                  </div>
                  <div className="p-6 bg-card rounded-xl border">
                    <p className="text-4xl font-display font-black text-primary mb-2">+50%</p>
                    <p className="text-muted-foreground">Повече записани часове при козметичен салон</p>
                  </div>
                  <div className="p-6 bg-card rounded-xl border">
                    <p className="text-4xl font-display font-black text-primary mb-2">-80%</p>
                    <p className="text-muted-foreground">Намаление на пропуснатите обаждания</p>
                  </div>
                  <div className="p-6 bg-card rounded-xl border">
                    <p className="text-4xl font-display font-black text-primary mb-2">4 часа</p>
                    <p className="text-muted-foreground">Спестено време на ден при адвокатска кантора</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Започнете още днес
                </h2>
                <p className="text-muted-foreground">
                  Не чакайте повече да губите клиенти. NEO се настройва за <strong>по-малко от 5 минути</strong> и започва да работи веднага. Опитайте безплатната демонстрация и вижте сами разликата.
                </p>

              </div>

              {/* CTA */}
              <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 text-center">
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Готови ли сте да увеличите продажбите си?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Безплатна демонстрация за 30 секунди. Без кредитна карта.
                </p>
                <Button size="lg" asChild>
                  <Link to="/#demo">
                    Тествайте NEO безплатно
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Share */}
              <div className="mt-12 pt-8 border-t border-border/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Споделете статията:</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Linkedin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="border-t border-border/20 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} NEO AI. Всички права запазени.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SmallBusinessSales;
