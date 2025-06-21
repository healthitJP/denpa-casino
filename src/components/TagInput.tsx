// @ts-nocheck
// TagInput using Tagify
"use client";

import React from "react";
import Tags from "@yaireo/tagify/dist/react.tagify";

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function TagInput({ values, onChange, placeholder, readOnly }: TagInputProps) {
  const initialValue = values.join(",");

  function handleChange(e: any) {
    const newValue = e.detail.value as string; // comma-separated
    const arr = newValue ? newValue.split(",") : [];
    onChange(arr);
  }

  return (
    <Tags
      settings={{
        duplicates: false,
        maxTags: 20,
        enforceWhitelist: false,
        editTags: false,
        readOnly,
        placeholder,
      }}
      defaultValue={initialValue}
      onChange={handleChange}
      className="tag-input border rounded p-2 text-sm w-full"
    />
  );
} 