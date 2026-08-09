import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../assets/components/layout/DashboardLayout';
import { supabase } from '../supabaseClient';

import {
    GraduationCap,
    ChevronRight,
    AlertCircle,
    ListPlus,
    FileText,
    Landmark,
    Check,
    MoreVertical,
    CalendarDays as CalendarIcon,
    ChevronLeft,
    Maximize2,
    X,
    MapPin,
} from 'lucide-react';

// ============================================================
// STATIC SCHEDULE DATA
// ============================================================

const FULL_SCHEDULE_DATA = {
    BA: [
        { code: 'CIS 221', desc: 'Analytics Application', lec: 2, lab: 1, units: 3, sched: 'M 03:00PM-06:00PM ICT 206 / F 10:00AM-12:00PM ICT 301' },
        { code: 'CIS 216', desc: 'Business Intelligence', lec: 2, lab: 1, units: 3, sched: 'M 10:00AM-12:00PM ICT 106 / W 10:00AM-01:00PM ICT 206' },
        { code: 'CIS 213', desc: 'Evaluation of Business Performance', lec: 3, lab: 0, units: 3, sched: 'T 02:30PM-04:00PM ICT 201 / TH 02:30PM-04:00PM ICT 201' },
        { code: 'CC 209', desc: 'Seminars and Field Study', lec: 3, lab: 0, units: 3, sched: 'T 04:00PM-05:30PM ICT 106 / TH 04:00PM-05:30PM ICT 106' },
        { code: 'CIS 212', desc: 'Thesis Writing for IS 2', lec: 3, lab: 0, units: 3, sched: 'T 01:00PM-02:30PM ICT 202 / TH 01:00PM-02:30PM ICT 202' },
    ],

    BAD: [
        { code: 'CIS 216', desc: 'Business Intelligence', lec: 2, lab: 1, units: 3, sched: 'M 10:00AM-12:00PM ICT 106 / W 10:00AM-01:00PM ICT 206' },
        { code: 'CIS 213', desc: 'Evaluation of Business Performance', lec: 3, lab: 0, units: 3, sched: 'T 02:30PM-04:00PM ICT 201 / TH 02:30PM-04:00PM ICT 201' },
        { code: 'CC 209', desc: 'Seminars and Field Study', lec: 3, lab: 0, units: 3, sched: 'T 04:00PM-05:30PM ICT 106 / TH 04:00PM-05:30PM ICT 106' },
        { code: 'CIS 229', desc: 'Systems Infrastructure and Integration', lec: 3, lab: 0, units: 3, sched: 'M 02:30PM-04:00PM ICT 107 / W 02:30PM-04:00PM ICT 107' },
        { code: 'CIS 212', desc: 'Thesis Writing for IS 2', lec: 3, lab: 0, units: 3, sched: 'T 01:00PM-02:30PM ICT 202 / TH 01:00PM-02:30PM ICT 202' },
    ],
};

const DAILY_SCHEDULE_DATA = {
    BA: {
        Monday: [
            { time: '10:00 AM - 12:00 PM', code: 'CIS 216', room: 'ICT 106' },
            { time: '03:00 PM - 06:00 PM', code: 'CIS 221', room: 'ICT 206' },
        ],
        Tuesday: [
            { time: '01:00 PM - 02:30 PM', code: 'CIS 212', room: 'ICT 202' },
            { time: '02:30 PM - 04:00 PM', code: 'CIS 213', room: 'ICT 201' },
            { time: '04:00 PM - 05:30 PM', code: 'CC 209', room: 'ICT 106' },
        ],
        Wednesday: [
            { time: '10:00 AM - 01:00 PM', code: 'CIS 216', room: 'ICT 206' },
        ],
        Thursday: [
            { time: '01:00 PM - 02:30 PM', code: 'CIS 212', room: 'ICT 202' },
            { time: '02:30 PM - 04:00 PM', code: 'CIS 213', room: 'ICT 201' },
            { time: '04:00 PM - 05:30 PM', code: 'CC 209', room: 'ICT 106' },
        ],
        Friday: [
            { time: '10:00 AM - 12:00 PM', code: 'CIS 221', room: 'ICT 301' },
        ],
    },

    BAD: {
        Monday: [
            { time: '10:00 AM - 12:00 PM', code: 'CIS 216', room: 'ICT 106' },
            { time: '02:30 PM - 04:00 PM', code: 'CIS 229', room: 'ICT 107' },
        ],
        Tuesday: [
            { time: '01:00 PM - 02:30 PM', code: 'CIS 212', room: 'ICT 202' },
            { time: '02:30 PM - 04:00 PM', code: 'CIS 213', room: 'ICT 201' },
            { time: '04:00 PM - 05:30 PM', code: 'CC 209', room: 'ICT 106' },
        ],
        Wednesday: [
            { time: '10:00 AM - 01:00 PM', code: 'CIS 216', room: 'ICT 206' },
            { time: '02:30 PM - 04:00 PM', code: 'CIS 229', room: 'ICT 107' },
        ],
        Thursday: [
            { time: '01:00 PM - 02:30 PM', code: 'CIS 212', room: 'ICT 202' },
            { time: '02:30 PM - 04:00 PM', code: 'CIS 213', room: 'ICT 201' },
            { time: '04:00 PM - 05:30 PM', code: 'CC 209', room: 'ICT 106' },
        ],
        Friday: [],
    },
};

