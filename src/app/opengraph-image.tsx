import { ImageResponse } from 'next/og';

export const alt = 'ExteriorViz — Roofing, windows and doors. One connected workspace.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function SocialPreview() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F7FAFC', color: '#173047', padding: 70 }}>
      <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>ExteriorViz</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, lineHeight: 1.08, maxWidth: 960 }}>Help them see the possibilities.</div>
        <div style={{ display: 'flex', fontSize: 30, color: '#587083' }}>Roofing, windows and doors on their own home.</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 23, color: '#1F587A', borderTop: '2px solid #D5E1E9', paddingTop: 28 }}><span>One connected visualization workspace</span><span>By Bar9 AI</span></div>
    </div>,
    size,
  );
}
