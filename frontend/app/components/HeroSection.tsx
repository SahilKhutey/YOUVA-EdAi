"use client";
import Link from "next/link";
import Image from "next/image";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="sm:text-center lg:text-left"
            >
              <h1 className="text-4xl tracking-tight font-extrabold text-foreground sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Master any subject with</span>{" "}
                <span className="block text-primary xl:inline">
                  AI-powered learning
                </span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Youva EdAi adapts to your unique learning style. Get
                personalized lessons, instant feedback on practice quizzes, and
                track your mastery in real-time.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/auth/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 md:py-4 md:text-lg md:px-10 transition-colors"
                  >
                    Get started
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="/auth/login"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 md:py-4 md:text-lg md:px-10 transition-colors"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-muted/30"
      >
        <div className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
          <div className="relative w-full h-full p-12 flex items-center justify-center overflow-hidden">
            {/* Abstract Shapes */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 text-center">
              <span className="text-8xl filter drop-shadow-xl">🚀</span>
              <h2 className="mt-6 text-2xl font-bold text-gray-800 dark:text-gray-100">
                AI Learning in Action
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Personalized. Adaptive. Smart.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
