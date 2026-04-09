import { Phone, PhoneIncoming, PhoneOff, Clock, CheckCircle2, XCircle, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePhoneNumbers } from '@/hooks/usePhoneNumbers';
import PhoneWizard from './PhoneWizard';

interface PhoneSectionProps {
  userId: string;
  sessionId?: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Днес ${time}`;
  if (isYesterday) return `Вчера ${time}`;
  return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' }) + ` ${time}`;
}

const PhoneSection = ({ userId, sessionId }: PhoneSectionProps) => {
  const {
    activePhone, callLogs, stats, loading,
    releasing, releaseNumber, loadActivePhone,
  } = usePhoneNumbers(userId);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Show wizard if no phone or setup not completed
  const setupCompleted = (activePhone as any)?.setup_completed === true;
  if (!activePhone || !setupCompleted) {
    return (
      <PhoneWizard
        userId={userId}
        sessionId={sessionId}
        activePhone={activePhone ? { id: activePhone.id, phone_number: activePhone.phone_number, setup_completed: (activePhone as any)?.setup_completed } : null}
        onComplete={() => loadActivePhone()}
      />
    );
  }

  // Active phone with stats
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-primary" />
              Телефонна линия
            </CardTitle>
            <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">
              ● Активен
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-2xl font-bold tracking-tight">{activePhone.phone_number}</p>
            <p className="text-sm text-muted-foreground mt-0.5">NEO отговаря автоматично на обаждания</p>
            <p className="text-xs text-muted-foreground mt-1">Месечна цена: ${activePhone.customer_price_monthly}/мес</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: PhoneIncoming, label: 'Входящи', value: stats.totalCalls, color: 'text-blue-500' },
              { icon: Clock, label: 'Ср. продълж.', value: formatDuration(stats.avgDuration), color: 'text-amber-500' },
              { icon: CheckCircle2, label: 'Успешни', value: stats.successCount, color: 'text-emerald-500' },
              { icon: XCircle, label: 'Пропуснати', value: stats.missedCount, color: 'text-red-500' },
              { icon: DollarSign, label: 'Разход', value: `$${stats.totalCost}`, color: 'text-primary' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-muted/30 rounded-xl p-3 text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Call logs */}
          {callLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Последни обаждания</h4>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Номер</TableHead>
                      <TableHead className="text-xs">Кога</TableHead>
                      <TableHead className="text-xs">Продълж.</TableHead>
                      <TableHead className="text-xs">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callLogs.slice(0, 10).map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm font-mono">{log.caller_number || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(log.started_at)}</TableCell>
                        <TableCell className="text-sm">{formatDuration(log.duration_seconds)}</TableCell>
                        <TableCell>
                          {log.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {callLogs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Все още няма обаждания. Споделете номера си с клиенти!</p>
          )}

          {/* Release */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-500 border-red-500/30 hover:bg-red-500/10 w-full sm:w-auto">
                <PhoneOff className="w-4 h-4 mr-1.5" />
                Деактивирай номера
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Деактивиране на номера</AlertDialogTitle>
                <AlertDialogDescription>
                  Сигурни ли сте? Номерът <strong>{activePhone.phone_number}</strong> ще бъде освободен и няма да може да бъде възстановен.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отказ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => releaseNumber(activePhone.id)}
                  disabled={releasing}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {releasing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Деактивирай
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneSection;
