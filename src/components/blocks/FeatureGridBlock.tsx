'use client';

import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function FeatureGridBlock() {
  const { t } = useTranslation();

  const features = [
    {
      icon: 'material-symbols:language',
      title: t('home.feature_worlds_title'),
      description: t('home.feature_worlds_desc'),
    },
    {
      icon: 'material-symbols:group-rounded',
      title: t('home.feature_social_title'),
      description: t('home.feature_social_desc'),
    },
    {
      icon: 'material-symbols:sentiment-satisfied-rounded',
      title: t('home.feature_avatars_title'),
      description: t('home.feature_avatars_desc'),
    },
    {
      icon: 'material-symbols:share',
      title: t('home.feature_open_title'),
      description: t('home.feature_open_desc'),
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-heading text-3xl font-bold mb-3">
          {t('home.features_title')}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          {t('home.features_subtitle')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon, title, description }) => (
            <Card key={title} className="border border-border">
              <CardHeader>
                <Icon icon={icon} className="h-8 w-8 text-primary mb-2" aria-hidden />
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
