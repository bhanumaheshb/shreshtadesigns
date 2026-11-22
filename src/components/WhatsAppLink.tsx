import { BRAND_NAME } from '../data/brand';

const whatsappNumber = '919246511899';
const message = `Hi ${BRAND_NAME}, I came across your website and I'm planning an event. I'd love to know more about your services and discuss my requirements. Could you please help me with the details? Thank you!`;

export function WhatsAppLink() {
  return (
    <a
      className="whatsapp-link"
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <svg width="29" height="29" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20.6 11.7a8.6 8.6 0 0 1-12.9 7.4L3.4 20.2l1.1-4.2a8.6 8.6 0 1 1 16.1-4.3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8.6 7.4c-.5 0-1.4.6-1.4 1.8 0 2.2 3.1 5.7 5.5 6.7 1.2.5 2.6.8 3.5-.2.4-.5.5-1.1.2-1.3l-2-1c-.3-.2-.6 0-.9.5-.3.4-.5.4-1 .2-1.2-.5-2.1-1.3-2.8-2.4-.3-.5-.3-.7 0-1l.5-.6c.1-.2.1-.4 0-.6l-.8-1.8c-.1-.3-.4-.3-.8-.3Z"
          fill="currentColor"
        />
      </svg>
    </a>
  );
}
