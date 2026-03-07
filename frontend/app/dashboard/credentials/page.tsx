"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/app/components/MainLayout";
import api from "@/lib/axios";
import { ShieldCheck, Network, Hexagon, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Credential {
    id: string;
    blockchainHash: string;
    validationScore: number;
    issuedAt: string;
    skillNode: {
        name: string;
        type: string;
    };
}

export default function CredentialWallet() {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchCredentials = async () => {
            try {
                const res = await api.get("/credential-mesh/my-credentials");
                setCredentials(res.data);
            } catch (error) {
                console.error("Failed to load credentials", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCredentials();
    }, []);

    if (!isMounted) return null;

    return (
        <MainLayout>
            <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover w-fit">
                            Credential Mesh Wallet
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
                            Your globally verifiable knowledge graph. These credentials are mathematically backed by your embedded assessment performance and recorded on the mesh.
                        </p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                        <button className="px-4 py-1.5 text-sm font-bold bg-white shadow-sm rounded-md text-slate-800">
                            Active Keys
                        </button>
                        <button className="px-4 py-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
                            Public Ledger
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="font-semibold">Syncing with credential mesh...</p>
                    </div>
                ) : credentials.length === 0 ? (
                    <div className="clay-card p-12 flex flex-col items-center justify-center text-center bg-white/50">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                            <ShieldCheck className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No Credentials Minted Yet</h3>
                        <p className="text-slate-500 max-w-md mt-2">
                            Complete deeply integrated AI assessments and real-world projects to earn cryptographically secure competency proofs.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {credentials.map((cred) => (
                            <div key={cred.id} className="clay-card bg-gradient-to-br from-white to-slate-50 p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
                                <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />

                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center z-10">
                                        <Hexagon className="w-6 h-6 text-primary fill-primary/10" />
                                    </div>
                                    <div className="text-right z-10">
                                        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-200">
                                            <ShieldCheck className="w-3 h-3" /> Validated
                                        </div>
                                    </div>
                                </div>

                                <div className="z-10 relative">
                                    <h3 className="font-black text-xl text-slate-800 mb-1 leading-tight">
                                        {cred.skillNode.name.replace('Mastery: ', '')}
                                    </h3>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                                        <Network className="w-3 h-3" />
                                        {cred.skillNode.type} NODE
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100/80 z-10 relative grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mastery Index</p>
                                        <p className="text-lg font-black text-slate-700">{(cred.validationScore * 100).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issued On</p>
                                        <p className="text-sm font-bold text-slate-700 mt-1">{format(new Date(cred.issuedAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div className="col-span-2 mt-2 bg-slate-100 rounded-lg p-3 border border-slate-200 border-dashed">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mesh Hash (Mock)</p>
                                        <p className="text-xs font-mono text-slate-600 truncate bg-white px-2 py-1 rounded border shadow-inner">
                                            {cred.blockchainHash}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
