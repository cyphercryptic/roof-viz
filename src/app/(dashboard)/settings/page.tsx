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
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    const tenantId = profile?.tenant_id;
    if (!tenantId) return;
    let active = true;
    async function loadTenant() {
      try {
        const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId!).single();
        if (error || !data) throw error || new Error('Company unavailable');
        if (active) {
          setTenant(data);
          setCompanyName(data.name);
          setLoadError(false);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTenant();
    return () => { active = false; };
  }, [profile?.tenant_id, supabase, reload]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);

    try {
      const name = companyName.trim();
      if (!name || name.length > 100) {
        toast.error('Enter a company name between 1 and 100 characters.');
        return;
      }
      const { error } = await supabase.from('tenants').update({ name }).eq('id', tenant.id);
      if (error) throw error;
      setCompanyName(name);
      toast.success('Company settings saved');
    } catch {
      toast.error('Could not save your company settings. Please try again.');
    } finally { setSaving(false); }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-brown-soft">
        <Shield className="h-12 w-12 mb-4" />
        <p>Only admins can access settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Company settings</h1>
        <p className="text-brand-brown-soft">Manage your company profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
            </div>
          ) : loadError ? (
            <div role="alert" className="space-y-3"><p>We could not load your company settings.</p><Button variant="outline" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Try again</Button></div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  maxLength={100}
                  autoComplete="organization"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
