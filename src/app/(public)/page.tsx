'use client';

import { HeroBlock } from '@/components/blocks/HeroBlock';
import { FeatureGridBlock } from '@/components/blocks/FeatureGridBlock';
import { CallToActionBlock } from '@/components/blocks/CallToActionBlock';
import { PageTitle } from '@/components/shared/PageTitle';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  let { t } = useTranslation();
  return (
    <>
      <PageTitle title={t('home.title')} />
      <HeroBlock />
      <FeatureGridBlock />
      <CallToActionBlock />
    </>
  );
}
