"use client";

import { useState } from "react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <ChunkyButton
      type="button"
      color="sky"
      full
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy code"}
    </ChunkyButton>
  );
}
