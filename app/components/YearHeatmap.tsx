import React, { useEffect, useState, useRef } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useTheme } from 'next-themes';

interface YearHeatmapProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

function getLastNDates(n: number) {
  const dates = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - n + 1);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

const YearHeatmap: React.FC<YearHeatmapProps> = ({ selectedDate, onSelectDate }) => {
  const [values, setValues] = useState<{ date: string; count: number }[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysToShow = 365;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const heatmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastDates = getLastNDates(daysToShow);
    const vals = lastDates.map(date => {
      const key = `foods_${formatDateKey(date)}`;
      const stored = localStorage.getItem(key);
      let count = 0;
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr) && arr.length > 0) {
            count = arr.length;
          }
        } catch { }
      }
      return {
        date: formatDateKey(date),
        count,
      };
    });
    setValues(vals);
  }, [selectedDate]);

  // Hide future rects after render
  useEffect(() => {
    const svg = heatmapRef.current?.querySelector('svg');
    if (svg) {
      const futureRects = svg.querySelectorAll('.color-future');
      futureRects.forEach(rect => {
        (rect as SVGRectElement).style.display = 'none';
        // Try to hide parent <g> if all children are hidden
        const parentG = rect.parentElement;
        if (parentG && parentG.tagName === 'g') {
          const allRects = parentG.querySelectorAll('rect');
          const allHidden = Array.from(allRects).every(r => (r as SVGRectElement).style.display === 'none');
          if (allHidden) {
            ((parentG as unknown) as SVGGElement).style.display = 'none';
          }
        }
      });
    }
  }, [values]);

  // Tooltip handlers
  const handleMouseOver = (event: React.MouseEvent, value: { date: string; count?: number } | undefined) => {
    if (!value) return;
    const rect = heatmapRef.current?.getBoundingClientRect();
    setTooltip({
      x: event.clientX - (rect?.left || 0) + 10,
      y: event.clientY - (rect?.top || 0) + 10,
      content: `${value.date}\n${value.count && value.count > 0 ? 'Entries: ' + value.count : 'No entries'}`,
    });
  };
  const handleMouseOut = () => setTooltip(null);

  const hasAnyEntry = values.some(v => v.count > 0);

  const lastDates = getLastNDates(daysToShow);
  const startDate = lastDates[0];
  const endDate = lastDates[lastDates.length - 1];

  return (
    <section className="mb-10">
      <h2 className="text-xl md:text-2xl font-bold mb-3 text-foreground text-center">Yearly Food Log Overview</h2>
      <div className="flex flex-col items-center">
        {!hasAnyEntry && (
          <div className="text-center text-muted-foreground mb-2 text-base font-medium">No entries for this year yet.</div>
        )}
        <div className="relative w-full flex justify-center">
          <div className="overflow-x-auto rounded-lg border border-border bg-card p-4 shadow-sm w-full max-w-full">
            <div ref={heatmapRef} className="flex justify-center">
              <CalendarHeatmap
                startDate={startDate}
                endDate={endDate}
                values={values}
                classForValue={(value: { date: string; count?: number } | undefined) => {
                  if (!value) return 'color-empty';
                  const isFuture = value.date > formatDateKey(today);
                  if (isFuture) return 'color-future';
                  if (value.date === formatDateKey(selectedDate)) return 'color-selected';
                  return value.count && value.count > 0 ? 'color-filled' : 'color-empty';
                }}
                onClick={(value: { date: string; count?: number } | undefined) => {
                  if (value && value.date) {
                    onSelectDate(new Date(value.date));
                  }
                }}
                showWeekdayLabels={true}
                // @ts-expect-error CalendarHeatmap's transformDayElement typing is too restrictive for our usage
                transformDayElement={(el: React.ReactElement<Record<string, unknown>, string | React.JSXElementConstructor<unknown>>, value: { date: string; count?: number } | undefined) => {
                  const isFuture = value && value.date > formatDateKey(today);
                  if (isFuture) {
                    return React.cloneElement(el as React.ReactElement<Record<string, unknown>, string | React.JSXElementConstructor<unknown>>, {
                      key: value?.date,
                      style: { pointerEvents: 'none', opacity: 0, width: 0, height: 0 },
                    });
                  }
                  return React.cloneElement(el as React.ReactElement<Record<string, unknown>, string | React.JSXElementConstructor<unknown>>, {
                    key: value?.date,
                    onMouseOver: (e: React.MouseEvent) => handleMouseOver(e, value),
                    onMouseOut: handleMouseOut,
                    tabIndex: 0,
                    role: 'button',
                    'aria-label': value ? `${value.date}, ${value.count === 1 ? '1 entry' : value.count && value.count > 1 ? value.count + ' entries' : 'no entries'}` : 'No entry',
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if ((e.key === 'Enter' || e.key === ' ') && value && value.date) {
                        onSelectDate(new Date(value.date));
                      }
                    },
                  });
                }}
              />
              {typeof window !== 'undefined' && tooltip && (
                <div
                  className={`pointer-events-none absolute z-50 px-3 py-2 rounded shadow text-xs whitespace-pre-line ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}
                  style={{ left: tooltip.x, top: tooltip.y }}
                >
                  {tooltip.content}
                </div>
              )}

            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 text-xs md:text-sm justify-center">
              <div className="flex items-center gap-2">
                <svg width="18" height="18"><rect width="18" height="18" className="color-empty" rx="4" /></svg>
                <span className="text-muted-foreground">No entry</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18"><rect width="18" height="18" className="color-filled" rx="4" /></svg>
                <span className="text-foreground">Entry</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18"><rect width="18" height="18" className="color-selected" rx="4" /></svg>
                <span className="font-semibold text-primary">Selected</span>
              </div>
            </div>
          </div>

        </div>

      </div>
      <style>{`
        .color-empty, .color-filled, .color-selected {
          transition: fill 0.2s;
        }
        .color-empty { fill: #e5e7eb; }
        .color-filled { fill: #4ade80; }
        .color-selected { fill: #2563eb; }
        @media (prefers-color-scheme: dark) {
          .color-empty { fill: #262626; }
          .color-filled { fill: #4ade80; }
          .color-selected { fill: #2563eb; }
        }
        @media (max-width: 600px) {
          .react-calendar-heatmap svg { min-width: 600px; height: 90px; }
          .react-calendar-heatmap rect { width: 10px; height: 10px; }
        }
        .color-future { fill: transparent !important; pointer-events: none; display: none; }
      `}</style>
    </section>
  );
};

export default YearHeatmap; 