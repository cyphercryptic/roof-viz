'use client';

import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

export function BeforeAfterSlider({ beforeUrl, afterUrl }: BeforeAfterSliderProps) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-brand-peach/30 shadow-lg">
      <ReactCompareSlider
        handle={
          <ReactCompareSliderHandle
            buttonStyle={{
              width: 44,
              height: 44,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(255,255,255,0.85)',
              border: '2px solid rgba(0,0,0,0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            linesStyle={{
              width: 3,
              opacity: 0.5,
            }}
          />
        }
        itemOne={
          <ReactCompareSliderImage
            src={beforeUrl}
            alt="Original house"
            style={{ objectFit: 'cover' }}
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={afterUrl}
            alt="House with new roof"
            style={{ objectFit: 'cover' }}
          />
        }
        style={{ width: '100%', aspectRatio: '4/3' }}
      />
      <div className="flex justify-between px-4 py-2 bg-brand-cream text-sm font-medium text-brand-brown/60">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  );
}
