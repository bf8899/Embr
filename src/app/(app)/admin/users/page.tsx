import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getCurrentUser } from "@/lib/supabase/dal";
import { UserRow, type AdminUser } from "./controls";
import { UserSearch } from "./search";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const search = q?.trim() ?? "";

  const [supabase, me] = await Promise.all([createClient(), getCurrentUser()]);
  const { data, error } = await supabase.rpc("admin_user_directory", {
    p_search: search || undefined,
  });

  const users = (data ?? []) as AdminUser[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <Link href="/admin" className="text-sm text-ember-2 hover:text-ember-1">
          ← Moderation queue
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-dim">
        Suspend or delete accounts, grant embers, and manage admins.
      </p>

      <UserSearch initial={search} />

      {error ? (
        <p className="mt-6 text-sm text-ember-3">Couldn&apos;t load users: {error.message}</p>
      ) : users.length === 0 ? (
        <div className="mt-8 rounded-[22px] border border-dashed border-line p-12 text-center text-ink-faint">
          {search ? "No users match that search." : "No users yet."}
        </div>
      ) : (
        <>
          <p className="mt-6 text-xs text-ink-faint">
            {users.length}
            {users.length === 100 ? "+" : ""} {users.length === 1 ? "user" : "users"}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === me?.id} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
