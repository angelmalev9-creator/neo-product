import ActivityLog from '@/components/dashboard/ActivityLog';

interface ConversationsPageProps {
  userId: string;
  section?: string;
}

const ConversationsPage = ({ userId }: ConversationsPageProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Разговори</h1>
      <ActivityLog userId={userId} />
    </div>
  );
};

export default ConversationsPage;
