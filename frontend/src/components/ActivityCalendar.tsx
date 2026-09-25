import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DayActivity } from '../api';

interface Props {
  activity: DayActivity[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  month: Date;
  onMonthChange: (delta: -1 | 1) => void;
}

export const ActivityCalendar: React.FC<Props> = ({
  activity,
  selectedDate,
  onSelectDate,
  month,
  onMonthChange
}) => {
  const daysInMonth = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const date = new Date(year, m, 1);
    const days: Date[] = [];
    while (date.getMonth() === m) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [month]);

  const firstDayOffset = daysInMonth[0].getDay();

  const getDayCellClass = (reviewed: number, goalMet: boolean): string => {
    if (goalMet) return 'bg-secondary-container/20 text-on-surface';
    if (reviewed > 0) return 'bg-surface-container-high/60';
    return 'bg-surface-container opacity-40';
  };

  const getDotColor = (reviewed: number, goalMet: boolean): string => {
    if (goalMet) return 'bg-secondary';
    if (reviewed > 0) return 'bg-tertiary-container';
    return 'bg-surface-variant';
  };

  const getLocalDateString = (d: Date) => {
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  };

  const today = getLocalDateString(new Date());

  return (
    <div className="bg-surface-container-low rounded-2xl p-spacing-xl flex flex-col gap-spacing-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-spacing-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Study Activity & Consistency</h2>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-xl text-on-surface">
          <button onClick={() => onMonthChange(-1)} aria-label="Previous Month" className="hover:text-primary transition-colors flex items-center">
            <ChevronLeft size={16} />
          </button>
          <span className="font-title-sm text-title-sm px-2">
            {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => onMonthChange(1)} aria-label="Next Month" className="hover:text-primary transition-colors flex items-center">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center font-label-sm text-on-surface-variant mb-1">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      <div className="grid grid-cols-7 gap-2.5">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-16 rounded-xl bg-surface-container-lowest/40 opacity-40"></div>
        ))}

        {daysInMonth.map((d) => {
          const dateStr = getLocalDateString(d);
          const act = activity.find((a) => a.date === dateStr);
          const reviewed = act?.reviewed || 0;
          const goalMet = act?.streak_met || false;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;

          let baseClass = getDayCellClass(reviewed, goalMet);
          if (isToday) {
            baseClass = 'bg-surface-bright shadow-lg shadow-primary-container/20 ring-2 ring-primary-container relative transform scale-[1.03]';
          } else if (isFuture) {
            baseClass = 'bg-surface-container-lowest opacity-20';
          }
          if (isSelected && !isToday && !isFuture) {
            baseClass += ' ring-1 ring-secondary scale-[1.02] shadow-md';
          }

          return (
            <div
              key={dateStr}
              onClick={() => { if (!isFuture) onSelectDate(dateStr) }}
              className={`h-16 rounded-xl flex flex-col justify-between p-2 transition-transform ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'} ${baseClass}`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-title-sm ${isToday ? 'text-primary font-bold' : 'text-on-surface font-label-sm'}`}>
                  {d.getDate()}
                </span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
              </div>
              
              {reviewed > 0 ? (
                <div className="flex items-center justify-between">
                  {isToday ? (
                    <>
                      <span className="font-label-sm text-primary font-bold hidden lg:inline">Today</span>
                      <span className={`w-2 h-2 rounded-full lg:hidden ${getDotColor(reviewed, goalMet)}`}></span>
                    </>
                  ) : (
                     <span className={`w-2 h-2 rounded-full ${getDotColor(reviewed, goalMet)}`}></span>
                  )}
                  <span className={`font-title-sm ${isToday ? 'text-secondary' : 'text-secondary font-label-sm'}`}>{reviewed}</span>
                </div>
              ) : isToday ? (
                <div className="flex items-center justify-between">
                   <span className="font-label-sm text-primary font-bold hidden lg:inline">Today</span>
                   <span className="w-2 h-2 rounded-full bg-surface-variant lg:hidden"></span>
                   <span className="font-title-sm text-secondary">0</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-spacing-md pt-spacing-sm text-on-surface-variant font-label-sm">
        <div className="flex items-center gap-spacing-md">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-secondary"></span>
            <span>Goal Reached</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-tertiary-container"></span>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-surface-container-high"></span>
            <span>Scheduled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
