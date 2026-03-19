import { Bot, ArrowLeft, Calendar, Clock, User, ArrowRight, Stethoscope, Phone, Shield, Heart, CheckCircle, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import heroImage from '@/assets/blog/medical-reception-ai.jpg';

const MedicalReceptionAI = () => {
  return (
    <>
      <Helmet>
        <title>AI Асистент за Медицинска Рецепция: Автоматизация на Записване на Часове | NEO</title>
        <meta name="description" content="Как AI рецепционист помага на медицински клиники да автоматизират записването на пациенти, да намалят чакането и да подобрят обслужването. Практическо ръководство за лекари и клиники." />
        <meta name="keywords" content="AI медицинска рецепция, виртуален асистент клиника, записване на час лекар AI, автоматизация медицинска практика, AI за лекари, гласов асистент здравеопазване, NEO медицина" />
        <meta property="og:title" content="AI Асистент за Медицинска Рецепция: Автоматизация на Записване на Часове" />
        <meta property="og:description" content="Как AI рецепционист помага на медицински клиники да автоматизират записването на пациенти." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="https://neo-assistant.com/blog/medical-reception-ai" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "AI Асистент за Медицинска Рецепция",
            "description": "Как AI рецепционист помага на медицински клиники",
            "author": { "@type": "Organization", "name": "NEO AI" },
            "datePublished": "2025-01-12",
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
              alt="AI виртуален асистент в медицинска клиника - автоматизация на записване на часове" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="max-w-4xl">
              <Badge className="mb-4">Здравеопазване</Badge>
              <h1 className="text-3xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
                AI Асистент за Медицинска Рецепция: Как Клиниките Спестяват 15+ Часа Седмично
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Продуктов екип
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  12 януари 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  8 мин четене
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
                  Всеки ден медицинските сестри и рецепционисти в клиниките прекарват часове в отговаряне на телефони за записване на часове. <strong>AI асистентът за медицинска рецепция</strong> може да автоматизира този процес, освобождавайки персонала за грижа за пациентите.
                </p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 my-8">
                  <div className="flex items-start gap-4">
                    <Stethoscope className="w-8 h-8 text-blue-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Проблемът в здравеопазването</h3>
                      <p className="text-muted-foreground">
                        <strong>73% от пациентите</strong> предпочитат да се запишат за преглед по телефона. Но <strong>38% от обажданията</strong> остават без отговор в натоварени часове. Това означава пропуснати пациенти и загубени приходи.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Какво може AI рецепционистът за клиники?
                </h2>
                
                <div className="space-y-6 my-8">
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Phone className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Записване на часове 24/7</h4>
                      <p className="text-muted-foreground">
                        Пациентите могат да се запишат по всяко време - рано сутрин, късно вечер или в почивни дни. NEO проверява свободните часове и потвърждава записването.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Calendar className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Напомняния за прегледи</h4>
                      <p className="text-muted-foreground">
                        Автоматични обаждания или съобщения ден преди прегледа. Намаляване на неявяванията с до 45%.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Shield className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">GDPR съответствие</h4>
                      <p className="text-muted-foreground">
                        NEO е проектиран с мисъл за защита на личните данни. Всички разговори са криптирани и съхранявани сигурно.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-card rounded-xl border">
                    <Heart className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Емпатична комуникация</h4>
                      <p className="text-muted-foreground">
                        AI асистентът е обучен да комуникира внимателно и професионално, разбирайки, че пациентите често се обаждат в стресови ситуации.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Реални резултати от клиники с AI рецепция
                </h2>

                <div className="grid md:grid-cols-3 gap-6 my-8">
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20 text-center">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">+47%</div>
                    <p className="font-semibold text-foreground">Записани часове</p>
                    <p className="text-sm text-muted-foreground mt-2">Благодарение на 24/7 достъпност</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20 text-center">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">-45%</div>
                    <p className="font-semibold text-foreground">Неявявания</p>
                    <p className="text-sm text-muted-foreground mt-2">С автоматични напомняния</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/20 text-center">
                    <div className="text-4xl font-display font-black text-green-400 mb-2">15ч</div>
                    <p className="font-semibold text-foreground">Спестено време</p>
                    <p className="text-sm text-muted-foreground mt-2">На седмица за персонала</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Примерен разговор с AI рецепционист
                </h2>
                
                <div className="bg-card rounded-xl border p-6 my-8 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-foreground">"Здравейте! Обаждате се на Клиника Здраве. Аз съм NEO, вашият асистент. Как мога да ви помогна днес?"</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-foreground">"Искам да запиша час при д-р Петров."</p>
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
                      <p className="text-foreground">"Разбира се! Д-р Петров има свободни часове утре в 10:00, 14:30 и 16:00. Кой час ви устройва?"</p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Как да внедрите AI рецепция в клиниката си
                </h2>
                
                <div className="space-y-4 my-8">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <p className="text-muted-foreground"><strong>Регистрация</strong> - Създайте акаунт в NEO за 2 минути</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <p className="text-muted-foreground"><strong>Настройка</strong> - Въведете работно време, лекари и услуги</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <p className="text-muted-foreground"><strong>Интеграция</strong> - Свържете с вашия календар (Google, Outlook)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">4</span>
                    </div>
                    <p className="text-muted-foreground"><strong>Активиране</strong> - NEO започва да приема обаждания</p>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mt-12 mb-6">
                  Често задавани въпроси
                </h2>
                
                <div className="space-y-4 my-8">
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">Ще разберат ли пациентите, че говорят с AI?</h4>
                    <p className="text-muted-foreground text-sm">NEO говори естествено на български. Много пациенти не разбират, че комуникират с AI. При желание можете да зададете представяне като "виртуален асистент".</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">Какво става при спешни случаи?</h4>
                    <p className="text-muted-foreground text-sm">NEO е обучен да разпознава спешни ситуации и веднага да пренасочва към дежурен лекар или спешна помощ.</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">Мога ли да персонализирам отговорите?</h4>
                    <p className="text-muted-foreground text-sm">Да, можете да зададете специфични инструкции, работно време, услуги и дори стила на комуникация.</p>
                  </div>
                </div>

              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 text-center">
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Подобрете обслужването в клиниката си
                </h3>
                <p className="text-muted-foreground mb-6">
                  Безплатен тест за 7 дни. Без ангажимент.
                </p>
                <Button size="lg" asChild>
                  <Link to="/#demo">
                    Тествайте NEO безплатно
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

export default MedicalReceptionAI;
