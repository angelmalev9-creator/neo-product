import { useState } from 'react';
import WidgetPage from '@/components/dashboard/WidgetPage';
import PhoneSection from '@/components/dashboard/PhoneSection';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Palette, Phone } from 'lucide-react';

interface ChannelsPageProps {
  userId: string;
  companyName: string;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  sessionId?: string;
  section?: string;
}

const TABS = [
  { id: 'widget', label: 'Уиджет', icon: Palette },
  { id: 'phone', label: 'Телефон', icon: Phone },
];

const ChannelsPage = ({ userId, companyName, logoUrl, setLogoUrl, sessionId, section }: ChannelsPageProps) => {
  const [tab, setTab] = useState(section === 'phone' ? 'phone' : 'widget');

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1 mb-4 shrink-0 border-b border-[hsl(0_0%_100%/0.06)] pb-3"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
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

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        {tab === 'widget'
          ? <WidgetPage userId={userId} companyName={companyName} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
          : <PhoneSection userId={userId} sessionId={sessionId} />
        }
      </motion.div>
    </div>
  );
};

export default ChannelsPage;
