import { useRef, useState, useEffect } from 'react';
import { MotionTokens } from '@/lib/motion-tokens';

interface Point {
    x: number;
    y: number;
}

export function useSmoothCursor(targetPos: Point | null) {
    const [currentPos, setCurrentPos] = useState<Point | null>(targetPos);
    const requestRef = useRef<number>(null);
    const targetRef = useRef<Point | null>(targetPos);

    useEffect(() => {
        targetRef.current = targetPos;
    }, [targetPos]);

    useEffect(() => {
        const animate = () => {
            if (!targetRef.current) return;

            setCurrentPos((prev) => {
                if (!prev) return targetRef.current;

                // Linear Interpolation (Lerp)
                // Factor determines speed. 0.2 is "smooth but responsive"
                // For exact 120ms lag, we might need delta time calculation, 
                // but a fixed factor of ~0.1-0.2 at 60fps approximates it well.
                const factor = 0.2;

                const dx = targetRef.current!.x - prev.x;
                const dy = targetRef.current!.y - prev.y;

                if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
                    return targetRef.current;
                }

                return {
                    x: prev.x + dx * factor,
                    y: prev.y + dy * factor,
                };
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return currentPos;
}
