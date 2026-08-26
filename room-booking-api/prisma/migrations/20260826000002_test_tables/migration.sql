-- CreateTable
CREATE TABLE "TestResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestBooking" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestBooking_resourceId_idx" ON "TestBooking"("resourceId");

-- CreateIndex
CREATE INDEX "TestBooking_resourceId_status_startTime_idx" ON "TestBooking"("resourceId", "status", "startTime");

-- AddForeignKey
ALTER TABLE "TestBooking" ADD CONSTRAINT "TestBooking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "TestResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add Constraint
ALTER TABLE "TestBooking" ADD CONSTRAINT "TestBooking_no_overlap_excl"
EXCLUDE USING gist (
    "resourceId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
)
WHERE (status = 'CONFIRMED');
