import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, CheckCircle, Loader2, Clock, ChevronDown, ChevronLeft, ChevronRight, Trash2, User, Phone, Mail, Plus, ImagePlus, X, Pencil, Eye, EyeOff, Users, Tag, Package } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarSettings {
  id?: string;
  calendar_enabled: boolean;
  booking_type: string;
  auto_book_after_conversation: boolean;
  default_meeting_duration: number;
  booking_buffer_minutes: number;
  working_hours_start: string;
  working_hours_end: string;
  working_days: number[];
  meeting_title_template: string;
  meeting_description_template: string;
  required_booking_fields: string[];
}

interface BookingItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_unit: string;
  capacity: number | null;
  amenities: string[];
  images: string[];
  category: string;
  is_active: boolean;
  sort_order: number;
}

const BOOKING_FIELDS = [
  { value: 'name', label: 'Име' },
  { value: 'email', label: 'Имейл' },
  { value: 'phone', label: 'Телефон' },
  { value: 'service', label: 'Услуга' },
];

const CATEGORIES = [
  { value: 'стая', label: '🛏️ Стая' },
  { value: 'апартамент', label: '🏠 Апартамент' },
  { value: 'услуга', label: '💆 Услуга' },
  { value: 'маса', label: '🍽️ Маса' },
  { value: 'зала', label: '🏢 Зала' },
  { value: 'друго', label: '📦 Друго' },
];

const PRICE_UNITS = [
  { value: 'нощ', label: 'на нощ' },
  { value: 'час', label: 'на час' },
  { value: 'сесия', label: 'на сесия' },
  { value: 'човек', label: 'на човек' },
  { value: 'бр', label: 'на брой' },
];

interface CalendarBooking {
  id: string;
  event_title: string;
  event_start: string;
  event_end: string;
  attendee_email: string | null;
  attendee_name: string | null;
  attendee_phone: string | null;
  status: string;
  created_at: string;
  service: string | null;
}

const WEEKDAYS = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Нд' },
];

const MONTH_NAMES = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
const DAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const BOOKING_COLORS = [
  'from-primary/80 to-primary/40',
  'from-emerald-500/80 to-emerald-500/30',
  'from-violet-500/80 to-violet-500/30',
  'from-amber-500/80 to-amber-500/30',
  'from-cyan-500/80 to-cyan-500/30',
  'from-rose-500/80 to-rose-500/30',
];

const getBookingColor = (index: number) => BOOKING_COLORS[index % BOOKING_COLORS.length];

