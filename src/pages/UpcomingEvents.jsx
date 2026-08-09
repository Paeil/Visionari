import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../assets/components/layout/DashboardLayout';
import { 
    Plus, Pencil, Trash2, X, TriangleAlert, 
    Clock, MapPin
} from 'lucide-react';
import { supabase } from '../supabaseClient';

// ============================================================
// REUSABLE EVENT FORM COMPONENT
// ============================================================

const EventForm = ({
    eventName, setEventName,
    eventDate, setEventDate,
    eventTime, setEventTime,
    eventLocation, setEventLocation,
    eventType, setEventType,
    eventDesc, setEventDesc
}) => (
    <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Event Name</label>
            <input 
                type="text" 
                value={eventName} 
                onChange={(e) => setEventName(e.target.value)} 
                placeholder="e.g., Annual Gala" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-200 text-gray-800" 
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Date</label>
                <input 
                    type="date" 
                    value={eventDate} 
                    onChange={(e) => setEventDate(e.target.value)} 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-800" 
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Time</label>
                <input 
                    type="text" 
                    value={eventTime} 
                    onChange={(e) => setEventTime(e.target.value)} 
                    placeholder="-- : -- --" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-800" 
                />
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Location</label>
            <input 
                type="text" 
                value={eventLocation} 
                onChange={(e) => setEventLocation(e.target.value)} 
                placeholder="Search venues or address" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-800" 
            />
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Event Category</label>
            <select 
                value={eventType} 
                onChange={(e) => setEventType(e.target.value)} 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white text-gray-800"
            >
                <option value="" disabled>Select category</option>
                <option value="class">Class Event</option>
                <option value="university">University Event</option>
                <option value="individual">Individual Event</option>
            </select>
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Event Description</label>
            <textarea 
                rows="3" 
                value={eventDesc} 
                onChange={(e) => setEventDesc(e.target.value)} 
                placeholder="Brief details about the event..." 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none text-gray-800"
            ></textarea>
        </div>
    </div>
);

