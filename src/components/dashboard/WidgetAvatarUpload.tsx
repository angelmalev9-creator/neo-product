import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import neoLogoImg from '@/assets/neo-logo.png';
import { Button } from '@/components/ui/button';

interface WidgetAvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}

const WidgetAvatarUpload = ({ userId, currentAvatarUrl, onAvatarChange }: WidgetAvatarUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Грешка', description: 'Моля, изберете изображение', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Грешка', description: 'Файлът е твърде голям (макс. 2MB)', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('widget-avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('widget-avatars').getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ logo_url: avatarUrl }).eq('user_id', userId);
      onAvatarChange(avatarUrl);
      toast({ title: 'Готово!', description: 'Профилната снимка е обновена' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Грешка', description: 'Неуспешно качване', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await supabase.from('profiles').update({ logo_url: null }).eq('user_id', userId);
      onAvatarChange(null);
      toast({ title: 'Премахнато' });
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/30 bg-card/50 flex items-center justify-center shrink-0">
        {currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <img src={neoLogoImg} alt="NEO" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-[10px] h-7 gap-1 px-2">
          <Upload className="w-3 h-3" />
          {uploading ? 'Качване...' : 'Аватар'}
        </Button>
        {currentAvatarUrl && (
          <Button variant="ghost" size="sm" onClick={handleRemove} className="text-[10px] h-7 w-7 p-0 text-muted-foreground">
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
};

export default WidgetAvatarUpload;
