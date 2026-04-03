import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - RoofViz',
  description: 'RoofViz Privacy Policy describing how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <article className="prose prose-neutral max-w-none prose-headings:text-brand-brown prose-a:text-brand-orange hover:prose-a:text-brand-orange-dark">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 2, 2026</p>

        <p>
          RoofViz (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This
          Privacy Policy explains how we collect, use, store, and share information when you
          use the RoofViz platform (&quot;the Service&quot;).
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
          You may upload photographs of residential properties to generate roof visualizations.
          These images are stored securely and associated with your tenant account.
        </p>
        <h3>Usage Data</h3>
        <p>
          We automatically collect information about how you interact with the Service,
          including pages visited, features used, visualization requests, timestamps, and
          device or browser information.
        </p>
        <h3>Payment Information</h3>
        <p>
          Payment processing is handled entirely by Stripe. We do not store your credit card
          numbers or bank account details on our servers. We receive limited billing
          information from Stripe, such as the last four digits of your card and billing
          address, for record-keeping purposes.
        </p>

        <h2>2. How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, operate, and maintain the Service, including generating AI roof visualizations.</li>
          <li>Process transactions and manage your subscription.</li>
          <li>Communicate with you about your account, updates, and support requests.</li>
          <li>Analyze usage patterns to improve the Service and develop new features.</li>
          <li>Detect and prevent fraud, abuse, or security incidents.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>3. Data Storage and Security</h2>
        <p>
          Your data is stored using Supabase infrastructure, which provides enterprise-grade
          security including encryption at rest and in transit. We implement appropriate
          technical and organizational measures to protect your data against unauthorized
          access, alteration, disclosure, or destruction.
        </p>
        <p>
          While we strive to protect your information, no method of electronic storage or
          transmission is completely secure. We cannot guarantee absolute security but are
          committed to following industry best practices.
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
            <strong>OpenAI / Google (Gemini)</strong> &mdash; AI image processing for roof
            visualizations. Uploaded photos may be sent to these services for processing.
            These providers process images according to their respective data handling
            policies and do not use your images to train their models when accessed via API.
          </li>
        </ul>

        <h2>5. Image Data</h2>
        <p>
          Photographs you upload are processed by AI services to generate roof visualizations.
          Your images are stored within your tenant account and are never shared with other
          tenants or used for purposes unrelated to providing the Service to you.
        </p>
        <p>
          AI-generated visualizations are derived from your uploaded images and are associated
          solely with your account. We do not use your images to train AI models or share
          them with third parties beyond what is necessary to generate the visualizations you
          request.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your account information and uploaded content for as long as your account
          is active. If you cancel your subscription, your data is retained for 30 days to
          allow for reactivation or data export, after which it is scheduled for permanent
          deletion.
        </p>
        <p>
          We may retain certain information as required by law or for legitimate business
          purposes, such as resolving disputes or enforcing our agreements.
        </p>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
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
          <a href="mailto:support@roofviz.com">support@roofviz.com</a>. We will respond to
          your request within 30 days.
        </p>

        <h2>8. Cookies</h2>
        <p>
          RoofViz uses minimal cookies strictly necessary for the operation of the Service.
          We use a session cookie to maintain your authenticated state. We do not use
          advertising cookies, tracking pixels, or third-party analytics cookies.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Service is designed for use by roofing professionals and is not intended for
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
          at <a href="mailto:support@roofviz.com">support@roofviz.com</a>.
        </p>
      </article>
    </div>
  );
}
