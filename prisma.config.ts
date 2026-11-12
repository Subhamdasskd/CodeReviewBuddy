// Prisma CLI configuration.
//
// The datasource is intentionally not overridden here: the CLI follows the
// `datasource` block in prisma/schema.prisma, so switching that file to
// PostgreSQL is all that is needed for a deployment build.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
