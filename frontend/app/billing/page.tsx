'use client';

import { useEffect, useState } from 'react';

type Plan = {
  plan: string;
  entitlements: string[];
};

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/commercial/plans`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load pricing plans');
        }
        return response.json();
      })
      .then((data) => setPlans(data))
      .catch((err) => setError(err.message));
  }, [apiUrl]);

  async function subscribe(plan: string) {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      if (!token) {
        window.location.assign('/login?redirect=/billing');
        return;
      }

      const response = await fetch(
        `${apiUrl}/api/v1/commercial/billing/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Unable to create checkout session.');
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('Checkout URL was not returned.');
      }

      window.location.assign(data.url);
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Choose your YOUVA plan
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Transparent, human-supervised AI education for learners, families, and schools.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((item) => {
          const isFamily = item.plan === 'FAMILY';
          const isFamilyPlus = item.plan === 'FAMILY_PLUS';
          const isSchool = item.plan.startsWith('SCHOOL');

          return (
            <section
              key={item.plan}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-shadow hover:shadow-lg ${
                isFamilyPlus
                  ? 'border-indigo-600 ring-2 ring-indigo-600 bg-indigo-50/20'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {item.plan.replace('_', ' ')}
                  </h2>
                  {isFamilyPlus && (
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      Popular
                    </span>
                  )}
                </div>

                <ul className="my-6 space-y-2.5">
                  {item.entitlements.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-700">
                      <span className="mr-2 text-indigo-600 font-bold">✓</span>
                      <span>{feature.replaceAll('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-100">
                {item.plan === 'FREE' ? (
                  <button
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-500 cursor-not-allowed"
                  >
                    Current Default
                  </button>
                ) : (
                  <button
                    disabled={loading}
                    onClick={() => subscribe(item.plan)}
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      isFamilyPlus
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {loading ? 'Processing...' : isSchool ? 'Contact & Subscribe' : 'Continue'}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
