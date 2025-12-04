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
        let user;

        const existingUser = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (existingUser) {
            console.log(`✓ Regular user already exists: ${userEmail}`);
            user = existingUser;
        } else {
            const hashedPassword = await bcrypt.hash(userPassword, 10);
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    password: hashedPassword,
                    role: 'user'
                }
            });
            console.log(`✓ Created regular user: ${user.email}`);
        }

        // Check if demo session exists
        const existingSession = await prisma.session.findFirst({
            where: {
                userId: user.id,
                title: 'Demo Conversation'
            }
        });

        if (!existingSession) {
            // Create a sample chat session for the regular user
            const session = await prisma.session.create({
                data: {
                    userId: user.id,
                    title: 'Demo Conversation',
                    messages: {
                        create: [
                            {
                                role: 'user',
                                content: 'Hello! Can you help me write a poem about coding?'
                            },
                            {
                                role: 'assistant',
                                content: "Certainly! Here's a short poem about coding:\n\nIn lines of code, a world we weave,\nWhere logic flows and dreams believe.\nWith loops and functions, strict and grand,\nWe build the future, hand in hand.\n\nBugs may hide in shadows deep,\nBut patience wakes while others sleep.\nCompile, debug, and run once more,\nUntil the logic opens every door."
                            }
                        ]
                    }
                }
            });
            console.log(`✓ Created sample chat session: "${session.title}"`);
        } else {
            console.log(`✓ Demo session already exists`);
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
