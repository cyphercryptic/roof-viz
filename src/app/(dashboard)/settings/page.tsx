'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { Tenant } from '@/types';

export default function SettingsPage() {
  const { profile } = useUser();
  const supabase = createClient();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (profile?.tenant_id) loadTenant();
  }, [profile?.tenant_id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTenant() {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile!.tenant_id)
      .single();

    if (data) {
      setTenant(data);
      setCompanyName(data.name);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);

    const { error } = await supabase
      .from('tenants')
      .update({ name: companyName })
      .eq('id', tenant.id);

    if (error) {
      toast.error('Failed to update company name');
    } else {
      toast.success('Settings saved');
    }
    setSaving(false);
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-brown/50">
        <Shield className="h-12 w-12 mb-4" />
        <p>Only admins can access settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Company Settings</h1>
        <p className="text-brand-brown/50">Manage your company profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
