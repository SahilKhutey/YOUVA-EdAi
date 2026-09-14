import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const subjects = [
        {
            name: 'Mathematics',
            description: 'Study of numbers, shapes, and patterns.',
            topics: [
                { title: 'Linear Equations in One Variable', description: 'Grade 8 CBSE Chapter 2: Algebraic solving methods and applications.' },
                { title: 'Algebra', description: 'Operations and relations.' },
                { title: 'Geometry', description: 'Properties of space.' },
                { title: 'Calculus', description: 'Change and motion.' },
                { title: 'Statistics', description: 'Data collection and analysis.' },
                { title: 'Trigonometry', description: 'Relationships between side lengths and angles of triangles.' },
            ],
        },
        {
            name: 'Physics',
            description: 'Study of matter and energy.',
            topics: [
                { title: 'Mechanics', description: 'Motion and forces.' },
                { title: 'Thermodynamics', description: 'Heat and energy.' },
                { title: 'Electromagnetism', description: 'Electricity and magnetism.' },
                { title: 'Quantum Mechanics', description: 'Behavior of matter and light on the atomic and subatomic scale.' },
                { title: 'Optics', description: 'Behavior and properties of light.' },
            ],
        },
        {
            name: 'Chemistry',
            description: 'Study of substances and their changes.',
            topics: [
                { title: 'Organic Chemistry', description: 'Carbon compounds.' },
                { title: 'Inorganic Chemistry', description: 'Other compounds.' },
                { title: 'Physical Chemistry', description: 'Chemical systems properties.' },
            ],
        },
        {
            name: 'Biology',
            description: 'Study of living organisms.',
            topics: [
                { title: 'Cell Biology', description: 'Cells and their functions.' },
                { title: 'Genetics', description: 'Heredity and variation.' },
                { title: 'Ecology', description: 'Interactions among organisms and their environment.' },
            ],
        },
        {
            name: 'History',
            description: 'Study of past events.',
            topics: [
                { title: 'World War II', description: 'Global conflict from 1939 to 1945.' },
                { title: 'The Renaissance', description: 'Rebirth of art and learning.' },
                { title: 'Ancient Civilizations', description: 'Early human societies.' },
            ],
        },
        {
            name: 'Computer Science',
            description: 'Study of computation and information.',
            topics: [
                { title: 'Data Structures', description: 'Organizing and storing data.' },
                { title: 'Algorithms', description: 'Step-by-step procedures for calculations.' },
                { title: 'Artificial Intelligence', description: 'Simulation of human intelligence.' },
            ],
        },
    ];

    for (const subjectData of subjects) {
        const { topics, ...data } = subjectData;
        const subject = await prisma.subject.upsert({
            where: { name: data.name },
            update: {},
            create: {
                ...data,
                topics: {
                    create: topics,
                },
            },
        });
        console.log(`Created or Updated subject: ${subject.name}`);
    }

    // Seed Verified Phase 1 Question Bank for Grade 8 Linear Equations
    const linearEquationsTopic = await prisma.topic.findFirst({
        where: { title: 'Linear Equations in One Variable' }
    });

    if (linearEquationsTopic) {
        let verifiedQuestions: any[] = [];
        const fs = require('fs');
        const path = require('path');
        const bankPath = path.resolve(__dirname, '../../phase1/content/grade8_linear_equations_bank.json');

        if (fs.existsSync(bankPath)) {
            const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
            verifiedQuestions = raw.questions.map((q: any) => ({
                content: q.text,
                options: q.options,
                correctAnswer: q.options[q.correctOptionIndex],
                explanation: q.explanation,
                difficulty: q.difficulty === 'EASY' ? 0.25 : q.difficulty === 'MEDIUM' ? 0.55 : 0.85,
                hints: q.hints ? JSON.stringify(q.hints) : null,
            }));
        }

        for (const q of verifiedQuestions) {
            const existing = await prisma.question.findFirst({
                where: { topicId: linearEquationsTopic.id, content: q.content }
            });
            if (!existing) {
                await prisma.question.create({
                    data: {
                        topicId: linearEquationsTopic.id,
                        content: q.content,
                        type: 'MCQ',
                        difficulty: q.difficulty,
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        hints: q.hints,
                    }
                });
            }
        }
        console.log(`Seeded ${verifiedQuestions.length} verified Phase 1 questions for ${linearEquationsTopic.title}`);
    }

    // Provision Demo Accounts
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { email: 'student@test.com' },
        update: {},
        create: {
            email: 'student@test.com',
            password: hashedPassword,
            name: 'Demo Student',
            role: 'STUDENT',
            onboardingComplete: true
        }
    });
    console.log('Created Demo Student');

    await prisma.user.upsert({
        where: { email: 'teacher@test.com' },
        update: {},
        create: {
            email: 'teacher@test.com',
            password: hashedPassword,
            name: 'Demo Teacher',
            role: 'TEACHER',
            onboardingComplete: true
        }
    });
    console.log('Created Demo Teacher');

    // =========================================================================
    // Phase 3 Closed Pilot Cohort: Delhi Public School, R.K. Puram (20 Students)
    // =========================================================================
    const pilotParent = await prisma.user.upsert({
        where: { email: 'parent.dps@test.com' },
        update: {},
        create: {
            email: 'parent.dps@test.com',
            password: hashedPassword,
            name: 'Mr. Rajesh Kumar (DPS RKP Parent Delegate)',
            role: 'PARENT',
            onboardingComplete: true
        }
    });
    console.log('Created Pilot Parent: Mr. Rajesh Kumar');

    const teacherRitu = await prisma.user.upsert({
        where: { email: 'ritu.sharma@dpsrkp.edu.in' },
        update: {},
        create: {
            email: 'ritu.sharma@dpsrkp.edu.in',
            password: hashedPassword,
            name: 'Mrs. Ritu Sharma',
            role: 'TEACHER',
            onboardingComplete: true
        }
    });

    const teacherVikram = await prisma.user.upsert({
        where: { email: 'vikram.seth@dpsrkp.edu.in' },
        update: {},
        create: {
            email: 'vikram.seth@dpsrkp.edu.in',
            password: hashedPassword,
            name: 'Mr. Vikram Seth',
            role: 'TEACHER',
            onboardingComplete: true
        }
    });
    console.log('Created Pilot Teachers: Mrs. Ritu Sharma & Mr. Vikram Seth');

    // Seed Pilot Classes
    const class8A = await prisma.teacherClass.upsert({
        where: { id: 'class-dps-8a' },
        update: {},
        create: {
            id: 'class-dps-8a',
            name: 'Grade 8-A Mathematics',
            gradeLevel: 'Grade 8',
            subject: 'Mathematics',
            teacherId: teacherRitu.id,
        }
    });

    const class8B = await prisma.teacherClass.upsert({
        where: { id: 'class-dps-8b' },
        update: {},
        create: {
            id: 'class-dps-8b',
            name: 'Grade 8-B Mathematics',
            gradeLevel: 'Grade 8',
            subject: 'Mathematics',
            teacherId: teacherVikram.id,
        }
    });
    console.log('Created Pilot Classes: Grade 8-A & Grade 8-B');

    // Seed 20 Pilot Cohort Students with Verified DPDP Consents
    const pilotStudentsData = [
        ...Array.from({ length: 10 }, (_, i) => ({
            id: `s-dps-${101 + i}`,
            email: `student.dps${101 + i}@dpsrkp.edu.in`,
            name: `DPS Student 8A-${i + 1}`,
            classId: class8A.id,
            teacherId: teacherRitu.id,
            section: '8-A',
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
            id: `s-dps-${201 + i}`,
            email: `student.dps${201 + i}@dpsrkp.edu.in`,
            name: `DPS Student 8B-${i + 1}`,
            classId: class8B.id,
            teacherId: teacherVikram.id,
            section: '8-B',
        })),
    ];

    for (const s of pilotStudentsData) {
        const studentUser = await prisma.user.upsert({
            where: { email: s.email },
            update: {},
            create: {
                id: s.id,
                email: s.email,
                password: hashedPassword,
                name: s.name,
                role: 'STUDENT',
                gradeLevel: 'Grade 8',
                cognitiveLevel: 'TEEN',
                onboardingComplete: true,
            }
        });

        // Link Parent & Student
        await prisma.parentStudent.upsert({
            where: { parentId_studentId: { parentId: pilotParent.id, studentId: studentUser.id } },
            update: {},
            create: {
                parentId: pilotParent.id,
                studentId: studentUser.id,
            }
        });

        // Enroll in Pilot Class
        await prisma.teacherClassEnrollment.upsert({
            where: { classId_studentId: { classId: s.classId, studentId: studentUser.id } },
            update: {},
            create: {
                classId: s.classId,
                studentId: studentUser.id,
            }
        });

        // Grant DPDP Act 2023 Verified Parental Consents
        const consentTypes = ['LEARNING_SERVICE', 'AI_ASSISTANCE', 'PERSONALIZATION', 'PARENT_PROGRESS_VISIBILITY'];
        for (const cType of consentTypes) {
            await prisma.consentRecord.upsert({
                where: {
                    parentId_studentId_consentType: {
                        parentId: pilotParent.id,
                        studentId: studentUser.id,
                        consentType: cType,
                    }
                },
                update: {},
                create: {
                    parentId: pilotParent.id,
                    studentId: studentUser.id,
                    consentType: cType,
                    status: 'GRANTED',
                    version: '1.0.0',
                    grantedAt: new Date(),
                    evidence: `hmac-sha256-dps-rkp-${s.id}-${cType.toLowerCase()}-verified-dpdp`,
                }
            });
        }
    }
    console.log(`Seeded 20 pilot students with DPDP parent consents and class enrollments.`);

    // Seed 1 Unconsented Control Student for fail-closed verification
    const unconsentedStudent = await prisma.user.upsert({
        where: { email: 'student.unconsented@dpsrkp.edu.in' },
        update: {},
        create: {
            id: 's-dps-unconsented',
            email: 'student.unconsented@dpsrkp.edu.in',
            password: hashedPassword,
            name: 'Unconsented Control Student',
            role: 'STUDENT',
            gradeLevel: 'Grade 8',
            cognitiveLevel: 'TEEN',
            onboardingComplete: true,
        }
    });

    await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: pilotParent.id, studentId: unconsentedStudent.id } },
        update: {},
        create: {
            parentId: pilotParent.id,
            studentId: unconsentedStudent.id,
        }
    });

    await prisma.consentRecord.upsert({
        where: {
            parentId_studentId_consentType: {
                parentId: pilotParent.id,
                studentId: unconsentedStudent.id,
                consentType: 'LEARNING_SERVICE',
            }
        },
        update: { status: 'REVOKED', revokedAt: new Date() },
        create: {
            parentId: pilotParent.id,
            studentId: unconsentedStudent.id,
            consentType: 'LEARNING_SERVICE',
            status: 'REVOKED',
            version: '1.0.0',
            revokedAt: new Date(),
        }
    });
    console.log('Seeded Unconsented Control Student (REVOKED consent)');

    // =========================================================================
    // Tenant B: Modern School Vasant Vihar (Cross-Tenant Isolation Fixtures)
    // =========================================================================
    const modernParent = await prisma.user.upsert({
        where: { email: 'parent.sunita@modernschool.edu.in' },
        update: {},
        create: {
            id: 'u-parent-modern-01',
            email: 'parent.sunita@modernschool.edu.in',
            password: hashedPassword,
            name: 'Mrs. Sunita Sharma (Modern School Parent)',
            role: 'PARENT',
            onboardingComplete: true
        }
    });

    const modernTeacher = await prisma.user.upsert({
        where: { email: 'teacher.anita@modernschool.edu.in' },
        update: {},
        create: {
            id: 'u-teacher-modern-01',
            email: 'teacher.anita@modernschool.edu.in',
            password: hashedPassword,
            name: 'Mrs. Anita Roy (Modern School Educator)',
            role: 'TEACHER',
            onboardingComplete: true
        }
    });

    const modernClass = await prisma.teacherClass.upsert({
        where: { id: 'class-modern-8a' },
        update: {},
        create: {
            id: 'class-modern-8a',
            name: 'Grade 8-A Modern Mathematics',
            gradeLevel: 'Grade 8',
            subject: 'Mathematics',
            teacherId: modernTeacher.id,
        }
    });

    const modernStudent = await prisma.user.upsert({
        where: { email: 'student.kabir@modernschool.edu.in' },
        update: {},
        create: {
            id: 's-modern-101',
            email: 'student.kabir@modernschool.edu.in',
            password: hashedPassword,
            name: 'Kabir Sharma (Modern School Student)',
            role: 'STUDENT',
            gradeLevel: 'Grade 8',
            cognitiveLevel: 'TEEN',
            onboardingComplete: true,
        }
    });

    await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: modernParent.id, studentId: modernStudent.id } },
        update: {},
        create: {
            parentId: modernParent.id,
            studentId: modernStudent.id,
        }
    });

    await prisma.teacherClassEnrollment.upsert({
        where: { classId_studentId: { classId: modernClass.id, studentId: modernStudent.id } },
        update: {},
        create: {
            classId: modernClass.id,
            studentId: modernStudent.id,
        }
    });

    for (const cType of ['LEARNING_SERVICE', 'AI_ASSISTANCE', 'PERSONALIZATION', 'PARENT_PROGRESS_VISIBILITY']) {
        await prisma.consentRecord.upsert({
            where: {
                parentId_studentId_consentType: {
                    parentId: modernParent.id,
                    studentId: modernStudent.id,
                    consentType: cType,
                }
            },
            update: {},
            create: {
                parentId: modernParent.id,
                studentId: modernStudent.id,
                consentType: cType,
                status: 'GRANTED',
                version: '1.0.0',
                grantedAt: new Date(),
                evidence: `hmac-sha256-modern-vv-${modernStudent.id}-${cType.toLowerCase()}-verified-dpdp`,
            }
        });
    }
    console.log('Seeded Tenant B: Modern School Vasant Vihar fixtures.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
