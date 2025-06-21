// Server Component: fetch initial combination list on the server and
// render lightweight client component for user interaction.

import { createClient } from "../../utils/supabaseServer";
// @ts-ignore false positive due to Next.js app dir resolution
import BettingClient from "./BettingClient";

export default async function BettingPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.functions.invoke("stats", {
    body: { mode: "all", include_default: true },
  });

  if (error) {
    // Surface error to the nearest error boundary in the app.
    throw new Error(error.message);
  }

  const combos = (data?.combinations ?? []).map((c: any) => ({
    id: c.combination_id,
    monsters: c.monsters,
  }));

  return <BettingClient initialCombos={combos} />;
} 