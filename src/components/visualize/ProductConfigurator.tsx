'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getFrameGradient } from '@/lib/frame-colors';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import type {
  Product,
  ProductCategory,
  WindowAttributes,
  SlidingDoorAttributes,
  EntryDoorAttributes,
} from '@/types';

interface ProductConfiguratorProps {
  products: Product[];
  category: ProductCategory;
  selectedId: string;
  onSelect: (productId: string) => void;
}

// Labels for window types
const WINDOW_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
  'double-hung': { label: 'Double-Hung', desc: 'Both sashes slide up and down' },
  'casement': { label: 'Casement', desc: 'Hinged on the side, cranks open outward' },
  'awning': { label: 'Awning', desc: 'Hinged at top, opens outward from bottom' },
  'sliding': { label: 'Sliding', desc: 'Slides horizontally on a track' },
  'picture': { label: 'Picture', desc: 'Fixed, non-operable — maximum light' },
  'bay': { label: 'Bay', desc: '3-panel angled projection from wall' },
  'bow': { label: 'Bow', desc: 'Curved arc of 4-6 panels' },
  'hopper': { label: 'Hopper', desc: 'Hinged at bottom, tilts inward' },
  'garden': { label: 'Garden', desc: 'Greenhouse-style box projection' },
  'egress': { label: 'Egress', desc: 'Emergency exit window' },
};

// Labels for sliding door configurations
const DOOR_CONFIG_LABELS: Record<string, { label: string; desc: string }> = {
  '2-panel': { label: '2-Panel', desc: 'Standard width sliding door' },
  '3-panel': { label: '3-Panel', desc: 'Extra-wide with center panel' },
  '4-panel': { label: '4-Panel', desc: 'Grand opening with dual sliders' },
  'pocket': { label: 'Pocket', desc: 'Panels slide into wall cavity' },
  'stacking': { label: 'Multi-Slide', desc: 'Panels stack to one side' },
};

// Labels for entry door styles
const DOOR_STYLE_LABELS: Record<string, { label: string; desc: string }> = {
  'panel': { label: 'Raised Panel', desc: 'Classic raised panel design' },
  'craftsman': { label: 'Craftsman', desc: 'Flat panels, clean lines' },
  'modern': { label: 'Modern', desc: 'Flat, minimalist, contemporary' },
  'traditional': { label: 'Traditional', desc: 'Elegant, timeless design' },
  'rustic': { label: 'Rustic', desc: 'Woodgrain texture, handcrafted' },
  'farmhouse': { label: 'Farmhouse', desc: 'Charming, warm, inviting' },
  'contemporary': { label: 'Contemporary', desc: 'Bold, architectural lines' },
};

// Labels for entry door glass types
const GLASS_TYPE_LABELS: Record<string, string> = {
  'none': 'No Glass (Solid)',
  'full-light': 'Full Light',
  'half-light': 'Half Light',
  'quarter-light': 'Quarter Light',
  'sidelight': 'Sidelight',
  'transom': 'Transom',
  'decorative': 'Decorative Glass',
};

const SIDELIGHT_LABELS: Record<string, string> = {
  'none': 'No Sidelights',
  'left': 'Left Sidelight',
  'right': 'Right Sidelight',
  'both': 'Both Sidelights',
};

const HARDWARE_FINISH_LABELS: Record<string, string> = {
  'brass': 'Brass',
  'brushed-nickel': 'Brushed Nickel',
  'oil-rubbed-bronze': 'Oil-Rubbed Bronze',
  'matte-black': 'Matte Black',
  'chrome': 'Chrome',
  'satin-chrome': 'Satin Chrome',
};

type ConfigStep = 'brand' | 'line' | 'type' | 'color' | 'hardware' | 'done';

