import bcrypt from 'bcryptjs';
import { prisma } from './db';

const TEST_PASSWORD = 'password123';

export async function seedData() {
  const schoolsCount = await prisma.school.count();
  if (schoolsCount === 0) {
    console.log('Seeding schools and majors...');
    const bt = await prisma.school.create({
      data: { value: 'bt', label: 'Bergen Tech' }
    });
    const at = await prisma.school.create({
      data: { value: 'at', label: 'Applied Tech' }
    });

    const majs = {
      bt: [
        { value: "compsci", label: "Computer Science" },
        { value: "digital", label: "Digital Media" },
        { value: "business", label: "Business" },
        { value: "aero", label: "Aerospace Engineering" },
        { value: "auto", label: "Automotive Engineering" },
        { value: "law", label: "Law" },
        { value: "culinary", label: "Culinary" },
        { value: "comart", label: "Commercial Art" },
        { value: "other", label: "Other" }
      ],
      at: [
        { value: "cyber", label: "Cybersecurity" },
        { value: "other", label: "Other" }
      ]
    };

    for (const m of majs.bt) {
      await prisma.major.create({
        data: { ...m, schoolId: bt.id }
      });
    }
    for (const m of majs.at) {
      await prisma.major.create({
        data: { ...m, schoolId: at.id }
      });
    }
  }

  const catCount = await prisma.category.count();
  if (catCount === 0) {
    console.log('Seeding categories...');
    const categories = [
      { value: 'ai', label: 'Best Artificial Intelligence', description: 'For projects that use AI or machine learning in a meaningful way, such as natural language processing, computer vision, recommendation systems, or generative models.' },
      { value: 'mobile', label: 'Best Mobile App', description: 'For projects built as mobile applications (iOS, Android, or cross-platform). Judged on usability, design, and functionality on mobile devices.' },
      { value: 'hardware', label: 'Best Physical System', description: 'For projects that integrate physical hardware components like Arduino, Raspberry Pi, sensors, or robotics with software.' },
      { value: 'game', label: 'Best Game', description: 'For interactive game projects of any genre. Judged on gameplay, creativity, and overall fun factor.' },
      { value: 'freshman', label: 'Best Freshman Project', description: 'Exclusively for teams where all members are freshmen (9th grade). Recognizes outstanding work from first-year students.' },
      { value: 'beginner', label: 'Best New Coder', description: 'For teams with less than one year of coding experience. Celebrates newcomers to programming who take on the challenge.' }
    ];
    for (const c of categories) {
      await prisma.category.create({ data: c });
    }
  }

  // Seed test accounts
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('Seeding test accounts...');
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 5);

    // Admin account
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        fname: 'Admin',
        lname: 'User',
        email: 'admin@bthackathon.com',
        phone: '2015550100',
        password: hashedPassword,
        admin: true,
        verified: true,
        school: 'bt',
        major: 'compsci',
        grade: '12',
        shirt: 'L',
        parents: JSON.stringify([{ fname: 'Parent', lname: 'Admin', email: 'parent@example.com', phone: '2015550101', relationship: 'Mother' }]),
        verificationCode: '000000',
        verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    await prisma.registration.create({
      data: { userId: admin.id, status: 1 },
    });

    // Student with a team (team leader)
    const student1 = await prisma.user.create({
      data: {
        name: 'Alice Chen',
        fname: 'Alice',
        lname: 'Chen',
        email: 'alice@student.bthackathon.com',
        phone: '2015550200',
        password: hashedPassword,
        verified: true,
        school: 'bt',
        major: 'compsci',
        grade: '11',
        shirt: 'M',
        parents: JSON.stringify([{ fname: 'Wei', lname: 'Chen', email: 'wei@example.com', phone: '2015550201', relationship: 'Father' }]),
        verificationCode: '000000',
        verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    const team = await prisma.team.create({
      data: {
        name: 'ByteBuilders',
        project: 'An AI-powered study group matcher for students',
        leaderId: student1.id,
        maxSize: '4',
        experience: 'intermediate',
        categories: JSON.stringify([{ value: 'ai', label: 'Best Artificial Intelligence' }]),
        members: { connect: { id: student1.id } },
      },
    });

    await prisma.registration.create({
      data: { userId: student1.id, teamId: team.id, status: 1 },
    });

    // Student on the same team (member)
    const student2 = await prisma.user.create({
      data: {
        name: 'Bob Martinez',
        fname: 'Bob',
        lname: 'Martinez',
        email: 'bob@student.bthackathon.com',
        phone: '2015550300',
        password: hashedPassword,
        verified: true,
        school: 'bt',
        major: 'digital',
        grade: '10',
        shirt: 'L',
        parents: JSON.stringify([{ fname: 'Maria', lname: 'Martinez', email: 'maria@example.com', phone: '2015550301', relationship: 'Mother' }]),
        verificationCode: '000000',
        verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    await prisma.team.update({
      where: { id: team.id },
      data: { members: { connect: { id: student2.id } } },
    });

    await prisma.registration.create({
      data: { userId: student2.id, teamId: team.id, status: 1 },
    });

    // Solo student (no team)
    const student3 = await prisma.user.create({
      data: {
        name: 'Carol Kim',
        fname: 'Carol',
        lname: 'Kim',
        email: 'carol@student.bthackathon.com',
        phone: '2015550400',
        password: hashedPassword,
        verified: true,
        school: 'at',
        major: 'cyber',
        grade: '9',
        shirt: 'S',
        parents: JSON.stringify([{ fname: 'James', lname: 'Kim', email: 'james@example.com', phone: '2015550401', relationship: 'Father' }]),
        verificationCode: '000000',
        verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    await prisma.registration.create({
      data: { userId: student3.id, status: 1 },
    });

    // School admin account for Applied Tech
    const schoolAdmin = await prisma.user.create({
      data: {
        name: 'AT School Admin',
        fname: 'AT',
        lname: 'Admin',
        email: 'schooladmin@appliedtech.bthackathon.com',
        phone: '2015550500',
        password: hashedPassword,
        verified: true,
        school: 'at',
        major: 'cyber',
        grade: '12',
        shirt: 'M',
        parents: JSON.stringify([{ fname: 'Parent', lname: 'Admin', email: 'atparent@example.com', phone: '2015550501', relationship: 'Mother' }]),
        verificationCode: '000000',
        verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    await prisma.registration.create({
      data: { userId: schoolAdmin.id, status: 1 },
    });

    // Look up the Applied Tech school and create SchoolAdmin assignment
    const atSchool = await prisma.school.findUnique({ where: { value: 'at' } });
    if (atSchool) {
      await prisma.schoolAdmin.create({
        data: { userId: schoolAdmin.id, schoolId: atSchool.id },
      });

      // Set Applied Tech to disallow self-registration
      await prisma.school.update({
        where: { id: atSchool.id },
        data: { allowSelfRegistration: false, allowTeamCreation: false },
      });
    }

    console.log('Test accounts seeded:');
    console.log('  Admin:        admin@bthackathon.com                    / password123');
    console.log('  AT Admin:     schooladmin@appliedtech.bthackathon.com  / password123');
    console.log('  Team Leader:  alice@student.bthackathon.com            / password123');
    console.log('  Team Member:  bob@student.bthackathon.com              / password123');
    console.log('  Solo Student: carol@student.bthackathon.com            / password123');
  }
}
