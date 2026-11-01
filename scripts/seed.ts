// Loads the clearly labelled sample candidates. Usage: npm run seed
// (uses DATABASE_URL if set, otherwise the local PGlite database). Safe to re-run.
import { reseedSamples } from "../src/lib/samples/seed";

reseedSamples().then(
  (rows) => {
    for (const row of rows) {
      console.log(`${row.name.padEnd(18)} ${row.role.padEnd(32)} ${row.stage.padEnd(13)} ${row.score ?? "-"}% (${row.engine})`);
    }
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
