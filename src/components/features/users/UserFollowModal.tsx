'use client';

import { useTranslation } from 'react-i18next';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { UserFollowList } from './UserFollowList';

interface Props {
  mode: 'followers' | 'following';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFollowModal({ mode, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const labelKey = mode === 'followers' ? 'user.followers' : 'user.following';

  return (
    <ModalDrawer open={open} onOpenChange={onOpenChange} header={t(labelKey)}>
      <div className="flex-1 overflow-y-auto">
        <UserFollowList mode={mode} />
      </div>
    </ModalDrawer>
  );
}
