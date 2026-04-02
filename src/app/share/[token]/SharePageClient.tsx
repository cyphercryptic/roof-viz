'use client';

import { BeforeAfterSlider } from '@/components/visualize/BeforeAfterSlider';

interface SharePageClientProps {
  beforeUrl: string;
  afterUrl: string;
  productName: string;
  productBrand: string;
  productColor: string;
  customerName: string | null;
  companyName: string;
  whiteLabel: boolean;
  primaryColor: string;
  secondaryColor: string;
  hidePoweredBy: boolean;
  logoUrl: string | null;
}

export function SharePageClient({
  beforeUrl,
  afterUrl,
  productName,
  productBrand,
  productColor,
  customerName,
  companyName,
  whiteLabel,
  primaryColor,
  secondaryColor,
  hidePoweredBy,
  logoUrl,
}: SharePageClientProps) {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="border-b border-brand-peach/30 bg-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {whiteLabel && logoUrl ? (
              <img
                src={logoUrl}
                alt={`${companyName} logo`}
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${!whiteLabel ? 'bg-brand-orange' : ''}`}
                style={whiteLabel ? { backgroundColor: primaryColor } : undefined}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            )}
            <span className="font-bold text-brand-brown">{companyName}</span>
          </div>
          {!(whiteLabel && hidePoweredBy) && (
            <span className="text-xs text-brand-brown/40">Powered by RoofViz</span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {customerName && (
          <p className="text-sm text-brand-brown/50">Visualization for {customerName}</p>
        )}

        <BeforeAfterSlider beforeUrl={beforeUrl} afterUrl={afterUrl} />

        <div className="flex items-center justify-between px-1">
          <div>
            <p className="font-semibold text-brand-brown">{productName}</p>
            <p className="text-sm text-brand-brown/50">
              {productBrand} - {productColor}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-brand-brown/30 pt-4">
          Drag the slider to compare before & after
        </p>
      </main>
    </div>
  );
}
