// Embers sent per hold-to-tip. Fixed amount per press (non-monetary demo
// tokens). The starting wallet grant lives in the tips migration.
export const TIP_AMOUNT = 10;

// Maps a send_tip() Postgres error message to viewer-facing copy.
export function tipErrorMessage(raw: string): string {
  if (raw.includes("insufficient balance")) return "You're out of embers.";
  if (raw.includes("cannot tip yourself")) return "You can't tip yourself.";
  if (raw.includes("not authenticated")) return "Sign in to send embers.";
  if (raw.includes("tip target not found")) return "That's gone now.";
  return "Couldn't send embers. Try again.";
}
