'use client';

import { AppError, type AppErrorProps } from '@/app/error';

export default function PublicError(props: Omit<AppErrorProps, 'layout'>) {
  return <AppError {...props} />;
}
