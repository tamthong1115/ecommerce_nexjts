'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { 
  EmailSettingsPublicDTO, 
  UpdateEmailSettingsDTO 
} from '../../server/system-settings.dto';
import { updateEmailSettingsAction } from '../../server/controller/system-settings.action';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';

type Props = {
  initialData: EmailSettingsPublicDTO;
};

export default function EmailSettingsForm({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<UpdateEmailSettingsDTO>({
    provider: initialData.provider,
    from: initialData.from || '',
    smtp: {
      host: initialData.smtp?.host || '',
      port: initialData.smtp?.port || 587,
      user: initialData.smtp?.user || '',
      pass: '', 
    },
    resend: {
      apiKey: '', 
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      // Clean up empty secrets so we don't overwrite with empty strings
      const payload = { ...formData };
        if (payload.provider !== 'smtp') {
        payload.smtp = undefined;
      } else if (!payload.smtp?.pass) {
        delete payload.smtp?.pass;
      }
      if (payload.provider !== 'resend') {
        payload.resend = undefined;
      } else if (!payload.resend?.apiKey) {
        delete payload.resend?.apiKey;
      }

      const res = await updateEmailSettingsAction(payload);
      
      if (res.success) {
        toast.success("Email settings saved successfully!");
        setFormData(prev => ({
          ...prev,
          smtp: { ...prev.smtp!, pass: '' },
          resend: { ...prev.resend!, apiKey: '' }
        }));
      } else {
        toast.error(res.message || "Failed to save email settings");
      }
    });
  };

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>
            Configure how the system sends transactional emails (orders, verification, etc).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Provider</Label>
              <Select 
                value={formData.provider} 
                onValueChange={(val: any) => setFormData({...formData, provider: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock (Console Log)</SelectItem>
                  <SelectItem value="smtp">SMTP Server</SelectItem>
                  <SelectItem value="resend">Resend API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Name/Address</Label>
              <Input 
                placeholder="My Store <noreply@example.com>"
                value={formData.from}
                onChange={(e) => setFormData({...formData, from: e.target.value})}
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Format: Name &lt;email@domain.com&gt; or just email
              </p>
            </div>
          </div>

          {formData.provider === 'smtp' && (
            <div className="pt-4 border-t space-y-4">
              <h3 className="font-medium text-sm">SMTP Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input 
                    placeholder="smtp.gmail.com"
                    value={formData.smtp?.host || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      smtp: { ...formData.smtp!, host: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input 
                    type="number"
                    placeholder="587"
                    value={formData.smtp?.port || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      smtp: { ...formData.smtp!, port: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input 
                    placeholder="youremail@gmail.com"
                    value={formData.smtp?.user || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      smtp: { ...formData.smtp!, user: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password</Label>
                  <Input 
                    type="password"
                    placeholder={initialData.smtp?.hasPass ? "•••••••• (Leave empty to keep)" : "Enter password"}
                    value={formData.smtp?.pass || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      smtp: { ...formData.smtp!, pass: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {formData.provider === 'resend' && (
            <div className="pt-4 border-t space-y-4">
              <h3 className="font-medium text-sm">Resend API Configuration</h3>
              <div className="space-y-2">
                <Label>Resend API Key</Label>
                <Input 
                  type="password"
                  placeholder={initialData.resend?.hasApiKey ? "re_•••••••• (Leave empty to keep)" : "re_..."}
                  value={formData.resend?.apiKey || ''}
                  onChange={(e) => setFormData({
                    ...formData, 
                    resend: { ...formData.resend!, apiKey: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
