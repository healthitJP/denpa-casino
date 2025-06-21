// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabaseBrowser";

export default function EdgeTest() {
  const supabase = createClient();
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function callStats() {
    setError(null);
    setResponse(null);
    console.log("[EdgeTest] invoke stats");
    const { data, error } = await supabase.functions.invoke("stats", {
      body: { mode: "all", include_default: true },
    });
    if (error) {
      console.error("[EdgeTest] stats error", error);
      setError(error.message);
    } else {
      console.log("[EdgeTest] stats data", data);
      setResponse(data);
    }
  }

  useEffect(() => {
    callStats();
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>Edge Function 呼び出しテスト</h1>
      <button onClick={callStats} style={{ padding: "8px 16px", marginTop: 16 }}>
        call /functions/v1/stats
      </button>

      {error && <pre style={{ color: "red" }}>{error}</pre>}
      {response && (
        <pre style={{ maxHeight: 300, overflow: "auto", marginTop: 16 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </main>
  );
} 