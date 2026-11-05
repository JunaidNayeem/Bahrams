"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { findVariantBySku, VARIANT_PARAM } from "@/lib/domain/variants";

interface VariantSelection {
  selectedId: string | undefined;
  select: (id: string) => void;
}

const VariantSelectionContext = createContext<VariantSelection | null>(null);

/**
 * Shares the chosen variant between the gallery and the buy box, so picking a design shows that
 * design's photos. The choice is mirrored in ?variant=<sku> on the client only (history.replaceState),
 * which keeps the product page static and cached while making each design's URL shareable.
 */
export function VariantSelectionProvider({
  variants,
  children,
}: {
  variants: readonly { id: string; sku: string }[];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);

  useEffect(() => {
    const sku = new URLSearchParams(window.location.search).get(VARIANT_PARAM);
    const match = findVariantBySku(variants, sku);
    // Syncing from the URL (an external system) after hydration; the server render can't see it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (match) setSelectedId(match.id);
  }, [variants]);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      const variant = variants.find((v) => v.id === id);
      if (!variant) return;
      const url = new URL(window.location.href);
      if (id === variants[0]?.id) url.searchParams.delete(VARIANT_PARAM);
      else url.searchParams.set(VARIANT_PARAM, variant.sku.toLowerCase());
      window.history.replaceState(window.history.state, "", url);
    },
    [variants],
  );

  return (
    <VariantSelectionContext.Provider value={{ selectedId, select }}>
      {children}
    </VariantSelectionContext.Provider>
  );
}

/** The selected variant id, or undefined outside a provider (single-variant layouts). */
export function useVariantSelection(): VariantSelection | null {
  return useContext(VariantSelectionContext);
}
