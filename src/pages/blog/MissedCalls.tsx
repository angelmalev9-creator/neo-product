import { Bot, ArrowLeft, Calendar, Clock, User, ArrowRight, AlertTriangle, Phone, DollarSign, TrendingDown, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import heroImage from '@/assets/blog/missed-calls.jpg';

const MissedCalls = () => {
  return (
    <>
      <Helmet>
        <title>Защо 67% от обажданията остават без отговор и как NEO решава този проблем | NEO AI Блог</title>
        <meta name="description" content="Статистиките са шокиращи - повечето бизнеси губят клиенти заради пропуснати обаждания. Вижте как NEO AI гарантира 24/7 достъпност и увеличава продажбите." />
        <meta name="keywords" content="NEO, пропуснати обаждания, загубени клиенти, 24/7 обслужване, AI асистент, клиентско обслужване" />
        <meta property="og:title" content="Защо 67% от обажданията остават без отговор и как NEO решава този проблем" />
        <meta property="og:description" content="Статистиките са шокиращи - вижте как NEO гарантира 24/7 достъпност." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="https://neo-assistant.com/blog/missed-calls" />
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
              alt="Бизнесмен разглежда пропуснати обаждания на телефона - проблем, който NEO решава" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="max-w-4xl">
              <Badge variant="destructive" className="mb-4">Индустриален анализ</Badge>
              <h1 className="text-3xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
                Защо 67% от обажданията остават без отговор и как NEO решава този проблем
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  NEO Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  5 януари 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  6 мин четене
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
                  Представете си: клиент търси точно вашата услуга, набира телефона ви... и никой не отговаря. Какво прави след това? <strong>85% от тях няма да ви се обадят отново</strong> - ще потърсят конкурент. Това се случва хиляди пъти на ден в България.
                </p>

                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 my-8">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Шокиращата статистика</h3>
                      <p className="text-muted-foreground">
                        Според проучване на Forbes, <strong>67% от бизнес обажданията към малки и средни предприятия остават без отговор</strong>. Това са потенциални клиенти, които никога няма да станат реални.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Защо обажданията остават без отговор?
                </h2>
                
                <div className="space-y-6 my-8">
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Phone className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">1. Зает с клиенти</h4>
                      <p className="text-muted-foreground">
                        Когато обслужвате клиент лично, не можете да отговорите на телефона. Но това не означава, че обаждането е по-малко важно.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Clock className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">2. Извън работно време</h4>
                      <p className="text-muted-foreground">
                        42% от хората търсят услуги вечер или в почивни дни. Повечето бизнеси тогава са затворени.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <TrendingDown className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">3. Липса на персонал</h4>
                      <p className="text-muted-foreground">
                        Много малки бизнеси нямат ресурс за рецепционист или кол център. Собственикът върши всичко сам.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Цената на пропуснатото обаждане
                </h2>
                <p className="text-muted-foreground">
                  Нека направим бърза сметка. Ако имате бизнес, при който средната поръчка е 100 лева:
                </p>
                
                <div className="bg-card rounded-xl border p-6 my-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Пропуснати обаждания на ден:</span>
                      <span className="font-bold text-foreground">5</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Конверсия (ако бяха отговорени):</span>
                      <span className="font-bold text-foreground">30%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Загубени клиенти на ден:</span>
                      <span className="font-bold text-foreground">1.5</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Загуба на ден (×50 €):</span>
                      <span className="font-bold text-foreground">75 €</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold text-foreground">Загуба на месец:</span>
                      <span className="text-2xl font-bold text-destructive">2,250 €</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  <strong>2,250 евро на месец</strong> - това е цената на пропуснатите обаждания. За една година това са <strong>27,000 евро</strong> загубени приходи.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Как NEO решава проблема
                </h2>
                <p className="text-muted-foreground mb-4">
                  <strong>NEO е AI гласов асистент</strong>, който отговаря на всяко обаждане - мигновено и 24/7. Ето как работи:
                </p>

                <div className="grid md:grid-cols-2 gap-6 my-8">
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">0</div>
                    <p className="font-semibold text-foreground">Пропуснати обаждания</p>
                    <p className="text-sm text-muted-foreground mt-2">NEO отговаря на всяко обаждане мигновено</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">24/7</div>
                    <p className="font-semibold text-foreground">Достъпност</p>
                    <p className="text-sm text-muted-foreground mt-2">Денем, нощем, празници - винаги на линия</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">100%</div>
                    <p className="font-semibold text-foreground">Точни отговори</p>
                    <p className="text-sm text-muted-foreground mt-2">Познава всичко за вашия бизнес</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">5 мин</div>
                    <p className="font-semibold text-foreground">Настройка</p>
                    <p className="text-sm text-muted-foreground mt-2">Бързо и лесно внедряване</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  ROI на NEO: Примерна калкулация
                </h2>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 my-8">
                  <div className="flex items-start gap-4">
                    <DollarSign className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Ако NEO ви спести дори <strong>половината</strong> от загубите от пропуснати обаждания:
                      </p>
                      <ul className="text-muted-foreground space-y-2">
                        <li>• Загуби преди NEO: 2,250 €/месец</li>
                        <li>• Спасени клиенти с NEO: 1,125 €/месец</li>
                        <li>• Цена на NEO: от 49 €/месец</li>
                        <li className="font-bold text-primary">• Нетна печалба: 1,076 €/месец</li>
                      </ul>
                      <p className="text-foreground font-semibold mt-4">
                        ROI: над 2000%
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Действайте сега
                </h2>
                <p className="text-muted-foreground">
                  Всяка минута, в която нямате NEO, е потенциално загубен клиент. Конкурентите ви вече използват AI технологии. Не оставайте назад.
                </p>
                <p className="text-muted-foreground">
                  <strong>Опитайте NEO безплатно още днес</strong> - настройката отнема под 5 минути.
                </p>

              </div>

              {/* CTA */}
              <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 text-center">
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Спрете да губите клиенти
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

export default MissedCalls;
