import { Bot, ArrowLeft, Calendar, Clock, User, ArrowRight, CheckCircle, Phone, MessageCircle, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import heroImage from '@/assets/blog/dental-clinic-ai.jpg';

const DentalClinicAI = () => {
  return (
    <>
      <Helmet>
        <title>NEO AI асистент за стоматологични клиники: Практическо ръководство | NEO AI Блог</title>
        <meta name="description" content="Пълно ръководство за внедряване на NEO AI гласов асистент в зъболекарска практика - от настройка до автоматично записване на часове." />
        <meta name="keywords" content="NEO, зъболекар, стоматология, AI асистент, записване часове, зъболекарски кабинет, автоматизация" />
        <meta property="og:title" content="NEO AI асистент за стоматологични клиники: Практическо ръководство" />
        <meta property="og:description" content="Пълно ръководство за внедряване на NEO в зъболекарска практика." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="https://neo-assistant.com/blog/dental-clinic-ai" />
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
                  <Bot className="w-4 h-4" />
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
              alt="Модерна стоматологична клиника с NEO AI асистент на рецепция" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="max-w-4xl">
              <Badge className="mb-4">Ръководства</Badge>
              <h1 className="text-3xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
                NEO AI асистент за стоматологични клиники: Практическо ръководство
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Продуктов екип
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  3 януари 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  10 мин четене
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
                  Стоматологичните клиники са перфектният кандидат за AI гласов асистент. Голям обем обаждания, повтарящи се въпроси и нужда от записване на часове - <strong>NEO</strong> може да поеме всичко това. В това ръководство ще ви покажем стъпка по стъпка как да внедрите NEO във вашата практика.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Защо зъболекарските кабинети се нуждаят от NEO?
                </h2>
                <p className="text-muted-foreground">
                  Типичният зъболекарски кабинет получава десетки обаждания на ден. Повечето от тях са за:
                </p>
                <ul className="space-y-3 my-6">
                  <li className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-muted-foreground">Записване или промяна на часове</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-muted-foreground">Въпроси за цени на процедури</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-muted-foreground">Работно време и местоположение</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-muted-foreground">Налични услуги и гаранции</span>
                  </li>
                </ul>
                <p className="text-muted-foreground">
                  Докато зъболекарят е зает с пациент, много от тези обаждания остават без отговор. <strong>NEO решава този проблем.</strong>
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Стъпка 1: Подготовка на информацията
                </h2>
                <p className="text-muted-foreground">
                  Преди да настроите NEO, уверете се, че уебсайтът ви съдържа актуална информация за:
                </p>
                <div className="bg-card rounded-xl border p-6 my-6">
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Списък на всички услуги с цени
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Работно време (включително почивни дни)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Адрес и указания за намиране
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Марки импланти/материали, които използвате
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Гаранции и условия
                    </li>
                  </ul>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Стъпка 2: Настройка на NEO (5 минути)
                </h2>
                <div className="space-y-4 my-6">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">1</span>
                    <div>
                      <h4 className="font-semibold text-foreground">Регистрация</h4>
                      <p className="text-sm text-muted-foreground">Създайте безплатен акаунт на neo-assistant.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">2</span>
                    <div>
                      <h4 className="font-semibold text-foreground">Въведете URL на сайта</h4>
                      <p className="text-sm text-muted-foreground">NEO автоматично ще извлече цялата информация</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-foreground">Тествайте</h4>
                      <p className="text-sm text-muted-foreground">Задайте въпроси и се уверете, че отговаря правилно</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">4</span>
                    <div>
                      <h4 className="font-semibold text-foreground">Добавете към сайта</h4>
                      <p className="text-sm text-muted-foreground">Копирайте кода и го поставете в уебсайта си</p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Стъпка 3: Персонализация за стоматология
                </h2>
                <p className="text-muted-foreground mb-4">
                  За най-добри резултати, добавете специфични инструкции за NEO:
                </p>
                <div className="bg-card rounded-xl border p-6 my-6 font-mono text-sm">
                  <p className="text-muted-foreground mb-2">// Примерни инструкции:</p>
                  <ul className="text-muted-foreground space-y-2">
                    <li>• При спешни случаи насочвай към телефон за спешности</li>
                    <li>• Винаги споменавай, че използваме немски импланти MIS</li>
                    <li>• При въпрос за цена на избелване, предлагай и преглед</li>
                    <li>• Събирай име и телефон за обратно обаждане</li>
                  </ul>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Примерни въпроси, на които NEO отговаря
                </h2>
                <div className="space-y-4 my-6">
                  <div className="p-4 bg-card rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-2">Пациент:</p>
                    <p className="text-foreground">"Колко струва имплант?"</p>
                    <p className="text-sm text-muted-foreground mt-4 mb-2">NEO:</p>
                    <p className="text-foreground">"Имплантите в нашата клиника са от немската марка MIS с доживотна гаранция. Цената за един имплант е 1200 лева, като в нея е включен и контролен преглед след 6 месеца. Искате ли да ви запиша за безплатна консултация?"</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-2">Пациент:</p>
                    <p className="text-foreground">"Работите ли в събота?"</p>
                    <p className="text-sm text-muted-foreground mt-4 mb-2">NEO:</p>
                    <p className="text-foreground">"Да, работим в събота от 9:00 до 14:00 часа. В неделя сме затворени. Искате ли да ви запиша час за тази събота?"</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Резултати от реални клиники
                </h2>
                <div className="grid md:grid-cols-2 gap-6 my-8">
                  <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20">
                    <p className="text-3xl font-display font-black text-primary mb-2">+45%</p>
                    <p className="text-muted-foreground">Повече записани часове</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20">
                    <p className="text-3xl font-display font-black text-primary mb-2">90%</p>
                    <p className="text-muted-foreground">По-малко пропуснати обаждания</p>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 my-8">
                  <p className="text-foreground font-semibold mb-2">💬 Отзив от клиент:</p>
                  <p className="text-muted-foreground italic">
                    "От когато използваме NEO, броят на новите пациенти се увеличи с 30%. Особено полезен е вечер и в почивни дни, когато много хора търсят зъболекар."
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">— Д-р Иванова, Дентална клиника "Усмивка", София</p>
                </div>

              </div>

              {/* CTA */}
              <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 text-center">
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Готови ли сте да автоматизирате клиниката си?
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

export default DentalClinicAI;
