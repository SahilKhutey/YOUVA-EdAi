'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { Socket } from 'socket.io-client';

export default function SharedWhiteboard({ socket, sessionId }: { socket: Socket | null, sessionId: string }) {
    const [lines, setLines] = useState<any[]>([]);
    const isDrawing = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        if (!containerRef.current) return;
        setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
        });

        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('draw', (newLine: any) => {
            setLines((prev) => [...prev, newLine]);
        });
        socket.on('clear-board', () => {
            setLines([]);
        });
        return () => {
            socket.off('draw');
            socket.off('clear-board');
        }
    }, [socket]);

    const handleMouseDown = (e: any) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        if (!pos) return;
        setLines([...lines, { tool: 'pen', points: [pos.x, pos.y] }]);
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        if (!point) return;

        let lastLine = lines[lines.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        lines.splice(lines.length - 1, 1, lastLine);
        setLines([...lines]);

        // Emit to socket
        if (socket && socket.connected) {
            socket.emit('draw', { sessionId, drawData: lastLine });
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const clearBoard = () => {
        setLines([]);
        if (socket) socket.emit('clear-board', { sessionId });
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-200">
            <Stage
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                className="cursor-crosshair"
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke="#4f46e5"
                            strokeWidth={5}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                        />
                    ))}
                </Layer>
            </Stage>
            <button
                onClick={clearBoard}
                className="absolute top-4 right-4 bg-white shadow-md border px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors z-10"
            >
                Clear Board
            </button>
        </div>
    );
}