export default function UpcomingEvents() {
    const navigate = useNavigate();

    // ==========================================
    // ROLE-BASED ACCESS CONTROL
    // ==========================================
    const userRole = localStorage.getItem('visionari_role') || 'officer';

    // ==========================================
    // STATE: MODALS & EVENTS
    // ==========================================
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [eventToEdit, setEventToEdit] = useState(null);
    const [eventToDelete, setEventToDelete] = useState(null);

    // Form States
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [eventType, setEventType] = useState('');
    const [eventDesc, setEventDesc] = useState('');

    // Load events from Supabase
    const [events, setEvents] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        // 1. INSTANT OFFLINE BYPASS
        if (!navigator.onLine) {
            console.warn('Device is offline. Loading events instantly from cache...');
            const cached = localStorage.getItem('visionari_events_cache');
            if (cached) setEvents(JSON.parse(cached));
            return;
        }

        // 2. ONLINE FETCH
        try {
            const { data, error } = await supabase.from('events').select('*');
            if (error) throw error;
            
            setEvents(data || []);
            if (data) localStorage.setItem('visionari_events_cache', JSON.stringify(data));
        } catch (error) {
            const cached = localStorage.getItem('visionari_events_cache');
            if (cached) setEvents(JSON.parse(cached));
        }
    };

    // ==========================================
    // LOGIC & HELPERS
    // ==========================================
    const formatEventDateBlock = (dateString) => {
        if (!dateString) return { month: '---', day: '--' };
        const dateObj = new Date(`${dateString}T00:00:00`);
        return {
            month: dateObj.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: String(dateObj.getDate()).padStart(2, '0')
        };
    };

    const getCategoryStyles = (type) => {
        switch(type) {
            case 'class': return 'bg-red-100 text-[#B30000]';
            case 'university': return 'bg-gray-200 text-gray-700';
            case 'individual': return 'bg-orange-100 text-[#E65C00]';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getCategoryLabel = (type) => {
        switch(type) {
            case 'class': return 'Class Event';
            case 'university': return 'University Event';
            case 'individual': return 'Individual Event';
            default: return 'Event';
        }
    };

    // Group events by Month and Year for the Timeline Layout
    const groupedEvents = events
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .reduce((acc, event) => {
            if (!event.date) return acc;
            const dateObj = new Date(`${event.date}T00:00:00`);
            const monthYear = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) acc[monthYear] = [];
            acc[monthYear].push(event);
            return acc;
        }, {});

    // Handlers
    const handleAddEvent = async () => {
        if (userRole !== 'officer') return;
        if (!eventName.trim() || !eventDate) return;
        
        const newEvent = {
            id: Date.now(),
            title: eventName,
            date: eventDate,
            time: eventTime,
            location: eventLocation,
            type: eventType,
            description: eventDesc
        };

        try {
            const { error } = await supabase.from('events').insert([newEvent]);
            if (error) throw error;
            
            const updatedEvents = [...events, newEvent];
            setEvents(updatedEvents);
            localStorage.setItem('visionari_events_cache', JSON.stringify(updatedEvents));
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Failed to save event to cloud. Check internet connection.');
        }

        closeAndResetModals();
    };

    const handleSaveEdit = async () => {
        if (userRole !== 'officer') return;
        if (!eventName.trim() || !eventDate) return;

        const updatedFields = {
            title: eventName,
            date: eventDate,
            time: eventTime,
            location: eventLocation,
            type: eventType,
            description: eventDesc
        };

        try {
            const { error } = await supabase
                .from('events')
                .update(updatedFields)
                .eq('id', eventToEdit.id);

            if (error) throw error;

            const updatedEvents = events.map(e => 
                e.id === eventToEdit.id ? { ...e, ...updatedFields } : e
            );
            setEvents(updatedEvents);
            localStorage.setItem('visionari_events_cache', JSON.stringify(updatedEvents));
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Check internet connection.');
        }

        closeAndResetModals();
    };

    const confirmDelete = async () => {
        if (userRole !== 'officer') return;

        try {
            const { error } = await supabase.from('events').delete().eq('id', eventToDelete);
            if (error) throw error;
            
            const updatedEvents = events.filter(e => e.id !== eventToDelete);
            setEvents(updatedEvents);
            localStorage.setItem('visionari_events_cache', JSON.stringify(updatedEvents));
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Check internet connection.');
        }

        closeAndResetModals();
    };

    const openEditModal = (event) => {
        if (userRole !== 'officer') return;
        setEventToEdit(event);
        setEventName(event.title);
        setEventDate(event.date);
        setEventTime(event.time || '');
        setEventLocation(event.location || '');
        setEventType(event.type || '');
        setEventDesc(event.description || '');
        setIsEditModalOpen(true);
    };

    const closeAndResetModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setEventToEdit(null);
        setEventToDelete(null);
        setEventName('');
        setEventDate('');
        setEventTime('');
        setEventLocation('');
        setEventType('');
        setEventDesc('');
    };

    return (
        <DashboardLayout 
            title="Upcoming Events" 
            showBackButton={true}
            rightActions={
                userRole === 'officer' && (
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-[#CC0000] md:px-6 px-3 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span className="hidden md:inline">Add Event</span>
                    </button>
                )
            }
        >

            {/* 
              ============================================
              TIMELINE CONTENT 
              ============================================
            */}
            <div className="w-full max-w-5xl mx-auto pt-6 mt-[30px] md:mt-[40px]">
                {Object.keys(groupedEvents).map((monthYear, index) => (
                    <div key={index} className="relative pl-8 md:pl-0 mb-12">
                        
                        {/* Month Header */}
                        <div className="flex items-center gap-4 mb-6 relative">
                            {/* Timeline Node */}
                            <div className="hidden md:flex absolute -left-[29px] w-4 h-4 bg-[#CC0000]/20 rounded-full items-center justify-center">
                                <div className="w-2 h-2 bg-[#CC0000] rounded-full"></div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">{monthYear}</h2>
                        </div>

                        {/* Event Cards Container */}
                        <div className="flex flex-col gap-5 md:pl-6 md:border-l-2 border-red-100">
                            {groupedEvents[monthYear].map((event) => {
                                const { month, day } = formatEventDateBlock(event.date);
                                
                                return (
                                    <div key={event.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative group">
                                        
                                        {/* Date Block */}
                                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl w-20 h-20 shrink-0 border border-gray-100">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{month}</span>
                                            <span className="text-2xl font-bold text-[#CC0000] leading-none mt-1">{day}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${getCategoryStyles(event.type)}`}>
                                                    {getCategoryLabel(event.type)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-500 mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={16} /> {event.time || 'TBA'}
                                                </div>
                                                <span className="hidden md:block">•</span>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={16} /> {event.location || 'TBA'}
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 leading-relaxed pr-8">
                                                {event.description}
                                            </p>
                                        </div>

                                        {/* Action Buttons - Officers Only */}
                                        {userRole === 'officer' && (
                                            <div className="absolute top-6 right-6 flex items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(event)} className="text-gray-400 hover:text-gray-800 transition-colors">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => { setEventToDelete(event.id); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-[#CC0000] transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ============================================
                MODAL: ADD EVENT (Officers Only)
                ============================================ */}
            {userRole === 'officer' && isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAndResetModals}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Add New Event</h2>
                            <button onClick={closeAndResetModals} className="text-gray-400 hover:text-gray-800"><X size={24} /></button>
                        </div>
                        
                        <EventForm 
                            eventName={eventName} setEventName={setEventName}
                            eventDate={eventDate} setEventDate={setEventDate}
                            eventTime={eventTime} setEventTime={setEventTime}
                            eventLocation={eventLocation} setEventLocation={setEventLocation}
                            eventType={eventType} setEventType={setEventType}
                            eventDesc={eventDesc} setEventDesc={setEventDesc}
                        />

                        <div className="p-6 pt-4 flex justify-end gap-3 bg-white border-t border-gray-50">
                            <button onClick={closeAndResetModals} className="px-6 py-2.5 rounded-xl border border-gray-200 text-[#CC0000] font-bold hover:bg-red-50 transition-colors">Cancel</button>
                            <button onClick={handleAddEvent} className="px-6 py-2.5 rounded-xl bg-[#CC0000] text-white font-bold flex items-center gap-2 hover:bg-red-800 transition-colors shadow-sm">
                                <Plus size={18} strokeWidth={3} /> Add Event
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                MODAL: EDIT EVENT (Officers Only)
                ============================================ */}
            {userRole === 'officer' && isEditModalOpen && eventToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAndResetModals}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
                            <button onClick={closeAndResetModals} className="text-gray-400 hover:text-gray-800"><X size={24} /></button>
                        </div>
                        
                        <EventForm 
                            eventName={eventName} setEventName={setEventName}
                            eventDate={eventDate} setEventDate={setEventDate}
                            eventTime={eventTime} setEventTime={setEventTime}
                            eventLocation={eventLocation} setEventLocation={setEventLocation}
                            eventType={eventType} setEventType={setEventType}
                            eventDesc={eventDesc} setEventDesc={setEventDesc}
                        />

                        <div className="p-6 pt-4 flex justify-end gap-3 bg-white border-t border-gray-50">
                            <button onClick={closeAndResetModals} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-sm">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                MODAL: DELETE CONFIRMATION (Officers Only)
                ============================================ */}
            {userRole === 'officer' && isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAndResetModals}></div>
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <TriangleAlert size={32} className="text-[#CC0000]" strokeWidth={2.5} />
                            <h2 className="text-3xl font-bold text-gray-900">Delete Event?</h2>
                        </div>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to delete this event? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={closeAndResetModals} className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-lg">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} className="flex-1 py-3.5 rounded-xl bg-[#B30000] text-white font-bold hover:bg-red-900 transition-colors text-lg shadow-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}