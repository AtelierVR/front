'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/lib/api/context';
import { Skeleton } from '@/components/ui/skeleton';

interface NodeInfoUsage {
  users: {
    total: number;
    activeMonth: number;
    activeHalfyear: number;
  };
  localPosts: number;
}

function StatItem({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {value === undefined ? (
        <Skeleton className="h-10 w-24" />
      ) : (
        <span className="font-heading text-4xl font-bold text-primary">
          {value.toLocaleString()}
        </span>
      )}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function StatsBlock() {
  const { t } = useTranslation();
  const { wellKnown } = useApi();
  const [stats, setStats] = useState<NodeInfoUsage | null>(null);

  useEffect(() => {
    if (!wellKnown) return;
    fetch(`${wellKnown.gateway.api}/api/nodeinfo/2.1`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.usage) setStats(data.usage);
      })
      .catch(() => {});
  }, [wellKnown]);

  return (
    <section className="border-t border-b border-border py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-heading text-2xl font-semibold mb-10">
          {t('home.stats_title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <StatItem label={t('home.stats_users')} value={stats?.users.total} />
          <StatItem label={t('home.stats_active')} value={stats?.users.activeMonth} />
          <StatItem label={t('home.stats_posts')} value={stats?.localPosts} />
        </div>
      </div>
    </section>
  );
}
