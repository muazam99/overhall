import { date, index, integer, pgEnum, pgTable, text, time, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { hall } from "@/db/schema/halls";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "refunded"]);

export const booking = pgTable(
  "booking",
  {
    id: text("id").primaryKey(),
    hallId: text("hall_id")
      .notNull()
      .references(() => hall.id, { onDelete: "restrict" }),
    bookerUserId: text("booker_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    eventDate: date("event_date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    guestCount: integer("guest_count").notNull(),
    currency: text("currency").notNull().default("MYR"),
    hallRentalFeeMyr: integer("hall_rental_fee_myr").notNull(),
    cleaningFeeMyr: integer("cleaning_fee_myr").notNull().default(0),
    serviceFeeMyr: integer("service_fee_myr").notNull().default(0),
    totalFeeMyr: integer("total_fee_myr").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bookingHallIdIdx: index("booking_hall_id_idx").on(table.hallId),
    bookingBookerUserIdIdx: index("booking_booker_user_id_idx").on(table.bookerUserId),
    bookingEventDateIdx: index("booking_event_date_idx").on(table.eventDate),
    bookingStatusIdx: index("booking_status_idx").on(table.status),
    bookingPaymentStatusIdx: index("booking_payment_status_idx").on(table.paymentStatus),
    bookingHallDateIdx: index("booking_hall_date_idx").on(table.hallId, table.eventDate),
  }),
);
