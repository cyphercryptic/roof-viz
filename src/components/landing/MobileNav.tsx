'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import styles from './Landing.module.css';
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.mobileNav}>
      <button type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X size={24} /> : <Menu size={24} />}</button>
      {open && <div id="mobile-navigation" className={styles.mobileMenu} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}><a href="#examples" onClick={() => setOpen(false)}>Explore examples</a><a href="#workflow" onClick={() => setOpen(false)}>How it works</a><a href="#teams" onClick={() => setOpen(false)}>For your team</a><Link href="/login">Sign in</Link><Link href="/signup" className={styles.button}>Create your workspace</Link></div>}
    </div>
  );
}
