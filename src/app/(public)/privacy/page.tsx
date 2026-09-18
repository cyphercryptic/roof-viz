import type { Metadata } from 'next';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ExteriorViz Privacy Policy describing how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <article className="text-[15px] leading-7 text-muted-foreground [&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-brand-brown [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-brown [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-brand-brown [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-brand-orange [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-brand-brown">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: September 18, 2026</p>

        <p>
          ExteriorViz is operated by Bar9 AI (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). This
          Privacy Policy explains how we collect, use, store, and share information when you
          use the ExteriorViz platform (&quot;the Service&quot;).
        </p>

        <h2>1. Information We Collect</h2>
        <h3>Account Information</h3>
        <p>
          When you create an account, we collect your name, email address, and organization
          details. If you are invited to join a team, we collect the information provided
          during the invitation process.
        </p>
        <h3>Uploaded Photos</h3>
        <p>
          We collect the property photographs you upload, the roof, window, or door options you
          select, and generated previews. We also store optional customer names and property
          addresses you enter. This content is associated with your organization’s workspace.
        </p>
        <h3>Usage Data</h3>
        <p>
          We record visualization requests, processing status, timestamps, usage counts, and
          share-link view counts. Hosting and error logs may include IP addresses, request
          details, and browser information needed to operate and troubleshoot the Service.
        </p>
        <h3>Payment Information</h3>
        <p>
          Payment processing is handled entirely by Stripe. We do not store your credit card
          numbers or bank account details on our servers. We store Stripe customer and subscription identifiers, subscription status, plan, and
          billing-period information to manage access and usage.
        </p>

        <h2>2. How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, operate, and maintain the Service, including generating AI previews of roofs, windows, and doors.</li>
          <li>Process transactions and manage your subscription.</li>
          <li>Communicate with you about your account, updates, and support requests.</li>
          <li>Analyze usage patterns to improve the Service and develop new features.</li>
          <li>Detect and prevent fraud, abuse, or security incidents.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>3. Data Storage and Security</h2>
        <p>
          We use Supabase for accounts, application data, and uploaded images. Workspace
          access is controlled by accounts and organization membership. Property photos and
          generated previews use access-controlled storage and temporary image links.
        </p>
        <p>
          While we strive to protect your information, no method of electronic storage or
          transmission is completely secure. No security measure eliminates every risk. Contact us if you believe your account or
          content has been accessed without permission.
        </p>

        <h2>4. Third-Party Services</h2>
        <p>
          We use the following third-party services to operate the platform. Each processes
          data in accordance with their own privacy policies:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> &mdash; Authentication, database, and file storage
            infrastructure.
          </li>
          <li>
            <strong>Stripe</strong> &mdash; Payment processing and subscription management.
          </li>
          <li>
            <strong>Google Gemini</strong> &mdash; AI image generation. Property photos, product
            references, and generation instructions are sent to Google to create previews.
            Provider retention and data use depend on the applicable service terms and
            account configuration. See the{' '}
            <a href="https://ai.google.dev/gemini-api/terms">Gemini API terms</a>.
          </li>
          <li><strong>Vercel</strong> &mdash; Application hosting and operational logs.</li>
          <li><strong>Resend</strong> &mdash; Account and invitation emails when email delivery is configured.</li>
          <li><strong>Sentry</strong> &mdash; Error diagnostics when monitoring is enabled.</li>
        </ul>

        <h2>5. Image Data and Sharing</h2>
        <p>
          Upload only images you have permission to process, and avoid including sensitive
          personal details that are unnecessary for a project. Authorized members of your
          organization can access workspace content. Photos and previews are also processed
          by the service providers described above to deliver the requested features.
        </p>
        <p>
          If you create a share link, anyone who has that link may view its preview and the
          customer or project information displayed with it. Only share links with intended
          recipients. Expiring or disabling a link cannot recall copies already downloaded,
          and temporary image URLs may remain usable until their own expiry.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain account information and workspace content to provide the Service. Canceling
          a paid subscription does not automatically delete your account or project images.
          Contact us to request export or deletion; we will confirm the scope and applicable
          timing after verifying your request.
        </p>
        <p>
          Some records may be retained to meet legal, billing, fraud-prevention, or dispute
          requirements. Backup copies and provider logs may follow separate retention cycles.
        </p>

        <h2>7. Your Rights</h2>
        <p>You may contact us to request:</p>
        <ul>
          <li>
            <strong>Access</strong> &mdash; Request a copy of the personal data we hold about
            you.
          </li>
          <li>
            <strong>Deletion</strong> &mdash; Request deletion of your account and associated
            data.
          </li>
          <li>
            <strong>Export</strong> &mdash; Request an export of your data, including uploaded
            images and generated visualizations, in a commonly used format.
          </li>
          <li>
            <strong>Correction</strong> &mdash; Request correction of inaccurate personal
            information.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We may need to verify your identity and, for workspace content, your authority to act
          for the organization. We handle requests according to applicable law.
        </p>

        <h2>8. Cookies</h2>
        <p>
          ExteriorViz uses authentication cookies to keep you signed in. Service providers may
          also use cookies or similar technologies for security and payment functionality.
          Blocking essential cookies can prevent sign-in or billing features from working.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Service is designed for use by roofing, window, and door professionals and is not intended for
          individuals under the age of 18. We do not knowingly collect personal information
          from children. If we learn that we have collected data from a person under 18, we
          will take steps to delete that information promptly.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by posting the updated policy on this page and updating the
          &quot;Last updated&quot; date. Your continued use of the Service after changes are posted
          constitutes acceptance of the revised policy.
        </p>

        <h2>11. Contact</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy, please contact us
          at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </article>
    </div>
  );
}
