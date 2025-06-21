// @ts-nocheck
"use client";

import React from "react";
import { createClient } from "../../utils/supabaseBrowser";

export default function LoginPage() {
  const supabase = React.useMemo(() => createClient(), []);

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }
  async function signInTwitter() {
    await supabase.auth.signInWithOAuth({ provider: "twitter" });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">ログイン / サインアップ</h1>
      <button
        onClick={signInGoogle}
        className="px-6 py-3 bg-blue-600 text-white rounded"
      >
        Google で続行
      </button>
      <button
        onClick={signInTwitter}
        className="px-6 py-3 bg-black text-white rounded"
      >
        X (Twitter) で続行
      </button>
    </div>
  );
} 