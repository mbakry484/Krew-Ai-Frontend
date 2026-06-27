export const metadata = {
  title: 'Data Deletion | Krew',
  description: 'Request deletion of your personal data from the Krew platform.',
};

export default function DataDeletion() {
  return (
    <div className="legal-page">
      <div className="legal-wrap">
        <p className="legal-eyebrow">Privacy</p>
        <h1 className="legal-title">Data Deletion Request</h1>
        <p className="legal-meta">In compliance with Meta Platform Policy and applicable privacy law</p>

        <div className="legal-section">
          <p>
            If you have used Krew through a Meta platform (Instagram or Facebook) and would like to
            request deletion of your personal data, you can do so by emailing us directly. We will
            process your request and confirm deletion within <strong>30 days</strong>.
          </p>
        </div>

        <hr className="legal-divider" />

        <div className="legal-section">
          <h2>How to Request Deletion</h2>
          <p>Send an email to:</p>
          <div className="legal-notice">
            <p>
              <strong>
                <a href="mailto:privacy@mykrew.co" className="text-text-primary hover:underline underline-offset-2">
                  privacy@mykrew.co
                </a>
              </strong>
            </p>
            <p className="mt-2">
              Please include <strong>"Data Deletion Request"</strong> in the subject line and the
              Instagram or Facebook account name associated with your data so we can locate and
              remove it promptly.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2>What Gets Deleted</h2>
          <ul>
            <li>All conversation and message history associated with your account</li>
            <li>Any personal identifiers (name, profile information) stored by Krew</li>
            <li>Access tokens and authorization credentials linked to your Meta account</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>Timeline</h2>
          <p>
            Deletion requests are processed within <strong>30 days</strong> of receipt. You will
            receive a confirmation email once your data has been permanently removed from our
            systems.
          </p>
        </div>

        <div className="legal-section">
          <h2>Automated Deletion via Meta</h2>
          <p>
            If you disconnect Krew from your Meta account through Facebook's Business Integrations
            settings, we also receive an automated deletion signal and will remove your data within
            30 days without any additional action required on your part.
          </p>
        </div>

        <div className="legal-contact">
          <div className="text-[0.62rem] uppercase tracking-[0.12em] text-text-tertiary mb-3">Privacy Inquiries</div>
          <div className="text-[0.78rem] font-medium text-text-primary mb-2">Krew Systems</div>
          <p className="text-[0.73rem] text-text-secondary leading-[1.8]">
            Email:{' '}
            <a href="mailto:privacy@mykrew.co" className="text-text-primary hover:underline underline-offset-2">
              privacy@mykrew.co
            </a>
            <br />
            Website:{' '}
            <a href="https://www.mykrew.co" className="text-text-primary hover:underline underline-offset-2">
              mykrew.co
            </a>
            <br />
            Jurisdiction: Egypt
          </p>
        </div>
      </div>
    </div>
  );
}
