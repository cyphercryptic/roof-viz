'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '#how', label: 'How it works' },
  { href: '#why', label: 'Why' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 rounded-md text-brand-brown hover:bg-brand-peach-light transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-brand-cream border-b border-brand-brown/15 shadow-[0_20px_40px_-10px_rgba(62,35,24,0.2)] z-50">
          <div className="px-4 py-5 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-3 font-mono text-[10px] tracking-[0.24em] uppercase text-brand-brown hover:text-brand-orange hover:bg-brand-peach-light/60 transition-colors rounded-md"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 mt-3 border-t border-brand-brown/15 space-y-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 font-mono text-[10px] tracking-[0.24em] uppercase text-brand-brown hover:text-brand-orange transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block px-5 py-3 font-mono text-[10px] tracking-[0.24em] uppercase text-brand-cream bg-brand-brown hover:bg-brand-orange transition-colors text-center rounded-full"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
