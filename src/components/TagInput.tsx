"use client";

import React, { useState, useRef, useEffect } from "react";

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function TagInput({ values, onChange, placeholder, readOnly }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // notify parent when values change internally
  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (readOnly) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input) {
      // delete last tag
      onChange(values.slice(0, -1));
    }
  }

  // focus helper when container clicked
  function focusInput() {
    inputRef.current?.focus();
  }

  // keep internal input empty when parent resets values externally
  useEffect(() => {
    setInput("");
  }, [values.join(",")]);

  return (
    <div
      className="flex flex-wrap gap-1 border rounded p-2 text-sm w-full cursor-text min-h-10"
      onClick={focusInput}
    >
      {values.map((tag) => (
        <span
          key={tag}
          className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded flex items-center gap-1"
        >
          {tag}
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(values.filter((t) => t !== tag));
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!readOnly && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : undefined}
          className="flex-1 min-w-[6rem] outline-none"
        />
      )}
    </div>
  );
} 