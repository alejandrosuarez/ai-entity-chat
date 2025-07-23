import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AI } from '@/lib/ai';
import { notFound } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!['es', 'en'].includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AI>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </AI>
    </NextIntlClientProvider>
  );
}
