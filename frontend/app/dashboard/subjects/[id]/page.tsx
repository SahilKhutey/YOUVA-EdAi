"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

interface SubjectDetail {
  id: string;
  name: string;
  description: string | null;
  topics: Topic[];
}

export default function SubjectDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && id) {
      fetchSubjectDetails();
    }
  }, [user, id]);

  const fetchSubjectDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/subjects/${id}`);
      setSubject(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch subject details:", err);
      setError("Failed to load subject details. It may not exist.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading subject details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user || !subject) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/subjects")}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center"
          >
            &larr; Back to Subjects
          </button>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            {subject.name}
          </h1>
          <p className="mt-2 text-lg text-gray-500">{subject.description}</p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Topics
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Select a topic to start learning.
            </p>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            {subject.topics
              .sort((a, b) => a.order - b.order)
              .map((topic) => (
                <li key={topic.id}>
                  <div className="block hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {topic.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/learn/${topic.id}`);
                              }}
                              className="flex-1 px-3 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-md bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                            >
                              Start Session
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/practice/${topic.id}`);
                              }}
                              className="flex-1 px-3 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-md bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                            >
                              Take Quiz
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {topic.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            {subject.topics.length === 0 && (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No topics available yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
