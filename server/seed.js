const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    console.log('Seeding database...');

    // Create default admin user
    const adminEmail = 'admin@pocketllm.com';
    const adminPassword = 'admin123';

    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log(`✓ Admin user already exists: ${adminEmail}`);
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const admin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin'
                }
            });
            console.log(`✓ Created admin user: ${admin.email}`);
        }

        // Create default regular user
        const userEmail = 'user@pocketllm.com';
        const userPassword = 'user123';

        const existingUser = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (existingUser) {
            console.log(`✓ Regular user already exists: ${userEmail}`);
        } else {
            const hashedPassword = await bcrypt.hash(userPassword, 10);
            const user = await prisma.user.create({
                data: {
                    email: userEmail,
                    password: hashedPassword,
                    role: 'user'
                }
            });
            console.log(`✓ Created regular user: ${user.email}`);
        }

        console.log('\n========================================');
        console.log('Default Credentials:');
        console.log('========================================');
        console.log('Admin Account:');
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);
        console.log('');
        console.log('Regular User Account:');
        console.log(`  Email: ${userEmail}`);
        console.log(`  Password: ${userPassword}`);
        console.log('========================================\n');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
