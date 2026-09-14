import { test as base, Page } from '@playwright/test';
import { TEST_DATA } from './test-data';

type WorkerFixtures = {};

type TestFixtures = {
  studentPage: Page;
  teacherPage: Page;
  parentPage: Page;
  tenantBStudentPage: Page;
  tenantBTeacherPage: Page;
};

async function authenticateAndSetStorage(page: Page, email: string, pass: string): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let token = '';
  try {
    const response = await page.request.post(`${apiUrl.replace(/\/$/, '')}/auth/login`, {
      data: { email, password: pass },
    });
    if (response.ok()) {
      const data = await response.json();
      token = data.access_token;
    }
  } catch {
    token = 'mock-jwt-token-for-testing';
  }

  // Set in localStorage before loading any page
  await page.addInitScript((jwt) => {
    window.localStorage.setItem('token', jwt);
  }, token);

  return token;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  studentPage: async ({ page }, use) => {
    await authenticateAndSetStorage(
      page,
      TEST_DATA.tenantA.student.email,
      TEST_DATA.tenantA.student.password,
    );
    await use(page);
  },

  teacherPage: async ({ page }, use) => {
    await authenticateAndSetStorage(
      page,
      TEST_DATA.tenantA.teacher.email,
      TEST_DATA.tenantA.teacher.password,
    );
    await use(page);
  },

  parentPage: async ({ page }, use) => {
    await authenticateAndSetStorage(
      page,
      TEST_DATA.tenantA.parent.email,
      TEST_DATA.tenantA.parent.password,
    );
    await use(page);
  },

  tenantBStudentPage: async ({ page }, use) => {
    await authenticateAndSetStorage(
      page,
      TEST_DATA.tenantB.student.email,
      TEST_DATA.tenantB.student.password,
    );
    await use(page);
  },

  tenantBTeacherPage: async ({ page }, use) => {
    await authenticateAndSetStorage(
      page,
      TEST_DATA.tenantB.teacher.email,
      TEST_DATA.tenantB.teacher.password,
    );
    await use(page);
  },
});

export { expect } from '@playwright/test';
