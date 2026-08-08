const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { name: "CampusDesk Admin", email: "admin@lnmiit.ac.in", role: "ADMIN" },
      { name: "Naavya", email: "naavya@lnmiit.ac.in", role: "STUDENT" },
      { name: "Rahul", email: "rahul@lnmiit.ac.in", role: "STUDENT" },
    ],
  });

  await prisma.resource.createMany({
    data: [
      { name: "LT-1", description: "Lecture theatre 1", location: "Academic Block", category: "hall", openTime: "09:00", closeTime: "21:00" },
      { name: "LT-2", description: "Lecture theatre 2", location: "Academic Block", category: "hall", openTime: "09:00", closeTime: "21:00" },
      { name: "LT-3", description: "Lecture theatre 3", location: "Academic Block", category: "hall", openTime: "09:00", closeTime: "21:00" },
      { name: "LT-4", description: "Lecture theatre 4", location: "Academic Block", category: "hall", openTime: "09:00", closeTime: "21:00" },
      { name: "Projector", description: "HD projector", location: "Media Room", category: "equipment", openTime: "09:00", closeTime: "21:00" },
      { name: "Camera", description: "DSLR camera for campus events", location: "Media Room", category: "equipment", openTime: "09:00", closeTime: "21:00" },
      { name: "Music Room", description: "Practice room", location: "Student Activity Center", category: "room", openTime: "10:00", closeTime: "20:00" },
      { name: "Computer Lab", description: "Programming lab", location: "Block C", category: "other", openTime: "09:00", closeTime: "18:00" },
    ],
  });

  console.log("Database seeded: 1 admin, 2 students, 8 resources.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
