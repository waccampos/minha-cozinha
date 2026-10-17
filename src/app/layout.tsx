import "@/styles/globals.css";
import "@/styles/mobile.css";
import "@/styles/recipe-prompt.css";
import "@/styles/categories.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import Footer from "@/components/layout/footer";
import KitchenProvider from "@/components/layout/kitchen-provider";
import Shell from "@/components/layout/shell";
import { publicError } from "@/lib/errors";
import { readKitchen } from "@/server/repositories/kitchen.repository";
import { emptyKitchen } from "@/types/kitchen";

export const metadata: Metadata = {
  title: { default: "Minha Cozinha", template: "%s | Minha Cozinha" },
  description: "Sua coleção de receitas, memórias e descobertas.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffdf9",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  let data = emptyKitchen;
  let error = "";

  try {
    data = await readKitchen();
  } catch (cause) {
    error = publicError(cause).message;
  }

  return (
    <html lang="pt-BR">
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags -- CSS público gerado por assets:vendor, servido diretamente por URL. */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>
        <KitchenProvider initialData={data} initialError={error}>
          <Shell footer={<Footer />}>{children}</Shell>
        </KitchenProvider>
      </body>
    </html>
  );
}
