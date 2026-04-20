import { relations } from "drizzle-orm";
import {
  account,
  amenity,
  booking,
  hall,
  hallAmenities,
  hallPhoto,
  hostProfile,
  profile,
  session,
  user,
} from "@/db/schema";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(profile, {
    fields: [user.id],
    references: [profile.userId],
  }),
  hostProfile: one(hostProfile, {
    fields: [user.id],
    references: [hostProfile.userId],
  }),
  bookingsAsBooker: many(booking),
  hostedHalls: many(hall),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
}));

export const hostProfileRelations = relations(hostProfile, ({ one }) => ({
  user: one(user, {
    fields: [hostProfile.userId],
    references: [user.id],
  }),
}));

export const hallRelations = relations(hall, ({ many, one }) => ({
  host: one(user, {
    fields: [hall.hostUserId],
    references: [user.id],
  }),
  photos: many(hallPhoto),
  amenities: many(hallAmenities),
  bookings: many(booking),
}));

export const hallPhotoRelations = relations(hallPhoto, ({ one }) => ({
  hall: one(hall, {
    fields: [hallPhoto.hallId],
    references: [hall.id],
  }),
}));

export const amenityRelations = relations(amenity, ({ many }) => ({
  hallAmenities: many(hallAmenities),
}));

export const hallAmenitiesRelations = relations(hallAmenities, ({ one }) => ({
  hall: one(hall, {
    fields: [hallAmenities.hallId],
    references: [hall.id],
  }),
  amenity: one(amenity, {
    fields: [hallAmenities.amenityId],
    references: [amenity.id],
  }),
}));

export const bookingRelations = relations(booking, ({ one }) => ({
  hall: one(hall, {
    fields: [booking.hallId],
    references: [hall.id],
  }),
  booker: one(user, {
    fields: [booking.bookerUserId],
    references: [user.id],
  }),
}));
