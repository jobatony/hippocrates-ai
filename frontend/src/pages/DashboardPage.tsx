import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { CircularProgress } from '../components/CircularProgress';
import { ActivityCalendar } from '../components/ActivityCalendar';
import { DayDetailPanel } from '../components/DayDetailPanel';
import { useStore } from '../store/useStore';
import { fetchDashboardStats } from '../api';
import { PlayCircle, Flame, BadgeCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, setDashboardStats, currentUser } = useStore();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  });
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardStats()
      .then(stats => setDashboardStats(stats))
      .catch(err => console.error("Failed to load dashboard stats", err));
  }, [setDashboardStats]);

  if (!dashboardStats) {
    return (
      <div className="bg-surface min-h-screen text-on-surface">
        <TopNav />
        <div className="pt-20 flex justify-center items-center h-screen">
          <span className="font-title-lg animate-pulse text-secondary">Loading your clinical dashboard...</span>
        </div>
      </div>
    );
  }

  const {
    reviewed_today, review_streak_minimum,
    created_today, creation_streak_minimum,
    longest_review_streak, current_review_streak,
    monthly_activity, due_count
  } = dashboardStats;

  const reviewPercent = Math.min(100, Math.round((reviewed_today / review_streak_minimum) * 100));
  const creationPercent = Math.min(100, Math.round((created_today / creation_streak_minimum) * 100));

  const todayStr = new Date().toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = currentUser?.first_name || '';

  const handleMonthChange = (delta: -1 | 1) => {
    setCalendarMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + delta);
      return next;
    });
  };

  const selectedActivity = monthly_activity.find(a => a.date === selectedDate) || null;

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <TopNav />
      <main className="w-full pt-20 pb-10">
        <div className="flex flex-col w-full px-spacing-xl pb-spacing-3xl gap-spacing-2xl max-w-7xl mx-auto">
          
          {/* Greeting Section */}
          <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-spacing-xl pt-spacing-lg">
            <div className="flex flex-col gap-spacing-xs">
              <h1 className="font-display-sm text-display-sm text-on-surface tracking-tight">
                Hello{firstName ? `, ${firstName}` : ''} <span className="inline-block animate-bounce">👋</span>
              </h1>
              <p className="font-title-md text-title-md text-on-surface-variant flex items-center gap-2">
                📅 {todayStr}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-spacing-md">
              <button 
                onClick={() => navigate('/quiz')}
                className="group flex items-center gap-3 px-6 h-14 py-3 rounded-xl bg-primary-container text-on-primary-fixed font-title-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary-container/10"
              >
                <PlayCircle className="text-xl transition-transform group-hover:scale-110" />
                <span className="tracking-wide">Resume Daily Review <span className="opacity-75 font-normal text-xs ml-1">({due_count} due)</span></span>
              </button>
            </div>
          </section>

          {/* Metric Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-lg">
            
            {/* Daily Goal */}
            <div className="bg-surface-container rounded-2xl p-spacing-xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="flex flex-col gap-spacing-xs">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Daily Goal Progress</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-headline-lg text-headline-lg text-primary">{reviewed_today}</span>
                  <span className="font-title-lg text-title-lg text-on-surface-variant">/ {review_streak_minimum}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">questions mastered today ({reviewPercent}%)</p>
              </div>
              <CircularProgress percent={reviewPercent} label={`${reviewPercent}%`} />
            </div>

            {/* Due Cards */}
            <div className="bg-surface-container rounded-2xl p-spacing-xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="flex flex-col gap-spacing-xs">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Cards Due Today</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-headline-lg text-headline-lg text-error">{due_count}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">questions waiting for review</p>
              </div>
            </div>

            {/* Questions Created */}
            <div className="bg-surface-container rounded-2xl p-spacing-xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="flex flex-col gap-spacing-xs">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Questions Created</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-headline-lg text-headline-lg text-primary">{created_today}</span>
                  <span className="font-title-lg text-title-lg text-on-surface-variant">/ {creation_streak_minimum}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">questions added today ({creationPercent}%)</p>
              </div>
              <CircularProgress percent={creationPercent} label={`${creationPercent}%`} />
            </div>

            {/* Streak */}
            <div className="bg-surface-container rounded-2xl p-spacing-xl flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Learning Streak</span>
                <div className="w-9 h-9 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
                  <Flame size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display-sm text-display-sm text-tertiary-container tracking-tight">{current_review_streak}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary-fixed-dim">Current</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display-sm text-display-sm text-outline tracking-tight opacity-70">{longest_review_streak}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-outline">Record</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-outline mt-2 flex items-center gap-1.5">
                  <BadgeCheck size={14} className="text-tertiary-fixed-dim" />
                  Keep mastering questions to extend your streak
                </p>
              </div>
            </div>

          </section>

          {/* Calendar & Day Detail */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-spacing-xl items-start">
            <div className="lg:col-span-8">
              <ActivityCalendar 
                activity={monthly_activity} 
                month={calendarMonth} 
                onMonthChange={handleMonthChange}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
            <div className="lg:col-span-4">
              <DayDetailPanel 
                date={selectedDate} 
                activity={selectedActivity} 
                goalMet={selectedActivity?.streak_met || false}
              />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

