// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../utils/supabaseBrowser";

export default function TopNav() {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = useState(null);
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  if (typeof window !== "undefined") {
    console.log(`[TopNav] render #${renderCount.current}`);
  }

  useEffect(() => {
    let unsub: (() => void) | null = null;

    // initial fetch
    supabase.auth.getUser().then(({ data }) => {
      setUser((prev) => (prev?.id === data.user?.id ? prev : data.user));
    });

    // subscribe to subsequent changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
    });

    unsub = () => listener.subscription.unsubscribe();

    return () => {
      // cleanup
      unsub?.();
    };
  }, [supabase]);

  return (
    <header className="w-full flex justify-between items-center px-4 py-3 border-b sticky top-0 bg-white z-10">
      <Link href="/" className="font-bold text-lg">電波人間カジノ統計</Link>
      <nav className="flex items-center gap-4">
        <Link href="/betting" className="hover:underline">Betting</Link>
        {user && (
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        )}
        {user ? (
          <Link href="/mypage" className="hover:underline">
            My Page
          </Link>
        ) : (
          <Link href="/login" className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
            ログイン
          </Link>
        )}
      </nav>
    </header>
  );
} 