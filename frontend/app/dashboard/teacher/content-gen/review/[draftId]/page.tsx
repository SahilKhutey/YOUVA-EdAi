'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Save, Edit, RefreshCw } from 'lucide-react';

export default function ReviewPanelPage() {
    const { draftId } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState<any>(null);
    const [contentObj, setContentObj] = useState<any>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    useEffect(() => {
        const fetchDraft = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                // In a real app we'd fetch this specific draft by ID via a GET route.
                // For MVP, we'll fetch all drafts and find the matching one.
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/content-gen/drafts`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const drafts = await res.json();
                const currentDraft = drafts.find((d: any) => d.id === draftId);

                if (currentDraft) {
                    setDraft(currentDraft);
                    setContentObj(JSON.parse(currentDraft.content));
                }
            } catch (e) {
                console.error('Failed to fetch draft', e);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchDraft();
    }, [draftId, user]);

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/content-gen/publish/${draftId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ overrides: contentObj }) // Send the edited state
            });
            if (res.ok) {
                setIsPublished(true);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to publish');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!user) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!draft || !contentObj) return <div className="p-10 text-center text-muted-foreground">Draft not found or unauthorized.</div>;

    if (isPublished) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="bg-white p-10 rounded-2xl border text-center shadow-sm max-w-md w-full">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Content Published!</h2>
                    <p className="text-muted-foreground mb-6">The {draft.type.toLowerCase().replace('_', ' ')} is now live for your students.</p>
                    <button
                        onClick={() => router.push('/dashboard/teacher/content-gen')}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium w-full"
                    >
                        Create More Content
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <Edit className="w-7 h-7 text-primary" />
                        Human Review Panel
                    </h1>
                    <p className="text-muted-foreground">
                        Review and edit the AI-generated <strong>{draft.type.replace('_', ' ')}</strong> before publishing.
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm border flex items-center gap-2">
                        <Save className="w-4 h-4" /> Auto-Saved Draft
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
                    >
                        {isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve & Publish
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">Bloom's Focus</span>
                This content is optimized for <strong>{draft.bloomsTaxonomyLevel}</strong>. Objective: "{draft.learningObjective}"
            </div>

            {/* Editable JSON Formatted View */}
            <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase">Document Title</label>
                    <input
                        type="text"
                        value={contentObj.title || ''}
                        onChange={e => setContentObj({ ...contentObj, title: e.target.value })}
                        className="w-full text-2xl font-bold border-b border-transparent focus:border-primary focus:bg-slate-50 outline-none pb-2 transition-all"
                    />
                </div>

                {draft.type === 'LESSON_PLAN' && contentObj.sections && (
                    <div className="space-y-6">
                        {contentObj.sections.map((sec: any, idx: number) => (
                            <div key={idx} className="p-5 border rounded-xl bg-slate-50 relative group">
                                <div className="absolute top-4 right-4 text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border shadow-sm">
                                    {sec.durationMins || 10} Mins
                                </div>
                                <input
                                    className="text-lg font-bold bg-transparent outline-none w-[90%] mb-2 focus:text-primary"
                                    value={sec.title || ''}
                                    onChange={e => {
                                        const newArr = [...contentObj.sections];
                                        newArr[idx].title = e.target.value;
                                        setContentObj({ ...contentObj, sections: newArr });
                                    }}
                                />
                                <textarea
                                    className="w-full bg-white p-3 rounded-lg border outline-none resize-y min-h-[100px] text-slate-700 text-sm leading-relaxed"
                                    value={sec.content || ''}
                                    onChange={e => {
                                        const newArr = [...contentObj.sections];
                                        newArr[idx].content = e.target.value;
                                        setContentObj({ ...contentObj, sections: newArr });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {(draft.type === 'QUIZ' || draft.type === 'WORKSHEET' || draft.type === 'HOMEWORK') && contentObj.items && (
                    <div className="space-y-6">
                        {contentObj.items.map((item: any, idx: number) => (
                            <div key={idx} className="p-6 border rounded-xl bg-slate-50">
                                <span className="text-xs font-bold uppercase text-primary mb-2 block tracking-wider">Question {idx + 1}</span>
                                <textarea
                                    className="w-full text-lg font-medium bg-transparent outline-none resize-none mb-4 focus:ring-1 focus:ring-primary/30 p-2 rounded"
                                    value={item.question || ''}
                                    rows={2}
                                    onChange={e => {
                                        const newArr = [...contentObj.items];
                                        newArr[idx].question = e.target.value;
                                        setContentObj({ ...contentObj, items: newArr });
                                    }}
                                />

                                {item.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                        {item.options.map((opt: string, optIdx: number) => (
                                            <div key={optIdx} className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border border-slate-300 ${opt === item.correctAnswer ? 'bg-emerald-500 border-none' : 'bg-white'}`} />
                                                <input
                                                    className="flex-1 bg-white border p-2 rounded text-sm outline-none w-full"
                                                    value={opt}
                                                    onChange={e => {
                                                        const newArr = [...contentObj.items];
                                                        newArr[idx].options[optIdx] = e.target.value;
                                                        // Auto-update correctAnswer if the underlying text changed
                                                        if (opt === item.correctAnswer) newArr[idx].correctAnswer = e.target.value;
                                                        setContentObj({ ...contentObj, items: newArr });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                    <label className="text-xs font-bold text-primary block mb-1">AI Explanation / Answer Key logic</label>
                                    <textarea
                                        className="w-full bg-transparent text-sm text-slate-700 outline-none resize-y min-h-[60px]"
                                        value={item.explanation || ''}
                                        onChange={e => {
                                            const newArr = [...contentObj.items];
                                            newArr[idx].explanation = e.target.value;
                                            setContentObj({ ...contentObj, items: newArr });
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
