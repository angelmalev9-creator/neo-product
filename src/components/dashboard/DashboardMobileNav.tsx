import { FileText, Settings, Link2, Database, Mic, Palette, BarChart3, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import NeoLogo from '@/components/ui/NeoLogo';

interface DashboardMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Преглед', icon: BarChart3 },
  { id: 'diary', label: 'Дневник', icon: FileText },
  { id: 'settings', label: 'Настройки', icon: Settings },
  { id: 'integrations', label: 'Интеграции', icon: Link2 },
  { id: 'knowledge', label: 'Знания', icon: Database },
  { id: 'test', label: 'Тест', icon: Mic },
  { id: 'widget', label: 'Уиджет', icon: Palette },
];

const DashboardMobileNav = ({ activeTab, onTabChange }: DashboardMobileNavProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <header className="lg:hidden sticky top-0 z-50 border-b border-border/30 bg-sidebar/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <NeoLogo size="sm" />
        <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Dropdown nav */}
      {open && (
        <div className="lg:hidden fixed inset-x-0 top-[53px] z-40 bg-sidebar/98 backdrop-blur-xl border-b border-border/30 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all',
                activeTab === item.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default DashboardMobileNav;
