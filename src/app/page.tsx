import Link from 'next/link';
import {
  Camera,
  Palette,
  Sparkles,
  Image,
  BookOpen,
  FileText,
  Users,
  Share2,
  BarChart3,
  Paintbrush,
  Check,
  ArrowRight,
  Star,
} from 'lucide-react';
import MobileNav from '@/components/landing/MobileNav';

/* ------------------------------------------------------------------ */
/*  Plan data (mirrored from billing + stripe for static rendering)   */
/* ------------------------------------------------------------------ */
const PLANS = [
  {
    key: 'free',
    name: 'Free',
    priceLabel: '$0',
    priceUnit: '/mo',
    description: 'Try it out',
    features: [
      '5 visualizations/month',
      '1 team member',
      'Standard quality',
    ],
    highlighted: false,
  },
  {
    key: 'pay_per_use',
    name: 'Pay As You Go',
    priceLabel: '$0.75',
    priceUnit: '/viz',
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
    priceUnit: '/mo',
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
    priceUnit: '/mo',
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
    priceUnit: '/mo',
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
    priceUnit: '/mo',
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
    title: 'AI Visualization',
    description:
      'Generate photorealistic roof renderings in seconds using AI. Show homeowners their new roof before work begins.',
    plans: 'All plans',
  },
  {
    icon: BookOpen,
    title: 'Product Catalog',
    description:
      'Maintain a catalog of shingle styles, colors, and materials your team can choose from during visualizations.',
    plans: 'All plans',
  },
  {
    icon: Image,
    title: 'Before & After Gallery',
    description:
      'Save every visualization in an organized gallery. Browse, compare, and share past projects with clients.',
    plans: 'All plans',
  },
  {
    icon: FileText,
    title: 'PDF Proposals',
    description:
      'Generate branded PDF proposals with visualization images, product details, and pricing to close deals faster.',
    plans: 'Pro and above',
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Invite sales reps, assign roles, and track who is generating the most visualizations across your org.',
    plans: 'Starter and above',
  },
  {
    icon: Share2,
    title: 'Share Links',
    description:
      'Send clients a branded link to view their roof visualization. No login required for them to see results.',
    plans: 'Pro and above',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Track visualization volume, team performance, and conversion metrics to optimize your sales process.',
    plans: 'Business and above',
  },
  {
    icon: Paintbrush,
    title: 'White-Label Branding',
    description:
      'Remove RoofViz branding and replace it with your own logo, colors, and domain for a fully custom experience.',
    plans: 'Business Pro',
  },
];

/* ------------------------------------------------------------------ */
/*  Steps data                                                        */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    number: '1',
    icon: Camera,
    title: 'Upload a Photo',
    description:
      'Snap a photo of the home or upload an existing image. Our AI detects the roof automatically.',
  },
  {
    number: '2',
    icon: Palette,
    title: 'Choose a Product',
    description:
      'Pick from your product catalog — shingle style, color, and material — or let the homeowner browse options.',
  },
  {
    number: '3',
    icon: Sparkles,
    title: 'Get Your Visualization',
    description:
      'In seconds, see a photorealistic rendering of the new roof on the actual home. Share it or build a proposal.',
  },
];

