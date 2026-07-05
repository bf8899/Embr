import Link from "next/link";
import { requireProfile } from "@/lib/supabase/dal";
import { logout } from "@/lib/supabase/auth-actions";
import { WalletProvider, WalletBadge } from "@/components/wallet";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <WalletProvider initialBalance={profile.ember_balance}>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-6 border-b border-line px-6 py-4">
          <Link
            href="/dashboard"
            className="font-display text-base font-extrabold tracking-[0.14em] bg-[image:var(--ember-grad)] bg-clip-text text-transparent"
          >
            EMBER
          </Link>
          <nav className="flex items-center gap-4 text-sm text-ink-dim">
            <Link href="/dashboard" className="hover:text-ink">
              Dashboard
            </Link>
            <Link href="/profile" className="hover:text-ink">
              Profile
            </Link>
            {profile.role !== "viewer" && (
              <Link href="/upload" className="hover:text-ink">
                Upload
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <WalletBadge />
            <span className="text-ink-dim">@{profile.handle}</span>
            <form action={logout}>
              <button className="text-ink-dim hover:text-ink" type="submit">
                Log out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-6 py-10">{children}</main>
      </div>
    </WalletProvider>
  );
}
