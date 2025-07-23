'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    
    startTransition(() => {
      // Remove current locale from pathname and add new one
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      router.replace(`/${nextLocale}${pathWithoutLocale}`);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      disabled={isPending}
      className="h-8 w-8"
      title={t('changeLanguage')}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">{t('changeLanguage')}</span>
    </Button>
  );
}
