import React, { useRef, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface HeatmapValue {
    date: string; // yyyy-mm-dd
    count: number;
}

interface CustomHeatmapProps {
    values: HeatmapValue[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

function getWeeks(values: HeatmapValue[]) {
    // Group days into weeks (each week is an array of 7 days, starting Sunday)
    const weeks: HeatmapValue[][] = [];
    let week: HeatmapValue[] = [];
    values.forEach((v, i) => {
        const date = new Date(v.date);
        if (i === 0 && date.getDay() !== 0) {
            // pad first week with nulls if not starting on Sunday
            for (let j = 0; j < date.getDay(); j++) week.push({ date: '', count: -1 });
        }
        week.push(v);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    });
    if (week.length > 0) {
        // pad last week
        while (week.length < 7) week.push({ date: '', count: -1 });
        weeks.push(week);
    }
    return weeks;
}

function formatDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

const colorClass = (count: number, isSelected: boolean) => {
    if (count === -1) return 'bg-transparent';
    if (isSelected) return 'bg-blue-600';
    if (count === 0) return 'bg-zinc-200 dark:bg-zinc-800';
    if (count < 2) return 'bg-green-100 dark:bg-green-900';
    if (count < 5) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-600 dark:bg-green-400';
};

const CustomHeatmap: React.FC<CustomHeatmapProps> = ({ values, selectedDate, onSelectDate }) => {
    const [isClient, setIsClient] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    useEffect(() => { setIsClient(true); }, []);
    // Auto-scroll to the rightmost (latest) week
    useEffect(() => {
        if (isClient && viewportRef.current) {
            setTimeout(() => {
                if (viewportRef.current) {
                    viewportRef.current.scrollLeft = viewportRef.current.scrollWidth;
                }
            }, 0);
        }
    }, [isClient, values.length]);
    if (!isClient) {
        return (
            <ScrollArea style={{ height: '9.6rem' }} className="w-full">
                <div className="animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-md min-w-[900px] h-full" style={{ height: '9.6rem' }} />
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        );
    }
    const weeks = getWeeks(values);

    return (
        <TooltipProvider delayDuration={50}>
            <div className="relative w-full" style={{ height: '9.6rem' }}>
                {/* Absolutely positioned weekday labels */}
                <div style={{ position: 'absolute', left: '-32px', top: '-7px', height: '100%', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', pointerEvents: 'none' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'].map((label, i) => (
                        <div key={i} style={{ height: '16px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--muted-foreground)', userSelect: 'none', paddingRight: '4px' }}>
                            {label}
                        </div>
                    ))}
                </div>
                {/* Scrollable heatmap grid */}
                <div style={{ height: '9.6rem' }} className="w-full overflow-x-scroll" ref={viewportRef}>
                    <div className="grid grid-flow-col auto-cols-max gap-1 min-w-[900px]">
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-1">
                                {week.map((v, di) => {
                                    const isSelected = !!v.date && v.date === formatDateKey(selectedDate);
                                    const hasData = v.date && v.count >= 0;
                                    const tooltipText = hasData ? `${v.date}\n${v.count} entr${v.count === 1 ? 'y' : 'ies'}` : '';
                                    const cell = (
                                        <div
                                            key={v.date || `empty-${wi}-${di}`}
                                            className={`w-4 h-4 rounded ${colorClass(v.count, isSelected)} border border-border cursor-pointer transition-all duration-100`}
                                            tabIndex={hasData ? 0 : -1}
                                            aria-label={hasData ? `${v.date}, ${v.count} entr${v.count === 1 ? 'y' : 'ies'}` : ''}
                                            onClick={() => hasData && onSelectDate(new Date(v.date))}
                                            onKeyDown={e => {
                                                if ((e.key === 'Enter' || e.key === ' ') && hasData) {
                                                    onSelectDate(new Date(v.date));
                                                }
                                            }}
                                        />
                                    );
                                    return hasData ? (
                                        <Tooltip key={v.date || `empty-${wi}-${di}`}>
                                            <TooltipTrigger asChild>{cell}</TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="text-xs whitespace-pre-line">
                                                {tooltipText}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : cell;
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default CustomHeatmap; 