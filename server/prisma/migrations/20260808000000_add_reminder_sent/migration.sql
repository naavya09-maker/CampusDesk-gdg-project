-- Add a persistent flag so each confirmed booking reminder is sent at most once.
ALTER TABLE "Booking" ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false;
