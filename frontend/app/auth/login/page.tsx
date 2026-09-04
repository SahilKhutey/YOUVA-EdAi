"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      {/* Left Side - Branding (Google Devs Style: Clean, Information Heavy but Spacious) */}
      <div className="hidden lg:flex w-1/2 bg-[#F8F9FA] relative flex-col justify-between p-16 border-r border-slate-200">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-[#1a73e8] flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-medium tracking-tight text-slate-800">
              Youva-EdAi
            </span>
          </div>

          <div className="w-[448px] max-w-full space-y-8">
            <h1 className="text-5xl font-medium tracking-tight text-slate-900 leading-[1.1]">
              Build your <br />
              <span className="text-[#1a73e8]">knowledge base</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed font-light">
              Join a community of learners using AI to master complex subjects.
              Experience a personalized curriculum that adapts to your pace.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 text-sm text-slate-500">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Documentation</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-[#1a73e8] transition-colors">
                  Getting Started
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1a73e8] transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1a73e8] transition-colors">
                  Guides
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-[#1a73e8] transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1a73e8] transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1a73e8] transition-colors">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Google Sign-in Style) */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-[#E2E8F0]">
        <div className="w-[400px] max-w-full space-y-8 p-10 clay-card">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-slate-900">Sign in</h2>
            <p className="mt-2 text-base text-slate-600">
              to continue to Youva-EdAi
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-[4px] bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  required
                  className="peer w-full h-[54px] px-4 clay-input text-base text-slate-900 placeholder-transparent focus:outline-none"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-translate-y-6 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                >
                  Email
                </label>
              </div>

              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  required
                  className="peer w-full h-[54px] px-4 clay-input text-base text-slate-900 placeholder-transparent focus:outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-translate-y-6 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                >
                  Password
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a
                href="#"
                className="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
              >
                Forgot password?
              </a>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex justify-between items-center w-full">
                <Link
                  href="/auth/register"
                  className="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] py-2 px-1"
                >
                  Create account
                </Link>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center px-8 py-3 h-[44px] clay-btn text-sm font-medium focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>

              {/* Demo Section */}
              <div className="relative mt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500">Or try a demo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("student@test.com");
                    setPassword("password123");
                    // We need a slight delay to let state update before we can submit
                    setTimeout(() => {
                      const formEvent = new Event("submit", { cancelable: true, bubbles: true });
                      const form = document.querySelector("form");
                      if (form) form.dispatchEvent(formEvent);
                    }, 10);
                  }}
                  className="flex items-center justify-center h-[44px] px-4 font-medium text-slate-700 bg-[#E2E8F0] clay-btn focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                >
                  Demo Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("teacher@test.com");
                    setPassword("password123");
                    setTimeout(() => {
                      const formEvent = new Event("submit", { cancelable: true, bubbles: true });
                      const form = document.querySelector("form");
                      if (form) form.dispatchEvent(formEvent);
                    }, 10);
                  }}
                  className="flex items-center justify-center h-[44px] px-4 font-medium text-slate-700 bg-[#E2E8F0] clay-btn focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                >
                  Demo Teacher
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
