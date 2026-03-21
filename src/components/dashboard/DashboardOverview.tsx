import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Crown, AlertCircle, Clock, CreditCard, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardOverviewProps {
  subscribed: boolean;
  tierName: string;
  subscriptionEnd: string | null;
  usedMinutes: number;
  planLimit: number;
  onManageSubscription: () => void;
  portalLoading: boolean;
  onTabChange: (tab: string) => void;
}

const DashboardOverview = ({
  subscribed, tierName, subscriptionEnd, usedMinutes, planLimit,
  onManageSubscription, portalLoading, onTabChange,
}: DashboardOverviewProps) => {
  const navigate = useNavigate();
  const usagePercent = planLimit > 0 ? (usedMinutes / planLimit) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Табло за управление</h1>
        {subscribed && (
          <Button variant="outline" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-xs gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            {portalLoading ? '...' : 'Абонамент'}
          </Button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Plan card */}
        <div className="rounded-xl border border-border/30 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            {subscribed ? <Crown className="w-4 h-4 text-primary" /> : <AlertCircle className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">План</span>
          </div>
          <p className="text-sm font-bold text-foreground">{subscribed ? tierName : 'Няма план'}</p>
          {subscribed && subscriptionEnd && (
            <p className="text-[10px] text-muted-foreground mt-1">
              до {new Date(subscriptionEnd).toLocaleDateString('bg-BG')}
            </p>
          )}
        </div>

        {/* Usage card */}
        <div className="rounded-xl border border-border/30 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-neo-blue" />
            <span className="text-xs text-muted-foreground">Минути</span>
          </div>
          <p className="text-sm font-bold text-foreground">{usedMinutes.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ {planLimit}</span></p>
          <Progress value={Math.min(usagePercent, 100)} className="h-1.5 mt-2" />
        </div>

        {/* Quick action */}
        <div className="rounded-xl border border-border/30 bg-card/50 p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-neo-success" />
            <span className="text-xs text-muted-foreground">Бърз достъп</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1" onClick={() => onTabChange('test')}>Тест</Button>
            <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1" onClick={() => onTabChange('widget')}>Уиджет</Button>
          </div>
        </div>
      </div>

      {!subscribed && (
        <div className="text-center py-12 rounded-xl border border-border/20 bg-card/30">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">Активирайте NEO</h3>
          <p className="text-xs text-muted-foreground mb-4">Изберете план за достъп до всички функции.</p>
          <Button onClick={() => navigate('/#pricing')} size="sm">Разгледайте плановете</Button>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
