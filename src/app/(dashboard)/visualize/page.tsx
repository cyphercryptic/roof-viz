'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { PhotoUploader } from '@/components/visualize/PhotoUploader';
import { ProductSelector } from '@/components/visualize/ProductSelector';
import { BeforeAfterSlider } from '@/components/visualize/BeforeAfterSlider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ProductSwatch } from '@/components/catalog/ProductSwatch';
import { Sparkles, RotateCcw, Download, ArrowLeft, ChevronLeft, ChevronRight, Zap, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { extractProductLine } from '@/lib/product-images';
import { SUPPORT_EMAIL } from '@/lib/site';
import type { Product } from '@/types';

interface UsageInfo {
  used: number;
  limit: number;
  plan: string;
  allowed: boolean;
}

type Step = 'upload' | 'configure' | 'generating' | 'result';

interface VisualizationResult {
  id: string;
  resultUrl: string;
  product: Product;
  processingTimeMs: number;
}

/** Extract the product line from the product name (e.g. "GAF Timberline HDZ - Charcoal" → "Timberline HDZ") */
function extractLine(product: Product): string {
  return extractProductLine(product.name, product.brand);
}

export default function VisualizePage() {
  const { profile } = useUser();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<Step>('upload');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [enhance, setEnhance] = useState(false);

  // Image state
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [originalImagePath, setOriginalImagePath] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');

  // Result state — track all visualizations done on the same photo
  const [results, setResults] = useState<VisualizationResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const activeResult = results[activeResultIndex] ?? null;

  useEffect(() => {
    loadProducts();
    loadUsage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-load photo from query params (e.g. coming from gallery "Add a Visual")
  useEffect(() => {
    const photoPath = searchParams.get('photo');
    if (photoPath) {
      setOriginalImagePath(photoPath);
      setStep('configure');
      // Private bucket — sign the path (RLS scopes this to the user's tenant)
      supabase.storage
        .from('house-photos')
        .createSignedUrl(photoPath, 60 * 60)
        .then((res: { data: { signedUrl: string } | null }) => {
          if (res.data) {
            setOriginalImageUrl(res.data.signedUrl);
            setPreview(res.data.signedUrl);
          }
        });

      const name = searchParams.get('customer');
      const address = searchParams.get('address');
      if (name) setCustomerName(name);
      if (address) setCustomerAddress(address);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('brand')
      .order('name');
    setProducts(data || []);
  }

  async function loadUsage() {
    const res = await fetch('/api/billing/usage');
    if (res.ok) {
      setUsage(await res.json());
    }
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });

    if (!res.ok) {
      toast.error('Failed to upload photo');
      setPreview(null);
      setUploading(false);
      return;
    }

    const data = await res.json();
    setOriginalImagePath(data.path);
    setOriginalImageUrl(data.url);
    setUploading(false);
    setStep('configure');
  }

  function handleClearPhoto() {
    setPreview(null);
    setOriginalImagePath('');
    setOriginalImageUrl('');
    setStep('upload');
  }

  async function handleVisualize() {
    if (!selectedProductId || !originalImagePath) {
      toast.error('Please select a product and upload a photo');
      return;
    }

    setStep('generating');
    setGenerating(true);

    try {
      const res = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          originalImagePath,
          customerName: customerName || null,
          customerAddress: customerAddress || null,
          enhance,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Visualization failed');
      }

      const data = await res.json();
      const product = products.find((p) => p.id === selectedProductId)!;
      const newResult: VisualizationResult = {
        id: data.id,
        resultUrl: data.resultUrl,
        product,
        processingTimeMs: data.processingTimeMs,
      };

      setResults((prev) => [...prev, newResult]);
      setActiveResultIndex(results.length); // point to the newly added one
      setStep('result');
      toast.success(`Visualization complete in ${(data.processingTimeMs / 1000).toFixed(1)}s`);
      loadUsage(); // refresh usage count
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Visualization failed');
      setStep('configure');
    } finally {
      setGenerating(false);
    }
  }

  function handleTryAnother() {
    setSelectedProductId('');
    setStep('configure');
  }

  function handleStartOver() {
    setPreview(null);
    setOriginalImagePath('');
    setOriginalImageUrl('');
    setSelectedProductId('');
    setCustomerName('');
    setCustomerAddress('');
    setResults([]);
    setActiveResultIndex(0);
    setStep('upload');
  }

  async function handleDownload() {
    if (!activeResult) return;
    const response = await fetch(activeResult.resultUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roof-visualization-${activeResult.id}.png`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Roof Visualization</h1>
        <p className="text-brand-brown/50">
          {step === 'upload' && 'Upload a photo of the house to get started'}
          {step === 'configure' && 'Select a roofing product to visualize'}
          {step === 'generating' && 'AI is generating your visualization...'}
          {step === 'result' && 'Drag the slider to compare before & after'}
        </p>
      </div>

      {/* Demo user banner */}
      {profile?.role === 'demo' && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-brand-orange/10 to-brand-peach-light border border-brand-orange/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-brand-brown">Demo Account</p>
            <p className="text-sm text-brand-brown/60">
              {usage ? `${usage.used} of ${usage.limit} free visualizations used` : 'Limited visualizations available'}
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Interested%20in%20RoofViz`}
            className="px-4 py-2 bg-brand-orange text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Contact Sales
          </a>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <PhotoUploader
          onUpload={handlePhotoUpload}
          preview={preview}
          uploading={uploading}
          onClear={handleClearPhoto}
        />
      )}

      {/* Step 2: Configure */}
      {step === 'configure' && (
        <div className="space-y-6">
          {/* Photo preview */}
          <PhotoUploader
            onUpload={handlePhotoUpload}
            preview={preview}
            uploading={false}
            onClear={handleClearPhoto}
          />

          {/* Previous results thumbnails */}
          {results.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-brand-brown/50 mb-3">
                  Previous visualizations on this photo ({results.length})
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {results.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveResultIndex(i);
                        setStep('result');
                      }}
                      className="flex-shrink-0 rounded-lg border-2 border-brand-peach/30 hover:border-brand-orange overflow-hidden transition-colors"
                    >
                      <div className="w-28">
                        <img
                          src={r.resultUrl}
                          alt={`${r.product.name} visualization`}
                          className="w-full h-16 object-cover"
                        />
                        <div className="px-2 py-1 bg-brand-cream">
                          <p className="text-[11px] font-medium truncate">{r.product.color}</p>
                          <p className="text-[10px] text-brand-brown/40 truncate">{r.product.brand}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-6">
              {/* Product selection */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Roofing Product</Label>
                {products.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    No products in catalog yet. Ask your admin to add products.
                  </p>
                ) : (
                  <ProductSelector
                    products={products}
                    selectedId={selectedProductId}
                    onSelect={setSelectedProductId}
                  />
                )}
              </div>

              {/* Optional customer info (hidden for demo users) */}
              {profile?.role !== 'demo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-sm text-brand-brown/50">
                      Customer Name (optional)
                    </Label>
                    <Input
                      id="customerName"
                      placeholder="John Smith"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress" className="text-sm text-brand-brown/50">
                      Address (optional)
                    </Label>
                    <Input
                      id="customerAddress"
                      placeholder="123 Main St"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Photo enhancement toggle */}
              <label className="flex items-start gap-3 rounded-lg border border-brand-peach/40 bg-brand-cream/50 px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhance}
                  onChange={(e) => setEnhance(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-orange"
                />
                <span>
                  <span className="block text-sm font-medium text-brand-brown">Enhance photo presentation</span>
                  <span className="block text-xs text-brand-brown/50">
                    Brightens lighting and cleans up the sky and lawn for a marketing-ready shot.
                    Leave off for an exact like-for-like preview of the customer&apos;s home.
                  </span>
                </span>
              </label>

              {/* Usage indicator */}
              {usage && (
                <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                  !usage.allowed ? 'bg-red-50 text-red-700' : 'bg-brand-peach-light text-brand-brown/60'
                }`}>
                  <Zap className="h-4 w-4" />
                  {usage.limit === -1 ? (
                    <span>{usage.used} visualizations used this period</span>
                  ) : (
                    <span>{usage.used} / {usage.limit} visualizations used this period</span>
                  )}
                </div>
              )}

              {/* Visualize button */}
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleVisualize}
                disabled={!selectedProductId || (usage !== null && !usage.allowed)}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {usage && !usage.allowed
                  ? (profile?.role === 'demo' ? 'Demo Limit Reached — Contact Sales' : 'Limit Reached — Upgrade Plan')
                  : 'Visualize New Roof'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-brand-orange animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Generating Your Visualization</h2>
          <p className="text-brand-brown/50 text-center max-w-md">
            Our AI is replacing the roof in your photo. This usually takes 15-25 seconds.
          </p>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && activeResult && (
        <div className="space-y-4">
          {/* Current product label */}
          <div className="flex items-center gap-3 px-1">
            <ProductSwatch
              brand={activeResult.product.brand}
              line={extractLine(activeResult.product)}
              color={activeResult.product.color}
              swatchUrl={activeResult.product.swatch_url}
              className="h-10 w-10 rounded-lg border shadow-sm flex-shrink-0"
            />
            <div>
              <p className="font-semibold text-brand-brown">{activeResult.product.name}</p>
              <p className="text-sm text-brand-brown/50">{activeResult.product.color}</p>
            </div>
          </div>

          <BeforeAfterSlider
            beforeUrl={originalImageUrl || preview || ''}
            afterUrl={activeResult.resultUrl}
          />

          {/* Navigation between results */}
          {results.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={activeResultIndex === 0}
                onClick={() => setActiveResultIndex((i) => i - 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex gap-1.5 items-center">
                {results.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveResultIndex(i)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      i === activeResultIndex
                        ? 'bg-brand-orange text-white'
                        : 'bg-brand-peach-light text-brand-brown/60 hover:bg-brand-peach'
                    }`}
                  >
                    <ProductSwatch
                      brand={r.product.brand}
                      line={extractLine(r.product)}
                      color={r.product.color}
                      swatchUrl={r.product.swatch_url}
                      className="h-4 w-4 rounded-sm flex-shrink-0"
                    />
                    {r.product.color}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                disabled={activeResultIndex === results.length - 1}
                onClick={() => setActiveResultIndex((i) => i + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" onClick={handleTryAnother} className="h-12">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Another Color
            </Button>
            <Button variant="outline" onClick={handleDownload} className="h-12">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handleStartOver} className="h-12 col-span-2 sm:col-span-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              New Photo
            </Button>
            <Button
              onClick={() => router.push('/gallery')}
              className="h-12 col-span-2 sm:col-span-1"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              View in Gallery
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
