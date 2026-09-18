'use client';
import { useState } from 'react';
import Image from 'next/image';
import { DoorOpen, House, PanelsTopLeft, Sparkles } from 'lucide-react';
import styles from './Landing.module.css';
const examples = [
  { key: 'roof', label: 'Roofing', icon: House, title: 'A new perspective on the whole home.', detail: 'Explore a fresh roofing finish.', before: '/examples/roof-before.png', after: '/examples/roof-after.png', alt: 'a gray ranch home with a shingle roof' },
  { key: 'windows', label: 'Windows', icon: PanelsTopLeft, title: 'Small details. A different outlook.', detail: 'Compare white frames with a dark bronze look.', before: '/examples/windows-before.png', after: '/examples/windows-after.png', alt: 'three windows on a gray exterior wall' },
  { key: 'doors', label: 'Doors', icon: DoorOpen, title: 'Open up another possibility.', detail: 'See a darker finish on a set of patio doors.', before: '/examples/doors-before.png', after: '/examples/doors-after.png', alt: 'patio doors viewed from inside a room' },
];
export default function HeroVisual() {
  const [activeKey, setActiveKey] = useState('roof');
  const [showPreview, setShowPreview] = useState(true);
  const active = examples.find((example) => example.key === activeKey) ?? examples[0];
  return (
    <div className={styles.demo}>
      <div className={styles.demoToolbar}><div className={styles.demoTabs} aria-label="Example project type">{examples.map((example) => <button key={example.key} type="button" aria-pressed={activeKey === example.key} onClick={() => setActiveKey(example.key)}><example.icon size={17} /><span>{example.label}</span></button>)}</div><span className={styles.demoHint}>Explore an example. No account needed.</span></div>
      <div className={`${styles.demoStage} ${active.key === 'doors' ? styles.doorStage : ''}`}>
        <Image key={`${active.key}-${showPreview}`} src={showPreview ? active.after : active.before} alt={`${showPreview ? 'AI visualization of' : 'Original photo of'} ${active.alt}`} fill sizes="(max-width: 800px) 100vw, 1248px" preload={active.key === 'roof'} className={styles.demoImage} />
        <div className={styles.imageBadge}>{showPreview && <Sparkles size={14} />}{showPreview ? 'AI preview' : 'Original photo'}</div>
        <div className={styles.demoCaption}><p>{active.title}</p><span>{active.detail}</span></div>
        <div className={styles.compareControl} aria-label="Compare original and visualization"><button type="button" aria-pressed={!showPreview} onClick={() => setShowPreview(false)}>Original</button><button type="button" aria-pressed={showPreview} onClick={() => setShowPreview(true)}>AI preview</button></div>
      </div>
      <div className={styles.demoFootnote}><span>Sample visualization</span><p>Pre-generated examples. Actual results vary; confirm your selection with physical product samples.</p></div>
    </div>
  );
}
