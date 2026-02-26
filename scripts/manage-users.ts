import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("--- User Management Script ---");

    // 1. Handle Admin User
    const adminEmail = "admin@example.com";
    const adminPassword = "Admin123456!";
    const adminHash = bcrypt.hashSync(adminPassword, 10);

    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (admin) {
        console.log(`[Admin] Found existing user: ${adminEmail}`);
        await prisma.user.update({
            where: { email: adminEmail },
            data: {
                passwordHash: adminHash,
                emailVerified: admin.emailVerified ? admin.emailVerified : new Date(),
                role: "ADMIN"
            }
        });
        console.log(`[Admin] Password reset and email verified.`);
    } else {
        console.log(`[Admin] User not found, creating new admin record...`);
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: "Admin",
                passwordHash: adminHash,
                emailVerified: new Date(),
                role: "ADMIN"
            }
        });
        console.log(`[Admin] Created successfully.`);
    }

    console.log("------------------------------");

    // 2. Handle Normal User
    const userEmail = "user@example.com";
    const userPassword = "User123456!";
    const userHash = bcrypt.hashSync(userPassword, 10);

    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (user) {
        console.log(`[User] Found existing user: ${userEmail}`);
        await prisma.user.update({
            where: { email: userEmail },
            data: {
                passwordHash: userHash,
                emailVerified: user.emailVerified ? user.emailVerified : new Date(),
                role: "USER"
            }
        });
        console.log(`[User] Password reset and email verified.`);
    } else {
        console.log(`[User] User not found, creating new user record...`);
        await prisma.user.create({
            data: {
                email: userEmail,
                name: "Test User",
                passwordHash: userHash,
                emailVerified: new Date(),
                role: "USER"
            }
        });
        console.log(`[User] Created successfully.`);
    }

    console.log("--- Done ---");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
