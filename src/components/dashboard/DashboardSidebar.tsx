import { useState } from 'react';
import {
  Home, Globe, CalendarDays, Mail,
  MessageSquare, Brain, Mic, BarChart3,
  Settings, Crown, User, LogOut, ChevronDown, Palette,
  Sun, Moon, Volume2, Phone, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import NeoLogo from '@/components/ui/NeoLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  { id: 'home', label: 'Начало', icon: Home },
  {
    id: 'setup', label: 'Обучение', icon: Brain, step: '1',
    children: [
      { id: 'setup-training', label: 'Обучение', icon: Globe },
      { id: 'setup-calendar', label: 'Календар', icon: CalendarDays },
      { id: 'setup-email', label: 'Имейл', icon: Mail },
    ],
  },
  {
    id: 'neo', label: 'NEO', icon: Mic, step: '2',
    children: [
      { id: 'neo-behavior', label: 'Поведение', icon: Settings },
      { id: 'neo-voice', label: 'Глас', icon: Volume2 },
      { id: 'neo-test', label: 'Тествай', icon: Mic },
    ],
  },
  {
    id: 'channels', label: 'Канали', icon: Palette, step: '3',
    children: [
      { id: 'channels-widget', label: 'Уиджет', icon: Palette },
      { id: 'channels-phone', label: 'Телефон', icon: Phone },
    ],
  },
  { id: 'conv-diary', label: 'Разговори', icon: MessageSquare },
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
  const [collapsed, setCollapsed] = useState(false);
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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'h-screen sticky top-0 flex flex-col transition-all duration-200 ease-out',
          'bg-[hsl(240_32%_7%)] border-r border-[hsl(0_0%_100%/0.06)]',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {/* Logo + Collapse */}
        <div className={cn('flex items-center pt-5 pb-4', collapsed ? 'justify-center px-2' : 'justify-between px-5')}>
          {!collapsed && <NeoLogo size="sm" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(0_0%_100%/0.4)] hover:text-[hsl(0_0%_100%/0.8)] hover:bg-[hsl(0_0%_100%/0.06)] transition-colors"
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Plan badge */}
        {subscribed && !collapsed && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-primary/8 border border-primary/12">
            <div className="flex items-center gap-2">
              <Crown className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary tracking-wide">{tierName}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV_GROUPS.map((group) => {
            const hasChildren = !!group.children?.length;
            const isOpen = !collapsed && (openGroups[group.id] || isChildActive(group));
            const isActive = activeTab === group.id || isChildActive(group);
            const Icon = group.icon;

            const button = (
              <button
                onClick={() => {
                  if (collapsed && hasChildren) {
                    setCollapsed(false);
                    setOpenGroups(prev => ({ ...prev, [group.id]: true }));
                  } else if (hasChildren) {
                    toggleGroup(group.id);
                  } else {
                    onTabChange(group.id);
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg transition-all duration-150',
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                  !hasChildren && activeTab === group.id
                    ? 'bg-primary/12 text-primary'
                    : isActive && hasChildren
                      ? 'text-[hsl(0_0%_100%/0.92)]'
                      : 'text-[hsl(0_0%_100%/0.45)] hover:text-[hsl(0_0%_100%/0.85)] hover:bg-[hsl(0_0%_100%/0.04)]'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center shrink-0',
                  collapsed ? 'w-9 h-9 rounded-lg' : 'w-7 h-7 rounded-md',
                  isActive ? 'bg-primary/10' : ''
                )}>
                  <Icon className={cn('shrink-0', collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4')} strokeWidth={1.6} />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-[13px] font-medium leading-5">{group.label}</span>
                    {hasChildren && (
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-150 opacity-40', isOpen && 'rotate-180')} />
                    )}
                  </>
                )}
              </button>
            );

            return (
              <div key={group.id}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{group.label}</TooltipContent>
                  </Tooltip>
                ) : button}

                {/* Children */}
                {hasChildren && isOpen && !collapsed && (
                  <div className="ml-5 mt-0.5 space-y-px border-l border-[hsl(0_0%_100%/0.06)] pl-3">
                    {group.children!.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onTabChange(child.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
                          activeTab === child.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-[hsl(0_0%_100%/0.4)] hover:text-[hsl(0_0%_100%/0.8)] hover:bg-[hsl(0_0%_100%/0.04)]'
                        )}
                      >
                        <child.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
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
        <div className={cn('border-t border-[hsl(0_0%_100%/0.06)] py-3', collapsed ? 'px-2' : 'px-3')}>
          {!collapsed && (
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="truncate text-[11px] text-[hsl(0_0%_100%/0.35)] flex-1">{userEmail}</div>
              <button
                onClick={toggleTheme}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[hsl(0_0%_100%/0.35)] hover:text-[hsl(0_0%_100%/0.8)] hover:bg-[hsl(0_0%_100%/0.06)] transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          {collapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[hsl(0_0%_100%/0.35)] hover:text-[hsl(0_0%_100%/0.8)] hover:bg-[hsl(0_0%_100%/0.06)] transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Тема</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onLogout}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[hsl(0_0%_100%/0.35)] hover:text-[hsl(0_0%_100%/0.8)] hover:bg-[hsl(0_0%_100%/0.06)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Изход</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full justify-start gap-2 text-[12px] text-[hsl(0_0%_100%/0.35)] hover:text-[hsl(0_0%_100%/0.8)] hover:bg-[hsl(0_0%_100%/0.06)] h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
              Изход
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default DashboardSidebar;
