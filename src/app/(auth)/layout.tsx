import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <Link
        href="/"
        className="mb-8 font-display text-lg font-extrabold tracking-[0.14em]"
      >
        <span
          className="bg-[image:var(--ember-grad)] bg-clip-text text-transparent"
          style={{ fontStyle: "normal" }}
        >
          EMBER
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-[22px] border border-line bg-pane p-8">
        {children}
      </div>
    </div>
  );
}
