"use client";

import type { ReactNode } from "react";

import { KitchenContext } from "@/hooks/use-kitchen";
import { useKitchenController } from "@/hooks/use-kitchen-controller";
import type { KitchenState } from "@/types/kitchen";

type KitchenProviderProps = {
  children: ReactNode;
  initialData?: KitchenState;
  initialError?: string;
};

export default function KitchenProvider({
  children,
  initialData,
  initialError,
}: KitchenProviderProps) {
  const { value, refresh } = useKitchenController(initialData, initialError);

  return (
    <KitchenContext value={value}>
      {value.error && (
        <div className="server-error" role="alert">
          <span>{value.error}</span>
          <button type="button" onClick={() => void refresh()}>
            Tentar novamente
          </button>
        </div>
      )}
      {children}
    </KitchenContext>
  );
}
