'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROOF_STYLES, COMMON_BRANDS } from '@/lib/constants';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: {
    name: string;
    brand: string;
    color: string;
    style: string;
    description: string;
    swatch_url: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [customBrand, setCustomBrand] = useState('');
  const [color, setColor] = useState(product?.color || '');
  const [style, setStyle] = useState(product?.style || '');
  const [description, setDescription] = useState(product?.description || '');
  const [swatchUrl, setSwatchUrl] = useState<string | null>(product?.swatch_url || null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomBrand = brand === '__custom__';

  async function handleSwatchUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `custom/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from('product-swatches')
        .upload(fileName, file, { contentType: file.type, upsert: true });

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
    await onSubmit({
      name,
      brand: isCustomBrand ? customBrand : brand,
      color,
      style,
      description,
      swatch_url: swatchUrl,
    });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          placeholder="e.g., Timberline HDZ"
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
          <Label>Style</Label>
          <Select value={style} onValueChange={(v) => setStyle(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {ROOF_STYLES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          placeholder="e.g., Charcoal, Weathered Wood, Slate"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          required
        />
      </div>

      {/* Swatch image upload */}
      <div className="space-y-2">
        <Label>Swatch Image (optional)</Label>
        {swatchUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border shadow-sm">
              <img src={swatchUrl} alt="Swatch preview" className="w-full h-full object-cover" />
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
              accept="image/*"
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
          placeholder="e.g., Dark gray architectural shingle with dimensional shadow lines and a slight blue undertone"
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
}
