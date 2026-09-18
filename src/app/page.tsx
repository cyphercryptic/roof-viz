import Link from 'next/link';
import { Camera, Check, DoorOpen, FolderOpen, House, PanelsTopLeft, Share2, Users } from 'lucide-react';
import HeroVisual from '@/components/landing/HeroVisual';
import MobileNav from '@/components/landing/MobileNav';
import styles from '@/components/landing/Landing.module.css';

const workflow = [
  { icon: Camera, title: 'Start with their home.', text: 'Upload a clear photo from the appointment. Keep the customer and address attached to your work.' },
  { icon: PanelsTopLeft, title: 'Explore the possibilities.', text: 'Choose roofing, windows, or doors. Select a product and create an AI preview to talk through together.' },
  { icon: FolderOpen, title: 'Keep the conversation going.', text: 'Save your options in one gallery. Return to the photo, compare another finish, and download the result.' },
];
const questions = [
  { q: 'What can I visualize?', a: 'ExteriorViz brings roofing, windows, and doors into one workspace. Choose the type of update, then select from the products available in your company catalog.' },
  { q: 'Can I try it before uploading a photo?', a: 'Yes. The interactive examples above let you switch between the original photo and an existing AI preview. They require no account and do not use generation credits.' },
  { q: 'Is the preview an exact product match?', a: 'AI previews help homeowners explore a direction. Colors, proportions, and details can vary. Confirm the final selection with physical samples, measurements, and manufacturer specifications.' },
  { q: 'Can my team work together?', a: 'Your company workspace brings the product catalog, saved visualizations, and team access together. Available features and team limits depend on your plan; you can review them in your account.' },
  { q: 'I already use RoofViz or WindowViz. Where do I sign in?', a: 'Your existing account and saved work remain with the site where you created them. Contact Connor at connor@bar9.ai for help moving your team into the combined workspace.' },
];

export default function LandingPage() {
  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.logo} aria-label="ExteriorViz home"><span className={styles.logoMark}><House size={22} strokeWidth={1.8} /></span><span>ExteriorViz<span className={styles.byline}>by Bar9 AI</span></span></Link>
          <div className={styles.navLinks}><a href="#examples">Explore examples</a><a href="#workflow">How it works</a><a href="#teams">For your team</a></div>
          <div className={styles.navActions}><Link href="/login">Sign in</Link><Link href="/signup" className={styles.buttonSmall}>Get started</Link></div>
          <MobileNav />
        </nav>
      </header>
      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroIntro}>
            <div className={styles.heroCopy}><p className={styles.introNote}><span /> Built for the homeowner conversation</p><h1>A clearer picture.<br />A better way to choose.</h1></div>
            <div className={styles.heroSupport}><p>Show homeowners what comes next. Explore roofing, windows, and doors on their own home, together in one visualization workspace.</p><div className={styles.actions}><Link href="/signup" className={styles.button}>Create your workspace</Link><a href="#examples" className={styles.textLink}>Try the examples</a></div><span className={styles.subtle}>One home. More possibilities.</span></div>
          </div>
          <div id="examples" className={styles.examplesAnchor}><HeroVisual /></div>
          <div className={styles.tradeStrip} aria-label="Supported project types"><span>One workspace for your exterior projects</span><div><span><House size={18} /> Roofing</span><span><PanelsTopLeft size={18} /> Windows</span><span><DoorOpen size={18} /> Doors</span></div></div>
        </section>
        <section id="workflow" className={styles.section}>
          <div className={styles.sectionHeading}><h2>From the first photo<br />to the next possibility.</h2><p>A practical workflow for real appointments. Bring the homeowner into the decision, one option at a time.</p></div>
          <ol className={styles.workflow}>{workflow.map((step, index) => <li key={step.title}><div className={styles.stepTop}><step.icon size={25} strokeWidth={1.5} /><span>Step {index + 1}</span></div><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
        </section>
        <section id="teams" className={styles.teamSection}>
          <div className={styles.teamInner}>
            <div><p className={styles.sectionKicker}>Made for your daily work</p><h2>Your products.<br />Your people.<br />One place to work.</h2><p className={styles.teamDescription}>Move between exterior projects without switching tools. Give your team a shared starting point and keep customer options easy to find.</p><Link href="/signup" className={styles.buttonLight}>Build your workspace</Link></div>
            <div className={styles.teamFeatures}>
              <article><FolderOpen size={24} /><div><h3>A gallery that stays with you</h3><p>Keep the original photo and your visualizations together, organized with customer details.</p></div></article>
              <article><PanelsTopLeft size={24} /><div><h3>A catalog that fits your business</h3><p>Manage the products your company offers across roofing, windows, and doors.</p></div></article>
              <article><Users size={24} /><div><h3>Room for your sales team</h3><p>Invite teammates and manage access from the same company workspace.</p></div></article>
              <article><Share2 size={24} /><div><h3>A useful follow-up</h3><p>Download previews, with share links and PDF proposals available on supported plans.</p></div></article>
              <p className={styles.planNote}>Review feature availability and team limits in your account before choosing a paid plan.</p>
            </div>
          </div>
        </section>
        <section className={styles.startSection}>
          <div><h2>Make the next appointment<br />easier to picture.</h2><p>Create your workspace, explore the catalog, and review your plan options.</p><ul><li><Check size={17} /> Roofing, windows, and doors</li><li><Check size={17} /> Customer photos and saved previews</li><li><Check size={17} /> Plans for individual reps and teams</li></ul></div>
          <div className={styles.startActions}><Link href="/signup" className={styles.button}>Get started with ExteriorViz</Link><a href="mailto:connor@bar9.ai?subject=ExteriorViz%20team%20setup" className={styles.textLink}>Talk through your team setup</a></div>
        </section>
        <section className={styles.faqSection} aria-labelledby="questions-title"><div><p className={styles.sectionKicker}>A few useful details</p><h2 id="questions-title">Before you begin.</h2><a href="mailto:connor@bar9.ai" className={styles.textLink}>Get in touch</a></div><div className={styles.questions}>{questions.map(({ q, a }) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
      </main>
      <footer className={styles.footer}><div><Link href="/" className={styles.footerLogo}>ExteriorViz</Link><p>See the possibilities. Make the choice.</p><span>© {new Date().getFullYear()} Bar9 AI</span></div><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:connor@bar9.ai">Contact</a><Link href="/login">Sign in</Link></nav><p className={styles.footerNote}>AI-generated visualizations are illustrative. Confirm colors, dimensions, and specifications before ordering.</p></footer>
    </div>
  );
}
