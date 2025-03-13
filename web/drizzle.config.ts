import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: [
    "./src/server/db/schema/tables/*.ts",
    "./src/server/db/schema/relations/*.ts",
    "./src/server/db/schema/enums.ts"
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: env.POSTGRES_URL
  },
  tablesFilter: ["dexter_*"]
} satisfies Config;
