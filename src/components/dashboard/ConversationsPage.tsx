import { useState, useEffect } from 'react';
import ActivityLog from '@/components/dashboard/ActivityLog';
import ConversationStats from '@/components/dashboard/ConversationStats';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MessageSquare, BarChart3 } from 'lucide-react';

interface ConversationsPageProps {
  userId: string;
  section?: string;
}

const TABS = [
  { id: 'log', label: 'Разговори', icon: MessageSquare },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
];

const ConversationsPage = ({ userId, section }: ConversationsPageProps) => {
  const [tab, setTab] = useState<'log' | 'stats'>(
    section === 'stats' ? 'stats' : 'log'
  );

  // 👉 sync ако section се смени отвън (много важно)
  useEffect(() => {
    if (section === 'stats') setTab('stats');
    else setTab('log');
  }, [section]);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden">

      {/* TABS */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1 mb-4 shrink-0 border-b border-[hsl(0_0%_100%/0.06)] pb-3"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'log' | 'stats')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150',
              tab === t.id
                ? 'bg-primary/12 text-primary'
                : 'text-[hsl(0_0%_100%/0.4)] hover:text-[hsl(0_0%_100%/0.8)] hover:bg-[hsl(0_0%_100%/0.04)]'
            )}
          >
            <t.icon className="w-3.5 h-3.5" strokeWidth={1.6} />
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* CONTENT */}
      <motion.div
        key={`${tab}-${userId}`} // 👉 force re-render при смяна
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain rounded-2xl border border-border/10 bg-card/60 p-4 lg:p-5"
      >
        {tab === 'log' ? (
          <ActivityLog
            key={`log-${userId}`} // 👉 force fresh fetch
            userId={userId}
          />
        ) : (
          <ConversationStats userId={userId} />
        )}
      </motion.div>

    </div>
  );
};

export default ConversationsPage;