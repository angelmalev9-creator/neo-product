import {
  Home, Rocket, MessageSquare, Brain, BarChart3,
  Settings, Menu, X, Palette, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import NeoLogo from '@/components/ui/NeoLogo';
import { useTheme } from '@/hooks/useTheme';

interface DashboardMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MOBILE_ITEMS = [
  { id: 'home', label: 'Начало', icon: Home },
  { id: 'setup-website', label: 'Настрой', icon: Rocket },
  { id: 'conv-diary', label: 'Разговори', icon: MessageSquare },
  { id: 'neo-test', label: 'NEO', icon: Brain },
  { id: 'results-stats', label: 'Резултати', icon: BarChart3 },
  { id: 'widget', label: 'Уиджет', icon: Palette },
  { id: 'settings-plan', label: 'Настройки', icon: Settings },
];

const DashboardMobileNav = ({ activeTab, onTabChange }: DashboardMobileNavProps) => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 border-b border-border/10 bg-sidebar/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <NeoLogo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-x-0 top-[53px] bottom-0 z-40 bg-sidebar/98 backdrop-blur-xl border-b border-border/10 p-3 space-y-0.5 overflow-y-auto">
          {MOBILE_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                activeTab === item.id
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
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
