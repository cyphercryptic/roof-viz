'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paintbrush, Shield, Upload, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Tenant } from '@/types';

export default function BrandingPage() {
  const { profile } = useUser();
  const supabase = createClient();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [primaryColor, setPrimaryColor] = useState('#E07A2F');
  const [secondaryColor, setSecondaryColor] = useState('#3D2B1F');
  const [hidePoweredBy, setHidePoweredBy] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (profile?.tenant_id) loadData();
  }, [profile?.tenant_id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    const [tenantRes, subRes] = await Promise.all([
      supabase
        .from('tenants')
        .select('*')
        .eq('id', profile!.tenant_id)
        .single(),
      supabase
        .from('subscriptions')
        .select('plan')
        .eq('tenant_id', profile!.tenant_id)
        .single(),
    ]);

    if (tenantRes.data) {
      const t = tenantRes.data as Tenant;
      setTenant(t);
      setPrimaryColor(t.brand_primary_color || '#E07A2F');
      setSecondaryColor(t.brand_secondary_color || '#3D2B1F');
      setHidePoweredBy(t.hide_powered_by ?? false);
      setLogoUrl(t.logo_url);
    }

    if (subRes.data) {
      setPlan(subRes.data.plan);
    }

    setLoading(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;

    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const path = `${tenant.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload logo');
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('tenants')
      .update({ logo_url: publicUrl })
      .eq('id', tenant.id);

    if (updateError) {
      toast.error('Failed to save logo URL');
    } else {
      setLogoUrl(publicUrl);
      toast.success('Logo uploaded');
    }

    setUploadingLogo(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);

    const { error } = await supabase
      .from('tenants')
      .update({
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
        hide_powered_by: hidePoweredBy,
      })
      .eq('id', tenant.id);

    if (error) {
      toast.error('Failed to save branding settings');
    } else {
      toast.success('Branding settings saved');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-brown/50">
        <Shield className="h-12 w-12 mb-4" />
        <p>Only admins can access branding settings.</p>
      </div>
    );
  }

  if (plan !== 'business_pro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">White-Label Branding</h1>
          <p className="text-brand-brown/50">Customize your customer-facing pages</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Paintbrush className="h-12 w-12 text-brand-brown/30 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Business Pro Feature</h2>
            <p className="text-brand-brown/50 mb-6 max-w-md">
              White-label branding is available on the Business Pro plan. Customize colors,
              upload your logo, and remove RoofViz branding from shared pages.
            </p>
            <Link href="/settings/billing">
              <Button>
                Upgrade to Business Pro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">White-Label Branding</h1>
        <p className="text-brand-brown/50">Customize your customer-facing pages</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Company Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="h-16 w-16 rounded-lg object-contain border border-brand-peach/30"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingLogo ? 'Uploading...' : 'Replace Logo'}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-brand-brown/40">
              Recommended: Square image, at least 128x128px. PNG or SVG preferred.
            </p>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Paintbrush className="h-5 w-5" />
              Brand Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 rounded cursor-pointer border border-brand-peach/30"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-10 rounded cursor-pointer border border-brand-peach/30"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Powered By Toggle */}
        <Card>
          <CardContent className="py-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium">Hide &quot;Powered by RoofViz&quot;</p>
                <p className="text-sm text-brand-brown/50">
                  Remove the RoofViz attribution from shared visualization pages
                </p>
              </div>
              <input
                type="checkbox"
                checked={hidePoweredBy}
                onChange={(e) => setHidePoweredBy(e.target.checked)}
                className="h-5 w-5 rounded border-brand-peach/50 text-brand-orange focus:ring-brand-orange"
              />
            </label>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-brand-peach/30 overflow-hidden">
              {/* Simulated share page header */}
              <div className="bg-white border-b border-brand-peach/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="h-8 w-8 rounded-lg object-contain"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                  )}
                  <span className="font-bold" style={{ color: secondaryColor }}>
                    {tenant?.name || 'Your Company'}
                  </span>
                </div>
                {!hidePoweredBy && (
                  <span className="text-xs text-brand-brown/40">Powered by RoofViz</span>
                )}
              </div>
              {/* Simulated content area */}
              <div className="bg-brand-cream/50 p-6 text-center text-sm text-brand-brown/40">
                Visualization content area
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </form>
    </div>
  );
}
