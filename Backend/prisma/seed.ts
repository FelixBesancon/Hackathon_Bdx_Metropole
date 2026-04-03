import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.heatZone.createMany({
    data: [
      {
        name: "Centre-ville",
        geometry: { type: "Point", coordinates: [-0.5792, 44.8378] },
        temperature: 40.2,
        intensity: 5,
      },
      {
        name: "Mériadeck",
        geometry: { type: "Point", coordinates: [-0.5860, 44.8380] },
        temperature: 38.5,
        intensity: 4,
      },
      {
        name: "Bacalan",
        geometry: { type: "Point", coordinates: [-0.5650, 44.8650] },
        temperature: 36.0,
        intensity: 3,
      },
      {
        name: "Saint-Michel",
        geometry: { type: "Point", coordinates: [-0.5620, 44.8320] },
        temperature: 37.2,
        intensity: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed terminé.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
