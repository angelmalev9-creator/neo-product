import { Bot, Search, MessageCircle, Settings, Zap, Users, Calendar, Mail, Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HelpCenter = () => {
  const categories = [
    {
      icon: Zap,
      title: 'Първи стъпки',
      description: 'Научете как да започнете с NEO',
      articles: [
        'Как да създам акаунт?',
        'Как да настроя NEO за моя бизнес?',
        'Как да добавя NEO към уебсайта си?',
        'Какви са системните изисквания?'
      ]
    },
    {
      icon: Settings,
      title: 'Конфигурация',
      description: 'Персонализирайте NEO за вашите нужди',
      articles: [
        'Как да променя гласа на NEO?',
        'Как да добавя база знания?',
        'Как да настроя автоматични отговори?',
        'Как да персонализирам изгледа на уиджета?'
      ]
    },
    {
      icon: Users,
      title: 'Интеграции',
      description: 'Свържете NEO с други системи',
      articles: [
        'Интеграция с Google Calendar',
        'Свързване с CRM системи',
        'Имейл интеграции',
        'API достъп и документация'
      ]
    },
    {
      icon: Shield,
      title: 'Сигурност и поверителност',
      description: 'Защита на данните ви',
      articles: [
        'Как NEO защитава данните?',
        'GDPR съответствие',
        'Съхранение на разговори',
        'Политика за поверителност'
      ]
    }
  ];

  const faqs = [
    {
      question: 'Какво е NEO и как работи?',
      answer: 'NEO е AI гласов асистент, който отговаря на обаждания и чат съобщения от клиентите ви 24/7. Той използва изкуствен интелект, за да разбира въпросите и да дава точни отговори базирани на информацията за вашия бизнес.'
    },
    {
      question: 'Колко време отнема настройката?',
      answer: 'Базовата настройка отнема само 5 минути! Просто въведете URL адреса на вашия уебсайт, NEO автоматично ще извлече информацията и ще бъде готов да отговаря на въпроси за вашия бизнес.'
    },
    {
      question: 'На какви езици говори NEO?',
      answer: 'NEO говори перфектен български език без акцент. Също така поддържа английски и други езици за международни клиенти.'
    },
    {
      question: 'Мога ли да интегрирам NEO с моя календар?',
      answer: 'Да! С Business плана можете да свържете NEO с Google Calendar, за да записва автоматично часове и срещи директно в календара ви.'
    },
    {
      question: 'Какво се случва, ако NEO не знае отговора?',
      answer: 'Ако NEO не разполага с информация за даден въпрос, той учтиво ще насочи клиента към директен контакт с вас, вместо да измисля отговори.'
    },
    {
      question: 'Как мога да тествам NEO преди да се абонирам?',
      answer: 'Предлагаме безплатна демонстрация! Просто въведете URL на вашия сайт на началната страница и опитайте NEO веднага.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Към началната страница</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-foreground">NEO Помощен център</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-black text-foreground mb-6">
            Как можем да ви помогнем?
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Намерете отговори на често задавани въпроси и научете как да използвате NEO максимално ефективно.
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Търсене в помощния център..."
              className="pl-12 py-6 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
            Категории
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, i) => (
                      <li key={i} className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" />
                        {article}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
            Често задавани въпроси
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card rounded-lg border px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            Не намерихте отговор?
          </h2>
          <p className="text-muted-foreground mb-6">
            Свържете се с нашия екип за поддръжка и ще ви помогнем.
          </p>
          <Button asChild>
            <a href="mailto:angelmalev9@gmail.com">
              <Mail className="w-4 h-4 mr-2" />
              Пишете ни
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NEO AI. Всички права запазени.</p>
        </div>
      </footer>
    </div>
  );
};

export default HelpCenter;
