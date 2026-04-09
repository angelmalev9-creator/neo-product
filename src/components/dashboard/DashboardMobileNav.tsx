import {
  Home, Brain, MessageSquare, Mic, BarChart3,
  Settings, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NeoLogo from '@/components/ui/NeoLogo';
import { useTheme } from '@/hooks/useTheme';

interface DashboardMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BOTTOM_TABS = [
  { id: 'home', label: 'Начало', icon: Home },
  { id: 'setup-training', label: 'Обучение', icon: Brain },
  { id: 'conv-diary', label: 'Разговори', icon: MessageSquare },
  { id: 'neo-test', label: 'Тест', icon: Mic },
  { id: 'results-stats', label: 'Данни', icon: BarChart3 },
  { id: 'settings-plan', label: 'Акаунт', icon: Settings },
];

const isTabActive = (activeTab: string, tabId: string) => {
  if (tabId === 'home') return activeTab === 'home';
  if (tabId === 'setup-training') return activeTab.startsWith('setup');
  if (tabId === 'conv-diary') return activeTab.startsWith('conv');
  if (tabId === 'neo-test') return activeTab.startsWith('neo');
  if (tabId === 'results-stats') return activeTab.startsWith('results');
  if (tabId === 'settings-plan') return activeTab.startsWith('settings') || activeTab === 'widget';
  return false;
};

const DashboardMobileNav = ({ activeTab, onTabChange }: DashboardMobileNavProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header
        className="lg:hidden sticky top-0 z-50 border-b border-border/10 bg-sidebar/95 backdrop-blur-xl px-5 py-3 flex items-center justify-between"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <NeoLogo size="sm" />
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>
      </header>

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-border/10"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {BOTTOM_TABS.map((tab) => {
            const active = isTabActive(activeTab, tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all min-w-0 flex-1',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                  active && 'bg-primary/15 scale-110'
                )}>
                  <tab.icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span className={cn(
                  'text-[11px] leading-tight truncate max-w-full',
                  active ? 'font-semibold' : 'font-medium'
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default DashboardMobileNav;
