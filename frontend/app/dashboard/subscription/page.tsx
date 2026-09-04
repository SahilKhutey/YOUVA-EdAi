"use client";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get("/subscription/status");
      setCurrentPlan(res.data); // data might be null if no subscription yet
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await api.post("/subscription/create-checkout-session", {
        plan: "premium",
      });
      // Redirect to Stripe Checkout URL
      window.location.href = res.data.url;
    } catch (error) {
      console.error("Upgrade failed:", error);
      alert("Something went wrong initiating the upgrade.");
    }
  };

  const isPro =
    currentPlan?.plan === "PREMIUM" && currentPlan?.status === "ACTIVE";

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground text-center mb-12">
        Choose Your Plan
      </h1>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-12">
        {/* Free Plan */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
          <div className="px-6 py-8">
            <h3 className="text-center text-2xl font-bold text-foreground">
              Free
            </h3>
            <p className="text-center text-muted-foreground mt-2">
              Basic learning essentials
            </p>
            <div className="mt-8 flex justify-center items-baseline">
              <span className="text-5xl font-extrabold text-foreground">
                $0
              </span>
              <span className="text-muted-foreground ml-1">/mo</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <span className="text-secondary mr-2">✓</span> Access to basic
                subjects
              </li>
              <li className="flex items-center">
                <span className="text-secondary mr-2">✓</span> 5 AI learning
                sessions/day
              </li>
              <li className="flex items-center">
                <span className="text-secondary mr-2">✓</span> Basic progress
                tracking
              </li>
            </ul>
          </div>
          <div className="px-6 py-8 bg-muted/30">
            {isPro ? (
              <button
                disabled
                className="w-full block bg-muted text-muted-foreground font-bold py-3 rounded-md cursor-not-allowed"
              >
                Downgrade (Not available)
              </button>
            ) : (
              <button
                disabled
                className="w-full block bg-primary/10 text-primary font-bold py-3 rounded-md cursor-default"
              >
                Current Plan
              </button>
            )}
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border-2 border-primary relative">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 uppercase tracking-wide">
            Popular
          </div>
          <div className="px-6 py-8">
            <h3 className="text-center text-2xl font-bold text-foreground">
              Pro
            </h3>
            <p className="text-center text-muted-foreground mt-2">
              Supercharge your learning
            </p>
            <div className="mt-8 flex justify-center items-baseline">
              <span className="text-5xl font-extrabold text-foreground">
                $9.99
              </span>
              <span className="text-muted-foreground ml-1">/mo</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <span className="text-secondary mr-2">✓</span> Unlimited AI
                sessions
              </li>
              <li className="flex items-center">
                <span className="text-secondary mr-2">✓</span> Advanced Practice
                Mode
              </li>
              <li className="flex items-center">
                <span className="text-secondary mr-2">✓</span> Detailed
                Analytics & Insights
              </li>
              <li className="flex items-center">
                <span className="text-secondary mr-2">✓</span> Mock Exams
              </li>
            </ul>
          </div>
          <div className="px-6 py-8 bg-muted/30">
            {isPro ? (
              <button
                disabled
                className="w-full block bg-secondary text-primary-foreground font-bold py-3 rounded-md cursor-default"
              >
                Active
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-md transition duration-150"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
