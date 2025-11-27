/*
  Warnings:

  - The primary key for the `Center` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `GymClass` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Machine` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_GymClassToUser` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER');

-- DropForeignKey
ALTER TABLE "Machine" DROP CONSTRAINT "Machine_centerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_centerId_fkey";

-- DropForeignKey
ALTER TABLE "_GymClassToUser" DROP CONSTRAINT "_GymClassToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_GymClassToUser" DROP CONSTRAINT "_GymClassToUser_B_fkey";

-- AlterTable
ALTER TABLE "Center" DROP CONSTRAINT "Center_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Center_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Center_id_seq";

-- AlterTable
ALTER TABLE "GymClass" DROP CONSTRAINT "GymClass_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "GymClass_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "GymClass_id_seq";

-- AlterTable
ALTER TABLE "Machine" DROP CONSTRAINT "Machine_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "centerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Machine_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Machine_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "centerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "_GymClassToUser" DROP CONSTRAINT "_GymClassToUser_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT,
ADD CONSTRAINT "_GymClassToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GymClassToUser" ADD CONSTRAINT "_GymClassToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "GymClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GymClassToUser" ADD CONSTRAINT "_GymClassToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
