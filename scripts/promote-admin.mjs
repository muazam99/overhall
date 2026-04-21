import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const targetEmail = process.argv[2]?.trim().toLowerCase();

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Run with: node --env-file=.env scripts/promote-admin.mjs <email>");
}

if (!targetEmail) {
  throw new Error(
    "Missing target email. Usage: node --env-file=.env scripts/promote-admin.mjs <email>",
  );
}

const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
        UPDATE "user"
        SET "role" = 'admin', "updated_at" = NOW()
        WHERE LOWER("email") = $1
        RETURNING "id", "email", "role";
      `,
      [targetEmail],
    );

    if (result.rowCount === 0) {
      throw new Error(`No user found with email "${targetEmail}".`);
    }

    console.log(`Promoted user ${result.rows[0].email} to admin.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Failed to promote admin:", error);
  process.exit(1);
});
