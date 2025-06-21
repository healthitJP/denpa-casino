// @ts-nocheck
"use client";

import React, { useState } from "react";
import TagInput from "./TagInput";
import { StatsMode } from "../types/stats";

interface Props {
  mode: StatsMode;
  setMode: (m: StatsMode) => void;
  includeDefault: boolean;
  setIncludeDefault: (b: boolean) => void;
  excludeDraws: boolean;
  setExcludeDraws: (b: boolean) => void;
  groupIds: string[];
  setGroupIds: (ids: string[]) => void;
  selfId: string;
}

export default function StatSelector({
  mode,
  setMode,
  includeDefault,
  setIncludeDefault,
  excludeDraws,
  setExcludeDraws,
  groupIds,
  setGroupIds,
  selfId,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded">
      {/* header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 font-semibold hover:bg-gray-100"
      >
        <span>詳細設定</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="space-y-4 p-4 pt-0">
          <div className="flex flex-col gap-2">
            <label className="font-semibold">統計モード</label>
            <select
              className="border rounded p-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as StatsMode)}
            >
              <option value="self" disabled={!selfId}>
                自分のみ{!selfId ? " (要ログイン)" : ""}
              </option>
              <option value="all">全体</option>
              <option value="group" disabled={!selfId}>
                グループ{!selfId ? " (要ログイン)" : ""}
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeDefault}
              onChange={(e) => setIncludeDefault(e.target.checked)}
              id="includeDefault"
            />
            <label htmlFor="includeDefault">デフォルト統計も含める</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={excludeDraws}
              onChange={(e) => setExcludeDraws(e.target.checked)}
              id="excludeDraws"
            />
            <label htmlFor="excludeDraws">引き分けを除外</label>
          </div>

          {mode === "group" && (
            <div className="space-y-2">
              <label className="font-semibold">ユーザー ID 群</label>
              <TagInput
                values={groupIds}
                onChange={setGroupIds}
                placeholder="UUID を入力 (Enter で確定)"
              />
              {selfId && (
                <p className="text-xs text-F-500">デフォルトで自分の ID ({selfId}) が含まれます</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 