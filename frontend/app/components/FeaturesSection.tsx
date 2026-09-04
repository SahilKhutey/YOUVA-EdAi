"use client";
// Note: In a real app, you might use @heroicons/react. Here we use inline SVGs for simplicity.

import { motion } from "framer-motion";

export default function FeaturesSection() {
  const features = [
    {
      name: "Personalized AI Tutor",
      description:
        "Our AI engine understands your current level and tailors every lesson to help you grasp concepts faster.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      name: "Adaptive Practice",
      description:
        "Quizzes that get harder as you improve. Never waste time on questions that are too easy or too hard.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      name: "Smart Analytics",
      description:
        "Visualize your mastery of every topic. Identify weak spots instantly and focus your revision where it matters.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
          />
        </svg>
      ),
    },
    {
      name: "24/7 Availability",
      description:
        "Learning doesn't stop when school ends. Access your AI tutor anytime, anywhere, on any device.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="py-12 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
            Features
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
            A better way to learn
          </p>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
            Youva EdAi combines advanced AI with proven educational methods to
            accelerate your learning journey.
          </p>
        </div>

        <div className="mt-10">
          <motion.dl
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                variants={item}
                className="relative"
              >
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                    {feature.icon}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-foreground">
                    {feature.name}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-muted-foreground">
                  {feature.description}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </div>
    </div>
  );
}
