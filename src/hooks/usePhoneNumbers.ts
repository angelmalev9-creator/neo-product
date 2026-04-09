import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  customerMonthly: number;
  customerMonthlyBGN: number;
}

interface PhoneNumber {
  id: string;
  phone_number: string;
  friendly_name: string | null;
  customer_price_monthly: number;
  status: string;
  created_at: string;
  session_id: string | null;
}

interface CallLog {
  id: string;
  caller_number: string | null;
  direction: string;
  status: string;
  duration_seconds: number;
  customer_cost: number;
  started_at: string;
  ended_at: string | null;
  transcript: string | null;
}

interface CallStats {
  totalCalls: number;
  avgDuration: number;
  successCount: number;
  missedCount: number;
  totalCost: number;
}

export function usePhoneNumbers(userId: string) {
  const { toast } = useToast();
  const [activePhone, setActivePhone] = useState<PhoneNumber | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<CallStats>({ totalCalls: 0, avgDuration: 0, successCount: 0, missedCount: 0, totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [buying, setBuying] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const loadActivePhone = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setActivePhone(data as PhoneNumber | null);
    return data;
  }, [userId]);

  const loadCallLogs = useCallback(async (phoneId: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('call_logs')
      .select('*')
      .eq('phone_number_id', phoneId)
      .gte('started_at', thirtyDaysAgo.toISOString())
      .order('started_at', { ascending: false })
      .limit(50);

    const logs = (data || []) as CallLog[];
    setCallLogs(logs);

    const totalCalls = logs.length;
    const successCount = logs.filter(l => l.status === 'completed').length;
    const missedCount = logs.filter(l => l.status === 'missed' || l.status === 'failed').length;
    const totalDuration = logs.reduce((s, l) => s + (l.duration_seconds || 0), 0);
    const totalCost = logs.reduce((s, l) => s + Number(l.customer_cost || 0), 0);

    setStats({
      totalCalls,
      avgDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      successCount,
      missedCount,
      totalCost: parseFloat(totalCost.toFixed(2)),
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const phone = await loadActivePhone();
      if (phone) await loadCallLogs(phone.id);
      setLoading(false);
    };
    if (userId) init();
  }, [userId, loadActivePhone, loadCallLogs]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel('phone-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs', filter: `user_id=eq.${userId}` }, () => {
        if (activePhone) loadCallLogs(activePhone.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, activePhone, loadCallLogs]);

  const fetchAvailableNumbers = async () => {
    setLoadingNumbers(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-available-numbers');
      if (error) throw error;
      if (data?.error === 'twilio_not_configured') {
        setAvailableNumbers([]);
        toast({ title: 'Телефонната услуга се настройва', description: 'Моля, опитайте по-късно.', variant: 'destructive' });
        return;
      }
      setAvailableNumbers(data?.numbers || []);
      if (!data?.numbers?.length) {
        toast({ title: 'Няма налични номера', description: 'Опитайте отново по-късно.' });
      }
    } catch {
      toast({ title: 'Грешка', description: 'Не успяхме да заредим номерата.', variant: 'destructive' });
    } finally {
      setLoadingNumbers(false);
    }
  };

  const buyNumber = async (phoneNumber: string, sessionId: string) => {
    setBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke('buy-phone-number', {
        body: { phoneNumber, sessionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Номерът е активиран!', description: `${data.phone.phone_number} е готов за обаждания.` });
      await loadActivePhone();
      setAvailableNumbers([]);
      return true;
    } catch (err: any) {
      toast({ title: 'Грешка при активиране', description: err.message || 'Опитайте отново.', variant: 'destructive' });
      return false;
    } finally {
      setBuying(false);
    }
  };

  const releaseNumber = async (phoneNumberId: string) => {
    setReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-phone-number', {
        body: { phoneNumberId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Номерът е деактивиран' });
      setActivePhone(null);
      setCallLogs([]);
      setStats({ totalCalls: 0, avgDuration: 0, successCount: 0, missedCount: 0, totalCost: 0 });
      return true;
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setReleasing(false);
    }
  };

  return {
    activePhone, callLogs, stats, loading,
    availableNumbers, loadingNumbers, buying, releasing,
    fetchAvailableNumbers, buyNumber, releaseNumber, loadActivePhone,
  };
}
