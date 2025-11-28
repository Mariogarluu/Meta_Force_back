-- AlterTable
ALTER TABLE "User" ADD COLUMN     "favoriteCenterId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_favoriteCenterId_fkey" FOREIGN KEY ("favoriteCenterId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;
