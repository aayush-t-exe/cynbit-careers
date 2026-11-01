"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function CopyLink() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost min-h-10 px-4 text-sm"
      onClick={async () => {
        try {
          const url = new URL(window.location.href);
          url.search = "";
          await navigator.clipboard.writeText(url.toString());
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy your tracker link:", window.location.href.split("?")[0]);
        }
      }}
    >
      {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
      {copied ? "Link copied" : "Copy tracker link"}
    </button>
  );
}
