import { useState } from 'react';
import { Phone, PhoneIncoming, PhoneOff, Clock, CheckCircle2, XCircle, DollarSign, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePhoneNumbers } from '@/hooks/usePhoneNumbers';

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
    availableNumbers, loadingNumbers, buying, releasing,
    fetchAvailableNumbers, buyNumber, releaseNumber,
  } = usePhoneNumbers(userId);

  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [showNumbers, setShowNumbers] = useState(false);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // State 2: Active phone number
  if (activePhone) {
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
  }

  // State 1: No active phone — show setup
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {!showNumbers ? (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Phone className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Свържете NEO с телефонна линия</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Когато клиентите Ви се обадят, NEO ще отговаря автоматично — 24/7, на български, с познанията за Вашия бизнес.
              </p>
            </div>
            <Button
              onClick={() => { setShowNumbers(true); fetchAvailableNumbers(); }}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Разгледай налични номера
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Изберете телефонен номер</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingNumbers ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : availableNumbers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Няма налични номера в момента.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={fetchAvailableNumbers}>
                  Опитай отново
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {availableNumbers.map(n => (
                    <button
                      key={n.phoneNumber}
                      onClick={() => setSelectedNumber(n.phoneNumber)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        selectedNumber === n.phoneNumber
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted/20'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-mono font-semibold text-sm">{n.phoneNumber}</p>
                        <p className="text-xs text-muted-foreground">{n.locality || n.region || 'България'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${n.customerMonthly}/мес</p>
                        <p className="text-[11px] text-muted-foreground">~{n.customerMonthlyBGN} лв</p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Цена за минута разговор: ~$0.02/мин (~0.04 лв)
                </p>

                <Button
                  onClick={() => {
                    if (selectedNumber && sessionId) buyNumber(selectedNumber, sessionId);
                  }}
                  disabled={!selectedNumber || buying || !sessionId}
                  className="w-full gap-2"
                >
                  {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {buying ? 'Активираме номера Ви...' : 'Активирай избрания номер'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Номерът ще бъде активен веднага. NEO ще отговаря с гласа и знанията, които вече сте конфигурирали.
                </p>

                <Button variant="ghost" size="sm" onClick={() => { setShowNumbers(false); setAvailableNumbers([]); setSelectedNumber(null); }}>
                  ← Назад
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhoneSection;
