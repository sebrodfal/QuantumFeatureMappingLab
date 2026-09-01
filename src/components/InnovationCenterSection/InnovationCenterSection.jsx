import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, Copy, Check, QrCode } from 'lucide-react';

export function InnovationCenterSection() {
  const [copied, setCopied] = useState(false);
  const innovationUrl = 'https://pe.nttdata.com/';

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(innovationUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = innovationUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy text: ', err);
    }
  };

  return (
    <section className="card innovation-qr-card" id="innovation-center">
      <div className="innovation-qr-layout">
        {/* Left Side: Clean Text & Peru attribution */}
        <div className="innovation-text-col">
          <div className="innovation-pill-tag">
            <span className="peru-flag-emoji">🇵🇪</span>
            <span>Engineered in Peru • NTT DATA Innovation Center</span>
          </div>

          <h2 className="innovation-card-title">
            NTT DATA Innovation Center
          </h2>

          <p className="innovation-card-desc">
            Developed by the Innovation Center team at{' '}
            <strong>NTT DATA Peru</strong> in collaboration with <strong>Kipu Quantum</strong>.
          </p>

          <div className="innovation-links-row">
            <button
              type="button"
              className={`innovation-btn copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyUrl}
              title="Copy link to clipboard"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={innovationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="innovation-btn open-btn"
            >
              <ExternalLink size={14} />
              <span>Visit NTT DATA Peru</span>
            </a>
          </div>
        </div>

        {/* Right Side: High contrast QR code */}
        <div className="innovation-qr-col">
          <div className="clean-qr-wrapper">
            <div className="clean-qr-frame">
              <QRCodeSVG
                value={innovationUrl}
                size={140}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#081120"
              />
            </div>
            <div className="clean-qr-hint">
              <QrCode size={13} />
              <span>Scan with phone</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
