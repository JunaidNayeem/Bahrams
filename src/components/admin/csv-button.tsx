"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Downloads tabular report data as CSV (for the CA / GSTR-1 workings). */
export function CsvButton({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const csv = rows.map((r) => r.map(cell).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const a = Object.assign(document.createElement("a"), { href: url, download: filename });
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <DownloadIcon /> CSV
    </Button>
  );
}
