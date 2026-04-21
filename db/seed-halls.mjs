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

const amenityCatalog = [
  { id: "seed-amenity-001", slug: "high-fidelity-sound-system", label: "High-fidelity sound system" },
  { id: "seed-amenity-002", slug: "dual-4k-projectors-led-wall", label: "Dual 4K projectors + LED wall" },
  { id: "seed-amenity-003", slug: "bridal-suite-makeup-room", label: "Bridal suite + makeup prep room" },
  { id: "seed-amenity-004", slug: "on-site-event-coordinator", label: "On-site event coordinator" },
  { id: "seed-amenity-005", slug: "private-parking", label: "Private parking area" },
  { id: "seed-amenity-006", slug: "wheelchair-access", label: "Wheelchair access + guest lift" },
  { id: "seed-amenity-007", slug: "high-speed-wifi", label: "High-speed Wi-Fi" },
  { id: "seed-amenity-008", slug: "built-in-lighting-rig", label: "Built-in lighting rig" },
  { id: "seed-amenity-009", slug: "air-conditioning", label: "Air-conditioning" },
  { id: "seed-amenity-010", slug: "catering-pantry", label: "Catering pantry access" },
  { id: "seed-amenity-011", slug: "stage-and-backdrop", label: "Stage + backdrop area" },
  { id: "seed-amenity-012", slug: "prayer-room", label: "Prayer room" },
];

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
    amenities: [
      "high-fidelity-sound-system",
      "dual-4k-projectors-led-wall",
      "bridal-suite-makeup-room",
      "on-site-event-coordinator",
      "private-parking",
      "wheelchair-access",
    ],
    customAmenities: ["Dedicated bridal arrival entrance"],
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
    amenities: [
      "high-fidelity-sound-system",
      "air-conditioning",
      "private-parking",
      "wheelchair-access",
      "stage-and-backdrop",
      "catering-pantry",
    ],
    customAmenities: ["Flexible partition walls"],
  },
  {
    seedId: "seed-hall-003",
    slug: "petaling-jaya-luxe-loft",
    name: "Petaling Jaya Luxe Loft",
    description: "Contemporary loft-style event hall suitable for product launches and private dinners.",
    addressLine1: "22 Jalan SS 2/67",
    addressLine2: null,
    city: "Petaling Jaya",
    state: "Selangor",
    postalCode: "47300",
    country: "Malaysia",
    latitude: 3.1176,
    longitude: 101.6152,
    maxCapacity: 180,
    basePriceMyr: 2900,
    cleaningFeeMyr: 180,
    serviceFeeMyr: 100,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-003-photo-cover",
        path: "halls/seed-hall-003/cover-main.jpg",
        altText: "Loft hall with modern lights",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-003-photo-interior",
        path: "halls/seed-hall-003/interior.jpg",
        altText: "Open floor event setup",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "high-speed-wifi",
      "dual-4k-projectors-led-wall",
      "built-in-lighting-rig",
      "air-conditioning",
      "private-parking",
      "catering-pantry",
    ],
    customAmenities: ["Moveable staging risers"],
  },
  {
    seedId: "seed-hall-004",
    slug: "shah-alam-lakefront-hall",
    name: "Shah Alam Lakefront Hall",
    description: "Bright banquet hall with lakefront views for weddings and family celebrations.",
    addressLine1: "9 Persiaran Tasik",
    addressLine2: null,
    city: "Shah Alam",
    state: "Selangor",
    postalCode: "40000",
    country: "Malaysia",
    latitude: 3.0738,
    longitude: 101.5183,
    maxCapacity: 420,
    basePriceMyr: 5200,
    cleaningFeeMyr: 320,
    serviceFeeMyr: 180,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-004-photo-cover",
        path: "halls/seed-hall-004/cover-main.jpg",
        altText: "Banquet setup with floral decorations",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-004-photo-stage",
        path: "halls/seed-hall-004/stage.jpg",
        altText: "Main stage and guest seating",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "high-fidelity-sound-system",
      "bridal-suite-makeup-room",
      "on-site-event-coordinator",
      "private-parking",
      "wheelchair-access",
      "prayer-room",
    ],
    customAmenities: ["Lakeside ceremony access"],
  },
  {
    seedId: "seed-hall-005",
    slug: "subang-urban-event-space",
    name: "Subang Urban Event Space",
    description: "Flexible urban venue with modular seating and built-in AV support.",
    addressLine1: "17 Jalan SS 15/4D",
    addressLine2: null,
    city: "Subang Jaya",
    state: "Selangor",
    postalCode: "47500",
    country: "Malaysia",
    latitude: 3.0733,
    longitude: 101.5852,
    maxCapacity: 260,
    basePriceMyr: 3600,
    cleaningFeeMyr: 240,
    serviceFeeMyr: 140,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-005-photo-cover",
        path: "halls/seed-hall-005/cover-main.jpg",
        altText: "Modern event hall with round tables",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-005-photo-setup",
        path: "halls/seed-hall-005/setup.jpg",
        altText: "Conference arrangement with projector",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "high-speed-wifi",
      "dual-4k-projectors-led-wall",
      "built-in-lighting-rig",
      "air-conditioning",
      "private-parking",
      "stage-and-backdrop",
    ],
    customAmenities: ["Modular conference seating kits"],
  },
  {
    seedId: "seed-hall-006",
    slug: "klcc-skyline-hall",
    name: "KLCC Skyline Hall",
    description: "Premium city-center hall featuring skyline views and upscale interior styling.",
    addressLine1: "3 Jalan Kia Peng",
    addressLine2: null,
    city: "Kuala Lumpur",
    state: "Wilayah Persekutuan",
    postalCode: "50450",
    country: "Malaysia",
    latitude: 3.1518,
    longitude: 101.7133,
    maxCapacity: 300,
    basePriceMyr: 6800,
    cleaningFeeMyr: 400,
    serviceFeeMyr: 250,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-006-photo-cover",
        path: "halls/seed-hall-006/cover-main.jpg",
        altText: "City view hall with elegant decor",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-006-photo-lounge",
        path: "halls/seed-hall-006/lounge.jpg",
        altText: "Reception lounge area",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "high-fidelity-sound-system",
      "high-speed-wifi",
      "on-site-event-coordinator",
      "private-parking",
      "wheelchair-access",
      "catering-pantry",
    ],
    customAmenities: ["Skyline-view VIP holding room"],
  },
  {
    seedId: "seed-hall-007",
    slug: "puchong-garden-court",
    name: "Puchong Garden Court",
    description: "Nature-inspired hall with indoor greenery and open-plan floor design.",
    addressLine1: "54 Jalan Meranti Jaya",
    addressLine2: null,
    city: "Puchong",
    state: "Selangor",
    postalCode: "47100",
    country: "Malaysia",
    latitude: 3.0309,
    longitude: 101.6187,
    maxCapacity: 210,
    basePriceMyr: 3100,
    cleaningFeeMyr: 210,
    serviceFeeMyr: 130,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-007-photo-cover",
        path: "halls/seed-hall-007/cover-main.jpg",
        altText: "Garden-inspired hall seating",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-007-photo-entrance",
        path: "halls/seed-hall-007/entrance.jpg",
        altText: "Venue entrance and reception",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "air-conditioning",
      "high-speed-wifi",
      "private-parking",
      "wheelchair-access",
      "catering-pantry",
      "prayer-room",
    ],
    customAmenities: ["Indoor greenery feature wall"],
  },
  {
    seedId: "seed-hall-008",
    slug: "cheras-starlight-banquet",
    name: "Cheras Starlight Banquet",
    description: "Popular banquet hall with chandeliers and adaptable wedding layouts.",
    addressLine1: "101 Jalan Cheras Hartamas",
    addressLine2: null,
    city: "Cheras",
    state: "Selangor",
    postalCode: "43200",
    country: "Malaysia",
    latitude: 3.0837,
    longitude: 101.7498,
    maxCapacity: 380,
    basePriceMyr: 5400,
    cleaningFeeMyr: 340,
    serviceFeeMyr: 200,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-008-photo-cover",
        path: "halls/seed-hall-008/cover-main.jpg",
        altText: "Banquet tables under chandeliers",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-008-photo-wedding",
        path: "halls/seed-hall-008/wedding.jpg",
        altText: "Wedding stage setup",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "high-fidelity-sound-system",
      "bridal-suite-makeup-room",
      "on-site-event-coordinator",
      "private-parking",
      "air-conditioning",
      "stage-and-backdrop",
    ],
    customAmenities: ["In-house wedding decor support"],
  },
  {
    seedId: "seed-hall-009",
    slug: "kajang-riverside-dewan",
    name: "Kajang Riverside Dewan",
    description: "Community-focused dewan for cultural events, talks, and medium-size gatherings.",
    addressLine1: "6 Jalan Sungai Chua",
    addressLine2: null,
    city: "Kajang",
    state: "Selangor",
    postalCode: "43000",
    country: "Malaysia",
    latitude: 2.9935,
    longitude: 101.7873,
    maxCapacity: 240,
    basePriceMyr: 2700,
    cleaningFeeMyr: 170,
    serviceFeeMyr: 90,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-009-photo-cover",
        path: "halls/seed-hall-009/cover-main.jpg",
        altText: "Community hall interior",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-009-photo-audience",
        path: "halls/seed-hall-009/audience.jpg",
        altText: "Audience seating rows",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "high-speed-wifi",
      "air-conditioning",
      "private-parking",
      "wheelchair-access",
      "stage-and-backdrop",
      "prayer-room",
    ],
    customAmenities: ["Community kitchen corner"],
  },
  {
    seedId: "seed-hall-010",
    slug: "cyberjaya-tech-events-hub",
    name: "Cyberjaya Tech Events Hub",
    description: "Tech-ready venue with high-speed internet, LED walls, and hybrid event support.",
    addressLine1: "15 Persiaran APEC",
    addressLine2: null,
    city: "Cyberjaya",
    state: "Selangor",
    postalCode: "63000",
    country: "Malaysia",
    latitude: 2.9225,
    longitude: 101.6559,
    maxCapacity: 280,
    basePriceMyr: 4100,
    cleaningFeeMyr: 260,
    serviceFeeMyr: 150,
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    photos: [
      {
        id: "seed-hall-010-photo-cover",
        path: "halls/seed-hall-010/cover-main.jpg",
        altText: "Stage with LED backdrop",
        sortOrder: 0,
        isCover: true,
      },
      {
        id: "seed-hall-010-photo-conference",
        path: "halls/seed-hall-010/conference.jpg",
        altText: "Hybrid conference arrangement",
        sortOrder: 1,
        isCover: false,
      },
    ],
    amenities: [
      "high-speed-wifi",
      "dual-4k-projectors-led-wall",
      "built-in-lighting-rig",
      "on-site-event-coordinator",
      "private-parking",
      "wheelchair-access",
    ],
    customAmenities: ["Hybrid-streaming control booth"],
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
    const amenityIdBySlug = new Map();

    for (const item of amenityCatalog) {
      const amenityResult = await client.query(
        `
          INSERT INTO "amenity" ("id", "slug", "label", "is_active")
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ("slug")
          DO UPDATE SET
            "label" = EXCLUDED."label",
            "is_active" = EXCLUDED."is_active",
            "updated_at" = NOW()
          RETURNING "id";
        `,
        [item.id, item.slug, item.label, true],
      );

      amenityIdBySlug.set(item.slug, amenityResult.rows[0].id);
    }

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

      await client.query(`DELETE FROM "hall_amenities" WHERE "hall_id" = $1;`, [hallId]);

      for (const [index, amenitySlug] of hall.amenities.entries()) {
        const amenityId = amenityIdBySlug.get(amenitySlug);
        if (!amenityId) {
          throw new Error(`Amenity slug "${amenitySlug}" is missing from amenityCatalog`);
        }

        await client.query(
          `
            INSERT INTO "hall_amenities" (
              "id",
              "hall_id",
              "amenity_id",
              "custom_amenity",
              "sort_order"
            )
            VALUES ($1, $2, $3, $4, $5);
          `,
          [`${hall.seedId}-amenity-${String(index + 1).padStart(2, "0")}`, hallId, amenityId, null, index],
        );
      }

      for (const [index, customAmenity] of (hall.customAmenities ?? []).entries()) {
        const offset = hall.amenities.length + index;
        await client.query(
          `
            INSERT INTO "hall_amenities" (
              "id",
              "hall_id",
              "amenity_id",
              "custom_amenity",
              "sort_order"
            )
            VALUES ($1, $2, $3, $4, $5);
          `,
          [
            `${hall.seedId}-custom-amenity-${String(index + 1).padStart(2, "0")}`,
            hallId,
            null,
            customAmenity,
            offset,
          ],
        );
      }
    }

    await client.query("COMMIT");
    console.log("Seeded host user, halls, hall photos, and amenities successfully.");
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
