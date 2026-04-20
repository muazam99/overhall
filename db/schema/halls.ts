import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const hallStatusEnum = pgEnum("hall_status", ["draft", "published", "archived"]);

export const hall = pgTable(
  "hall",
  {
    id: text("id").primaryKey(),
    hostUserId: text("host_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code"),
    country: text("country").notNull().default("Malaysia"),
    maxCapacity: integer("max_capacity").notNull(),
    basePriceMyr: integer("base_price_myr").notNull(),
    cleaningFeeMyr: integer("cleaning_fee_myr").notNull().default(0),
    serviceFeeMyr: integer("service_fee_myr").notNull().default(0),
    coverPhotoUrl: text("cover_photo_url"),
    status: hallStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    hallSlugUniqueIdx: uniqueIndex("hall_slug_unique_idx").on(table.slug),
    hallHostUserIdIdx: index("hall_host_user_id_idx").on(table.hostUserId),
    hallCityStateIdx: index("hall_city_state_idx").on(table.city, table.state),
    hallStatusIdx: index("hall_status_idx").on(table.status),
  }),
);

export const hallPhoto = pgTable(
  "hall_photo",
  {
    id: text("id").primaryKey(),
    hallId: text("hall_id")
      .notNull()
      .references(() => hall.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    hallPhotoHallIdIdx: index("hall_photo_hall_id_idx").on(table.hallId),
    hallPhotoHallSortIdx: index("hall_photo_hall_sort_idx").on(table.hallId, table.sortOrder),
  }),
);

export const amenity = pgTable(
  "amenity",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    amenitySlugUniqueIdx: uniqueIndex("amenity_slug_unique_idx").on(table.slug),
    amenityLabelUniqueIdx: uniqueIndex("amenity_label_unique_idx").on(table.label),
    amenityActiveIdx: index("amenity_is_active_idx").on(table.isActive),
  }),
);

export const hallAmenities = pgTable(
  "hall_amenities",
  {
    id: text("id").primaryKey(),
    hallId: text("hall_id")
      .notNull()
      .references(() => hall.id, { onDelete: "cascade" }),
    amenityId: text("amenity_id").references(() => amenity.id, { onDelete: "set null" }),
    customAmenity: text("custom_amenity"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    hallAmenitiesHallIdIdx: index("hall_amenities_hall_id_idx").on(table.hallId),
    hallAmenitiesAmenityIdIdx: index("hall_amenities_amenity_id_idx").on(table.amenityId),
    hallAmenitiesHallSortIdx: index("hall_amenities_hall_sort_idx").on(table.hallId, table.sortOrder),
    hallAmenitiesHallAmenityUniqueIdx: uniqueIndex("hall_amenities_hall_amenity_unique_idx").on(
      table.hallId,
      table.amenityId,
    ),
  }),
);
