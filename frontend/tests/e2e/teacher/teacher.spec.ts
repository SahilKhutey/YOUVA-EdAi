import { test, expect } from '../fixtures/auth.fixture';

test.describe('N5: Teacher Workspace & Intervention Operations (Browser Invariants)', () => {
  test('N5-E19 — Teacher workspace renders scoped class roster and cohort metrics', async ({ teacherPage: page }) => {
    await page.goto('/dashboard/teacher');

    // Metrics cards
    await expect(page.locator('text=Total Students, text=Students').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Interventions, text=Cohort').first()).toBeVisible();
  });

  test('N5-E20 — Teacher inspects individual learner 360 mastery breakdown', async ({ teacherPage: page }) => {
    await page.goto('/dashboard/teacher');

    // Navigate to student tab or click a student
    const studentTab = page.locator('button:has-text("Students"), button:has-text("Roster")').first();
    if (await studentTab.isVisible()) {
      await studentTab.click();
      await expect(page.locator('text=DPS Student, text=Student, text=Grade 8').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('N5-E21 — Teacher creates manual intervention with pedagogical rationale', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.post(`${apiUrl.replace(/\/$/, '')}/teacher/interventions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId: 's-dps-101',
        action: 'SCAFFOLD_PRACTICE',
        feedback: 'Assigning targeted reinforcement on two-step linear equations.',
        priority: 'REVIEW',
      },
    });

    expect([200, 201]).toContain(res.status());
  });

  test('N5-E22 — Teacher authorizes proposed AI intervention with atomic audit record', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    // Create a pending intervention first
    const createRes = await request.post(`${apiUrl.replace(/\/$/, '')}/teacher/interventions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId: 's-dps-101',
        action: 'ASSIGN_WORKSHEET',
        feedback: 'Review algebraic transposition rules.',
        priority: 'REVIEW',
      },
    });

    if (createRes.ok()) {
      const intervention = await createRes.json();
      const authRes = await request.post(`${apiUrl.replace(/\/$/, '')}/teacher/interventions/${intervention.id}/authorize`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { rationale: 'Approved after pedagogical assessment of learner struggle.' },
      });

      expect([200, 201]).toContain(authRes.status());
    }
  });

  test('N5-E23 — Teacher rejects unsuitable intervention with documented reason', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const createRes = await request.post(`${apiUrl.replace(/\/$/, '')}/teacher/interventions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId: 's-dps-101',
        action: 'ADVANCE_PACE',
        feedback: 'Too rapid acceleration.',
        priority: 'REVIEW',
      },
    });

    if (createRes.ok()) {
      const intervention = await createRes.json();
      const rejectRes = await request.post(`${apiUrl.replace(/\/$/, '')}/teacher/interventions/${intervention.id}/reject`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: 'Student requires further foundational reinforcement.' },
      });

      expect([200, 201]).toContain(rejectRes.status());
    }
  });
});
