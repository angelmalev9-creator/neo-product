import ActivityLog from '@/components/dashboard/ActivityLog';
import { motion } from 'framer-motion';

interface ConversationsPageProps {
  userId: string;
  section?: string;
}

const ConversationsPage = ({ userId }: ConversationsPageProps) => {
  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden overflow-x-hidden">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-lg font-bold text-foreground mb-3 shrink-0"
      >
        Разговори
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-2xl border border-border/10 bg-card/60 p-4 lg:p-5"
      >
        <ActivityLog userId={userId} />
      </motion.div>
    </div>
  );
};

export default ConversationsPage;
