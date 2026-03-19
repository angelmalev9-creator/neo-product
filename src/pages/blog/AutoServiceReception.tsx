import { Bot, ArrowLeft, Calendar, Clock, User, ArrowRight, Car, Wrench, Phone, DollarSign, CheckCircle, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import heroImage from '@/assets/blog/auto-service-reception.jpg';

const AutoServiceReception = () => {
  return (
    <>
      <Helmet>
        <title>AI Рецепция за Автосервиз: Автоматизирайте Записването на Клиенти | NEO</title>
        <meta name="description" content="Как AI асистентът помага на автосервизи да не губят клиенти. Автоматично записване за ремонт, 24/7 отговаряне на обаждания, увеличени приходи. Практическо ръководство." />
        <meta name="keywords" content="AI автосервиз, виртуален асистент автосервиз, записване за ремонт AI, автоматизация автосервиз, AI за автомобилни услуги, гласов асистент автосервиз, NEO автосервиз" />
        <meta property="og:title" content="AI Рецепция за Автосервиз: Автоматизирайте Записването на Клиенти" />
        <meta property="og:description" content="Как AI асистентът помага на автосервизи да не губят клиенти и да увеличат приходите." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="https://neo-assistant.com/blog/auto-service-reception" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "AI Рецепция за Автосервиз",
            "description": "Как AI асистентът помага на автосервизи да не губят клиенти",
            "author": { "@type": "Organization", "name": "NEO AI" },
            "datePublished": "2025-01-11",
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
              alt="AI рецепция в автосервиз - модерна система за записване на клиенти" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="max-w-4xl">
              <Badge className="mb-4">Автомобилни услуги</Badge>
              <h1 className="text-3xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
                AI Рецепция за Автосервиз: Как да Не Губите Клиенти, Докато Ремонтирате Коли
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  NEO Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  11 януари 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  7 мин четене
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
                  Когато механиците ви са под колите и ръцете им са в масло, кой отговаря на телефона? Ако отговорът е "никой" - губите клиенти всеки ден. <strong>AI рецепцията за автосервиз</strong> решава този проблем веднъж завинаги.
                </p>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 my-8">
                  <div className="flex items-start gap-4">
                    <Car className="w-8 h-8 text-orange-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Познат сценарий?</h3>
                      <p className="text-muted-foreground">
                        Клиент с авария се обажда. Вие сте под кола. Телефонът звъни. Не можете да отговорите. Клиентът звъни на конкурента. <strong>Загубихте 250-1000 € поръчка.</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Проблемите на автосервизите без AI рецепция
                </h2>
                
                <div className="space-y-4 my-8">
                  <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
                    <Phone className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground"><strong>Пропуснати обаждания:</strong> Докато работите, телефонът звъни. Не можете да прекъснете ремонта, за да отговорите.</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
                    <Clock className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground"><strong>Затворено след 18:00:</strong> 40% от клиентите търсят автосервиз вечер или в събота. Вие сте затворени.</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
                    <DollarSign className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground"><strong>Скъп рецепционист:</strong> Наемането на човек само за телефона струва 750+ €/месец. За малък сервиз - нерентабилно.</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Какво прави AI рецепционистът за автосервиз?
                </h2>
                
                <div className="space-y-6 my-8">
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Wrench className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Записва часове за ремонт</h4>
                      <p className="text-muted-foreground">
                        NEO пита какъв е проблемът, марката на колата и предлага свободен час. Записва директно в календара ви.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <DollarSign className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Дава ориентировъчни цени</h4>
                      <p className="text-muted-foreground">
                        Клиентите често питат "Колко струва смяна на масло/спирачки/ремък?". NEO дава ценови ориентири според вашия ценоразпис.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Phone className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Обслужва спешни случаи</h4>
                      <p className="text-muted-foreground">
                        При авария NEO записва данни за контакт и уведомява веднага. Не губите клиенти с аварии дори в 2 часа през нощта.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <CheckCircle className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Напомня за годишни прегледи</h4>
                      <p className="text-muted-foreground">
                        NEO може да се обажда на клиенти, когато им предстои годишен технически преглед или смяна на гуми.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Примерен разговор
                </h2>
                
                <div className="bg-card rounded-xl border p-6 my-8 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-foreground">"Здравейте! Обаждате се на Автосервиз Мотор Плюс. Аз съм NEO. Как мога да ви помогна?"</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-foreground">"Здравейте, колата ми прави странен шум при спиране. Бих искал да я прегледате."</p>
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
                      <p className="text-foreground">"Разбирам, това може да е проблем със спирачките. Каква е марката и модела на колата ви?"</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-foreground">"VW Golf 7, 2017 година."</p>
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
                      <p className="text-foreground">"Благодаря! Имаме свободен час утре в 9:00 или вдругиден в 14:00. Кое ви устройва по-добре?"</p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  ROI за автосервиз: Реални числа
                </h2>

                <div className="bg-card rounded-xl border p-6 my-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Пропуснати обаждания на седмица (без AI):</span>
                      <span className="font-bold text-foreground">15-20</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Конверсия на обаждане в клиент:</span>
                      <span className="font-bold text-foreground">40%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Средна стойност на ремонт:</span>
                      <span className="font-bold text-foreground">180 €</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Загубени приходи на месец:</span>
                      <span className="font-bold text-destructive">4,300 €</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/20 pb-4">
                      <span className="text-muted-foreground">Цена на NEO:</span>
                      <span className="font-bold text-foreground">от 49 €/месец</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold text-foreground">Потенциален ROI:</span>
                      <span className="text-2xl font-bold text-green-400">84x</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Лесна настройка за 5 минути
                </h2>
                <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                  <li>Въведете уебсайта на сервиза или опишете услугите си</li>
                  <li>Задайте работно време и свободни часове</li>
                  <li>Добавете ценоразпис (по желание)</li>
                  <li>NEO е готов да отговаря на обаждания</li>
                </ol>

              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 text-center">
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Спрете да губите клиенти
                </h3>
                <p className="text-muted-foreground mb-6">
                  Тествайте NEO безплатно. Настройка за 5 минути.
                </p>
                <Button size="lg" asChild>
                  <Link to="/#demo">
                    Опитайте безплатно
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

export default AutoServiceReception;
