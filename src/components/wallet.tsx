"use client";

import { createContext, useContext, useState } from "react";
import { formatViews } from "@/lib/format";

type WalletContextValue = {
  balance: number;
  // Reconcile to the authoritative balance returned by send_tip().
  setBalance: (balance: number) => void;
  // Optimistic adjustment before the server responds (negative to spend).
  adjustBalance: (delta: number) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  initialBalance,
  children,
}: {
  initialBalance: number;
  children: React.ReactNode;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const adjustBalance = (delta: number) => setBalance((b) => b + delta);
  return (
    <WalletContext.Provider value={{ balance, setBalance, adjustBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}

function Flame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2c.4 3-1.6 4.4-2.8 5.9C8 9.4 7.2 10.8 7.2 13a4.8 4.8 0 0 0 9.6.3c0-2.2-1-3.6-2-5-.5.9-1 1.4-1.8 1.7.6-2.6-.2-5.6-1-8z" />
    </svg>
  );
}

export function WalletBadge() {
  const { balance } = useWallet();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-ember-1/30 bg-ember-1/10 px-3 py-1 text-ember-1"
      title={`${balance.toLocaleString()} embers`}
    >
      <Flame className="h-3.5 w-3.5" />
      <span className="font-medium tabular-nums">{formatViews(balance)}</span>
    </span>
  );
}
