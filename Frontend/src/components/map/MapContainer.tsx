"use client";

import dynamic from "next/dynamic";

// Leaflet requires browser APIs — disable SSR
const BordeauxMap = dynamic(() => import("./BordeauxMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-green-600" />
        <span className="text-sm font-medium">Chargement de la carte…</span>
      </div>
    </div>
  ),
});

export default function MapContainer() {
  return <BordeauxMap />;
}
