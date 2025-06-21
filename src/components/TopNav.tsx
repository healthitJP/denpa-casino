// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../utils/supabaseBrowser";

export default function TopNav() {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="w-full flex justify-between items-center px-4 py-3 border-b sticky top-0 bg-white z-10">
      <Link href="/" className="font-bold text-lg">電波人間カジノ統計</Link>
      <nav className="flex items-center gap-4">
        <Link href="/betting" className="hover:underline">Betting</Link>
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        {user ? (
          <Link href="/mypage" className="px-3 py-1 bg-gray-800 text-white rounded text-sm">
            My Page
          </Link>
        ) : (
          <Link href="/login" className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            ログイン
          </Link>
        )}
      </nav>
    </header>
  );
} 