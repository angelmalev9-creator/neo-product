import ConversationStats from '@/components/dashboard/ConversationStats';

interface ResultsPageProps {
  userId: string;
}

const ResultsPage = ({ userId }: ResultsPageProps) => {
  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden overflow-x-hidden">
      <h1 className="text-lg font-bold text-foreground mb-3 shrink-0">Резултати</h1>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        <ConversationStats userId={userId} />
      </div>
    </div>
  );
};

export default ResultsPage;
