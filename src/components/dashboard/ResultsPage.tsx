import ConversationStats from '@/components/dashboard/ConversationStats';
import { BarChart3 } from 'lucide-react';

interface ResultsPageProps {
  userId: string;
}

const ResultsPage = ({ userId }: ResultsPageProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Резултати</h1>
      <ConversationStats userId={userId} />
    </div>
  );
};

export default ResultsPage;
