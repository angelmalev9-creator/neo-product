import { Bot, ArrowLeft, Calendar, Clock, User, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import voiceEvolutionImg from '@/assets/blog/voice-assistant-evolution.jpg';
import smallBusinessImg from '@/assets/blog/small-business-sales.jpg';
import dentalClinicImg from '@/assets/blog/dental-clinic-ai.jpg';
import missedCallsImg from '@/assets/blog/missed-calls.jpg';
import aiReceptionImg from '@/assets/blog/ai-reception-future.jpg';
import medicalReceptionImg from '@/assets/blog/medical-reception-ai.jpg';
import autoServiceImg from '@/assets/blog/auto-service-reception.jpg';
import beautySalonImg from '@/assets/blog/beauty-salon-reception.jpg';

const Blog = () => {
  const featuredPost = {
    title: 'AI Рецепция 2026: Как Виртуалните Асистенти Трансформират Бизнеса',
    excerpt: 'Бъдещето на бизнес комуникацията е тук. Разберете как AI рецепционистите като NEO революционизират клиентското обслужване и защо 2026 ще бъде годината на масовото им внедряване.',
    author: 'NEO Team',
    date: '15 януари 2025',
    readTime: '10 мин',
    category: 'AI Технологии',
    image: aiReceptionImg,
    link: '/blog/ai-reception-future'
  };

  const posts = [
    {
      title: 'Еволюцията на гласовите асистенти: Как NEO революционизира бизнес комуникацията',
      excerpt: 'От прости IVR системи до интелигентни AI асистенти - разгледайте как гласовите технологии променят начина, по който бизнесът обслужва клиентите си.',
      author: 'NEO Team',
      date: '10 януари 2025',
      readTime: '8 мин',
      category: 'AI Технологии',
      tags: ['NEO', 'Гласови асистенти', 'AI'],
      image: voiceEvolutionImg,
      link: '/blog/voice-assistant-evolution'
    },
    {
      title: '5 начина, по които NEO увеличава продажбите на малкия бизнес през 2025',
      excerpt: 'Научете как AI гласовият асистент NEO помага на малките предприятия да не пропускат обаждания и да конвертират повече потенциални клиенти.',
      author: 'Маркетинг екип',
      date: '8 януари 2025',
      readTime: '5 мин',
      category: 'Бизнес растеж',
      tags: ['NEO', 'Продажби', 'AI'],
      image: smallBusinessImg,
      link: '/blog/small-business-sales'
    },
    {
      title: 'Защо 67% от обажданията остават без отговор и как NEO решава този проблем',
      excerpt: 'Статистиките са шокиращи - повечето бизнеси губят клиенти заради пропуснати обаждания. Вижте как NEO гарантира 24/7 достъпност.',
      author: 'NEO Team',
      date: '5 януари 2025',
      readTime: '6 мин',
      category: 'Индустриален анализ',
      tags: ['NEO', 'Статистики', 'Клиентско обслужване'],
      image: missedCallsImg,
      link: '/blog/missed-calls'
    },
    {
      title: 'Гласов AI асистент за стоматологични клиники: Ръководство 2025',
      excerpt: 'Пълно ръководство за внедряване на NEO в зъболекарска практика - от настройка до запазване на часове автоматично.',
      author: 'Продуктов екип',
      date: '3 януари 2025',
      readTime: '10 мин',
      category: 'Ръководства',
      tags: ['NEO', 'Здравеопазване', 'Автоматизация'],
      image: dentalClinicImg,
      link: '/blog/dental-clinic-ai'
    },
    {
      title: 'AI Асистент за Медицинска Рецепция: Спестете 15+ Часа Седмично',
      excerpt: 'Как AI рецепционист помага на медицински клиники да автоматизират записването на пациенти и да подобрят обслужването.',
      author: 'Продуктов екип',
      date: '12 януари 2025',
      readTime: '8 мин',
      category: 'Здравеопазване',
      tags: ['AI медицина', 'Записване час', 'Клиника'],
      image: medicalReceptionImg,
      link: '/blog/medical-reception-ai'
    },
    {
      title: 'AI Рецепция за Автосервиз: Не Губете Клиенти Докато Ремонтирате',
      excerpt: 'Как AI асистентът помага на автосервизи да записват клиенти 24/7 и да увеличат приходите с до 84x ROI.',
      author: 'NEO Team',
      date: '11 януари 2025',
      readTime: '7 мин',
      category: 'Автомобилни услуги',
      tags: ['Автосервиз', 'AI рецепция', 'Записване'],
      image: autoServiceImg,
      link: '/blog/auto-service-reception'
    },
    {
      title: 'AI Рецепция за Салон за Красота: Записвайте Клиенти Автоматично',
      excerpt: 'Как AI асистентът помага на салони за красота да записват клиенти дори по време на процедури.',
      author: 'NEO Team',
      date: '9 януари 2025',
      readTime: '6 мин',
      category: 'Красота и СПА',
      tags: ['Салон', 'AI рецепция', 'Резервации'],
      image: beautySalonImg,
      link: '/blog/beauty-salon-reception'
    }
  ];

  const categories = ['Всички', 'AI Технологии', 'Бизнес растеж', 'Ръководства', 'Тенденции', 'Финанси'];

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
              <span className="font-display font-bold text-foreground">NEO Блог</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-black text-foreground mb-6">
            NEO Блог
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Статии, ръководства и новини за AI гласови асистенти и бизнес автоматизация
          </p>
          
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat, i) => (
              <Button key={i} variant={i === 0 ? 'default' : 'outline'} size="sm">
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-video md:aspect-auto bg-cover bg-center" style={{ backgroundImage: `url(${featuredPost.image})` }} />
              <div className="p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-4">{featuredPost.category}</Badge>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {featuredPost.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <Link to={featuredPost.link}>
                  <Button className="w-fit">
                    Прочетете повече
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8">
            Последни статии
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.filter(p => p.link).map((post, index) => (
              <Link key={index} to={post.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
                  {post.image && (
                    <div className="aspect-video bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${post.image})` }} />
                  )}
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {post.excerpt}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/blog">
                Зареди още статии
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            Получавайте новини за NEO
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Абонирайте се за нашия бюлетин и научавайте първи за нови функции и съвети.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Вашият имейл"
              className="flex-1 px-4 py-2 rounded-lg border bg-background"
            />
            <Button>Абонирай се</Button>
          </div>
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

export default Blog;
