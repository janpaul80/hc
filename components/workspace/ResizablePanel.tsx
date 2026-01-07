import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
    children: React.ReactNode;
    defaultWidth: number;
    minWidth?: number;
    maxWidth?: number;
    position?: 'left' | 'right';
    className?: string;
}

export default function ResizablePanel({
    children,
    defaultWidth,
    minWidth = 200,
    maxWidth = 800,
    position = 'right',
    className
}: ResizablePanelProps) {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const panel = panelRef.current;
            if (!panel) return;

            const rect = panel.getBoundingClientRect();
            let newWidth;

            if (position === 'right') {
                newWidth = rect.right - e.clientX;
            } else {
                newWidth = e.clientX - rect.left;
            }

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, minWidth, maxWidth, position]);

    return (
        <div
            ref={panelRef}
            className={cn("relative flex-shrink-0", className)}
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div
                className={cn(
                    "absolute top-0 bottom-0 w-1 cursor-col-resize z-10 group",
                    position === 'right' ? 'left-0' : 'right-0'
                )}
                onMouseDown={() => setIsResizing(true)}
            >
                <div className="absolute inset-0 hover:bg-orange-500/30 transition-colors" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-transparent group-hover:bg-orange-500/50 transition-colors" />
            </div>

            {children}
        </div>
    );
}
