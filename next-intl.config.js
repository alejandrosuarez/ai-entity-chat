import { getRequestConfig } from 'next-intl/server';

// Default locale configuration
export default getRequestConfig(async ({ locale }) => {
  // Fallback to default locale if locale is undefined
  const actualLocale = locale || 'es';
  
  return {
    locale: actualLocale,
    messages: (await import(`./messages/${actualLocale}.json`)).default
  };
});
