import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const hostProfile = pgTable(
  "host_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    displayName: text("display_name").notNull(),
    companyName: text("company_name"),
    bio: text("bio"),
    city: text("city"),
    state: text("state"),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    hostProfileUserIdIdx: index("host_profile_user_id_idx").on(table.userId),
    hostProfileCityIdx: index("host_profile_city_idx").on(table.city),
  }),
);
