import { AuthGuard } from '@/lib/auth/guards';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-muted">
        <Header />
        <main className="flex-1 bg-muted">{children}</main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
