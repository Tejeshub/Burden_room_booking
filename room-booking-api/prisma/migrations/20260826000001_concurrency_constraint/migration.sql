CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap_excl"
EXCLUDE USING gist (
    "resourceId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
)
WHERE (status = 'CONFIRMED');
