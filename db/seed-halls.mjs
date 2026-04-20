import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Run with: node --env-file=.env db/seed-halls.mjs");
}

const seedHost = {
  id: "seed-host-user-001",
  name: "Seed Host",
  email: "seed.host@overhall.local",
};

const halls = [
  {
    seedId: "seed-hall-001",
    slug: "seri-kembangan-grand-hall",
    name: "Seri Kembangan Grand Hall",
    description: "Spacious modern venue for weddings, banquets, and corporate events.",
    addressLine1: "12 Jalan SK 1",
    addressLine2: null,
    city: "Seri Kembangan",
    state: "Selangor",
    postalCode: "43300",
    country: "Malaysia",
    latitude: 3.0261,
    longitude: 101.7059,
    maxCapacity: 350,
    basePriceMyr: 4500,
    cleaningFeeMyr: 300,
    serviceFeeMyr: 150,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-001-photo-cover",
        path: "halls/seed-hall-001/cover-main.jpg",
        altText: "Main hall stage and seating setup",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-001-photo-foyer",
        path: "halls/seed-hall-001/foyer.jpg",
        altText: "Foyer and welcome area",
        sortOrder: 1,
        isCover: false,
      },
    ],
  },
  {
    seedId: "seed-hall-002",
    slug: "ampang-elegance-hall",
    name: "Ampang Elegance Hall",
    description: "Elegant hall with flexible floor plan for intimate and mid-sized events.",
    addressLine1: "88 Jalan Ampang",
    addressLine2: null,
    city: "Ampang",
    state: "Selangor",
    postalCode: "68000",
    country: "Malaysia",
    latitude: 3.1537,
    longitude: 101.7606,
    maxCapacity: 220,
    basePriceMyr: 3200,
    cleaningFeeMyr: 200,
    serviceFeeMyr: 120,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-002-photo-cover",
        path: "halls/seed-hall-002/cover-main.jpg",
        altText: "Decorated wedding reception hall",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-002-photo-ballroom",
        path: "halls/seed-hall-002/ballroom.jpg",
        altText: "Ballroom style seating layout",
        sortOrder: 1,
        isCover: false,
      },
    ],
  },
];

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        INSERT INTO "user" ("id", "name", "email", "email_verified")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("email")
        DO UPDATE SET
          "name" = EXCLUDED."name",
          "updated_at" = NOW()
        RETURNING "id";
      `,
      [seedHost.id, seedHost.name, seedHost.email, true],
    );

    const hostUserId = userResult.rows[0].id;

    for (const hall of halls) {
      const hallResult = await client.query(
        `
          INSERT INTO "hall" (
            "id",
            "host_user_id",
            "slug",
            "name",
            "description",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "latitude",
            "longitude",
            "max_capacity",
            "base_price_myr",
            "cleaning_fee_myr",
            "service_fee_myr",
            "cover_photo_url",
            "status"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
          )
          ON CONFLICT ("slug")
          DO UPDATE SET
            "host_user_id" = EXCLUDED."host_user_id",
            "name" = EXCLUDED."name",
            "description" = EXCLUDED."description",
            "address_line_1" = EXCLUDED."address_line_1",
            "address_line_2" = EXCLUDED."address_line_2",
            "city" = EXCLUDED."city",
            "state" = EXCLUDED."state",
            "postal_code" = EXCLUDED."postal_code",
            "country" = EXCLUDED."country",
            "latitude" = EXCLUDED."latitude",
            "longitude" = EXCLUDED."longitude",
            "max_capacity" = EXCLUDED."max_capacity",
            "base_price_myr" = EXCLUDED."base_price_myr",
            "cleaning_fee_myr" = EXCLUDED."cleaning_fee_myr",
            "service_fee_myr" = EXCLUDED."service_fee_myr",
            "cover_photo_url" = EXCLUDED."cover_photo_url",
            "status" = EXCLUDED."status",
            "updated_at" = NOW()
          RETURNING "id";
        `,
        [
          hall.seedId,
          hostUserId,
          hall.slug,
          hall.name,
          hall.description,
          hall.addressLine1,
          hall.addressLine2,
          hall.city,
          hall.state,
          hall.postalCode,
          hall.country,
          hall.latitude,
          hall.longitude,
          hall.maxCapacity,
          hall.basePriceMyr,
          hall.cleaningFeeMyr,
          hall.serviceFeeMyr,
          hall.coverPhotoUrl,
          hall.status,
        ],
      );

      const hallId = hallResult.rows[0].id;

      for (const photo of hall.photos) {
        await client.query(
          `
            INSERT INTO "hall_photo" (
              "id",
              "hall_id",
              "path",
              "alt_text",
              "sort_order",
              "is_cover"
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT ("id")
            DO UPDATE SET
              "hall_id" = EXCLUDED."hall_id",
              "path" = EXCLUDED."path",
              "alt_text" = EXCLUDED."alt_text",
              "sort_order" = EXCLUDED."sort_order",
              "is_cover" = EXCLUDED."is_cover",
              "updated_at" = NOW();
          `,
          [photo.id, hallId, photo.path, photo.altText, photo.sortOrder, photo.isCover],
        );
      }
    }

    await client.query("COMMIT");
    console.log("Seeded host user, halls, and hall photos successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Failed to seed halls:", error);
  process.exit(1);
});
