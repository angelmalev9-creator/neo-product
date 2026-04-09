import React, { useState } from 'react';
import { X, Send, User, Mail, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadData) => Promise<void>;
  companyName: string;
  services?: string[];
}

export interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  service: string;
}

const DEFAULT_SERVICES = [
  'Консултация',
  'Информация за услуги',
  'Оферта/Цена',
  'Записване за час',
  'Друго',
];

const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  companyName,
  services = DEFAULT_SERVICES,
}) => {
  const [formData, setFormData] = useState<LeadData>({
    firstName: '',
    lastName: '',
    email: '',
    service: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LeadData, string>> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Въведете име';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Въведете фамилия';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Въведете имейл';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Невалиден имейл';
    }
    if (!formData.service) {
      newErrors.service = 'Изберете услуга';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ firstName: '', lastName: '', email: '', service: '' });
      onClose();
    } catch (error) {
      console.error('Lead submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 "
        onClick={onClose}
      />
      
      {/* Modal - compact version */}
      <div className="relative w-full max-w-[280px] max-h-[calc(100%-16px)] bg-card/95  border border-border/30 rounded-xl shadow-2xl overflow-hidden animate-scale-in flex flex-col">
        {/* Header */}
        <div className="relative p-3 border-b border-border/20 bg-gradient-to-r from-primary/10 to-transparent shrink-0">
          <button
            onClick={onClose}
            className="absolute right-2 top-2 p-1 rounded-full hover:bg-background/50 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          
          <h2 className="text-sm font-bold text-foreground pr-6">
            Свържете се с нас
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {companyName} ще се свърже с вас
          </p>
        </div>

        {/* Form - scrollable */}
        <form onSubmit={handleSubmit} className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {/* First Name */}
          <div className="space-y-1">
            <Label htmlFor="firstName" className="text-[10px] font-medium flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-primary" />
              Име
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Иван"
              className={`h-8 text-xs bg-background/50 ${errors.firstName ? 'border-destructive' : ''}`}
            />
            {errors.firstName && (
              <p className="text-[10px] text-destructive">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <Label htmlFor="lastName" className="text-[10px] font-medium flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-primary" />
              Фамилия
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Петров"
              className={`h-8 text-xs bg-background/50 ${errors.lastName ? 'border-destructive' : ''}`}
            />
            {errors.lastName && (
              <p className="text-[10px] text-destructive">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[10px] font-medium flex items-center gap-1">
              <Mail className="w-2.5 h-2.5 text-primary" />
              Имейл
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="ivan@example.com"
              className={`h-8 text-xs bg-background/50 ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-[10px] text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Service */}
          <div className="space-y-1">
            <Label htmlFor="service" className="text-[10px] font-medium flex items-center gap-1">
              <Briefcase className="w-2.5 h-2.5 text-primary" />
              Интересувам се от
            </Label>
            <Select
              value={formData.service}
              onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
            >
              <SelectTrigger 
                className={`h-8 text-xs bg-background/50 ${errors.service ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder="Изберете услуга" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service} className="text-xs">
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service && (
              <p className="text-[10px] text-destructive">{errors.service}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 gap-1.5 bg-primary hover:bg-primary/90 text-xs mt-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Изпращане...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Изпрати
              </>
            )}
          </Button>

          <p className="text-[9px] text-center text-muted-foreground">
            Данните ви са защитени
          </p>
        </form>
      </div>
    </div>
  );
};

export default LeadCaptureModal;
