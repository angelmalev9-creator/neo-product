import ActivityLog from '@/components/dashboard/ActivityLog';

interface ConversationsPageProps {
  userId: string;
  section?: string;
}

const ConversationsPage = ({ userId }: ConversationsPageProps) => {
  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden overflow-x-hidden">
      <h1 className="text-lg font-bold text-foreground mb-3 shrink-0">Разговори</h1>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-4 lg:p-5">
        <ActivityLog userId={userId} />
      </div>
    </div>
  );
};

export default ConversationsPage;
