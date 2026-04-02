'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductForm } from '@/components/catalog/ProductForm';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Library, Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MASTER_PRODUCTS, getProductLinesByBrand, type MasterProduct } from '@/lib/master-products';
import { ProductSwatch } from '@/components/catalog/ProductSwatch';
import type { Product } from '@/types';

export default function CatalogPage() {
  const { profile } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = createClient();

  // Master catalog state
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const linesByBrand = getProductLinesByBrand();

  useEffect(() => {
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('brand', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      toast.error('Failed to load products');
      return;
    }
    setProducts(data || []);
    setLoading(false);
  }

  async function handleSubmit(data: {
    name: string;
    brand: string;
    color: string;
    style: string;
    description: string;
    swatch_url: string | null;
  }) {
    const { error } = await supabase
      .from('products')
      .insert({ ...data, tenant_id: profile?.tenant_id });

    if (error) {
      toast.error('Failed to add product');
      return;
    }
    toast.success('Product added');
    setDialogOpen(false);
    loadProducts();
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', product.id);

    if (error) {
      toast.error('Failed to delete product');
      return;
    }
    toast.success('Product removed');
    loadProducts();
  }

  // Check if a master product already exists in the tenant's catalog
  function isAlreadyAdded(mp: MasterProduct): boolean {
    return products.some(
      (p) => p.brand === mp.brand && p.color === mp.color && p.name.includes(mp.line)
    );
  }

  // Get the filtered product lines for the selected brand
  function getFilteredLines(): MasterProduct[] {
    if (!selectedBrand || !selectedLine) return [];
    return MASTER_PRODUCTS.filter(
      (p) => p.brand === selectedBrand && p.line === selectedLine
    );
  }

  // Toggle a color in the selection
  function toggleColor(colorKey: string) {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(colorKey)) {
        next.delete(colorKey);
      } else {
        next.add(colorKey);
      }
      return next;
    });
  }

  // Select all colors for current line
  function selectAllColors() {
    const lineProducts = getFilteredLines().filter((mp) => !isAlreadyAdded(mp) && !mp.comingSoon);
    setSelectedColors(new Set(lineProducts.map((mp) => `${mp.brand}|${mp.line}|${mp.color}`)));
  }

  // Add selected products from master catalog
  async function handleAddFromCatalog() {
    if (selectedColors.size === 0) {
      toast.error('Select at least one color');
      return;
    }

    setAdding(true);

    const productsToAdd = MASTER_PRODUCTS.filter((mp) =>
      selectedColors.has(`${mp.brand}|${mp.line}|${mp.color}`)
    );

    const res = await fetch('/api/catalog/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: productsToAdd }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to add products');
      setAdding(false);
      return;
    }

    const data = await res.json();
    toast.success(`Added ${data.added} products to your catalog`);
    setSelectedColors(new Set());
    setAdding(false);
    loadProducts();
  }

  // Filter existing products by search
  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.color.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-brown/50">
        <Package className="h-12 w-12 mb-4" />
        <p>Only admins can manage the product catalog.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Product Catalog</h1>
        <p className="text-brand-brown/50">Add products from our database or create custom ones</p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">
            <Library className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Browse </span>Products
          </TabsTrigger>
          <TabsTrigger value="my-catalog">
            <Package className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">My </span>Catalog ({products.length})
          </TabsTrigger>
        </TabsList>

        {/* Browse master catalog */}
        <TabsContent value="browse" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Products to Add</CardTitle>
              <p className="text-sm text-brand-brown/50">
                Browse our database of {MASTER_PRODUCTS.length}+ roofing products from top brands. Select the ones your company offers.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Pick a brand */}
              <div>
                <p className="text-sm font-medium mb-3">1. Choose a brand</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(linesByBrand).sort().map((brand) => (
                    <Button
                      key={brand}
                      variant={selectedBrand === brand ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedBrand(brand);
                        setSelectedLine(null);
                        setSelectedColors(new Set());
                      }}
                    >
                      {brand}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 2: Pick a product line */}
              {selectedBrand && (
                <div>
                  <p className="text-sm font-medium mb-3">2. Choose a product line</p>
                  <div className="flex flex-wrap gap-2">
                    {linesByBrand[selectedBrand].map((line) => {
                      const colorCount = MASTER_PRODUCTS.filter(
                        (p) => p.brand === selectedBrand && p.line === line
                      ).length;
                      const style = MASTER_PRODUCTS.find(
                        (p) => p.brand === selectedBrand && p.line === line
                      )?.style;
                      return (
                        <Button
                          key={line}
                          variant={selectedLine === line ? 'default' : 'outline'}
                          size="sm"
                          className="h-auto py-2 flex-col items-start"
                          onClick={() => {
                            setSelectedLine(line);
                            setSelectedColors(new Set());
                          }}
                        >
                          <span>{line}</span>
                          <span className="text-xs opacity-70">
                            {style} &middot; {colorCount} colors
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Pick colors */}
              {selectedBrand && selectedLine && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">3. Select colors to add</p>
                    <Button variant="ghost" size="sm" onClick={selectAllColors}>
                      Select All Available
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {getFilteredLines().map((mp) => {
                      const key = `${mp.brand}|${mp.line}|${mp.color}`;
                      const alreadyAdded = isAlreadyAdded(mp);
                      const isSelected = selectedColors.has(key);
                      const isComingSoon = mp.comingSoon === true;

                      return (
                        <button
                          key={key}
                          onClick={() => !alreadyAdded && !isComingSoon && toggleColor(key)}
                          disabled={alreadyAdded || isComingSoon}
                          className={`
                            relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all text-sm
                            ${isComingSoon
                              ? 'border-amber-200 bg-amber-50/50 opacity-75 cursor-not-allowed'
                              : alreadyAdded
                                ? 'border-green-200 bg-green-50 opacity-60 cursor-not-allowed'
                                : isSelected
                                  ? 'border-brand-orange bg-brand-peach-light ring-2 ring-brand-orange'
                                  : 'border-brand-peach/30 hover:border-brand-peach hover:bg-brand-peach-light cursor-pointer'
                            }
                          `}
                        >
                          <ProductSwatch
                            brand={mp.brand}
                            line={mp.line}
                            color={mp.color}
                            className="h-8 w-8 rounded border shadow-sm flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{mp.color}</p>
                            {isComingSoon && (
                              <p className="text-xs text-amber-600 font-medium">Coming Soon</p>
                            )}
                            {alreadyAdded && !isComingSoon && (
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Added
                              </p>
                            )}
                          </div>
                          {isComingSoon && (
                            <Badge className="absolute top-1 right-1 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 border-amber-200">
                              Soon
                            </Badge>
                          )}
                          {isSelected && !alreadyAdded && !isComingSoon && (
                            <div className="absolute top-1 right-1">
                              <Check className="h-4 w-4 text-brand-orange" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add button */}
                  {selectedColors.size > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-lg bg-brand-peach-light p-3 sm:p-4 border border-brand-peach">
                      <p className="text-sm font-medium text-brand-brown">
                        {selectedColors.size} product{selectedColors.size !== 1 ? 's' : ''} selected
                      </p>
                      <Button onClick={handleAddFromCatalog} disabled={adding} className="w-full sm:w-auto">
                        {adding ? 'Adding...' : `Add ${selectedColors.size} to My Catalog`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My catalog */}
        <TabsContent value="my-catalog" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-brown/40" />
              <Input
                placeholder="Search your products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Custom Product
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-brand-brown/50">
                <Package className="h-12 w-12 mb-4" />
                {products.length === 0 ? (
                  <>
                    <p className="mb-2">No products in your catalog yet.</p>
                    <p className="text-sm mb-4">Use the &quot;Browse Products&quot; tab to add from our database.</p>
                  </>
                ) : (
                  <p>No products match your search.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Group by brand */}
              {Object.entries(
                filteredProducts.reduce<Record<string, Product[]>>((acc, p) => {
                  if (!acc[p.brand]) acc[p.brand] = [];
                  acc[p.brand].push(p);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([brand, brandProducts]) => (
                  <div key={brand}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-brand-brown/50 uppercase">{brand}</h3>
                      <Badge variant="secondary">{brandProducts.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                      {brandProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Custom product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Custom Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

