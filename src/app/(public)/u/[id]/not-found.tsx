'use client';

import { NotFound } from '@/app/not-found';
import { useTranslation } from 'react-i18next';

export default function UserNotFound() {
  const { t } = useTranslation();
  return <NotFound back={{ href: '/search?type=users', label: t('user.not_found') }} />;
}
