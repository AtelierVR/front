'use client';

import { AppError, type AppErrorProps } from '@/app/error';

export default function DashboardError(props: Omit<AppErrorProps, 'layout'>) {
  return <AppError {...props} />;
}
