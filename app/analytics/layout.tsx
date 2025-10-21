import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Drinkjoy',
  description: 'View Drinkjoy analytics including popular drinks, user engagement metrics, total likes, and order statistics. Track drink popularity and trending recommendations in real-time.',
  openGraph: {
    title: 'Drinkjoy Analytics Dashboard',
    description: 'Track drink popularity, user engagement, and trending recommendations on Drinkjoy.',
    type: 'website',
    url: 'https://www.drinkjoy.app/analytics',
  },
  alternates: {
    canonical: 'https://www.drinkjoy.app/analytics',
  },
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
