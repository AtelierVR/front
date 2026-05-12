'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { InstanceCard } from '@/components/features/instances/InstanceCard';
import { CreateInstanceDrawer } from '@/components/features/instances/CreateInstanceDrawer';
import { getWorldInstances } from '@/lib/api/instances';
import { useWorld } from '@/components/features/worlds/WorldContext';
import { useApi } from '@/lib/api/context';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import type { ApiInstance } from '@/types/api';

export default function WorldInstancesPage() {
  const { world } = useWorld();
  const { t } = useTranslation();
  const { currentUser } = useApi();
  const [instances, setInstances] = useState<ApiInstance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadInstances = useCallback(() => {
    if (!world) return;
    setLoading(true);
    getWorldInstances(world.id)
      .then((data) => setInstances(data.items))
      .catch(() => setInstances([]))
      .finally(() => setLoading(false));
  }, [world]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const canCreate = !!currentUser;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('world.instances')}</h2>
        {canCreate && world && (
          <>
            <Button size="sm" onClick={() => setDrawerOpen(true)}>
              <Icon icon="material-symbols:add-rounded" className="size-4 mr-1.5" />
              {t('instance.create')}
            </Button>
            <CreateInstanceDrawer
              defaultWorld={world}
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              onCreated={loadInstances}
            />
          </>
        )}
      </div>

      {/* Instance list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : !instances || instances.length === 0 ? (
        <div className="text-center text-muted-foreground border border-dashed rounded-xl py-12">
          {t('world.no_instances')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {instances.map((instance) => (
            <InstanceCard key={instance.id} instance={instance} />
          ))}
        </div>
      )}
    </div>
  );
}
