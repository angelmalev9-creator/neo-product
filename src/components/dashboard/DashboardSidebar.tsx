import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Settings, Link2, Database, Mic, Palette, Crown,
  LogOut, CreditCard, BarChart3,
} from 'lucide-react';
import NeoLogo from '@/components/ui/NeoLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userEmail?: string;
  subscribed: boolean;
  tierName: string;
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

const DashboardSidebar = ({ activeTab, onTabChange, onLogout, userEmail, subscribed, tierName }: DashboardSidebarProps) => {
  return (
    <aside className="w-[220px] min-h-screen border-r border-border/30 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border/20">
        <NeoLogo size="sm" />
      </div>

      {/* Plan badge */}
      {subscribed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{tierName}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 mt-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
              activeTab === item.id
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border/20 space-y-2">
        <div className="px-2 truncate text-[10px] text-muted-foreground">{userEmail}</div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="w-3.5 h-3.5" />
          Изход
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
