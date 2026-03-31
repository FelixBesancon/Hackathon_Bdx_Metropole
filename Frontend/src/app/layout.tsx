import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Bordeaux Métropole — Résilience urbaine",
  description:
    "Simulation interactive des îlots de chaleur et des actions citoyennes à Bordeaux",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="h-full bg-stone-50">{children}</body>
    </html>
  );
}
