import Link from "next/link";
import { getProfile } from "@/lib/supabase/dal";
import { logout } from "@/lib/supabase/auth-actions";
import { WalletProvider, WalletBadge } from "@/components/wallet";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth-optional: browse/watch/flow are public. Pages that need a session
  // (profile, upload, admin, onboarding) gate themselves.
  const profile = await getProfile();

  const header = (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:px-6 sm:py-4">
      <Link
        href="/"
        className="font-display text-base font-extrabold tracking-[0.14em] bg-[image:var(--ember-grad)] bg-clip-text text-transparent"
      >
        EMBER
      </Link>
      {profile ? (
        <>
          <nav className="flex items-center gap-3 text-sm text-ink-dim sm:gap-4">
            <Link href="/" className="hover:text-ink">
              Browse
            </Link>
            <Link href="/profile" className="hover:text-ink">
              Profile
            </Link>
            {profile.role !== "viewer" && (
              <Link href="/upload" className="hover:text-ink">
                Upload
              </Link>
            )}
            {profile.is_admin && (
              <Link href="/admin" className="text-ember-2 hover:text-ember-1">
                Admin
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm sm:gap-4">
            <WalletBadge />
            <span className="hidden text-ink-dim sm:inline">@{profile.handle}</span>
            <form action={logout}>
              <button className="text-ink-dim hover:text-ink" type="submit">
                Log out
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/login" className="text-ink-dim hover:text-ink">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[image:var(--ember-grad)] px-4 py-2 font-display text-xs font-semibold text-[#1A0A08] hover:brightness-110"
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  );

  const body = (
    <div className="flex min-h-screen flex-col">
      {header}
      {profile?.suspended && (
        <div className="border-b border-ember-3/30 bg-ember-3/10 px-6 py-3 text-center text-sm text-ember-3">
          Your account is suspended. You can browse, but uploading, commenting,
          and tipping are disabled.
        </div>
      )}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );

  // Wallet context only exists for signed-in users.
  return profile ? (
    <WalletProvider initialBalance={profile.ember_balance}>{body}</WalletProvider>
  ) : (
    body
  );
}
