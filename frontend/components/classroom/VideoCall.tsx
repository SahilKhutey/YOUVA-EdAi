'use client';
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Mic, MicOff, VideoIcon, VideoOff } from 'lucide-react';

export default function VideoCall({ socket, sessionId, isTeacher }: { socket: Socket | null, sessionId: string, isTeacher: boolean }) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const [hasVideo, setHasVideo] = useState(true);
    const [hasAudio, setHasAudio] = useState(true);

    useEffect(() => {
        if (!socket) return;

        const startCall = async () => {
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Failed to get local stream", err);
                return;
            }

            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            peerConnection.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { sessionId, candidate: event.candidate });
                }
            };

            // Signaling handlers
            socket.on('user-joined', async () => {
                if (isTeacher) { // Teacher initiates the offer when a student joins
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { sessionId, offer });
                }
            });

            socket.on('offer', async (offer) => {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { sessionId, answer });
            });

            socket.on('answer', async (answer) => {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on('ice-candidate', async (candidate) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            });
        };

        startCall();

        return () => {
            peerConnection.current?.close();
            socket.off('user-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
        };
    }, [socket, isTeacher, sessionId]);

    const toggleVideo = () => setHasVideo(!hasVideo);
    const toggleAudio = () => setHasAudio(!hasAudio);

    return (
        <div className="flex flex-col gap-4 w-full h-full relative group">
            <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                    {isTeacher ? 'Student' : 'Teacher'}
                </div>
            </div>
            <div className="absolute bottom-6 right-6 w-32 h-44 bg-slate-800 rounded-xl overflow-hidden shadow-xl ring-4 ring-white/20">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md z-10">
                    You
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={toggleAudio} className={`p-3 rounded-full transition-colors ${hasAudio ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}>
                    {hasAudio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${hasVideo ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}>
                    {hasVideo ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