const CalendarAutomation = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<CalendarSettings>({
    calendar_enabled: false,
    booking_type: 'consultation',
    auto_book_after_conversation: true,
    default_meeting_duration: 30,
    booking_buffer_minutes: 15,
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    meeting_title_template: 'Среща с {{lead_name}} - {{company_name}}',
    meeting_description_template: '',
    required_booking_fields: ['name'],
  });
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Booking items state
  const [catalogItems, setCatalogItems] = useState<BookingItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogDeleting, setCatalogDeleting] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<BookingItem> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    loadBookings();
    loadCatalogItems();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [calendarMonth]);

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel('calendar-bookings-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'calendar_bookings',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          loadBookings();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    const cleanup = setupRealtime();
    return () => { cleanup.then(fn => fn?.()); };
  }, [calendarMonth]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          id: data.id,
          calendar_enabled: data.calendar_enabled || false,
          booking_type: (data as any).booking_type || 'consultation',
          auto_book_after_conversation: data.auto_book_after_conversation ?? true,
          default_meeting_duration: data.default_meeting_duration || 30,
          booking_buffer_minutes: data.booking_buffer_minutes || 15,
          working_hours_start: data.working_hours_start || '09:00',
          working_hours_end: data.working_hours_end || '18:00',
          working_days: data.working_days || [1, 2, 3, 4, 5],
          meeting_title_template: data.meeting_title_template || settings.meeting_title_template,
          meeting_description_template: data.meeting_description_template || '',
          required_booking_fields: (data as any).required_booking_fields || ['name'],
        });
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59);
      const { data } = await supabase
        .from('calendar_bookings')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_start', monthStart.toISOString())
        .lte('event_start', monthEnd.toISOString())
        .neq('status', 'cancelled')
        .order('event_start', { ascending: true });
      setBookings((data || []) as CalendarBooking[]);
    } catch (e) {
      console.error('Error loading bookings:', e);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('calendar_settings').upsert({
        user_id: user.id,
        calendar_enabled: settings.calendar_enabled,
        booking_type: settings.booking_type,
        calendar_connected: true,
        auto_book_after_conversation: settings.auto_book_after_conversation,
        default_meeting_duration: settings.default_meeting_duration,
        booking_buffer_minutes: settings.booking_buffer_minutes,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        working_days: settings.working_days,
        meeting_title_template: settings.meeting_title_template,
        meeting_description_template: settings.meeting_description_template,
        required_booking_fields: settings.required_booking_fields,
      } as any, { onConflict: 'user_id' });
      if (error) throw error;
      toast({ title: 'Настройките са запазени!' });
      setSettingsOpen(false);
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setDeletingId(bookingId);
    try {
      const { error } = await supabase.from('calendar_bookings').delete().eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Записът е изтрит.' });
      loadBookings();
    } catch {
      toast({ title: 'Грешка при изтриване', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // ========== Catalog functions ==========
  const loadCatalogItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('booking_items')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      setCatalogItems((data || []) as BookingItem[]);
    } catch (e) {
      console.error('Error loading catalog:', e);
    } finally {
      setCatalogLoading(false);
    }
  };

  const openNewItem = () => {
    setEditingItem({ name: '', description: '', price: null, price_unit: 'нощ', capacity: null, amenities: [], images: [], category: 'стая', is_active: true, sort_order: catalogItems.length });
    setAmenityInput('');
    setItemDialogOpen(true);
  };

  const openEditItem = (item: BookingItem) => {
    setEditingItem({ ...item });
    setAmenityInput('');
    setItemDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Файлът е твърде голям', description: 'Максимум 5MB.', variant: 'destructive' });
      return;
    }
    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('booking-images').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('booking-images').getPublicUrl(path);
      setEditingItem(prev => ({ ...prev!, images: [...(prev?.images || []), urlData.publicUrl] }));
    } catch {
      toast({ title: 'Грешка при качване', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => setEditingItem(prev => ({ ...prev!, images: (prev?.images || []).filter((_, i) => i !== idx) }));
  const addAmenity = () => { const v = amenityInput.trim(); if (!v) return; setEditingItem(prev => ({ ...prev!, amenities: [...(prev?.amenities || []), v] })); setAmenityInput(''); };
  const removeAmenity = (idx: number) => setEditingItem(prev => ({ ...prev!, amenities: (prev?.amenities || []).filter((_, i) => i !== idx) }));

  const saveCatalogItem = async () => {
    if (!editingItem?.name?.trim()) { toast({ title: 'Моля, въведете име', variant: 'destructive' }); return; }
    setCatalogSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload = {
        user_id: user.id, name: editingItem.name!.trim(), description: editingItem.description || null,
        price: editingItem.price || null, price_unit: editingItem.price_unit || 'нощ',
        capacity: editingItem.capacity || null, amenities: editingItem.amenities || [],
        images: editingItem.images || [], category: editingItem.category || 'стая',
        is_active: editingItem.is_active ?? true, sort_order: editingItem.sort_order ?? 0,
      };
      if (editingItem.id) {
        const { error } = await supabase.from('booking_items').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('booking_items').insert(payload);
        if (error) throw error;
      }
      toast({ title: editingItem.id ? 'Промените са запазени!' : 'Добавено успешно!' });
      setItemDialogOpen(false);
      setEditingItem(null);
      loadCatalogItems();
    } catch {
      toast({ title: 'Грешка при запазване', variant: 'destructive' });
    } finally {
      setCatalogSaving(false);
    }
  };

  const deleteCatalogItem = async (id: string) => {
    setCatalogDeleting(id);
    try {
      await supabase.from('booking_items').delete().eq('id', id);
      toast({ title: 'Елементът е изтрит.' });
      loadCatalogItems();
    } catch {
      toast({ title: 'Грешка при изтриване', variant: 'destructive' });
    } finally {
      setCatalogDeleting(null);
    }
  };

  const toggleItemActive = async (item: BookingItem) => {
    await supabase.from('booking_items').update({ is_active: !item.is_active }).eq('id', item.id);
    loadCatalogItems();
  };

  const toggleWorkingDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort(),
    }));
  };

  const bookingLabel = settings.booking_type === 'reservation' ? 'Резервация' : settings.booking_type === 'meeting' ? 'Среща' : 'Консултация';
  const bookingLabelPlural = settings.booking_type === 'reservation' ? 'Резервации' : settings.booking_type === 'meeting' ? 'Срещи' : 'Консултации';

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const getBookingsForDate = (day: number) => {
    return bookings.filter(b => {
      const d = new Date(b.event_start);
      return d.getDate() === day && d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear();
    });
  };
  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && calendarMonth.getMonth() === now.getMonth() && calendarMonth.getFullYear() === now.getFullYear();
  };
  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && calendarMonth.getMonth() === selectedDate.getMonth() && calendarMonth.getFullYear() === selectedDate.getFullYear();
  };

  const selectedDayBookings = getBookingsForDate(selectedDate.getDate()).filter(() => {
    return selectedDate.getMonth() === calendarMonth.getMonth() && selectedDate.getFullYear() === calendarMonth.getFullYear();
  });

  const upcomingBookings = bookings.filter(b => new Date(b.event_start) >= new Date());

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const daysInMonth = getDaysInMonth(calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarMonth);

  return (
    <div className="space-y-4">
      {/* Unified Settings & Catalog */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border/30 bg-gradient-to-r from-card/60 to-card/30 hover:from-card/80 hover:to-card/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Настройки и каталог</span>
              {catalogItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{catalogItems.length} оферти</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-xl border border-border/30 bg-card/30 overflow-hidden">
            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border/20 bg-transparent h-10">
                <TabsTrigger value="schedule" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Clock className="w-3.5 h-3.5" /> Графици
                </TabsTrigger>
                <TabsTrigger value="catalog" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Package className="w-3.5 h-3.5" /> Каталог
                  {catalogItems.length > 0 && <span className="text-[9px] ml-1 px-1 rounded-full bg-primary/15 text-primary">{catalogItems.length}</span>}
                </TabsTrigger>
              </TabsList>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="p-3 space-y-2.5 mt-0">
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Тип</Label>
                    <Select value={settings.booking_type} onValueChange={(v) => setSettings(prev => ({ ...prev, booking_type: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Консултация</SelectItem>
                        <SelectItem value="reservation">Резервация</SelectItem>
                        <SelectItem value="meeting">Среща</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Продълж. (мин)</Label>
                    <Input type="number" value={settings.default_meeting_duration} onChange={(e) => setSettings(prev => ({ ...prev, default_meeting_duration: parseInt(e.target.value) || 30 }))} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Буфер (мин)</Label>
                    <Input type="number" value={settings.booking_buffer_minutes} onChange={(e) => setSettings(prev => ({ ...prev, booking_buffer_minutes: parseInt(e.target.value) || 15 }))} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Капацитет</Label>
                    <Input type="number" value={settings.default_meeting_duration} disabled className="h-8 text-xs opacity-40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Работно време от</Label>
                    <Input type="time" value={settings.working_hours_start} onChange={(e) => setSettings(prev => ({ ...prev, working_hours_start: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Работно време до</Label>
                    <Input type="time" value={settings.working_hours_end} onChange={(e) => setSettings(prev => ({ ...prev, working_hours_end: e.target.value }))} className="h-8 text-xs" />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Label className="text-[10px] shrink-0">Работни дни</Label>
                  {WEEKDAYS.map(day => (
                    <button key={day.value} onClick={() => toggleWorkingDay(day.value)} className={`px-2 py-1 rounded-md border text-[10px] font-medium transition-colors ${settings.working_days.includes(day.value) ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                      {day.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Label className="text-[10px] shrink-0">Полета</Label>
                  {BOOKING_FIELDS.map(field => (
                    <label key={field.value} className="flex items-center gap-1 cursor-pointer">
                      <Checkbox className="h-3.5 w-3.5" checked={settings.required_booking_fields.includes(field.value)} onCheckedChange={(checked) => { setSettings(prev => ({ ...prev, required_booking_fields: checked ? [...prev.required_booking_fields, field.value] : prev.required_booking_fields.filter(f => f !== field.value) })); }} />
                      <span className="text-[10px] text-foreground">{field.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Автоматично записване</Label>
                  <Switch className="scale-90" checked={settings.auto_book_after_conversation} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_book_after_conversation: checked }))} />
                </div>
                <Button onClick={saveSettings} disabled={saving} size="sm" className="w-full h-8 text-xs">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                  Запази
                </Button>
              </TabsContent>

              {/* Catalog Tab */}
              <TabsContent value="catalog" className="p-4 mt-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-muted-foreground">Добавете стаи, услуги или каквото предлагате — NEO ще ги показва на клиентите</p>
                  <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={openNewItem} className="gap-1.5 shrink-0"><Plus className="w-3.5 h-3.5" /> Добави</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="text-base">{editingItem?.id ? 'Редактиране' : 'Ново предложение за клиентите'}</DialogTitle></DialogHeader>
                      {editingItem && (
                        <div className="space-y-4 mt-2">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Категория</Label>
                              <Select value={editingItem.category || 'стая'} onValueChange={v => setEditingItem(prev => ({ ...prev!, category: v }))}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <Label className="text-xs">Как се казва? *</Label>
                              <Input value={editingItem.name || ''} onChange={e => setEditingItem(prev => ({ ...prev!, name: e.target.value }))} placeholder="напр. Двойна стая Лукс" className="h-9 text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Опишете го с няколко изречения</Label>
                            <Textarea value={editingItem.description || ''} onChange={e => setEditingItem(prev => ({ ...prev!, description: e.target.value }))} placeholder="Просторна стая с изглед към морето, кралско легло и модерна баня..." className="text-sm min-h-[70px] resize-none" />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Цена</Label>
                              <Input type="number" value={editingItem.price ?? ''} onChange={e => setEditingItem(prev => ({ ...prev!, price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="120" className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">За</Label>
                              <Select value={editingItem.price_unit || 'нощ'} onValueChange={v => setEditingItem(prev => ({ ...prev!, price_unit: v }))}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{PRICE_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Капацитет</Label>
                              <Input type="number" value={editingItem.capacity ?? ''} onChange={e => setEditingItem(prev => ({ ...prev!, capacity: e.target.value ? parseInt(e.target.value) : null }))} placeholder="2" className="h-9 text-sm" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Снимки — покажете най-доброто от Вашето предложение</Label>
                            <div className="flex flex-wrap gap-2">
                              {(editingItem.images || []).map((url, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/30 group">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="w-20 h-20 rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                                <span className="text-[9px]">Качи</span>
                              </button>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1"><Tag className="w-3 h-3" /> Удобства и характеристики</Label>
                            <div className="flex gap-2">
                              <Input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())} placeholder="напр. WiFi, Климатик, Паркинг..." className="h-8 text-sm flex-1" />
                              <Button size="sm" variant="outline" onClick={addAmenity} className="h-8 px-3 text-xs">+</Button>
                            </div>
                            {(editingItem.amenities || []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {editingItem.amenities!.map((a, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary border border-primary/20">
                                    {a}<button onClick={() => removeAmenity(idx)} className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <div>
                              <Label className="text-xs font-medium">Видимо за клиенти</Label>
                              <p className="text-[10px] text-muted-foreground">NEO ще предлага само активните елементи</p>
                            </div>
                            <Switch checked={editingItem.is_active ?? true} onCheckedChange={v => setEditingItem(prev => ({ ...prev!, is_active: v }))} />
                          </div>
                          <Button onClick={saveCatalogItem} disabled={catalogSaving} className="w-full">
                            {catalogSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {editingItem.id ? 'Запази промените' : 'Добави към каталога'}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                {catalogLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : catalogItems.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Все още нямате добавени предложения.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">NEO ще ги показва на клиентите със снимки при резервация.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {catalogItems.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.03 }} className="relative flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-card/20 group overflow-hidden">
                          {item.images.length > 0 ? (
                            <img src={item.images[0]} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border/20" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 border border-border/20"><ImagePlus className="w-4 h-4 text-muted-foreground/40" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                              {!item.is_active && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/30">скрито</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-muted-foreground">{CATEGORIES.find(c => c.value === item.category)?.label || item.category}</span>
                              {item.price && <span className="text-[11px] font-medium text-primary">{item.price} лв/{item.price_unit}</span>}
                              {item.capacity && <span className="text-[11px] text-muted-foreground flex items-center gap-0.5"><Users className="w-3 h-3" /> {item.capacity}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleItemActive(item)}>
                              {item.is_active ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" disabled={catalogDeleting === item.id} onClick={() => deleteCatalogItem(item.id)}>
                              {catalogDeleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/60 via-card/30 to-card/10  overflow-hidden">
        <div className="p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-foreground tracking-wide">
              {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/70 py-1.5 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayBookings = getBookingsForDate(day);
              const hasBookings = dayBookings.length > 0;
              const isWorkDay = settings.working_days.includes(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).getDay());
              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day))}
                  className={`h-10 rounded-lg text-xs font-medium relative transition-all ${
                    isSelected(day)
                      ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25'
                      : isToday(day)
                      ? 'bg-gradient-to-br from-accent to-accent/70 text-accent-foreground ring-1 ring-primary/30'
                      : !isWorkDay
                      ? 'text-muted-foreground/40'
                      : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  {day}
                  {hasBookings && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayBookings.slice(0, 3).map((_, idx) => (
                        <span key={idx} className={`w-1 h-1 rounded-full ${
                          isSelected(day) ? 'bg-primary-foreground' : 
                          idx === 0 ? 'bg-primary' : 
                          idx === 1 ? 'bg-emerald-400' : 'bg-violet-400'
                        }`} />
                      ))}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Selected day detail */}
          <div className="mt-4 pt-4 border-t border-border/20">
            <p className="text-xs font-semibold text-foreground mb-2">
              {selectedDate.toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <AnimatePresence mode="wait">
              {selectedDayBookings.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground/50 py-4 text-center"
                >
                  Няма записи за този ден
                </motion.p>
              ) : (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  {selectedDayBookings.map((b, idx) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`relative flex items-start gap-3 p-3 rounded-xl border border-border/20 overflow-hidden group`}
                    >
                      {/* Color accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getBookingColor(idx)}`} />
                      
                      <div className="pl-2 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{b.event_title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(b.event_start).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                            {' – '}
                            {new Date(b.event_end).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                          {b.attendee_name && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="w-3 h-3 text-emerald-400" /> {b.attendee_name}
                            </span>
                          )}
                          {b.attendee_phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 text-violet-400" /> {b.attendee_phone}
                            </span>
                          )}
                          {b.attendee_email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3 text-cyan-400" /> {b.attendee_email}
                            </span>
                          )}
                        </div>
                        {b.service && (
                          <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {b.service}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === b.id}
                        className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteBooking(b.id)}
                      >
                        {deletingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Upcoming bookings list */}
      <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/60 to-card/20  p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Предстоящи {bookingLabelPlural.toLowerCase()}
          <span className="text-xs font-normal text-muted-foreground ml-1">({upcomingBookings.length})</span>
        </h4>
        {upcomingBookings.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-4">Няма предстоящи {bookingLabelPlural.toLowerCase()}</p>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((b, idx) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative flex items-center justify-between p-3 rounded-xl border border-border/20 bg-card/20 group overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getBookingColor(idx)}`} />
                <div className="min-w-0 flex-1 pl-2">
                  <p className="text-sm font-semibold text-foreground truncate">{b.event_title}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {new Date(b.event_start).toLocaleString('bg-BG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {b.attendee_name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-400" /> {b.attendee_name}
                      </span>
                    )}
                    {b.attendee_phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 text-violet-400" /> {b.attendee_phone}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === b.id}
                  className="shrink-0 h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-60 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteBooking(b.id)}
                >
                  {deletingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarAutomation;
