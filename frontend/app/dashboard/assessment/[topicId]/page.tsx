'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ProctorHarness } from '@/app/components/assessment/ProctorHarness';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AssessmentPage() {
    const { topicId } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }

        if (status === 'authenticated') {
            startAssessment();
        }
    }, [status]);

    const startAssessment = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/assessment/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(session as any).accessToken}`,
                },
                body: JSON.stringify({ topicId }),
            });
            if (!res.ok) throw new Error('Failed to start assessment');
            const data = await res.json();
            setSessionData(data.session);
            setQuestions(data.questions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitAssessment = async (finalAnswers: any[]) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`http://localhost:3001/api/assessment/${sessionData.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(session as any).accessToken}`,
                },
                body: JSON.stringify({ answers: finalAnswers }),
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectOption = (option: string) => {
        const question = questions[currentQuestionIndex];
        const isCorrect = option === question.correctAnswer;

        const newAnswer = {
            questionId: `rand-${currentQuestionIndex}`,
            answer: option,
            isCorrect,
        };

        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = newAnswer;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            submitAssessment(answers);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (result) {
        return (
            <div className="flex w-full min-h-screen bg-slate-50 items-center justify-center">
                <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-2xl border shadow-sm">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold mb-4">Assessment Complete</h1>
                    <p className="text-lg mb-2">Final Score: <span className="font-bold">{result.score.toFixed(1)}%</span></p>
                    <p className="text-muted-foreground mb-8">
                        Your final Integrity Score is:
                        <span className={`ml-2 font-bold ${result.session.integrityScore < 70 ? 'text-destructive' : 'text-emerald-600'}`}>
                            {result.session.integrityScore}%
                        </span>
                    </p>
                    <button
                        onClick={() => router.push('/dashboard/subjects')}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
                    >
                        Return to Subjects
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex];

    return (
        <ProctorHarness sessionId={sessionData?.id}>
            <div className="max-w-3xl mx-auto w-full pt-10 px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Secure Certification Exam</h1>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border p-8 shadow-sm mb-6 min-h-[300px]">
                    <h2 className="text-lg font-medium mb-6 leading-relaxed">{currentQ.content}</h2>

                    <div className="space-y-3">
                        {currentQ.options.map((option: string, i: number) => {
                            const isSelected = currentAnswer?.answer === option;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelectOption(option)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!currentAnswer || isSubmitting}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {currentQuestionIndex === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
                    </button>
                </div>
            </div>
        </ProctorHarness>
    );
}
