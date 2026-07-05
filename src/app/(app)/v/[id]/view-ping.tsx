"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Counted client-side after mount so RSC prefetches don't inflate views.
export function ViewPing({ videoId }: { videoId: string }) {
  useEffect(() => {
    // supabase-js builders are lazy thenables — without .then() no request fires.
    createClient()
      .rpc("increment_view_count", { video_id: videoId })
      .then(({ error }) => {
        if (error) console.error("view ping failed:", error.message);
      });
  }, [videoId]);

  return null;
}