export function ProductConfigurator({
  products,
  category,
  selectedId,
  onSelect,
}: ProductConfiguratorProps) {
  const [step, setStep] = useState<ConfigStep>(selectedId ? 'done' : 'brand');
  const [brand, setBrand] = useState<string | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [typeKey, setTypeKey] = useState<string | null>(null); // windowType, configuration, or doorStyle+glassType
  const [color, setColor] = useState<string | null>(null);

  // Filter products by category
  const categoryProducts = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category]
  );

  // Step 1: Available brands
  const brands = useMemo(
    () => [...new Set(categoryProducts.map((p) => p.brand))].sort(),
    [categoryProducts]
  );

  // Step 2: Available lines for selected brand
  const lines = useMemo(() => {
    if (!brand) return [];
    const brandProducts = categoryProducts.filter((p) => p.brand === brand);
    return [...new Set(brandProducts.map((p) => p.line || 'Standard'))].sort();
  }, [categoryProducts, brand]);

  // Step 3: Available types for selected brand + line
  const typeOptions = useMemo(() => {
    if (!brand || !line) return [];
    const filtered = categoryProducts.filter(
      (p) => p.brand === brand && (p.line || 'Standard') === line
    );

    if (category === 'window') {
      const types = new Map<string, { key: string; label: string; desc: string; count: number }>();
      for (const p of filtered) {
        const attrs = p.attributes as WindowAttributes;
        const wt = attrs.windowType || 'double-hung';
        if (!types.has(wt)) {
          const info = WINDOW_TYPE_LABELS[wt] || { label: wt, desc: '' };
          types.set(wt, { key: wt, ...info, count: 0 });
        }
        types.get(wt)!.count++;
      }
      return [...types.values()];
    }

    if (category === 'sliding_glass_door') {
      // Group by config + a derived "style" from the product line
      const types = new Map<string, { key: string; label: string; desc: string; count: number }>();
      for (const p of filtered) {
        const attrs = p.attributes as SlidingDoorAttributes;
        const config = attrs.configuration || '2-panel';
        // Use product name to derive if it's hinged vs sliding
        const isHinged = attrs.operation?.startsWith('hinged') || p.name.toLowerCase().includes('hinged');
        const isInswing = attrs.operation === 'hinged-inswing' || p.name.toLowerCase().includes('inswing');
        const isOutswing = attrs.operation === 'hinged-outswing' || p.name.toLowerCase().includes('outswing');
        let key: string;
        let label: string;
        let desc: string;

        if (isHinged && isInswing) {
          key = 'hinged-inswing';
          label = 'French Hinged (Inswing)';
          desc = 'Traditional French doors that swing inward';
        } else if (isHinged && isOutswing) {
          key = 'hinged-outswing';
          label = 'French Hinged (Outswing)';
          desc = 'French doors that swing outward';
        } else {
          key = `sliding-${config}`;
          const info = DOOR_CONFIG_LABELS[config] || { label: config, desc: '' };
          label = `${info.label} Sliding`;
          desc = info.desc;
        }

        if (!types.has(key)) {
          types.set(key, { key, label, desc, count: 0 });
        }
        types.get(key)!.count++;
      }
      return [...types.values()];
    }

    if (category === 'entry_door') {
      // Group by style + glass type combination
      const types = new Map<string, { key: string; label: string; desc: string; count: number }>();
      for (const p of filtered) {
        const attrs = p.attributes as EntryDoorAttributes;
        const style = attrs.doorStyle || 'panel';
        const glass = attrs.glassType || 'none';

        const key = `${style}-${glass}`;
        const styleInfo = DOOR_STYLE_LABELS[style] || { label: style, desc: '' };
        const glassLabel = glass !== 'none' ? ` — ${GLASS_TYPE_LABELS[glass] || glass}` : ' — Solid';
        const label = `${styleInfo.label}${glassLabel}`;

        if (!types.has(key)) {
          types.set(key, { key, label, desc: styleInfo.desc, count: 0 });
        }
        types.get(key)!.count++;
      }
      return [...types.values()];
    }

    return [];
  }, [categoryProducts, brand, line, category]);

  // Step 4: Available colors for selected brand + line + type
  const colorOptions = useMemo(() => {
    if (!brand || !line || !typeKey) return [];
    return getFilteredProducts(categoryProducts, brand, line, typeKey, category)
      .reduce<Array<{ color: string; productId: string }>>((acc, p) => {
        if (!acc.find((c) => c.color === p.color)) {
          acc.push({ color: p.color, productId: p.id });
        }
        return acc;
      }, [])
      .sort((a, b) => a.color.localeCompare(b.color));
  }, [categoryProducts, brand, line, typeKey, category]);

  // Currently selected product
  const selectedProduct = categoryProducts.find((p) => p.id === selectedId);

  // Step navigation
  function goBack() {
    if (!brand) { onSelect(''); setStep('brand'); return; }
    if (step === 'line') {
      setBrand(null);
      setLine(null);
      setTypeKey(null);
      setColor(null);
      onSelect('');
      setStep('brand');
    } else if (step === 'type') {
      setLine(null);
      setTypeKey(null);
      setColor(null);
      onSelect('');
      setStep('line');
    } else if (step === 'color') {
      setTypeKey(null);
      setColor(null);
      onSelect('');
      setStep('type');
    } else if (step === 'hardware') {
      setColor(null);
      onSelect('');
      setStep('color');
    } else if (step === 'done') {
      setColor(null);
      onSelect('');
      setStep('color');
    }
  }

  function selectBrand(b: string) {
    setBrand(b);
    setLine(null);
    setTypeKey(null);
    setColor(null);
    onSelect('');

    // If only one line, skip line selection
    const brandProducts = categoryProducts.filter((p) => p.brand === b);
    const uniqueLines = [...new Set(brandProducts.map((p) => p.line || 'Standard'))];
    if (uniqueLines.length === 1) {
      setLine(uniqueLines[0]);
      setStep('type');
    } else {
      setStep('line');
    }
  }

  function selectLine(l: string) {
    setLine(l);
    setTypeKey(null);
    setColor(null);
    onSelect('');
    setStep('type');
  }

  function selectType(key: string) {
    setTypeKey(key);
    setColor(null);
    onSelect('');
    setStep('color');
  }

  function selectColor(c: string, productId: string) {
    setColor(c);

    const matches = getFilteredProducts(categoryProducts, brand!, line!, typeKey!, category).filter((p) => p.color === c);
    if (matches.length > 1) {
      onSelect('');
      setStep('hardware');
      return;
    }

    // For windows/sliding doors or doors with no hardware options, select immediately
    onSelect(productId);
    setStep('done');
  }

  // Breadcrumb
  const crumbs: Array<{ label: string; step: ConfigStep }> = [];
  if (brand) crumbs.push({ label: brand, step: 'brand' });
  if (line) crumbs.push({ label: line, step: 'line' });
  if (typeKey) {
    const typeOpt = typeOptions.find((t) => t.key === typeKey);
    crumbs.push({ label: typeOpt?.label || typeKey, step: 'type' });
  }
  if (color) crumbs.push({ label: color, step: 'color' });

  return (
    <div className="space-y-3">
      {/* Breadcrumb trail */}
      {crumbs.length > 0 && (
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back to previous product option"
            className="text-brand-brown/40 hover:text-brand-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-brand-brown/30" />}
              <button
                type="button"
                onClick={() => {
                  // Reset to that step
                  if (crumb.step === 'brand') {
                    setBrand(null); setLine(null); setTypeKey(null); setColor(null); onSelect(''); setStep('brand');
                  } else if (crumb.step === 'line') {
                    setLine(null); setTypeKey(null); setColor(null); onSelect(''); setStep('line');
                  } else if (crumb.step === 'type') {
                    setTypeKey(null); setColor(null); onSelect(''); setStep('type');
                  } else if (crumb.step === 'color') {
                    setColor(null); onSelect(''); setStep('color');
                  }
                }}
                className="text-brand-orange hover:underline font-medium"
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Step 1: Brand */}
      {step === 'brand' && (
        <div>
          <p className="text-sm font-medium text-brand-brown/60 mb-2">Select Manufacturer</p>
          <div className="grid grid-cols-1 gap-2">
            {brands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => selectBrand(b)}
                className="flex items-center justify-between p-4 rounded-xl border-2 border-brand-peach/30 hover:border-brand-orange bg-white transition-all text-left group"
              >
                <div>
                  <p className="font-semibold text-brand-brown">{b}</p>
                  <p className="text-sm text-brand-brown/50">
                    {categoryProducts.filter((p) => p.brand === b).length} products
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-brand-brown/30 group-hover:text-brand-orange transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Product Line */}
      {step === 'line' && (
        <div>
          <p className="text-sm font-medium text-brand-brown/60 mb-2">Select Product Line</p>
          <div className="grid grid-cols-1 gap-2">
            {lines.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => selectLine(l)}
                className="flex items-center justify-between p-4 rounded-xl border-2 border-brand-peach/30 hover:border-brand-orange bg-white transition-all text-left group"
              >
                <div>
                  <p className="font-semibold text-brand-brown">{l}</p>
                  <p className="text-sm text-brand-brown/50">
                    {categoryProducts.filter((p) => p.brand === brand && (p.line || 'Standard') === l).length} options
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-brand-brown/30 group-hover:text-brand-orange transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Type / Style */}
      {step === 'type' && (
        <div>
          <p className="text-sm font-medium text-brand-brown/60 mb-2">
            {category === 'window' ? 'Select Window Type' : category === 'sliding_glass_door' ? 'Select Door Style' : 'Select Door Style'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => selectType(opt.key)}
                className="flex flex-col p-4 rounded-xl border-2 border-brand-peach/30 hover:border-brand-orange bg-white transition-all text-left group"
              >
                <p className="font-semibold text-brand-brown">{opt.label}</p>
                <p className="text-sm text-brand-brown/50">{opt.desc}</p>
                <p className="text-xs text-brand-brown/30 mt-1">{opt.count} product options</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Color */}
      {step === 'color' && (
        <div>
          <p className="text-sm font-medium text-brand-brown/60 mb-2">Select Color</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {colorOptions.map((opt) => (
              <button
                key={opt.color}
                type="button"
                onClick={() => selectColor(opt.color, opt.productId)}
                className={cn(
                  'flex flex-col items-center p-3 rounded-xl border-2 transition-all',
                  color === opt.color
                    ? 'border-brand-orange bg-brand-peach-light'
                    : 'border-brand-peach/30 hover:border-brand-orange bg-white'
                )}
              >
                <div
                  className="w-12 h-12 rounded-lg border shadow-sm mb-2"
                  style={{ background: getFrameGradient(opt.color) }}
                />
                <p className="text-xs font-medium text-brand-brown text-center leading-tight">{opt.color}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'hardware' && brand && line && typeKey && color && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-brown/60">Choose a configuration</p>
          {getFilteredProducts(categoryProducts, brand, line, typeKey, category).filter((p) => p.color === color).map((p) => (
            <button key={p.id} type="button" onClick={() => { onSelect(p.id); setStep('done'); }} className="w-full rounded-xl border-2 border-brand-peach/30 p-4 text-left hover:border-brand-orange">
              <span className="block font-medium">{p.name}</span>
              <span className="text-sm text-brand-brown/60">{Object.entries(p.attributes || {}).filter(([key]) => ['sidelightConfig', 'handleFinish', 'handleSet', 'gridPattern', 'glassType'].includes(key)).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${value}`).join(' · ')}</span>
            </button>
          ))}
        </div>
      )}

      {/* Done: Show selected product summary */}
      {step === 'done' && selectedProduct && (
        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-brand-orange/50 bg-brand-peach-light/50">
          <div
            className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
            style={{ background: getFrameGradient(selectedProduct.color) }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-brown truncate">{selectedProduct.name}</p>
            <p className="text-sm text-brand-brown/50">
              {selectedProduct.color} • {selectedProduct.material}
              {category === 'entry_door' && (() => {
                const attrs = selectedProduct.attributes as EntryDoorAttributes;
                const parts: string[] = [];
                if (attrs.sidelightConfig && attrs.sidelightConfig !== 'none') {
                  parts.push(SIDELIGHT_LABELS[attrs.sidelightConfig]);
                }
                if (attrs.handleFinish) {
                  parts.push(HARDWARE_FINISH_LABELS[attrs.handleFinish] || attrs.handleFinish);
                }
                return parts.length > 0 ? ` • ${parts.join(' • ')}` : '';
              })()}
            </p>
          </div>
          <button type="button" onClick={() => { setBrand(null); setLine(null); setTypeKey(null); setColor(null); onSelect(''); setStep('brand'); }} className="text-sm font-medium text-brand-orange hover:underline">Change</button>
        </div>
      )}
    </div>
  );
}

// Helper: filter products by brand, line, type key, and category
function getFilteredProducts(
  products: Product[],
  brand: string,
  line: string,
  typeKey: string,
  category: ProductCategory
): Product[] {
  return products.filter((p) => {
    if (p.brand !== brand) return false;
    if ((p.line || 'Standard') !== line) return false;
    if (p.category !== category) return false;

    if (category === 'window') {
      const attrs = p.attributes as WindowAttributes;
      return (attrs.windowType || 'double-hung') === typeKey;
    }

    if (category === 'sliding_glass_door') {
      const attrs = p.attributes as SlidingDoorAttributes;
      const config = attrs.configuration || '2-panel';
      const isHinged = attrs.operation?.startsWith('hinged') || p.name.toLowerCase().includes('hinged');
      const isInswing = attrs.operation === 'hinged-inswing' || p.name.toLowerCase().includes('inswing');
      const isOutswing = attrs.operation === 'hinged-outswing' || p.name.toLowerCase().includes('outswing');

      if (typeKey === 'hinged-inswing') return isHinged && isInswing;
      if (typeKey === 'hinged-outswing') return isHinged && isOutswing;
      return !isHinged && `sliding-${config}` === typeKey;
    }

    if (category === 'entry_door') {
      const attrs = p.attributes as EntryDoorAttributes;
      const style = attrs.doorStyle || 'panel';
      const glass = attrs.glassType || 'none';
      return `${style}-${glass}` === typeKey;
    }

    return false;
  });
}
