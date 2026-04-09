import {
  Home, Brain, MessageSquare, Mic,
  Settings, Sun, Moon, Phone,
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
  { id: 'neo-test', label: 'NEO', icon: Mic },
  { id: 'channels-widget', label: 'Канали', icon: Phone },
  { id: 'conv-diary', label: 'Чат', icon: MessageSquare },
  { id: 'settings-plan', label: 'Акаунт', icon: Settings },
];

const isTabActive = (activeTab: string, tabId: string) => {
  if (tabId === 'home') return activeTab === 'home';
  if (tabId === 'setup-training') return activeTab.startsWith('setup');
  if (tabId === 'conv-diary') return activeTab.startsWith('conv');
  if (tabId === 'neo-test') return activeTab.startsWith('neo');
  if (tabId === 'channels-widget') return activeTab.startsWith('channels');
  if (tabId === 'settings-plan') return activeTab.startsWith('settings');
  return false;
};

const DashboardMobileNav = ({ activeTab, onTabChange }: DashboardMobileNavProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Top header */}
      <header
        className="lg:hidden sticky top-0 z-50 border-b border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_32%_7%/0.97)] px-4 py-2.5 flex items-center justify-between"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <NeoLogo size="sm" />
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(0_0%_100%/0.4)] hover:text-[hsl(0_0%_100%/0.8)] transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[hsl(240_32%_7%/0.98)] border-t border-[hsl(0_0%_100%/0.06)]"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around px-1 pt-1.5 pb-0.5">
          {BOTTOM_TABS.map((tab) => {
            const active = isTabActive(activeTab, tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-0 flex-1',
                  active ? 'text-primary' : 'text-[hsl(0_0%_100%/0.35)]'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  active && 'bg-primary/12'
                )}>
                  <tab.icon className={cn('w-[18px] h-[18px]', active && 'scale-105')} strokeWidth={active ? 2 : 1.6} />
                </div>
                <span className={cn(
                  'text-[9px] leading-tight truncate max-w-full',
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
