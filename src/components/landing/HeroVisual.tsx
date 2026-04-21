// Editorial hero visual — a stylized "plate" from an architectural catalog
// showing a gabled roof: before (aged 3-tab), after (rich architectural),
// and a shingle color swatch strip. All SVG + CSS — no stock photography.

export default function HeroVisual() {
  return (
    <div className="relative w-full h-full">
      {/* Warm halo bloom behind the card */}
      <div className="absolute -inset-8 warm-halo rounded-[40px] blur-2xl opacity-80" />

      {/* Outer card — paper with grain */}
      <div className="relative grain rounded-[14px] overflow-hidden bg-brand-cream-soft border border-brand-brown/15 shadow-[0_30px_80px_-20px_rgba(62,35,24,0.35),0_8px_24px_-10px_rgba(245,128,37,0.22)]">
        {/* Metadata strip at top */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-brand-brown/12">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-brand-brown-mute">
            Plate N° 01 · Field Study
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-peach-deep" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-wheat" />
          </div>
        </div>

        {/* Before / After split */}
        <div className="grid grid-cols-2 divide-x divide-brand-brown/12">
          {/* BEFORE — faded sky + aged 3-tab gray shingles */}
          <div className="relative aspect-[5/6] overflow-hidden bg-gradient-to-b from-[#E8DDC6] via-[#E3D4BA] to-[#D7C4A5]">
            <div className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-brown/55">
              Before
            </div>
            <svg
              viewBox="0 0 200 240"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <defs>
                {/* Faded gray 3-tab pattern */}
                <pattern id="oldShingle" x="0" y="0" width="20" height="8" patternUnits="userSpaceOnUse">
                  <rect width="20" height="8" fill="#9C9C95" />
                  <line x1="0" y1="0" x2="20" y2="0" stroke="#7D7D76" strokeWidth="0.4" />
                  <line x1="0" y1="8" x2="20" y2="8" stroke="#7D7D76" strokeWidth="0.4" />
                  <line x1="6" y1="0" x2="6" y2="8" stroke="#7D7D76" strokeWidth="0.3" opacity="0.7" />
                  <line x1="14" y1="0" x2="14" y2="8" stroke="#7D7D76" strokeWidth="0.3" opacity="0.7" />
                </pattern>
                <linearGradient id="oldFade" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#B8B7B0" />
                  <stop offset="1" stopColor="#8E8C83" />
                </linearGradient>
              </defs>

              {/* Horizon + ground suggestion */}
              <rect x="0" y="180" width="200" height="60" fill="#C9B78F" opacity="0.4" />

              {/* House silhouette */}
              <g>
                {/* Wall */}
                <rect x="20" y="120" width="160" height="80" fill="#EEE2C2" />
                {/* Gable roof */}
                <polygon points="10,120 100,48 190,120" fill="url(#oldFade)" stroke="#4F4E47" strokeOpacity="0.35" strokeWidth="0.8" />
                {/* Shingle texture over roof */}
                <polygon points="10,120 100,48 190,120" fill="url(#oldShingle)" opacity="0.9" />
                {/* Shingle courses (horizontal) */}
                {[60, 72, 84, 96, 108].map((y) => (
                  <line key={y} x1={20 + (y - 48) * 0.5} y1={y} x2={180 - (y - 48) * 0.5} y2={y} stroke="#6A6862" strokeOpacity="0.5" strokeWidth="0.35" />
                ))}
                {/* Ridge line */}
                <line x1="10" y1="120" x2="190" y2="120" stroke="#3F3D38" strokeOpacity="0.45" strokeWidth="0.8" />
                {/* Trim / eave */}
                <rect x="20" y="118" width="160" height="3" fill="#B4A07A" opacity="0.8" />
                {/* Door */}
                <rect x="88" y="155" width="24" height="45" fill="#7A5A3D" opacity="0.7" />
                {/* Windows */}
                <rect x="40" y="140" width="24" height="22" fill="#D3C59F" stroke="#6A5637" strokeOpacity="0.5" strokeWidth="0.4" />
                <rect x="136" y="140" width="24" height="22" fill="#D3C59F" stroke="#6A5637" strokeOpacity="0.5" strokeWidth="0.4" />
                {/* Subtle aging spots */}
                <circle cx="70" cy="95" r="3" fill="#6C6A62" opacity="0.35" />
                <circle cx="130" cy="80" r="2.5" fill="#6C6A62" opacity="0.3" />
                <circle cx="115" cy="105" r="2" fill="#6C6A62" opacity="0.3" />
              </g>
            </svg>
          </div>

          {/* AFTER — warm sky + rich charcoal architectural shingles */}
          <div className="relative aspect-[5/6] overflow-hidden bg-gradient-to-b from-[#F4D9A8] via-[#EAC580] to-[#D9A757]">
            <div className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-orange">
              After
            </div>
            <svg
              viewBox="0 0 200 240"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <defs>
                {/* Architectural laminate shingle pattern */}
                <pattern id="newShingle" x="0" y="0" width="24" height="10" patternUnits="userSpaceOnUse">
                  <rect width="24" height="10" fill="#2E2925" />
                  <rect x="0" y="0" width="24" height="10" fill="url(#shingleVar)" opacity="0.85" />
                  <line x1="0" y1="0" x2="24" y2="0" stroke="#12100E" strokeWidth="0.5" />
                  <line x1="4" y1="0" x2="4" y2="10" stroke="#1C1915" strokeWidth="0.4" />
                  <line x1="16" y1="0" x2="16" y2="10" stroke="#1C1915" strokeWidth="0.4" />
                </pattern>
                <linearGradient id="shingleVar" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#3B332D" />
                  <stop offset="0.5" stopColor="#292420" />
                  <stop offset="1" stopColor="#453B33" />
                </linearGradient>
                <linearGradient id="roofShadow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#3A332D" />
                  <stop offset="1" stopColor="#1E1A17" />
                </linearGradient>
              </defs>

              {/* Warm ground */}
              <rect x="0" y="180" width="200" height="60" fill="#B8833F" opacity="0.3" />

              {/* House */}
              <g>
                <rect x="20" y="120" width="160" height="80" fill="#F6E2BA" />
                {/* Gable roof base */}
                <polygon points="10,120 100,48 190,120" fill="url(#roofShadow)" />
                {/* Shingle texture */}
                <polygon points="10,120 100,48 190,120" fill="url(#newShingle)" opacity="0.95" />
                {/* Course lines — crisper */}
                {[60, 72, 84, 96, 108].map((y) => (
                  <line key={y} x1={20 + (y - 48) * 0.5} y1={y} x2={180 - (y - 48) * 0.5} y2={y} stroke="#0C0A08" strokeOpacity="0.55" strokeWidth="0.4" />
                ))}
                {/* Ridge cap — slightly darker */}
                <line x1="10" y1="120" x2="190" y2="120" stroke="#0C0A08" strokeOpacity="0.65" strokeWidth="1" />
                {/* Drip edge — warm amber accent */}
                <rect x="20" y="118" width="160" height="3" fill="#F58025" opacity="0.5" />
                {/* Door */}
                <rect x="88" y="155" width="24" height="45" fill="#5E3920" />
                <circle cx="106" cy="178" r="0.8" fill="#F58025" />
                {/* Windows — cleaner */}
                <rect x="40" y="140" width="24" height="22" fill="#E8D29D" stroke="#3E2318" strokeOpacity="0.6" strokeWidth="0.5" />
                <line x1="52" y1="140" x2="52" y2="162" stroke="#3E2318" strokeOpacity="0.35" strokeWidth="0.3" />
                <rect x="136" y="140" width="24" height="22" fill="#E8D29D" stroke="#3E2318" strokeOpacity="0.6" strokeWidth="0.5" />
                <line x1="148" y1="140" x2="148" y2="162" stroke="#3E2318" strokeOpacity="0.35" strokeWidth="0.3" />
                {/* Subtle warm highlight on roof crown */}
                <polygon points="90,58 100,48 110,58" fill="#F58025" opacity="0.15" />
              </g>
            </svg>
          </div>
        </div>

        {/* Swatch strip */}
        <div className="px-5 py-4 border-t border-brand-brown/12 bg-brand-cream">
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-brand-brown-mute mb-2.5">
            Specification — Timberline HDZ Architectural
          </div>
          <div className="flex items-center gap-2">
            {[
              { c: "#2B2623", n: "Charcoal" },
              { c: "#5D5048", n: "Weathered" },
              { c: "#8A7157", n: "Driftwood" },
              { c: "#A84D06", n: "Barkwood" },
              { c: "#E8D29D", n: "Shakewood", ring: true },
            ].map((s) => (
              <div key={s.n} className="flex-1 flex flex-col items-start">
                <div
                  className={`w-full h-7 rounded-[2px] ${s.ring ? "ring-1 ring-brand-brown/15" : ""}`}
                  style={{ background: s.c }}
                />
                <div className="mt-1.5 font-mono text-[8px] tracking-[0.15em] uppercase text-brand-brown-soft">
                  {s.n}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative "new / 2026" corner marker */}
      <div className="absolute -top-4 -right-4 hidden sm:block drift">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border border-brand-brown/30 flex items-center justify-center bg-brand-cream-soft/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="font-display italic text-brand-orange text-2xl leading-none">
                new
              </div>
              <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-brand-brown-soft mt-0.5">
                2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
