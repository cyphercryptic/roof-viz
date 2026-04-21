import Link from 'next/link';
import {
  Camera,
  Palette,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Users,
  Share2,
  BarChart3,
  Paintbrush,
  Check,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import MobileNav from '@/components/landing/MobileNav';
import HeroVisual from '@/components/landing/HeroVisual';
import { DotRule, SectionNumber } from '@/components/landing/Ornament';

/* ------------------------------------------------------------------ */
/*  Plan data (mirrored from billing + stripe for static rendering)   */
/* ------------------------------------------------------------------ */
const PLANS = [
  {
    key: 'free',
    name: 'Free',
    priceLabel: '$0',
    priceUnit: '/ mo',
    description: 'Try it out',
    features: ['5 visualizations/month', '1 team member', 'Standard quality'],
    highlighted: false,
  },
  {
    key: 'pay_per_use',
    name: 'Pay as you go',
    priceLabel: '$0.75',
    priceUnit: '/ viz',
    description: 'No commitment',
    features: [
      'Unlimited visualizations',
      '1 team member',
      'High quality',
      'Pay only for what you use',
    ],
    highlighted: false,
  },
  {
    key: 'starter',
    name: 'Starter',
    priceLabel: '$44',
    priceUnit: '/ mo',
    description: 'For solo reps',
    features: [
      '100 visualizations/month',
      '3 team members',
      'High quality',
      'Email support',
    ],
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    priceLabel: '$99',
    priceUnit: '/ mo',
    description: 'Most popular',
    features: [
      '250 visualizations/month',
      '10 team members',
      'High quality',
      'Priority support',
      'Gallery sharing',
      'PDF proposals',
    ],
    highlighted: true,
  },
  {
    key: 'business',
    name: 'Business',
    priceLabel: '$299',
    priceUnit: '/ mo',
    description: 'For growing teams',
    features: [
      '1,000 visualizations/month',
      'Unlimited team members',
      'High quality',
      'Dedicated support',
      'Gallery sharing',
      'PDF proposals',
      'Analytics dashboard',
    ],
    highlighted: false,
  },
  {
    key: 'business_pro',
    name: 'Business Pro',
    priceLabel: '$1,199',
    priceUnit: '/ mo',
    description: 'Enterprise scale',
    features: [
      '5,000 visualizations/month',
      'Unlimited team members',
      'High quality',
      'Dedicated support',
      'Gallery sharing',
      'PDF proposals',
      'Analytics dashboard',
      'White-label branding',
    ],
    highlighted: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Features grid data                                                */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI visualization',
    description:
      'Generate photorealistic roof renderings in seconds. Show the homeowner exactly what they are buying — not a sample board, not a brochure photo.',
    plans: 'All plans',
  },
  {
    icon: BookOpen,
    title: 'Product catalog',
    description:
      'Every shingle line your team sells — Timberline HDZ, Landmark, Duration, Barkwood, Estate Gray — preloaded and ready for a homeowner to flip through.',
    plans: 'All plans',
  },
  {
    icon: ImageIcon,
    title: 'Before & after gallery',
    description:
      'Every visualization is saved, organized, and searchable. Pull up past jobs mid-appointment. Compare side-by-side on the kitchen counter.',
    plans: 'All plans',
  },
  {
    icon: FileText,
    title: 'Branded proposals',
    description:
      'Generate PDF proposals with the visualization, product specs, and pricing — in your branding, ready to leave behind.',
    plans: 'Pro and above',
  },
  {
    icon: Users,
    title: 'Team management',
    description:
      'Invite your reps, assign roles, and track who is closing the most. One subscription, your whole crew.',
    plans: 'Starter and above',
  },
  {
    icon: Share2,
    title: 'Share links',
    description:
      'Send a branded, no-login link to the homeowner after the visit. They show the spouse. You stay top of mind.',
    plans: 'Pro and above',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Visualizations per rep, per week. Which shingles convert. Which reps are pulling weight. Real numbers, not hunches.',
    plans: 'Business and above',
  },
  {
    icon: Paintbrush,
    title: 'White-label',
    description:
      'Replace RoofViz branding with your own logo, colors, and custom domain. A fully private experience for your crew.',
    plans: 'Business Pro',
  },
];

/* ------------------------------------------------------------------ */
/*  Steps data                                                        */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    number: '01',
    icon: Camera,
    title: 'Upload a home photo',
    description:
      'Snap the house from the curb on your phone. Upload existing site photos. Our AI handles the rest.',
  },
  {
    number: '02',
    icon: Palette,
    title: 'Pick the shingle',
    description:
      'Choose from your product catalog — brand, profile, color. Configured like a real order the homeowner is about to place.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Hand them the after',
    description:
      'Seconds later, a photorealistic rendering of the new roof on the actual home. Share it, download it, build the proposal.',
  },
];

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream text-brand-brown selection:bg-brand-orange selection:text-brand-cream">
      {/* ============================================================ */}
      {/*  Top hairline + masthead                                     */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-brand-cream/85 backdrop-blur-md border-b border-brand-brown/15">
        {/* Ultra-fine top rule — editorial detail */}
        <div className="h-[3px] w-full bg-gradient-to-r from-brand-orange via-brand-peach-deep to-brand-wheat" />
        <nav className="relative mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo — serif wordmark with orange period */}
          <Link href="/" className="flex items-baseline gap-1 group">
            <span className="font-display font-medium text-2xl tracking-tight text-brand-brown">
              RoofViz
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange translate-y-[-2px]" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {[
              { href: '#how', label: 'How it works' },
              { href: '#why', label: 'Why' },
              { href: '#features', label: 'Features' },
              { href: '#pricing', label: 'Pricing' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-[10px] tracking-[0.24em] uppercase text-brand-brown/65 hover:text-brand-orange transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="font-mono text-[10px] tracking-[0.24em] uppercase text-brand-brown/65 hover:text-brand-orange transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-brown px-5 py-2.5 font-mono text-[10px] tracking-[0.24em] uppercase text-brand-cream hover:bg-brand-orange transition-colors"
            >
              Start free
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <MobileNav />
        </nav>
      </header>

      <main className="flex-1">
        {/* ============================================================ */}
        {/*  HERO — editorial, asymmetric                                */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden">
          {/* Ambient warm halo */}
          <div className="pointer-events-none absolute inset-0 warm-halo" />
          {/* Subtle grain */}
          <div className="pointer-events-none absolute inset-0 grain" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left — editorial headline */}
              <div className="lg:col-span-7 rise rise-1">
                <div className="mb-8 flex items-center gap-4">
                  <SectionNumber n="00" label="AI for Roofing Sales" />
                </div>

                <h1 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.95] tracking-[-0.02em] text-brand-brown">
                  <span className="block">Walk in with</span>
                  <span className="block">
                    the{' '}
                    <em className="not-italic font-display italic font-normal text-brand-orange relative">
                      after
                      <svg
                        className="absolute -bottom-2 left-0 w-full"
                        viewBox="0 0 240 10"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <path
                          d="M2,6 Q60,1 120,5 T238,4"
                          stroke="#F58025"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </em>
                    ,
                  </span>
                  <span className="block text-brand-brown-soft font-extralight">
                    not a sample board.
                  </span>
                </h1>

                <p className="mt-8 max-w-xl text-lg sm:text-xl text-brand-brown-soft leading-relaxed">
                  RoofViz is how modern roofing reps run appointments. Snap a
                  curb-side photo, pick a shingle, hand back a photorealistic
                  rendering of the new roof — in under a minute.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 rise rise-3">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-3 rounded-full bg-brand-orange px-7 py-4 font-sans text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(245,128,37,0.6)] hover:bg-brand-orange-dark transition-all hover:shadow-[0_14px_38px_-10px_rgba(245,128,37,0.75)]"
                  >
                    Start free — 5/month
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#how"
                    className="group inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-brand-brown hover:text-brand-orange transition-colors"
                  >
                    See how it works
                    <span className="h-px w-8 bg-brand-brown group-hover:bg-brand-orange transition-colors" />
                  </Link>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] tracking-[0.2em] uppercase text-brand-brown-mute rise rise-4">
                  <span>No credit card</span>
                  <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                  <span>5 free renders / month</span>
                  <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              {/* Right — hero visual */}
              <div className="lg:col-span-5 rise rise-2">
                <div className="relative max-w-md mx-auto lg:max-w-none">
                  <HeroVisual />
                </div>
              </div>
            </div>
          </div>

          {/* Marquee-style brand strip — shingle brands the catalog supports */}
          <div className="relative border-y border-brand-brown/15 bg-brand-cream-soft">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8">
              <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-brand-brown-mute whitespace-nowrap">
                Catalog includes
              </span>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 font-display text-lg sm:text-xl italic text-brand-brown-soft/90">
                <span>GAF</span>
                <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                <span>CertainTeed</span>
                <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                <span>Owens Corning</span>
                <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                <span>Atlas</span>
                <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                <span>IKO</span>
                <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                <span>TAMKO</span>
                <span className="h-1 w-1 rounded-full bg-brand-peach-deep" />
                <span>Malarkey</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  HOW IT WORKS                                                */}
        {/* ============================================================ */}
        <section id="how" className="relative py-24 sm:py-32 scroll-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-20">
              <SectionNumber n="01" label="The Workflow" />
              <h2 className="mt-5 font-display font-light text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-[-0.02em] text-brand-brown">
                Three steps.{' '}
                <em className="font-display italic text-brand-peach-deep">
                  Under a minute.
                </em>
              </h2>
              <p className="mt-6 text-lg text-brand-brown-soft leading-relaxed">
                No learning curve. Built to be run curb-side, on a phone, with
                a homeowner reading over your shoulder.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 md:gap-x-14">
              {STEPS.map((step, i) => (
                <div key={step.number} className="relative group">
                  {/* Top rule */}
                  <div className="h-px w-full bg-brand-brown/18 mb-8" />

                  {/* Large numeric */}
                  <div className="flex items-start justify-between mb-10">
                    <div className="font-display italic font-extralight text-[6.5rem] leading-none text-brand-orange/90">
                      {step.number}
                    </div>
                    <div className="mt-4 w-12 h-12 flex items-center justify-center rounded-full border border-brand-brown/20 group-hover:border-brand-orange group-hover:rotate-6 transition-all">
                      <step.icon className="h-5 w-5 text-brand-brown group-hover:text-brand-orange transition-colors" />
                    </div>
                  </div>

                  <h3 className="font-display font-normal text-2xl sm:text-3xl leading-tight text-brand-brown tracking-[-0.01em] mb-4">
                    {step.title}
                  </h3>
                  <p className="text-brand-brown-soft leading-relaxed text-[15px] max-w-sm">
                    {step.description}
                  </p>

                  {/* Hidden visual cue on last step */}
                  {i === STEPS.length - 1 && (
                    <div className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-brand-orange">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                      Deal closes
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  WHY IT WORKS — editorial pull quote + benefits              */}
        {/* ============================================================ */}
        <section
          id="why"
          className="relative py-24 sm:py-32 bg-brand-brown text-brand-cream overflow-hidden scroll-mt-24"
        >
          {/* Warm vignette */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at 80% 20%, rgba(245,128,37,0.45), transparent 60%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 grain opacity-40" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-16">
              <div className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.32em] uppercase text-brand-wheat">
                <span className="text-brand-peach font-medium">N° 02</span>
                <span className="h-px w-8 bg-brand-wheat/50" />
                <span>On Selling Roofs</span>
              </div>
            </div>

            {/* Pull quote */}
            <blockquote className="max-w-5xl mb-20">
              <p className="font-display font-extralight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-[-0.02em] text-brand-cream text-balance">
                A homeowner doesn&rsquo;t buy a{' '}
                <em className="font-display italic text-brand-peach">shingle</em>.
                {' '}They buy the{' '}
                <em className="font-display italic text-brand-peach">feeling</em>
                {' '}of pulling into their driveway and seeing it{' '}
                <em className="font-display italic text-brand-peach">
                  finally finished
                </em>
                .
              </p>
            </blockquote>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-cream/15">
              {[
                {
                  label: 'In-home, in-hand',
                  body:
                    'Built for iPhone and iPad during the kitchen-table consult. Snap, configure, render, hand back — without losing the room.',
                },
                {
                  label: 'Your catalog, your brand',
                  body:
                    'Load every shingle your team sells. Render in your colors. Proposals leave with your logo on them, not ours.',
                },
                {
                  label: 'The whole crew, one roof',
                  body:
                    'Invite every rep. Track who’s running visualizations. Build a shared gallery of closed jobs for referrals and door-knocks.',
                },
              ].map((b, i) => (
                <div key={b.label} className="bg-brand-brown p-10 sm:p-12 relative">
                  <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-brand-peach mb-5">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-display font-normal text-2xl text-brand-cream mb-4 tracking-[-0.01em]">
                    {b.label}
                  </h3>
                  <p className="text-brand-cream/70 leading-relaxed text-[15px]">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FEATURES — magazine grid                                    */}
        {/* ============================================================ */}
        <section id="features" className="relative py-24 sm:py-32 scroll-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <SectionNumber n="03" label="The Features" />
                <h2 className="mt-5 font-display font-light text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-[-0.02em] text-brand-brown">
                  Everything you need
                  <br />
                  <em className="font-display italic text-brand-peach-deep">
                    and nothing you don&rsquo;t.
                  </em>
                </h2>
              </div>
              <p className="max-w-sm text-brand-brown-soft leading-relaxed">
                AI rendering is the center. Everything else is what makes it
                usable by a real crew on a real Tuesday.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-brand-brown/15 border border-brand-brown/15 rounded-xl overflow-hidden">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group relative bg-brand-cream-soft p-7 hover:bg-brand-ivory transition-colors"
                >
                  <f.icon
                    className="h-6 w-6 text-brand-orange mb-5 group-hover:rotate-[-6deg] transition-transform"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-display font-normal text-xl text-brand-brown tracking-[-0.01em] mb-2.5">
                    {f.title}
                  </h3>
                  <p className="text-[14px] text-brand-brown-soft leading-relaxed mb-5">
                    {f.description}
                  </p>
                  <span className="inline-block font-mono text-[9px] tracking-[0.22em] uppercase text-brand-orange-dark border border-brand-peach-deep/40 rounded-full px-2.5 py-1">
                    {f.plans}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  PRICING                                                     */}
        {/* ============================================================ */}
        <section
          id="pricing"
          className="relative py-24 sm:py-32 bg-brand-wheat-soft scroll-mt-24 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 grain opacity-50" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-20 text-center mx-auto">
              <SectionNumber n="04" label="Pricing" />
              <h2 className="mt-5 font-display font-light text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-[-0.02em] text-brand-brown">
                Start free.{' '}
                <em className="font-display italic text-brand-orange">
                  Grow into it.
                </em>
              </h2>
              <p className="mt-6 text-lg text-brand-brown-soft leading-relaxed">
                Five free renderings a month, forever. Pay as you go when the
                work is lumpy. Subscribe when it&rsquo;s steady.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                    plan.highlighted
                      ? 'bg-brand-brown text-brand-cream ring-1 ring-brand-orange shadow-[0_30px_60px_-20px_rgba(62,35,24,0.35)]'
                      : 'bg-brand-cream-soft border border-brand-brown/15 hover:border-brand-peach-deep/50'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-7">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1 font-mono text-[9px] tracking-[0.24em] uppercase text-brand-cream shadow-lg">
                        <span className="h-1 w-1 rounded-full bg-brand-cream" />
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3
                      className={`font-display font-normal text-2xl tracking-[-0.01em] ${
                        plan.highlighted ? 'text-brand-cream' : 'text-brand-brown'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`mt-1 font-mono text-[10px] tracking-[0.24em] uppercase ${
                        plan.highlighted
                          ? 'text-brand-peach'
                          : 'text-brand-brown-mute'
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-7 flex items-baseline gap-2">
                    <span
                      className={`font-display font-light text-5xl sm:text-6xl tracking-[-0.03em] leading-none ${
                        plan.highlighted ? 'text-brand-cream' : 'text-brand-brown'
                      }`}
                    >
                      {plan.priceLabel}
                    </span>
                    <span
                      className={`font-mono text-xs tracking-wider ${
                        plan.highlighted
                          ? 'text-brand-cream/60'
                          : 'text-brand-brown-mute'
                      }`}
                    >
                      {plan.priceUnit}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2.5 text-sm ${
                          plan.highlighted
                            ? 'text-brand-cream/85'
                            : 'text-brand-brown-soft'
                        }`}
                      >
                        <Check
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            plan.highlighted
                              ? 'text-brand-peach'
                              : 'text-brand-orange'
                          }`}
                          strokeWidth={2}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`inline-flex items-center justify-center gap-2 rounded-full py-3 font-mono text-[10px] tracking-[0.24em] uppercase transition-colors ${
                      plan.highlighted
                        ? 'bg-brand-orange text-white hover:bg-brand-orange-dark'
                        : 'border border-brand-brown/30 text-brand-brown hover:bg-brand-brown hover:text-brand-cream hover:border-brand-brown'
                    }`}
                  >
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  CLOSING CTA                                                 */}
        {/* ============================================================ */}
        <section className="relative py-24 sm:py-32 bg-brand-brown-deep overflow-hidden">
          {/* Layered gradients for depth */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(245,128,37,0.35), transparent 60%), radial-gradient(ellipse 80% 80% at 80% 90%, rgba(224,155,99,0.22), transparent 60%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 grain opacity-40" />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.32em] uppercase text-brand-peach mb-8">
              <span className="h-px w-8 bg-brand-peach/50" />
              <span>Start today</span>
              <span className="h-px w-8 bg-brand-peach/50" />
            </div>
            <h2 className="font-display font-extralight text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-brand-cream">
              Your next appointment
              <br />
              is{' '}
              <em className="font-display italic text-brand-peach">
                already warmer
              </em>
              .
            </h2>
            <p className="mt-8 max-w-xl mx-auto text-lg text-brand-cream/70 leading-relaxed">
              Five free visualizations every month. No card, no commitment —
              just better appointments.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 rounded-full bg-brand-cream px-8 py-4 font-sans text-sm font-medium text-brand-brown shadow-[0_14px_40px_-10px_rgba(0,0,0,0.4)] hover:bg-brand-wheat transition-colors"
              >
                Start free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="font-mono text-[10px] tracking-[0.28em] uppercase text-brand-cream/70 hover:text-brand-cream transition-colors"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/*  FOOTER — colophon                                           */}
      {/* ============================================================ */}
      <footer className="relative bg-brand-brown text-brand-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Masthead */}
            <div className="md:col-span-5">
              <Link href="/" className="inline-flex items-baseline gap-1">
                <span className="font-display font-medium text-3xl tracking-tight text-brand-cream">
                  RoofViz
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-orange translate-y-[-4px]" />
              </Link>
              <p className="mt-5 max-w-sm text-brand-cream/55 leading-relaxed text-sm">
                AI-powered roof visualization — built for the reps, estimators,
                and owners who sell shingles every day.
              </p>

              <div className="mt-8">
                <DotRule className="w-40 !gap-2 !opacity-50" />
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-peach mb-5">
                  Product
                </div>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#how" className="text-brand-cream/70 hover:text-brand-cream transition-colors">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="text-brand-cream/70 hover:text-brand-cream transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="text-brand-cream/70 hover:text-brand-cream transition-colors">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-peach mb-5">
                  Account
                </div>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/login" className="text-brand-cream/70 hover:text-brand-cream transition-colors">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="text-brand-cream/70 hover:text-brand-cream transition-colors">
                      Start free
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-peach mb-5">
                  Legal
                </div>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/terms" className="text-brand-cream/70 hover:text-brand-cream transition-colors">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-brand-cream/70 hover:text-brand-cream transition-colors">
                      Privacy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-brand-cream/12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brand-cream/45">
              © {new Date().getFullYear()} RoofViz · All rights reserved
            </p>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brand-cream/45">
              Set in Fraunces &amp; DM Sans
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
