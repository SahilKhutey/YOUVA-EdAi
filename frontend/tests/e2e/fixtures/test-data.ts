/**
 * Cycle N5: Deterministic E2E Test Fixtures & Tenant Constants
 */

export const TEST_DATA = {
  // Tenant A: Delhi Public School R.K. Puram
  tenantA: {
    id: 'tenant-dps-rkp',
    name: 'Delhi Public School R.K. Puram',
    student: {
      id: 's-dps-101',
      email: 'student.dps101@dpsrkp.edu.in',
      password: 'password123',
      name: 'DPS Student 8A-1',
      role: 'STUDENT',
      grade: 'Grade 8',
    },
    demoStudent: {
      email: 'student@test.com',
      password: 'password123',
      role: 'STUDENT',
    },
    unconsentedStudent: {
      id: 's-dps-unconsented',
      email: 'student.unconsented@dpsrkp.edu.in',
      password: 'password123',
      role: 'STUDENT',
    },
    teacher: {
      email: 'ritu.sharma@dpsrkp.edu.in',
      password: 'password123',
      name: 'Mrs. Ritu Sharma',
      role: 'TEACHER',
    },
    parent: {
      email: 'parent.dps@test.com',
      password: 'password123',
      name: 'Mr. Rajesh Kumar (DPS RKP Parent Delegate)',
      role: 'PARENT',
    },
  },

  // Tenant B: Modern School Vasant Vihar
  tenantB: {
    id: 'tenant-modern-vv',
    name: 'Modern School Vasant Vihar',
    student: {
      id: 's-modern-101',
      email: 'student.kabir@modernschool.edu.in',
      password: 'password123',
      name: 'Kabir Sharma (Modern School Student)',
      role: 'STUDENT',
    },
    teacher: {
      email: 'teacher.anita@modernschool.edu.in',
      password: 'password123',
      name: 'Mrs. Anita Roy (Modern School Educator)',
      role: 'TEACHER',
    },
    parent: {
      email: 'parent.sunita@modernschool.edu.in',
      password: 'password123',
      name: 'Mrs. Sunita Sharma (Modern School Parent)',
      role: 'PARENT',
    },
  },

  // Canonical Topics & Curriculum Constants
  topics: {
    linearEquations: {
      id: 'MATH-G8-LINEQ-01',
      title: 'Linear Equations in One Variable',
      slug: 'linear-equations',
    },
  },
};
