import ActivityLog from '@/components/dashboard/ActivityLog';
import PotentialClients from '@/components/dashboard/PotentialClients';
import { MessageSquare, Users } from 'lucide-react';

interface ConversationsPageProps {
  userId: string;
  section?: string;
}

const ConversationsPage = ({ userId, section = 'diary' }: ConversationsPageProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Разговори</h1>

      {section === 'diary' && (
        <div className="space-y-4">
          <ActivityLog userId={userId} />
        </div>
      )}

      {section === 'clients' && (
        <div className="space-y-4">
          <PotentialClients userId={userId} />
        </div>
      )}

      {section !== 'diary' && section !== 'clients' && (
        <div className="rounded-2xl border border-border/10 bg-card/50 p-8 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Нямате още разговори</h3>
          <p className="text-xs text-muted-foreground">Пуснете NEO на сайта си, за да започнете да получавате разговори.</p>
        </div>
      )}
    </div>
  );
};

export default ConversationsPage;
