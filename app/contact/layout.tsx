import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Drinkjoy',
  description: 'Get in touch with the Drinkjoy team. Whether you have questions, need support, or are interested in business partnerships, we\'re here to help. Response within 24 hours.',
  openGraph: {
    title: 'Contact Drinkjoy',
    description: 'Get in touch with the Drinkjoy team for support, partnerships, or general inquiries.',
    type: 'website',
    url: 'https://www.drinkjoy.app/contact',
  },
  alternates: {
    canonical: 'https://www.drinkjoy.app/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
