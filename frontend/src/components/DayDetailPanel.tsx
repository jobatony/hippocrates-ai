import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import type { DayActivity } from '../api';

interface Props {
  date: string;
  activity: DayActivity | null;
  goalMet: boolean; // Review streak
}

export const DayDetailPanel: React.FC<Props> = ({ date, activity, goalMet }) => {
  const reviewed = activity?.reviewed || 0;
  const created = activity?.created || 0;
  const creationMet = activity?.creation_streak_met || false;

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="bg-surface-container rounded-2xl p-spacing-xl flex flex-col gap-spacing-lg shadow-sm h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-label-sm text-secondary uppercase tracking-wider font-semibold">Active Selection</span>
          <h3 className="font-title-lg text-title-lg text-on-surface">{formattedDate}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-spacing-sm">
        {/* Review Stat */}
        <div className="bg-surface-container-low rounded-xl p-spacing-md flex flex-col justify-between gap-2 border border-surface-container-high/40">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-on-surface-variant">Review Session</span>
            <Flame size={16} className="text-tertiary-container" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-tertiary-container font-semibold leading-tight">
              {reviewed}
            </span>
            <span className="font-label-sm text-tertiary-fixed-dim mt-0.5">
              reviewed
            </span>
          </div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-label-sm ${goalMet ? 'bg-tertiary-container/15 text-tertiary-fixed-dim' : 'bg-surface-variant text-on-surface-variant'}`}>
              {goalMet ? 'Goal Met' : 'Partial'}
            </span>
          </div>
        </div>

        {/* Creation Stat */}
        <div className="bg-surface-container-low rounded-xl p-spacing-md flex flex-col justify-between gap-2 border border-surface-container-high/40">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-on-surface-variant">Created Cards</span>
            <Sparkles size={16} className="text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-secondary font-semibold leading-tight">
              {created}
            </span>
            <span className="font-label-sm text-secondary-fixed-dim mt-0.5">
              created today
            </span>
          </div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-label-sm ${creationMet ? 'bg-secondary-container/15 text-secondary-fixed-dim' : 'bg-surface-variant text-on-surface-variant'}`}>
              {creationMet ? 'Goal Met' : 'Partial'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
