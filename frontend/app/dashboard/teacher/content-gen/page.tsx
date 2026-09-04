'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Wand2, BookOpen, Layers, Clock, Target } from 'lucide-react';

export default function ContentGenInputPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customTopic: '',
        type: 'LESSON_PLAN',
        difficulty: 'INTERMEDIATE',
        targetDuration: 45,
        learningObjective: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/content-gen/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok && data.draftId) {
                router.push(`/dashboard/teacher/content-gen/review/${data.draftId}`);
            } else {
                throw new Error('Generation failed');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to generate content. Ensure backend AI service is running.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen">

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Wand2 className="w-8 h-8 text-primary" />
                    AI Content Studio
                </h1>
                <p className="text-muted-foreground">Orchestrate and generate structured curriculum items on demand.</p>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Topic Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            Target Subject / Topic
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Photosynthesis, Python For-Loops..."
                            value={formData.customTopic}
                            onChange={e => setFormData({ ...formData, customTopic: e.target.value })}
                            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Layers className="w-4 h-4 text-muted-foreground" />
                                Content Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-slate-50 outline-none"
                            >
                                <option value="LESSON_PLAN">Lesson Plan</option>
                                <option value="WORKSHEET">Worksheet</option>
                                <option value="QUIZ">Quiz / Assessment</option>
                                <option value="HOMEWORK">Homework Set</option>
                            </select>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Target Difficulty</label>
                            <select
                                value={formData.difficulty}
                                onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-slate-50 outline-none"
                            >
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                Duration (Mins)
                            </label>
                            <input
                                type="number"
                                min="5" max="180"
                                value={formData.targetDuration}
                                onChange={e => setFormData({ ...formData, targetDuration: parseInt(e.target.value) })}
                                className="w-full p-3 rounded-lg border bg-slate-50 outline-none"
                            />
                        </div>
                    </div>

                    {/* Objective Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            Specific Learning Objective (Bloom's Taxonomy Constraints applied automatically)
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Students will be able to analyze the impact of [X] on [Y]..."
                            value={formData.learningObjective}
                            onChange={e => setFormData({ ...formData, learningObjective: e.target.value })}
                            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !formData.customTopic || !formData.learningObjective}
                            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {loading ? `Orchestrating ${formData.type.replace('_', ' ')}...` : 'Generate Content'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
