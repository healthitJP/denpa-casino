// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../utils/supabaseBrowser";
import { ClipboardIcon } from "@heroicons/react/24/outline";

export default function MyPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [displayName, setDisplayName] = useState("");
  const [uuid, setUuid] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // fetch profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("未ログインです");
        setLoading(false);
        return;
      }
      setUuid(user.id);

      // ensure row exists
      await supabase.from("users").upsert({ id: user.id }).eq("id", user.id);
      const { data, error } = await supabase.from("users").select("display_name").eq("id", user.id).single();
      if (!error && data) setDisplayName(data.display_name ?? "");
      setLoading(false);
    })();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("users").update({ display_name: displayName }).eq("id", uuid);
    if (error) setMessage(error.message);
    else setMessage("保存しました");
    setSaving(false);
  }

  function copyUuid() {
    navigator.clipboard.writeText(uuid);
    setMessage("UUID をコピーしました");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  if (loading) return <p className="p-4">読み込み中...</p>;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">マイページ</h1>

      {message && <p className="text-sm text-blue-600">{message}</p>}

      <div className="space-y-2">
        <label className="font-semibold">ユーザー名 (公開)</label>
        <input
          type="text"
          className="border rounded w-full p-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      <div className="space-y-2">
        <label className="font-semibold flex items-center gap-2">
          ユーザー ID (UUID)
          <button onClick={copyUuid} className="p-1 hover:bg-gray-100 rounded">
            <ClipboardIcon className="w-5 h-5" />
          </button>
        </label>
        <input type="text" className="border rounded w-full p-2" value={uuid} readOnly />
        <p className="text-xs text-gray-500">ID は公開されます。コピーして友人に共有できます。</p>
      </div>

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        ログアウト
      </button>
    </div>
  );
} 