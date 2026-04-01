import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";

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
      <body style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f7f6f2", margin: 0 }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