// ============================================================
// COMPONENT
// ============================================================

export default function DashboardHome() {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('visionari_role') || 'officer';

    const [daysRemaining, setDaysRemaining] = useState(0);
    const [progress, setProgress] = useState(0);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMajor, setSelectedMajor] = useState('BA');
    const [todayWeekday, setTodayWeekday] = useState('');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);

    // ========================================================
    // AGGRESSIVE OFFLINE DATA FETCHING
    // ========================================================
    useEffect(() => {
        const fetchDashboardData = async () => {
        // 1. INSTANT OFFLINE BYPASS
        if (!navigator.onLine) {
            console.warn('Device is offline. Loading Dashboard instantly from cache...');
            const cachedTasks = localStorage.getItem('visionari_tasks_cache');
            if (cachedTasks) setTasks(JSON.parse(cachedTasks));

            const cachedEvents = localStorage.getItem('visionari_events_cache');
            if (cachedEvents) setEvents(JSON.parse(cachedEvents));
            return; // Stop here, skip Supabase!
        }

        // 2. ONLINE FETCH
        try {
            const [tasksResponse, eventsResponse] = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('events').select('*')
            ]);

            if (tasksResponse.error || eventsResponse.error) throw new Error("Fetch failed");

            if (tasksResponse.data) {
                setTasks(tasksResponse.data);
                localStorage.setItem('visionari_tasks_cache', JSON.stringify(tasksResponse.data));
            }
            if (eventsResponse.data) {
                setEvents(eventsResponse.data);
                localStorage.setItem('visionari_events_cache', JSON.stringify(eventsResponse.data));
            }
        } catch (error) {
            const cachedTasks = localStorage.getItem('visionari_tasks_cache');
            if (cachedTasks) setTasks(JSON.parse(cachedTasks));

            const cachedEvents = localStorage.getItem('visionari_events_cache');
            if (cachedEvents) setEvents(JSON.parse(cachedEvents));
        }
    };

        fetchDashboardData();
    }, []);

    // ========================================================
    // GRADUATION COUNTDOWN
    // ========================================================
    useEffect(() => {
        const startDate = new Date('2026-08-03T00:00:00');
        const graduationDate = new Date('2027-06-09T00:00:00');

        const calculateCountdown = () => {
            const today = new Date();
            const timeDifference = graduationDate.getTime() - today.getTime();
            const days = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

            const totalDuration = graduationDate.getTime() - startDate.getTime();
            const elapsedDuration = today.getTime() - startDate.getTime();
            
            let percentage = (elapsedDuration / totalDuration) * 100;
            if (percentage < 0) percentage = 0;
            if (percentage > 100) percentage = 100;

            setDaysRemaining(days > 0 ? days : 0);
            setProgress(Math.floor(percentage));
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000 * 60 * 60);

        const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setTodayWeekday(weekday);

        return () => clearInterval(interval);
    }, []);

    const priorityTasks = tasks.filter(task => task.category?.toLowerCase() === 'priority');
    const secondaryTasks = tasks.filter(task => task.category?.toLowerCase() === 'secondary');

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const daysInMonthArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
    const trailingDaysArray = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1);

    const actualToday = new Date();
    const isCurrentMonthView = actualToday.getMonth() === month && actualToday.getFullYear() === year;

    const scheduleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const renderIcon = (type, isCompleted) => {
        if (isCompleted) return <Check size={20} />;
        switch (type) {
            case 'landmark': return <Landmark size={20} />;
            case 'file':
            default: return <FileText size={20} />;
        }
    };

    const getEventTheme = (type) => {
        switch (type) {
            case 'class': return { bg: 'bg-[#B30000]', text: 'text-white', dot: 'bg-white' };
            case 'university': return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-400' };
            case 'individual': return { bg: 'bg-orange-50', text: 'text-[#E65C00]', dot: 'bg-[#E65C00]' };
            default: return { bg: 'bg-transparent', text: 'text-gray-700', dot: 'bg-transparent' };
        }
    };

    const formatEventDate = (dateString) => {
        if (!dateString) return { month: '---', day: '--' };
        const dateObj = new Date(`${dateString}T00:00:00`);
        const monthName = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
        const day = String(dateObj.getDate()).padStart(2, '0');
        return { month: monthName, day };
    };

    return (
        <DashboardLayout 
            title="Overview" 
            showBackButton={false}
        >
            <div className="flex flex-col w-full gap-6 -mt-4 md:mt-4">

                <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm h-[540px] w-full flex flex-col border border-gray-50">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h2 className="text-xl font-bold text-gray-900">Task Management</h2>
                                <button
                                    type="button"
                                    onClick={() => navigate('/tasks')}
                                    className="text-[#CC0000] text-sm font-semibold flex items-center hover:underline whitespace-nowrap"
                                >
                                    View All
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 flex-1 min-h-0">
                                <div className="flex flex-col w-full min-h-0 h-full">
                                    <div className="flex justify-between items-center mb-4 shrink-0">
                                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                                            <AlertCircle size={20} className="text-[#CC0000]" strokeWidth={2.5} />
                                            Priority
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
                                        {priorityTasks.length > 0 ? (
                                            priorityTasks.map((task) => {
                                                const isCompleted = task.status === 'completed';
                                                return (
                                                    <div key={task.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors group w-full shrink-0 ${isCompleted ? 'bg-gray-50 border-gray-50 shadow-none' : 'border-gray-100 shadow-sm hover:border-red-200'}`}>
                                                        <div className={`flex items-center gap-4 min-w-0 flex-1 ${isCompleted ? 'opacity-50' : ''}`}>
                                                            <div className={`p-2.5 rounded-xl shrink-0 ${isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-red-50 text-[#CC0000]'}`}>
                                                                {renderIcon(task.iconType, isCompleted)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className={`text-sm font-medium block truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                                    {task.title}
                                                                </span>
                                                                {task.date && (
                                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                                        Due: {new Date(`${task.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {userRole === 'officer' && (
                                                            <button type="button" onClick={() => navigate('/tasks')} className="text-gray-300 hover:text-gray-500 shrink-0 ml-2">
                                                                <MoreVertical size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex items-center justify-center flex-1 text-sm text-gray-400">No priority tasks yet.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col w-full min-h-0 h-full">
                                    <div className="flex justify-between items-center mb-4 shrink-0">
                                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                                            <ListPlus size={20} className="text-[#E65C00]" strokeWidth={2.5} />
                                            Secondary
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
                                        {secondaryTasks.length > 0 ? (
                                            secondaryTasks.map((task) => {
                                                const isCompleted = task.status === 'completed';
                                                return (
                                                    <div key={task.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors group w-full shrink-0 ${isCompleted ? 'bg-gray-50 border-gray-50 shadow-none' : 'border-gray-100 shadow-sm hover:border-orange-200'}`}>
                                                        <div className={`flex items-center gap-4 min-w-0 flex-1 ${isCompleted ? 'opacity-50' : ''}`}>
                                                            <div className={`p-2.5 rounded-xl shrink-0 ${isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-orange-50 text-[#E65C00]'}`}>
                                                                {renderIcon(task.iconType, isCompleted)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className={`text-sm font-medium block truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                                    {task.title}
                                                                </span>
                                                                {task.date && (
                                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                                        Due: {new Date(`${task.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {userRole === 'officer' && (
                                                            <button type="button" onClick={() => navigate('/tasks')} className="text-gray-300 hover:text-gray-500 shrink-0 ml-2">
                                                                <MoreVertical size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex items-center justify-center flex-1 text-sm text-gray-400">No secondary tasks yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 h-[540px] flex flex-col">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 shrink-0">
                                <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
                            </div>

                            <div className="flex flex-col gap-4 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-gray-200">
                                {events.length > 0 ? (
                                    events
                                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                                        .map((event) => {
                                            const formattedDate = formatEventDate(event.date);
                                            const theme = getEventTheme(event.type);

                                            return (
                                                <div key={event.id} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors bg-white shadow-sm shrink-0">
                                                    <div className={`flex flex-col items-center justify-center rounded-xl w-14 h-14 shrink-0 ${theme.bg} ${theme.text}`}>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{formattedDate.month}</span>
                                                        <span className="text-lg font-bold leading-none mt-0.5">{formattedDate.day}</span>
                                                    </div>
                                                    <div className="flex flex-col justify-center min-w-0 flex-1">
                                                        <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{event.title}</h3>
                                                        <p className="text-xs font-medium text-gray-400 truncate">
                                                            {event.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                ) : (
                                    <div className="flex items-center justify-center flex-1 text-sm text-gray-400">No upcoming events.</div>
                                )}
                            </div>

                            <div className="pt-4 mt-4 border-t border-gray-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => navigate('/events')}
                                    className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-[#CC0000] hover:text-[#CC0000] transition-colors flex items-center justify-center gap-2"
                                >
                                    View All Events
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="order-2 md:order-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col h-full w-full border border-gray-50 overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
                                    <p className="text-xs font-medium text-gray-400 mt-1">1st Semester, SY 2026-2027</p>
                                </div>

                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="flex bg-gray-100 p-1 rounded-full">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMajor('BA')}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedMajor === 'BA' ? 'bg-white text-[#CC0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            BA Majors
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMajor('BAD')}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedMajor === 'BAD' ? 'bg-white text-[#CC0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            BAD Majors
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsScheduleModalOpen(true)}
                                        className="text-gray-400 hover:text-[#CC0000] transition-colors p-1"
                                        title="View Full Table"
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 flex-1">
                                <div className="min-w-[800px] grid grid-cols-5 gap-3 h-full">
                                    {scheduleDays.map((day) => {
                                        const dayClasses = DAILY_SCHEDULE_DATA[selectedMajor][day] || [];
                                        const isToday = day === todayWeekday;

                                        return (
                                            <div key={day} className={`flex flex-col gap-3 rounded-2xl p-3 ${isToday ? 'bg-red-50/20 border border-red-100' : 'bg-transparent'}`}>
                                                <h3 className={`text-sm font-bold border-b pb-2 ${isToday ? 'text-[#CC0000] border-red-100' : 'text-gray-900 border-gray-100'}`}>
                                                    {day}
                                                    {isToday && (
                                                        <span className="ml-2 text-[10px] font-bold bg-[#CC0000] text-white px-2 py-0.5 rounded-full">TODAY</span>
                                                    )}
                                                </h3>

                                                {dayClasses.length > 0 ? (
                                                    <div className="flex flex-col gap-3">
                                                        {dayClasses.map((cls, idx) => (
                                                            <div key={idx} className="bg-white border border-gray-100 p-3.5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-red-200 hover:shadow-md transition-all">
                                                                <div className="font-bold text-[#CC0000] text-sm mb-1">{cls.code}</div>
                                                                <div className="text-[11px] font-semibold text-gray-500 mb-2 leading-tight bg-gray-50 inline-block px-2 py-1 rounded-md">{cls.time}</div>
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                                    <MapPin size={12} className="text-gray-300" /> {cls.room}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-4 opacity-50 min-h-[100px]">
                                                        <span className="text-xs font-bold text-gray-400">Free Day</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4 shrink-0">
                                <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
                                <button
                                    type="button"
                                    onClick={() => setCurrentDate(new Date())}
                                    className="bg-red-50 p-2 rounded-full text-[#B30000] hover:bg-red-100 transition-colors"
                                    title="Go to Today"
                                >
                                    <CalendarIcon size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className="text-base font-bold text-gray-800">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex gap-1 text-gray-400">
                                    <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-y-4 text-center mb-6 flex-1">
                                {weekDays.map((day, idx) => (
                                    <div key={`wd-${idx}`} className="text-xs font-semibold text-gray-400 mb-2">{day}</div>
                                ))}

                                {trailingDaysArray.map((day, i) => (
                                    <div key={`trail-${i}`} className="text-gray-300 font-medium">{day}</div>
                                ))}

                                {daysInMonthArray.map((day) => {
                                    const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayEvent = events.find((event) => event.date === dayString);
                                    const isActualToday = isCurrentMonthView && day === actualToday.getDate();

                                    let wrapperClass = 'w-9 h-9 flex flex-col items-center justify-center rounded-full mx-auto relative text-gray-800 font-medium hover:bg-gray-100 transition-colors cursor-pointer';
                                    let dotClass = 'hidden';

                                    if (dayEvent) {
                                        const theme = getEventTheme(dayEvent.type);
                                        wrapperClass = `w-9 h-9 flex flex-col items-center justify-center rounded-full mx-auto relative font-medium ${theme.bg} ${theme.text} transition-colors cursor-pointer`;
                                        dotClass = `w-1 h-1 rounded-full absolute bottom-1.5 ${theme.dot}`;
                                    } else if (isActualToday) {
                                        wrapperClass = `w-9 h-9 flex flex-col items-center justify-center rounded-full mx-auto relative font-bold bg-gray-900 text-white shadow-md transition-colors cursor-pointer`;
                                    }

                                    return (
                                        <div key={day} className="flex justify-center">
                                            <button type="button" className={wrapperClass} title={dayEvent ? dayEvent.title : undefined}>
                                                <span className="text-sm mt-0.5">{day}</span>
                                                {dayEvent && <div className={dotClass} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#B30000]" />
                                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">CLASS</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">UNIVERSITY</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#E65C00]" />
                                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">INDIVIDUAL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="bg-gradient-to-r from-[#d60000] to-[#cc4e04] text-white rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full mt-6">
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div className="bg-white/10 p-3 sm:p-4 rounded-full border border-white/20 shrink-0">
                        <GraduationCap size={36} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-white/80 text-xs font-bold tracking-[0.15em] uppercase mb-1">Days Until Graduation</p>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{daysRemaining} Days Remaining</h2>
                    </div>
                </div>

                <div className="flex flex-col w-full md:w-[40%] shrink-0">
                    <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-white/90">Progress to June 9, 2027</span>
                        <span className="font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden border border-white/10">
                        <div
                            className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)} />
                    <div className="relative bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 sm:p-8 border-b border-gray-100 bg-white z-10 shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Official Class Schedule</h2>
                                <p className="text-sm font-medium text-gray-500 mt-1">4th Year • 1st Semester, SY 2026-2027</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex bg-gray-100 p-1 rounded-full mr-2">
                                    <button type="button" onClick={() => setSelectedMajor('BA')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedMajor === 'BA' ? 'bg-white text-[#CC0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                        BA Majors
                                    </button>
                                    <button type="button" onClick={() => setSelectedMajor('BAD')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedMajor === 'BAD' ? 'bg-white text-[#CC0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                        BAD Majors
                                    </button>
                                </div>
                                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto bg-gray-50 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
                                <table className="w-full min-w-[700px] text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                            <th className="p-4 pl-6 font-bold w-32">Subject Code</th>
                                            <th className="p-4 font-bold">Description</th>
                                            <th className="p-4 text-center font-bold w-24">Units</th>
                                            <th className="p-4 pr-6 font-bold w-[35%]">Schedule & Room</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {FULL_SCHEDULE_DATA[selectedMajor].map((subject, i) => (
                                            <tr key={i} className="hover:bg-red-50/30 transition-colors">
                                                <td className="p-4 pl-6 font-bold text-gray-900 whitespace-nowrap">{subject.code}</td>
                                                <td className="p-4 font-medium text-gray-700">{subject.desc}</td>
                                                <td className="p-4 text-center">
                                                    <span className="bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-lg text-xs">{subject.units}</span>
                                                </td>
                                                <td className="p-4 pr-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        {subject.sched.split(' / ').map((timeBlock, bIdx) => {
                                                            const parts = timeBlock.split('ICT ');
                                                            return (
                                                                <div key={bIdx} className="flex items-center justify-between text-xs font-bold text-gray-600 bg-white border border-gray-200 p-2 rounded-lg w-full max-w-[280px] shadow-sm">
                                                                    <span>{parts[0]}</span>
                                                                    {parts[1] && <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1"><MapPin size={10} /> ICT {parts[1]}</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}