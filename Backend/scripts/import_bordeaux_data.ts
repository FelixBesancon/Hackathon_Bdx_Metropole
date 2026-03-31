/**
 * Importe les données open data de Bordeaux Métropole dans la base de données.
 * Usage : npm run import:data
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DATAHUB_BASE =
  "https://datahub.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets";

// ─── Import îlots de chaleur ────────────────────────────────────────────────

async function importHeatZones() {
  console.log("Importation des îlots de chaleur…");

  // Dataset exemple — à remplacer par le dataset réel de température
  const url = new URL(`${DATAHUB_BASE}/met_vegetation_urbaine/records`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("select", "geo_shape,nom,code_insee");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();

  let imported = 0;
  for (const record of data.results) {
    if (!record.geo_shape) continue;

    const geometry =
      record.geo_shape.geometry ?? record.geo_shape;

    await prisma.heatZone.upsert({
      where: { id: imported + 1 },
      update: {},
      create: {
        name: record.nom ?? `Zone ${imported + 1}`,
        geometry,
        temperature: 35 + Math.random() * 8, // placeholder
        intensity: Math.ceil(Math.random() * 5) as 1 | 2 | 3 | 4 | 5,
      },
    });
    imported++;
  }

  console.log(`${imported} zones importées.`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  await importHeatZones();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
