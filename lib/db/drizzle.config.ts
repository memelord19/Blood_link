import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../.env") });

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: [
    "./src/schema/users.ts",
    "./src/schema/donors.ts",
    "./src/schema/appointments.ts",
    "./src/schema/blood_bags.ts",
    "./src/schema/donations.ts",
    "./src/schema/blood_requests.ts",
    "./src/schema/alerts.ts",
    "./src/schema/invoices.ts",
    "./src/schema/notifications.ts",
    "./src/schema/transfusion_centers.ts",
    "./src/schema/blood_banks.ts",
    "./src/schema/establishments.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
