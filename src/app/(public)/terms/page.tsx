import type { Metadata } from 'next';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'ExteriorViz Terms of Service for AI roof, window, and door previews.',
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <article className="text-[15px] leading-7 text-muted-foreground [&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-brand-brown [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-brown [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-brand-brown [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-brand-orange [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-brand-brown">
        <h1>Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: September 18, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using ExteriorViz (&quot;the Service&quot;), you agree to be bound by these Terms
          of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the
          Service. ExteriorViz is operated by Bar9 AI (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        </p>

        <h2>2. Description of Service</h2>
        <p>
          ExteriorViz helps home-improvement professionals explore roof, window, and door
          options using AI previews of property photos. Your organization can manage products,
          generate previews, and use the collaboration and sharing features included in its plan.
        </p>
        <p>
          Previews are illustrative concepts. AI may alter proportions, surrounding details,
          textures, or colors, and screen displays may differ from physical samples. A preview
          is not a measurement, construction plan, product specification, installation quote,
          or guarantee of the finished result. Verify product availability, dimensions,
          materials, and installation requirements with the manufacturer and a qualified
          contractor before making purchasing or construction decisions. Present shared
          previews as AI-generated concepts.
        </p>

        <h2>3. User Accounts and Responsibilities</h2>
        <p>
          To use the Service, you must create an account and provide accurate, complete
          information. You are responsible for maintaining the confidentiality of your account
          credentials and for all activity that occurs under your account. You agree to notify
          us immediately of any unauthorized use of your account.
        </p>
        <p>
          If you are using the Service on behalf of an organization, you represent and warrant
          that you have the authority to bind that organization to these Terms.
        </p>

        <h2>4. Subscription and Billing</h2>
        <p>
          ExteriorViz offers the plans and usage allowances shown at checkout. Billing is processed through Stripe, a
          third-party payment processor. By subscribing to a paid plan, you agree to the
          following:
        </p>
        <ul>
          <li>
            Subscriptions automatically renew at the end of each billing cycle unless canceled
            before the renewal date.
          </li>
          <li>
            You may cancel your subscription at any time through your account settings.
            Cancellation takes effect at the end of the current billing period. Except where required by applicable law, no partial refunds are provided for unused
            portions of a billing cycle.
          </li>
          <li>
            We reserve the right to change pricing with at least 30 days&apos; notice. Continued
            use of the Service after a price change constitutes acceptance of the new pricing.
          </li>
          <li>
            You are responsible for providing valid and current payment information. Failed
            payments may result in suspension of your account.
          </li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Upload content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable.</li>
          <li>Upload images you do not have the right to use or that violate the privacy of others.</li>
          <li>Scrape, crawl, or use automated means to access the Service or extract data from it.</li>
          <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Service.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          <li>Use the Service for any purpose other than its intended use as a roof, window, and door visualization tool.</li>
          <li>Resell, redistribute, or sublicense access to the Service without our written consent.</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>
          You retain all rights to the photographs and images you upload to the Service. By
          uploading content, you grant ExteriorViz a limited, non-exclusive license to process,
          store, and display your content solely for the purpose of providing the Service to
          you.
        </p>
        <p>
          ExteriorViz and its licensors retain all rights, title, and interest in the Service,
          including but not limited to the platform, software, user interface
          designs, trademarks, and documentation. Nothing in these Terms transfers any
          intellectual property rights in the Service to you.
        </p>

        <h2>7. Data and Privacy</h2>
        <p>
          Your use of the Service is also governed by our{' '}
          <a href="/privacy">Privacy Policy</a>, which describes how we collect, use, and
          protect your information. By using the Service, you consent to the practices
          described in the Privacy Policy.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, ExteriorViz and its officers,
          directors, employees, and agents shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, including but not limited to loss of
          profits, data, or business opportunities, arising out of or related to your use of
          the Service.
        </p>
        <p>
          Our total liability for any claims arising under these Terms shall not exceed the
          amount you paid to us in the twelve (12) months preceding the event giving rise to
          the claim. The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without
          warranties of any kind, whether express or implied.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time if you violate
          these Terms or for any other reason at our sole discretion, with or without notice.
          Upon termination, your right to use the Service ceases immediately. You may request
          export of your data within 30 days of termination by contacting us.
        </p>
        <p>
          Canceling a subscription does not automatically delete your account. You may
          terminate your account by canceling your subscription and
          contacting us to request account deletion.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of
          material changes by posting the updated Terms on this page and updating the
          &quot;Last updated&quot; date. Your continued use of the Service after changes are posted
          constitutes acceptance of the revised Terms. We encourage you to review these Terms
          periodically.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms are subject to applicable law. Nothing in these Terms excludes rights or
          remedies that cannot lawfully be excluded. If a concern arises, contact us using
          the address below so we can try to resolve it.
        </p>

        <h2>12. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </article>
    </div>
  );
}
