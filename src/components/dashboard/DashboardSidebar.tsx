import { useState } from 'react';
import {
  Home, Globe, CalendarDays, Mail, Database,
  MessageSquare, Brain, Mic, BarChart3,
  Settings, Crown, User, LogOut, ChevronDown, Palette,
  Sun, Moon,
} from 'lucide-react';
import NeoLogo from '@/components/ui/NeoLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userEmail?: string;
  subscribed: boolean;
  tierName: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  step?: string;
  children?: { id: string; label: string; icon: React.ElementType }[];
}

const NAV_GROUPS: NavGroup[] = [
  { id: 'home', label: 'Начало', icon: Home, description: 'Преглед', step: undefined },
  {
    id: 'setup', label: 'Обучение', icon: Brain, description: 'Настройте NEO', step: '1',
    children: [
      { id: 'setup-training', label: 'Обучение', icon: Globe },
      { id: 'setup-calendar', label: 'Календар', icon: CalendarDays },
      { id: 'setup-email', label: 'Имейл', icon: Mail },
    ],
  },
  {
    id: 'neo', label: 'Тест на NEO', icon: Mic, description: 'Чуйте как звучи', step: '2',
    children: [
      { id: 'neo-behavior', label: 'Поведение', icon: Settings },
      { id: 'neo-test', label: 'Тествай на живо', icon: Mic },
    ],
  },
  { id: 'widget', label: 'Уиджет', icon: Palette, description: 'Инсталирайте на сайта', step: '3' },
  { id: 'conv-diary', label: 'Разговори', icon: MessageSquare, description: 'Чат история' },
  { id: 'results-stats', label: 'Статистика', icon: BarChart3, description: 'Резултати' },
  {
    id: 'settings-group', label: 'Акаунт', icon: Settings,
    children: [
      { id: 'settings-plan', label: 'Абонамент', icon: Crown },
      { id: 'settings-profile', label: 'Профил', icon: User },
    ],
  },
];

const DashboardSidebar = ({ activeTab, onTabChange, onLogout, userEmail, subscribed, tierName }: DashboardSidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_GROUPS.forEach((g) => {
      if (g.children?.some((c) => c.id === activeTab)) initial[g.id] = true;
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isChildActive = (group: NavGroup) => group.children?.some((c) => c.id === activeTab);

  return (
    <aside className="w-[240px] h-screen sticky top-0 border-r border-border/10 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-5 pb-4">
        <NeoLogo size="sm" />
      </div>

      {/* Plan badge */}
      {subscribed && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-primary/8 border border-primary/15">
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary">{tierName}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const hasChildren = !!group.children?.length;
          const isOpen = openGroups[group.id] || isChildActive(group);
          const isActive = activeTab === group.id || isChildActive(group);

          return (
            <div key={group.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleGroup(group.id);
                  } else {
                    onTabChange(group.id);
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                  !hasChildren && activeTab === group.id
                    ? 'bg-primary/12 text-primary'
                    : isActive && hasChildren
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {group.step ? (
                  <span className={cn(
                    'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 border',
                    isActive ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-muted/30 border-border/20 text-muted-foreground'
                  )}>
                    {group.step}
                  </span>
                ) : (
                  <group.icon className="w-4 h-4 shrink-0" />
                )}
                <span className="flex-1 text-left">{group.label}</span>
                {group.step && <group.icon className="w-3.5 h-3.5 shrink-0 opacity-50" />}
                {hasChildren && (
                  <ChevronDown className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )} />
                )}
              </button>

              {/* Children */}
              {hasChildren && isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/10 pl-3">
                  {group.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onTabChange(child.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150',
                        activeTab === child.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      )}
                    >
                      <child.icon className="w-3.5 h-3.5 shrink-0" />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-border/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="px-1 truncate text-[11px] text-muted-foreground flex-1">{userEmail}</div>
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            title={theme === 'dark' ? 'Светъл режим' : 'Тъмен режим'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground h-8"
        >
          <LogOut className="w-3.5 h-3.5" />
          Изход
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
