/**
 * Lance une synchronisation complète DataHub -> PostgreSQL.
 * Usage : npm run import:data
 */
import { prisma } from "../src/config/database";
import { syncAllDatasets } from "../src/services/data-sync.service";

async function main() {
  console.log("[Import] Synchronisation forcée des datasets cartographiques...");

  const report = await syncAllDatasets({
    force: true,
    reason: "import-script",
  });

  console.log("[Import] Synchronisation terminée.");
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error("[Import] Échec:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
