export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-wrap">
        <a href="/" className="legal-back">← Back to Krew</a>
        <p className="legal-eyebrow">Legal Document</p>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-meta">Effective Date: April 2026 · Last Updated: April 2026 · Jurisdiction: Egypt</p>

        <div className="legal-section">
          <p>This Privacy Policy describes how Krew Systems ("Krew", "we", "our", or "us") collects, processes, stores, and protects information in connection with the Krew platform at mykrew.co ("the Platform"). The Platform provides business communication management tools, including optional AI-assisted features, for use by registered business operators ("Users").</p>
          <p>By accessing or using the Platform, you acknowledge that you have read and understood this Privacy Policy. If you do not agree, you must discontinue use of the Platform immediately.</p>
        </div>

        <hr className="legal-divider" />

        <div className="legal-section">
          <h2>1. Scope</h2>
          <p>This Policy applies to all data processed by Krew in connection with the Platform, including data provided during account registration, data accessed through third-party integrations (Meta Instagram, Facebook Messenger, Shopify), and data generated through use of the Platform's features.</p>
        </div>

        <div className="legal-section">
          <h2>2. Information We Collect</h2>
          <ul>
            <li><strong>Account Registration Data</strong> — Name, email address, and credentials provided when creating a Krew account.</li>
            <li><strong>Business Information</strong> — Brand name, business details, and Shopify store data including product catalog information, provided voluntarily by the User.</li>
            <li><strong>Platform Authorization Tokens</strong> — Access tokens issued by Meta and Shopify, obtained exclusively through explicit OAuth authorization initiated by the User. Stored securely and used only to enable Platform functionality.</li>
            <li><strong>Messaging Data</strong> — Content of messages exchanged between the User's connected business accounts and their customers, accessed solely through Meta's official APIs and only after explicit User authorization.</li>
            <li><strong>Usage Data</strong> — Technical data regarding how Users interact with the Platform dashboard, collected for operational and security purposes.</li>
          </ul>
          <div className="legal-notice">
            <p>No data is accessed, stored, or processed from any messaging account prior to the User completing the OAuth authorization flow. All data collection is consent-based.</p>
          </div>
        </div>

        <div className="legal-section">
          <h2>3. How We Use Collected Information</h2>
          <p>Information is used exclusively for the following purposes:</p>
          <ul>
            <li>To authenticate Users and maintain secure Platform access</li>
            <li>To provide the Platform's communication management features as configured by the User</li>
            <li>To display incoming messages and conversation histories within the dashboard</li>
            <li>To enable AI-assisted response drafting when explicitly activated by the User</li>
            <li>To sync product and order data from connected Shopify stores for accurate query handling</li>
            <li>To send service-related communications including account and security notifications</li>
            <li>To monitor Platform performance and improve service reliability</li>
            <li>To comply with applicable legal obligations</li>
          </ul>
          <p>We do not use collected data for advertising, profiling, or any purpose beyond the direct provision of the Platform's services.</p>
        </div>

        <div className="legal-section">
          <h2>4. AI-Assisted Features and User Control</h2>
          <p>The Platform includes optional AI-assisted features designed to support Users in managing customer communications. These features are assistive in nature and operate strictly under the User's direction.</p>
          <ul>
            <li>AI-assisted features must be explicitly enabled by the User through the Platform dashboard before they become active.</li>
            <li>Users may disable AI-assisted features at any time without affecting other Platform functionality.</li>
            <li>Human agents may intervene in, override, or manually respond to any conversation at any time, regardless of whether AI features are enabled.</li>
            <li>AI-assisted suggestions are generated based solely on information the User has provided, including product data, business policies, and configured parameters.</li>
            <li>The Platform does not send unsolicited messages, initiate conversations without User authorization, or operate beyond the User's explicit configuration.</li>
          </ul>
          <div className="legal-notice">
            <p>Users retain full control over all communication activity on their connected accounts at all times. Krew does not act autonomously on any account without the User's configured and explicit authorization.</p>
          </div>
        </div>

        <div className="legal-section">
          <h2>5. Meta Platform Data</h2>
          <p>Krew integrates with Meta Platforms, Inc. through Meta's officially approved Graph API and Messaging Platform.</p>
          <ul>
            <li>Access is granted exclusively through OAuth authorization, requiring explicit User consent at each connection.</li>
            <li>Permissions requested are limited to those necessary for the Platform's stated features: instagram_manage_messages, instagram_basic, pages_manage_metadata, pages_read_engagement, pages_messaging, and pages_show_list.</li>
            <li>Meta platform data is used solely to provide communication management features to the authorizing User.</li>
            <li>Meta platform data is not sold, transferred, or disclosed for advertising, analytics, or any unrelated purpose.</li>
            <li>Users may revoke access at any time through Meta's Business Integrations settings or through the Krew dashboard. Access tokens are deleted within 30 days of disconnection.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>6. Shopify Integration Data</h2>
          <p>When a User connects their Shopify store, Krew accesses product and order data solely to enable accurate responses to customer inquiries. Shopify data is not shared with third parties and is not used beyond the Platform's stated functionality.</p>
        </div>

        <div className="legal-section">
          <h2>7. Third-Party Service Providers</h2>
          <p>Krew engages the following providers to operate the Platform, all bound by data processing agreements:</p>
          <ul>
            <li><strong>Supabase</strong> — Database hosting and authentication infrastructure</li>
            <li><strong>OpenAI</strong> — Natural language processing for AI-assisted features, activated only when explicitly enabled by the User</li>
            <li><strong>Meta Platforms, Inc.</strong> — Instagram and Facebook Messenger API access</li>
            <li><strong>Shopify Inc.</strong> — Product and order data access</li>
            <li><strong>Railway</strong> — Backend and frontend hosting infrastructure</li>
          </ul>
          <p>We do not sell User data or customer data to any third party under any circumstances.</p>
        </div>

        <div className="legal-section">
          <h2>8. Customer Messaging Data</h2>
          <ul>
            <li>Message content is stored securely to provide conversation history and continuity within the dashboard.</li>
            <li>Where AI-assisted features are enabled by the User, message content may be transmitted to OpenAI's API solely to generate response suggestions.</li>
            <li>Customer message data is not used for advertising or sold to third parties.</li>
            <li>Users are solely responsible for ensuring their use of the Platform complies with applicable privacy laws and the terms of service of connected platforms.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>9. Data Retention</h2>
          <p>User account data is retained for the duration of the active account relationship. Upon account termination, User data is deleted within 90 days, except where retention is required by applicable law. Access tokens are deleted within 30 days of disconnection or termination. Users may request deletion at any time by contacting privacy@mykrew.co.</p>
        </div>

        <div className="legal-section">
          <h2>10. Data Security</h2>
          <p>Krew implements encrypted storage of access tokens and credentials, HTTPS encryption for all data in transit, restricted access controls, and regular security monitoring. Users should report any suspected unauthorized access to support@mykrew.co immediately.</p>
        </div>

        <div className="legal-section">
          <h2>11. User Rights</h2>
          <ul>
            <li><strong>Right of Access</strong> — Request a copy of personal data we hold about you</li>
            <li><strong>Right of Rectification</strong> — Request correction of inaccurate or incomplete data</li>
            <li><strong>Right of Erasure</strong> — Request deletion of personal data, subject to legal retention requirements</li>
            <li><strong>Right to Withdraw Consent</strong> — Disconnect any connected platform account at any time</li>
            <li><strong>Right to Data Portability</strong> — Request data in a structured, machine-readable format where technically feasible</li>
          </ul>
          <p>Contact privacy@mykrew.co to exercise any of the above rights. We will respond within 30 days.</p>
        </div>

        <div className="legal-section">
          <h2>12. Children's Privacy</h2>
          <p>The Platform is intended solely for business operators and is not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware that such data has been collected, we will delete it promptly.</p>
        </div>

        <div className="legal-section">
          <h2>13. Changes to This Policy</h2>
          <p>Material changes will be communicated via email or a prominent notice within the Platform no less than 14 days prior to taking effect. Continued use of the Platform following notification constitutes acceptance of the updated Policy.</p>
        </div>

        <div className="legal-contact">
          <div className="text-[0.62rem] uppercase tracking-[0.12em] text-text-tertiary mb-3">Privacy Inquiries</div>
          <div className="text-[0.78rem] font-medium text-text-primary mb-2">Krew Systems</div>
          <p className="text-[0.73rem] text-text-secondary leading-[1.8]">
            Email: <a href="mailto:privacy@mykrew.co" className="text-text-primary hover:underline underline-offset-2">privacy@mykrew.co</a><br />
            Website: <a href="https://www.mykrew.co" className="text-text-primary hover:underline underline-offset-2">mykrew.co</a><br />
            Jurisdiction: Egypt
          </p>
        </div>
      </div>

    </div>
  );
}
