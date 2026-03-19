import { Bot, ArrowLeft, Calendar, Clock, User, ArrowRight, Sparkles, Phone, Star, Heart, CheckCircle, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import heroImage from '@/assets/blog/beauty-salon-reception.jpg';

const BeautySalonReception = () => {
  return (
    <>
      <Helmet>
        <title>AI Рецепция за Салон за Красота: Автоматично Записване на Часове | NEO</title>
        <meta name="description" content="Как AI асистентът помага на салони за красота да записват клиенти 24/7. Автоматизация на резервации, намаляване на неявявания, увеличаване на приходите. Пълно ръководство." />
        <meta name="keywords" content="AI салон за красота, виртуален асистент козметичен салон, записване на час фризьор AI, автоматизация салон, AI за спа, гласов асистент красота, NEO салон, резервация козметика AI" />
        <meta property="og:title" content="AI Рецепция за Салон за Красота: Автоматично Записване на Часове" />
        <meta property="og:description" content="Как AI асистентът помага на салони за красота да записват клиенти 24/7." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="https://neo-assistant.com/blog/beauty-salon-reception" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "AI Рецепция за Салон за Красота",
            "description": "Как AI асистентът помага на салони за красота да записват клиенти 24/7",
            "author": { "@type": "Organization", "name": "NEO AI" },
            "datePublished": "2025-01-09",
            "publisher": { "@type": "Organization", "name": "NEO AI" }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
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

        <section className="relative">
          <div className="aspect-[21/9] w-full overflow-hidden">
            <img 
              src={heroImage} 
              alt="AI рецепция в салон за красота - модерна система за записване" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="max-w-4xl">
              <Badge className="mb-4">Красота и СПА</Badge>
              <h1 className="text-3xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
                AI Рецепция за Салон за Красота: Записвайте Клиенти Дори Докато Боядисвате Коса
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  NEO Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  9 януари 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  6 мин четене
                </span>
              </div>
            </div>
          </div>
        </section>

        <article className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-lg prose-invert max-w-none">
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Познато ли ви е? Работите с клиент, телефонът звъни, не можете да отговорите, и губите потенциална резервация. За салоните за красота <strong>AI рецепцията</strong> е революция - позволява ви да се фокусирате върху работата си, докато NEO записва клиенти вместо вас.
                </p>

                <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-6 my-8">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-8 h-8 text-pink-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Статистика за бюти индустрията</h3>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• <strong>52%</strong> от клиентите записват час извън работно време</li>
                        <li>• <strong>35%</strong> от обажданията не се отговарят по време на процедури</li>
                        <li>• <strong>28%</strong> от резервациите се отменят без предупреждение</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Защо салоните за красота имат нужда от AI рецепция?
                </h2>
                
                <div className="space-y-6 my-8">
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Phone className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Не можете да прекъснете процедура</h4>
                      <p className="text-muted-foreground">
                        Когато боядисвате коса или правите маникюр, не можете просто да оставите клиента и да вдигнете телефона. С NEO не е нужно.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Clock className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Клиентите търсят вечер</h4>
                      <p className="text-muted-foreground">
                        Много жени търсят салон след работа - в 19:00, 20:00, дори в 22:00. Вие вече сте затворили, но NEO работи 24/7.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Star className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Неявявания унищожават графика</h4>
                      <p className="text-muted-foreground">
                        Клиент забравя за часа си = 1-2 часа загубено време. NEO изпраща автоматични напомняния и намалява неявяванията с до 50%.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Какво може NEO за вашия салон?
                </h2>

                <div className="grid md:grid-cols-2 gap-4 my-8">
                  <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl border border-pink-500/20">
                    <CheckCircle className="w-6 h-6 text-pink-400 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Записване на часове</h4>
                    <p className="text-sm text-muted-foreground">24/7 резервации по телефона</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl border border-pink-500/20">
                    <CheckCircle className="w-6 h-6 text-pink-400 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Информация за услуги</h4>
                    <p className="text-sm text-muted-foreground">Цени, продължителност, описание</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl border border-pink-500/20">
                    <CheckCircle className="w-6 h-6 text-pink-400 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Напомняния</h4>
                    <p className="text-sm text-muted-foreground">Автоматични обаждания ден преди</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl border border-pink-500/20">
                    <CheckCircle className="w-6 h-6 text-pink-400 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Промоции</h4>
                    <p className="text-sm text-muted-foreground">Информира за текущи оферти</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Типичен разговор в салон
                </h2>
                
                <div className="bg-card rounded-xl border p-6 my-8 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-foreground">"Здравейте! Обаждате се на Салон Елеганс. Аз съм NEO. Как мога да ви помогна?"</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-foreground">"Здравейте, бих искала да си запиша час за маникюр с гел лак."</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-foreground">"Чудесен избор! Маникюр с гел лак е 23 € и отнема около 1 час. Имаме свободни часове утре в 11:00 и 15:30, или в събота в 10:00. Кой ви устройва?"</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-foreground">"Събота в 10 ми е идеално."</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-foreground">"Записах ви за събота, 10:00, маникюр с гел лак. Ще ви се обадя в петък за напомняне. На кое име да запиша?"</p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Реални резултати от салони с NEO
                </h2>

                <div className="grid md:grid-cols-3 gap-6 my-8">
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20 text-center">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">+38%</div>
                    <p className="font-semibold text-foreground">Повече резервации</p>
                    <p className="text-sm text-muted-foreground mt-2">От нощни и уикенд обаждания</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20 text-center">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">-50%</div>
                    <p className="font-semibold text-foreground">По-малко неявявания</p>
                    <p className="text-sm text-muted-foreground mt-2">Благодарение на напомнянията</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20 text-center">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">10ч</div>
                    <p className="font-semibold text-foreground">Спестено време</p>
                    <p className="text-sm text-muted-foreground mt-2">На седмица за телефони</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Финансова калкулация за салон
                </h2>

                <div className="bg-card rounded-xl border p-6 my-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Пропуснати обаждания на седмица:</span>
                      <span className="font-bold text-foreground">10</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Средна цена на услуга:</span>
                      <span className="font-bold text-foreground">30 €</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Загубени приходи на месец:</span>
                      <span className="font-bold text-destructive">1,200 €</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Цена на NEO:</span>
                      <span className="font-bold text-foreground">от 49 €/месец</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold text-foreground">Нетна печалба:</span>
                      <span className="text-2xl font-bold text-green-400">+1,150 €/месец</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Защо клиентките обичат AI асистента?
                </h2>
                
                <div className="space-y-4 my-8">
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Heart className="w-6 h-6 text-pink-400" />
                    <p className="text-muted-foreground"><strong>Бързо и лесно</strong> - без чакане на линия</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Heart className="w-6 h-6 text-pink-400" />
                    <p className="text-muted-foreground"><strong>По всяко време</strong> - записват се когато им е удобно</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Heart className="w-6 h-6 text-pink-400" />
                    <p className="text-muted-foreground"><strong>Напомняния</strong> - не забравят часа си</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Heart className="w-6 h-6 text-pink-400" />
                    <p className="text-muted-foreground"><strong>Професионално обслужване</strong> - винаги учтив и информиран</p>
                  </div>
                </div>

              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 text-center">
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Готови да автоматизирате записванията?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Тествайте NEO безплатно. Настройка за 5 минути.
                </p>
                <Button size="lg" asChild>
                  <Link to="/#demo">
                    Опитайте NEO сега
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

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

        <footer className="border-t border-border/20 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} NEO AI. Всички права запазени.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BeautySalonReception;
