import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, ImagePlus, X, GripVertical, Pencil, Eye, EyeOff, Users, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const EMPTY_ITEM: Omit<BookingItem, 'id'> = {
  name: '',
  description: '',
  price: null,
  price_unit: 'нощ',
  capacity: null,
  amenities: [],
  images: [],
  category: 'стая',
  is_active: true,
  sort_order: 0,
};

const BookingItemsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<BookingItem> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('booking_items')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      setItems((data || []) as BookingItem[]);
    } catch (e) {
      console.error('Error loading items:', e);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingItem({ ...EMPTY_ITEM, sort_order: items.length });
    setAmenityInput('');
    setDialogOpen(true);
  };

  const openEdit = (item: BookingItem) => {
    setEditingItem({ ...item });
    setAmenityInput('');
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Файлът е твърде голям', description: 'Максимум 5MB на снимка.', variant: 'destructive' });
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
      setEditingItem(prev => ({
        ...prev!,
        images: [...(prev?.images || []), urlData.publicUrl],
      }));
    } catch (err) {
      console.error(err);
      toast({ title: 'Грешка при качване', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setEditingItem(prev => ({
      ...prev!,
      images: (prev?.images || []).filter((_, i) => i !== idx),
    }));
  };

  const addAmenity = () => {
    const val = amenityInput.trim();
    if (!val || !editingItem) return;
    setEditingItem(prev => ({
      ...prev!,
      amenities: [...(prev?.amenities || []), val],
    }));
    setAmenityInput('');
  };

  const removeAmenity = (idx: number) => {
    setEditingItem(prev => ({
      ...prev!,
      amenities: (prev?.amenities || []).filter((_, i) => i !== idx),
    }));
  };

  const saveItem = async () => {
    if (!editingItem?.name?.trim()) {
      toast({ title: 'Моля, въведете име', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        name: editingItem.name!.trim(),
        description: editingItem.description || null,
        price: editingItem.price || null,
        price_unit: editingItem.price_unit || 'нощ',
        capacity: editingItem.capacity || null,
        amenities: editingItem.amenities || [],
        images: editingItem.images || [],
        category: editingItem.category || 'стая',
        is_active: editingItem.is_active ?? true,
        sort_order: editingItem.sort_order ?? 0,
      };

      if (editingItem.id) {
        const { error } = await supabase.from('booking_items').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('booking_items').insert(payload);
        if (error) throw error;
      }

      toast({ title: editingItem.id ? 'Промените са запазени!' : 'Добавено успешно!' });
      setDialogOpen(false);
      setEditingItem(null);
      loadItems();
    } catch (err) {
      console.error(err);
      toast({ title: 'Грешка при запазване', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('booking_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Елементът е изтрит.' });
      loadItems();
    } catch {
      toast({ title: 'Грешка при изтриване', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (item: BookingItem) => {
    try {
      await supabase.from('booking_items').update({ is_active: !item.is_active }).eq('id', item.id);
      loadItems();
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/60 to-card/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            Какво предлагате на клиентите?
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Добавете стаи, услуги или каквото предлагате — NEO ще ги показва с визия при резервация
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Добави
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">
                {editingItem?.id ? 'Редактиране' : 'Ново предложение за клиентите'}
              </DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4 mt-2">
                {/* Category & Name */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Категория</Label>
                    <Select value={editingItem.category || 'стая'} onValueChange={v => setEditingItem(prev => ({ ...prev!, category: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Как се казва? *</Label>
                    <Input
                      value={editingItem.name || ''}
                      onChange={e => setEditingItem(prev => ({ ...prev!, name: e.target.value }))}
                      placeholder="напр. Двойна стая Лукс"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Опишете го с няколко изречения</Label>
                  <Textarea
                    value={editingItem.description || ''}
                    onChange={e => setEditingItem(prev => ({ ...prev!, description: e.target.value }))}
                    placeholder="Просторна стая с изглед към морето, кралско легло и модерна баня..."
                    className="text-sm min-h-[70px] resize-none"
                  />
                </div>

                {/* Price & Capacity */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Цена</Label>
                    <Input
                      type="number"
                      value={editingItem.price ?? ''}
                      onChange={e => setEditingItem(prev => ({ ...prev!, price: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="120"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">За</Label>
                    <Select value={editingItem.price_unit || 'нощ'} onValueChange={v => setEditingItem(prev => ({ ...prev!, price_unit: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRICE_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Капацитет</Label>
                    <Input
                      type="number"
                      value={editingItem.capacity ?? ''}
                      onChange={e => setEditingItem(prev => ({ ...prev!, capacity: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="2"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <Label className="text-xs">Снимки — покажете най-доброто от Вашето предложение</Label>
                  <div className="flex flex-wrap gap-2">
                    {(editingItem.images || []).map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/30 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      <span className="text-[9px]">Качи</span>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1"><Tag className="w-3 h-3" /> Удобства и характеристики</Label>
                  <div className="flex gap-2">
                    <Input
                      value={amenityInput}
                      onChange={e => setAmenityInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                      placeholder="напр. WiFi, Климатик, Паркинг..."
                      className="h-8 text-sm flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={addAmenity} className="h-8 px-3 text-xs">+</Button>
                  </div>
                  {(editingItem.amenities || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {editingItem.amenities!.map((a, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary border border-primary/20">
                          {a}
                          <button onClick={() => removeAmenity(idx)} className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label className="text-xs font-medium">Видимо за клиенти</Label>
                    <p className="text-[10px] text-muted-foreground">NEO ще предлага само активните елементи</p>
                  </div>
                  <Switch checked={editingItem.is_active ?? true} onCheckedChange={v => setEditingItem(prev => ({ ...prev!, is_active: v }))} />
                </div>

                <Button onClick={saveItem} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingItem.id ? 'Запази промените' : 'Добави към каталога'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Все още нямате добавени предложения.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Добавете стаите или услугите, които предлагате — NEO ще ги показва на клиентите със снимки при резервация.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.03 }}
                className="relative flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-card/20 group overflow-hidden"
              >
                {/* Thumbnail */}
                {item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border/20" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 border border-border/20">
                    <ImagePlus className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    {!item.is_active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/30">скрито</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">
                      {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                    </span>
                    {item.price && (
                      <span className="text-[11px] font-medium text-primary">{item.price} лв/{item.price_unit}</span>
                    )}
                    {item.capacity && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <Users className="w-3 h-3" /> {item.capacity}
                      </span>
                    )}
                    {item.images.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">{item.images.length} снимки</span>
                    )}
                  </div>
                  {item.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary/70">{a}</span>
                      ))}
                      {item.amenities.length > 4 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">+{item.amenities.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(item)}>
                    {item.is_active ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive/60 hover:text-destructive"
                    disabled={deleting === item.id}
                    onClick={() => deleteItem(item.id)}
                  >
                    {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default BookingItemsManager;