/* ================================================================== */
/*  Page Component                                                    */
/* ================================================================== */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      {/* ---------------------------------------------------------- */}
      {/*  Navigation                                                */}
      {/* ---------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <nav className="relative mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-orange flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-brown">RoofViz</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-brand-brown/70 hover:text-brand-orange transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-brand-brown/70 hover:text-brand-orange transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-brand-brown/70 hover:text-brand-orange transition-colors"
            >
              Pricing
            </a>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-brown hover:text-brand-orange transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-dark transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile menu */}
          <MobileNav />
        </nav>
      </header>

      <main className="flex-1">
        {/* -------------------------------------------------------- */}
        {/*  Hero Section                                            */}
        {/* -------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-gradient-to-b from-brand-peach-light to-transparent rounded-b-[50%] opacity-60" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-peach-light border border-brand-peach px-4 py-1.5 text-sm font-medium text-brand-brown mb-6">
              <Sparkles className="h-4 w-4 text-brand-orange" />
              AI-Powered Roof Visualization
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-brown leading-tight">
              Show Homeowners Their{' '}
              <span className="text-brand-orange">New Roof</span> Before the
              First Shingle Is Laid
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-brand-brown/60 leading-relaxed">
              Upload a photo, pick a product, and get a photorealistic
              visualization in seconds. Close more deals by helping customers
              see exactly what they are buying.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-orange/25 hover:bg-brand-orange-dark transition-colors"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border-2 border-brand-brown/20 bg-white px-8 py-3.5 text-base font-semibold text-brand-brown hover:border-brand-orange hover:text-brand-orange transition-colors"
              >
                See Demo
              </Link>
            </div>

            <p className="mt-4 text-sm text-brand-brown/40">
              No credit card required. 5 free visualizations every month.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/*  How It Works                                            */}
        {/* -------------------------------------------------------- */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-brand-brown/60 max-w-2xl mx-auto">
                Three simple steps from photo to photorealistic visualization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {STEPS.map((step) => (
                <div key={step.number} className="relative text-center group">
                  {/* Step number badge */}
                  <div className="mx-auto mb-6 relative">
                    <div className="h-20 w-20 mx-auto rounded-2xl bg-brand-peach-light flex items-center justify-center group-hover:bg-brand-peach transition-colors">
                      <step.icon className="h-9 w-9 text-brand-orange" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-brand-orange text-white text-sm font-bold flex items-center justify-center shadow-md">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-brand-brown mb-2">
                    {step.title}
                  </h3>
                  <p className="text-brand-brown/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/*  Features Grid                                           */}
        {/* -------------------------------------------------------- */}
        <section id="features" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown">
                Everything You Need to Sell More Roofs
              </h2>
              <p className="mt-4 text-lg text-brand-brown/60 max-w-2xl mx-auto">
                From AI-powered visualizations to branded proposals, RoofViz
                gives your sales team an unfair advantage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-white p-6 hover:shadow-lg hover:border-brand-peach transition-all"
                >
                  <div className="h-12 w-12 rounded-lg bg-brand-peach-light flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-brand-orange" />
                  </div>
                  <h3 className="font-semibold text-brand-brown mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-brand-brown/60 leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <span className="inline-block text-xs font-medium text-brand-orange bg-brand-peach-light px-2.5 py-1 rounded-full">
                    {feature.plans}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/*  Pricing Section                                         */}
        {/* -------------------------------------------------------- */}
        <section id="pricing" className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-brand-brown/60 max-w-2xl mx-auto">
                Start free with 5 visualizations per month. Upgrade as your
                business grows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.key}
                  className={`relative rounded-xl border p-6 flex flex-col ${
                    plan.highlighted
                      ? 'border-brand-orange ring-2 ring-brand-orange bg-white shadow-lg'
                      : 'border-border bg-white hover:border-brand-peach'
                  } transition-all`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-white shadow-sm">
                        <Star className="h-3 w-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-brand-brown">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-brand-brown/50">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-brand-brown">
                      {plan.priceLabel}
                    </span>
                    <span className="text-brand-brown/50 ml-1">
                      {plan.priceUnit}
                    </span>
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-brand-brown/70"
                      >
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? 'bg-brand-orange text-white hover:bg-brand-orange-dark shadow-sm'
                        : 'border-2 border-brand-brown/15 text-brand-brown hover:border-brand-orange hover:text-brand-orange'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/*  Social Proof / Trust                                    */}
        {/* -------------------------------------------------------- */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown mb-4">
              Trusted by Roofing Companies Nationwide
            </h2>
            <p className="text-lg text-brand-brown/60 max-w-2xl mx-auto mb-16">
              Sales teams across the country use RoofViz to close more deals,
              faster.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote:
                    'RoofViz completely changed how we sell. Homeowners love seeing their new roof before we start.',
                  name: 'Mike R.',
                  role: 'Sales Manager',
                },
                {
                  quote:
                    'We went from closing 20% of appointments to over 40%. The visualizations sell themselves.',
                  name: 'Sarah T.',
                  role: 'Owner, Apex Roofing',
                },
                {
                  quote:
                    'The PDF proposals are a game-changer. Professional, branded, and ready in seconds.',
                  name: 'Jason L.',
                  role: 'Regional Sales Lead',
                },
              ].map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-xl border border-border bg-white p-6 text-left"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-brand-orange text-brand-orange"
                      />
                    ))}
                  </div>
                  <p className="text-brand-brown/70 leading-relaxed mb-4 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-brand-brown text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-brand-brown/50">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/*  Final CTA                                               */}
        {/* -------------------------------------------------------- */}
        <section className="py-20 sm:py-28 bg-brand-brown">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Close More Deals?
            </h2>
            <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
              Start visualizing roofs today with 5 free visualizations per
              month. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-orange/25 hover:bg-brand-orange-dark transition-colors"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ---------------------------------------------------------- */}
      {/*  Footer                                                    */}
      {/* ---------------------------------------------------------- */}
      <footer className="bg-brand-brown border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-orange flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">RoofViz</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/terms"
                className="text-white/50 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-white/50 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/login"
                className="text-white/50 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-white/50 hover:text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} RoofViz. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
