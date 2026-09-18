'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROOF_STYLES, COMMON_BRANDS, WINDOW_TYPES, SLIDING_DOOR_CONFIGS, ENTRY_DOOR_STYLES, FRAME_MATERIALS } from '@/lib/constants';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Product, ProductCategory } from '@/types';
import { CATEGORY_LABELS } from '@/types';

const CATEGORY_OPTIONS: ProductCategory[] = ['roofing', 'window', 'sliding_glass_door', 'entry_door'];

const GLASS_TYPES = ['clear', 'low-e', 'tinted', 'frosted', 'decorative', 'tempered', 'impact-resistant'] as const;
const GRID_PATTERNS = ['none', 'colonial', 'prairie', 'diamond', 'custom'] as const;

interface ProductFormProps {
  product?: Product;
  defaultCategory?: ProductCategory;
  onSubmit: (data: {
    name: string;
    brand: string;
    color: string;
    category: ProductCategory;
    style: string | null;
    line: string | null;
    material: string | null;
    attributes: Record<string, unknown>;
    description: string;
    swatch_url: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, defaultCategory = 'roofing', onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [customBrand, setCustomBrand] = useState('');
  const [color, setColor] = useState(product?.color || '');
  const [category, setCategory] = useState<ProductCategory>(product?.category || defaultCategory);
  const [style, setStyle] = useState(product?.style || '');
  const [line, setLine] = useState(product?.line || '');
  const [material, setMaterial] = useState(product?.material || '');
  const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>(
    (product?.attributes as Record<string, string | number | boolean>) || {}
  );
  const [description, setDescription] = useState(product?.description || '');
  const [swatchUrl, setSwatchUrl] = useState<string | null>(product?.swatch_url || null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomBrand = brand === '__custom__';

  function updateAttr(key: string, value: string) {
    setAttributes((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }

  function handleCategoryChange(newCategory: ProductCategory) {
    setCategory(newCategory);
    setAttributes({});
  }

  async function handleSwatchUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Please select a PNG, JPEG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to upload a swatch');
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) throw new Error('Company not found');
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `${profile.tenant_id}/custom/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('product-swatches')
        .upload(fileName, file, { contentType: file.type });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-swatches')
        .getPublicUrl(fileName);

      setSwatchUrl(publicUrl);
      toast.success('Swatch image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
    await onSubmit({
      name,
      brand: isCustomBrand ? customBrand : brand,
      color,
      category,
      style: category === 'roofing' ? style || null : null,
      line: line.trim() || null,
      material: material || null,
      attributes,
      description,
      swatch_url: swatchUrl,
    });
    } catch { toast.error('Unable to save product. Please try again.'); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category selector */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => handleCategoryChange(v as ProductCategory)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((cat) => (
              <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          placeholder="e.g., 400 Series Double-Hung Window"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand</Label>
          <Select value={brand} onValueChange={(v) => setBrand(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_BRANDS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
              <SelectItem value="__custom__">Other (custom)</SelectItem>
            </SelectContent>
          </Select>
          {isCustomBrand && (
            <Input
              placeholder="Enter brand name"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>{category === 'roofing' ? 'Roof style' : 'Material'}</Label>
          <Select value={category === 'roofing' ? style : material} onValueChange={(v) => category === 'roofing' ? setStyle(v ?? '') : setMaterial(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {(category === 'roofing' ? ROOF_STYLES : FRAME_MATERIALS).map((m) => (
                <SelectItem key={m} value={category === 'roofing' ? m : m.toLowerCase()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          placeholder="e.g., White, Dark Bronze, Pebble Gray"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2"><Label htmlFor="product-line">Product line (optional)</Label><Input id="product-line" value={line} onChange={(e) => setLine(e.target.value)} placeholder="e.g., Timberline HDZ, Acclaim" /></div>
      {/* Category-specific attribute fields */}
      {category !== 'roofing' && <div className="space-y-3 rounded-lg border border-brand-peach/20 bg-brand-peach-light/30 p-3">
        <p className="text-sm font-medium text-brand-brown/70">
          {CATEGORY_LABELS[category]} Attributes
        </p>

        {category === 'window' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Window Type</Label>
              <Select
                value={(attributes.windowType as string) || ''}
                onValueChange={(v) => updateAttr('windowType', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_TYPES.map((t) => (
                    <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Glass Type</Label>
              <Select
                value={(attributes.glassType as string) || ''}
                onValueChange={(v) => updateAttr('glassType', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select glass" />
                </SelectTrigger>
                <SelectContent>
                  {GLASS_TYPES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Grid Pattern</Label>
              <Select
                value={(attributes.gridPattern as string) || ''}
                onValueChange={(v) => updateAttr('gridPattern', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  {GRID_PATTERNS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {category === 'sliding_glass_door' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Configuration</Label>
              <Select
                value={(attributes.configuration as string) || ''}
                onValueChange={(v) => updateAttr('configuration', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select config" />
                </SelectTrigger>
                <SelectContent>
                  {SLIDING_DOOR_CONFIGS.map((c) => (
                    <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Panel Layout</Label>
              <Select
                value={(attributes.panelLayout as string) || ''}
                onValueChange={(v) => updateAttr('panelLayout', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  {['OX', 'XO', 'OXO', 'OXXO'].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Glass Type</Label>
              <Select
                value={(attributes.glassType as string) || ''}
                onValueChange={(v) => updateAttr('glassType', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select glass" />
                </SelectTrigger>
                <SelectContent>
                  {GLASS_TYPES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Grid Pattern</Label>
              <Select
                value={(attributes.gridPattern as string) || ''}
                onValueChange={(v) => updateAttr('gridPattern', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  {GRID_PATTERNS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {category === 'entry_door' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Door Style</Label>
              <Select
                value={(attributes.doorStyle as string) || ''}
                onValueChange={(v) => updateAttr('doorStyle', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_DOOR_STYLES.map((s) => (
                    <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Glass Type</Label>
              <Select
                value={(attributes.glassType as string) || ''}
                onValueChange={(v) => updateAttr('glassType', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select glass" />
                </SelectTrigger>
                <SelectContent>
                  {['none', 'full-light', 'half-light', 'quarter-light', 'sidelight', 'transom', 'decorative'].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sidelight Config</Label>
              <Select
                value={(attributes.sidelightConfig as string) || ''}
                onValueChange={(v) => updateAttr('sidelightConfig', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select sidelight" />
                </SelectTrigger>
                <SelectContent>
                  {['none', 'left', 'right', 'both'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Handle Set</Label>
              <Select
                value={(attributes.handleSet as string) || ''}
                onValueChange={(v) => updateAttr('handleSet', v ?? '')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select handle" />
                </SelectTrigger>
                <SelectContent>
                  {['lever', 'knob', 'handleset', 'pull-bar'].map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>}

      {/* Swatch image upload */}
      <div className="space-y-2">
        <Label>Swatch Image (optional)</Label>
        {swatchUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border shadow-sm">
              <Image src={swatchUrl} alt="Swatch preview" fill unoptimized className="object-cover" />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSwatchUrl(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleSwatchUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Swatch Photo'}
            </Button>
            <p className="text-xs text-brand-brown/50 mt-1">
              Upload a photo of the product swatch. Max 5MB.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (helps AI accuracy)</Label>
        <Textarea
          id="description"
          placeholder="e.g., White vinyl double-hung window with colonial grids and Low-E glass"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <p className="text-xs text-brand-brown/50">
          The more detail you provide, the more accurate the AI visualization will be.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading || !(isCustomBrand ? customBrand.trim() : brand.trim())}>
          {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
}
