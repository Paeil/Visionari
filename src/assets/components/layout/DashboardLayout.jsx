import React, { useState, useEffect } from 'react';
import { LayoutGrid, Settings, ChevronDown, LogOut, ArrowLeft, Plus, Download, Megaphone, Copy, Check, X, RefreshCw, Lock, Eye, EyeOff, Menu, BellRing } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../layout/Lowgow2.png';
import { supabase } from '../../../supabaseClient';
import { getToken } from "firebase/messaging";
import { messaging } from '../../../firebaseClient';

export default function DashboardLayout({ 
    children, 
    title = "Overview", 
    showBackButton = false, 
    rightActions = null 
}) {
    const navigate = useNavigate();
    const location = useLocation();
    
    // ========================================================
    // ROLE-BASED ACCESS CONTROL (RBAC)
    // ========================================================
    const userRole = localStorage.getItem('visionari_role') || 'officer'; 

    // States for Authentication Modal
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [officerPassword, setOfficerPassword] = useState('');
    const [authError, setAuthError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // States for Dropdown, Modals, and Menus
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [announcementText, setAnnouncementText] = useState('');
    const [copied, setCopied] = useState(false);
    
    // State for the Notification Modal
    const [showNotifModal, setShowNotifModal] = useState(false);

    // ========================================================
    // NOTIFICATION LOGIC
    // ========================================================
    useEffect(() => {
        // Check if the user has already answered the prompt
        const hasSeenPrompt = localStorage.getItem("hasSeenNotifPrompt");
        
        // If they haven't seen it, show the modal after a short 2-second delay
        if (!hasSeenPrompt) {
            setTimeout(() => setShowNotifModal(true), 2000);
        }
    }, []);

    const handleDismissModal = () => {
        // Save their choice so it never pops up again
        localStorage.setItem("hasSeenNotifPrompt", "true");
        setShowNotifModal(false);
    };

    const enableNotifications = async () => {
        try {
            // 1. Ask the browser for permission
            const permission = await Notification.requestPermission();
            
            if (permission === "granted") {
                // 2. Get the token from Firebase
                const token = await getToken(messaging, { 
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
                });
                
                if (token) {
                    // 3. Save the token securely to Supabase
                    const { error } = await supabase
                        .from('push_tokens')
                        .upsert([{ token }], { onConflict: 'token' });
                    
                    if (error) throw error;
                    alert("Notifications enabled! You will now receive alerts for new events.");
                    
                    // 4. Save preference and close modal
                    localStorage.setItem("hasSeenNotifPrompt", "true");
                    setShowNotifModal(false);
                }
            } else {
                alert("Notification permission was denied.");
                localStorage.setItem("hasSeenNotifPrompt", "true");
                setShowNotifModal(false);
            }
        } catch (error) {
            console.error("Error setting up notifications:", error);
        }
    };

    // ========================================================
    // HANDLERS
    // ========================================================
    const handleSwitchRoleClick = () => {
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
        if (userRole === 'officer') {
            localStorage.setItem('visionari_role', 'student');
            window.location.reload();
        } else {
            setOfficerPassword('');
            setAuthError(false);
            setShowPassword(false);
            setIsAuthModalOpen(true);
        }
    };

    const verifyOfficerPassword = (e) => {
        e.preventDefault();
        if (officerPassword === 'Visionari_ISA_27') {
            localStorage.setItem('visionari_role', 'officer');
            window.location.reload();
        } else {
            setAuthError(true);
        }
    };

    const handleLogoutClick = () => {
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
        setIsLogoutModalOpen(true);     
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        navigate('/'); 
    };

    // ========================================================
    // ANNOUNCEMENT GENERATOR LOGIC
    // ========================================================
    const handleOpenAnnouncement = async () => {
        try {
            const { data: dbTasks } = await supabase.from('tasks').select('*');
            const { data: dbEvents } = await supabase.from('events').select('*');
            
            const tasks = dbTasks || [];
            const events = dbEvents || [];

            const priorityTasks = tasks.filter(t => t.category?.toLowerCase() === 'priority');
            const secondaryTasks = tasks.filter(t => t.category?.toLowerCase() === 'secondary');

            const formattedEvents = events.map(e => `  - ${e.title} | ${e.date}${e.time ? ` (${e.time})` : ''}`).join('\n');
            const formattedPrio = priorityTasks.map((t, idx) => 
                `${idx + 1}. ${t.title}${t.date ? ` (Due: ${t.date})` : ''}\n    - ${t.description || 'No details provided.'}`
            ).join('\n\n');
            const formattedSec = secondaryTasks.map((t, idx) => 
                `${idx + 1}. ${t.title}${t.date ? ` (Due: ${t.date})` : ''}\n    - ${t.description || 'No details provided.'}`
            ).join('\n\n');

            const template = `@everyone@everyone@everyone\n\n𝐀𝐧𝐧𝐨𝐮𝐧𝐜𝐞𝐦𝐞𝐧𝐭\n\n𝐒𝐚𝐯𝐞 𝐓𝐡𝐞 𝐃𝐚𝐭𝐞!\n${formattedEvents || '  - No upcoming events scheduled.'}\n\n𝐓𝐨 𝐃𝐨:\n\n𝐏𝐑𝐈𝐎 𝐓𝐀𝐒𝐊𝐒\n${formattedPrio || '1. None at the moment.'}\n\n𝐒𝐄𝐂𝐎𝐍𝐃𝐀𝐑𝐘 𝐓𝐀𝐒𝐊𝐒\n${formattedSec || '1. None at the moment.'}\n\n𝐑𝐎𝐔𝐓𝐈𝐍𝐄 𝐓𝐀𝐒𝐊𝐒\n1. 𝐂𝐋𝐀𝐒𝐒𝐑𝐎𝐎𝐌 𝐅𝐔𝐍𝐃𝐒\n\n𝐊𝐢𝐭𝐚𝐤𝐢𝐭𝐬`;

            setAnnouncementText(template);
            setCopied(false);
            setIsAnnouncementModalOpen(true);
        } catch (error) {
            console.error("Failed to generate announcement:", error);
            alert("Error loading tasks or events for announcement.");
        }
    };

    const handleCopyClipboard = () => {
        navigator.clipboard.writeText(announcementText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    // ========================================================
    // PDF BACKUP GENERATOR
    // ========================================================
    const handleBackup = async () => {
        try {
            const { data: dbTasks } = await supabase.from('tasks').select('*');
            const { data: dbEvents } = await supabase.from('events').select('*');
            
            const tasks = dbTasks || [];
            const events = dbEvents || [];

            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(204, 0, 0);
            doc.text("VISIONARI", 14, 20);

            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text("Dashboard Data Backup", 14, 28);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Task Directory", 14, 48);

            const taskBody = tasks.map(t => [t.title || 'N/A', t.date || 'No Date', t.category || 'N/A', t.course || 'N/A', t.description || 'N/A']);
            autoTable(doc, {
                startY: 53,
                head: [['Task Name', 'Due Date', 'Priority', 'Category/Course', 'Description']],
                body: taskBody,
                headStyles: { fillColor: [204, 0, 0] },
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: { 4: { cellWidth: 70 } },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });

            let finalY = doc.lastAutoTable.finalY || 53; 
            
            doc.setFontSize(14);
            doc.text("Upcoming Events", 14, finalY + 15);

            const eventBody = events.map(e => [e.title || 'N/A', e.date || 'No Date', e.time || 'N/A', e.type ? e.type.toUpperCase() : 'N/A', e.location || 'N/A']);
            autoTable(doc, {
                startY: finalY + 20,
                head: [['Event Name', 'Date', 'Time', 'Category', 'Location']],
                body: eventBody,
                headStyles: { fillColor: [204, 0, 0] },
                styles: { fontSize: 9, cellPadding: 4 },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });

            const dateStr = new Date().toISOString().split('T')[0];
            doc.save(`visionari_backup_${dateStr}.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF backup:", error);
            alert("Sorry, there was an error generating your PDF backup file.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7F9] relative font-sans w-full overflow-x-hidden">
            
            {/* RED HEADER BACKDROP */}
            <div className={`absolute top-0 left-0 w-full bg-gradient-to-r from-[#d60000] to-[#cc4e04] rounded-b-[40px] z-0 transition-all duration-300 ${showBackButton ? 'h-[230px]' : 'h-[320px]'}`}></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                
                {/* TOP NAVIGATION BAR */}
                <nav className="flex justify-between items-center px-4 md:px-10 py-6 gap-2">
                    
                    {/* Left: Logo Area */}
                    <div className="flex items-center gap-2 md:gap-3 text-white cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
                        <img 
                            src={logoImage} 
                            alt="Visionari Logo" 
                            className="w-8 h-8 object-contain shrink-0" 
                        />
                        <span className="hidden md:block text-2xl font-bold tracking-[0.15em] mt-1">VISIONARI</span>
                    </div>

                    {/* Center: Navigation Pills */}
                    <div className="flex flex-1 justify-center items-center">
                        <div className="flex items-center bg-black/15 rounded-full p-1 md:p-1.5 backdrop-blur-sm overflow-x-auto hide-scrollbar max-w-full">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className={`px-3 py-1.5 md:px-8 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${location.pathname === '/dashboard' ? 'bg-white text-[#CC0000] shadow-sm' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                            >
                                Dashboard
                            </button>
                            <button 
                                onClick={() => navigate('/class-funds')}
                                className={`px-3 py-1.5 md:px-8 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${location.pathname === '/class-funds' ? 'bg-white text-[#CC0000] shadow-sm' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                            >
                                Funds
                            </button>
                            <button 
                                onClick={() => navigate('/photos')}
                                className={`px-3 py-1.5 md:px-8 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${location.pathname === '/photos' ? 'bg-white text-[#CC0000] shadow-sm' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                            >
                                Photos
                            </button>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                        
                        {/* DESKTOP MENU */}
                        <div className="hidden md:flex items-center gap-6">
                            {userRole === 'officer' && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/settings')}
                                    className={`hover:rotate-90 transition-all duration-300 ${
                                        location.pathname === '/settings'
                                            ? 'text-white'
                                            : 'text-white/90 hover:text-white'
                                    }`}
                                    title="Settings"
                                >
                                    <Settings size={22} />
                                </button>
                            )}

                            {/* PROFILE DROPDOWN */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                                    className="flex items-center gap-3 bg-black/15 hover:bg-black/25 transition-colors rounded-full pl-4 pr-4 py-1.5 border border-white/10 backdrop-blur-sm cursor-pointer"
                                >
                                    <span className="text-white text-sm font-bold tracking-wide capitalize">
                                        {userRole}
                                    </span>
                                    <ChevronDown
                                        size={16}
                                        className={`text-white/80 transition-transform duration-200 ${
                                            isProfileDropdownOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {isProfileDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setIsProfileDropdownOpen(false)} />
                                        <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                type="button"
                                                onClick={handleSwitchRoleClick}
                                                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                            >
                                                <RefreshCw size={18} strokeWidth={2.5} className="text-blue-600" />
                                                <span>{userRole === 'officer' ? 'Switch to Student' : 'Switch to Officer'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleLogoutClick}
                                                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-[#CC0000] hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut size={18} strokeWidth={2.5} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* MOBILE HAMBURGER ICON */}
                        <div className="md:hidden flex items-center">
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                            >
                                <Menu size={28} />
                            </button>
                        </div>
                    </div>
                </nav>

                {/* DYNAMIC PAGE HEADER */}
                <div className={`px-6 md:px-10 flex justify-between items-center relative min-h-[50px] ${showBackButton ? 'mt-10 mb-14' : 'mt-8 mb-6 items-end'}`}>
                   {showBackButton ? (
                      <div className="flex items-center justify-center w-full relative">
                        <button 
                          onClick={() => navigate('/dashboard')} 
                          className="absolute left-0 md:left-10 flex items-center gap-2 text-white/90 hover:text-white font-semibold transition-colors"
                        >
                          <ArrowLeft size={22} />
                          <span className="hidden md:inline">Back to Dashboard</span>
                        </button>
                          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight text-center px-12 md:px-0">{title}</h1>
                          <div className="absolute right-0 md:right-10 flex items-center gap-3">
                              {rightActions}
                        </div>
                      </div>
                    ) : (
                        <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-4">
                            <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
                            <div className="flex items-center gap-3 mb-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                                {rightActions || (
                                    <>
                                        {userRole === 'officer' && (
                                            <>
                                                <button 
                                                    onClick={handleOpenAnnouncement}
                                                    className="flex items-center gap-2 bg-white text-[#CC0000] px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors shrink-0"
                                                >
                                                    <Megaphone size={18} strokeWidth={2.5} />
                                                    Announcement
                                                </button>
                                                <button 
                                                    onClick={handleBackup}
                                                    className="flex items-center gap-2 bg-[#B30000] text-white border border-white/20 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#990000] transition-colors shadow-sm shrink-0"
                                                >
                                                    <Download size={16} strokeWidth={2.5} />
                                                    Backup PDF
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* DYNAMIC PAGE CONTENT INJECTED HERE */}
                <main className="flex-1 px-6 md:px-10 pb-10 w-full max-w-[1600px] mx-auto z-10 relative">
                    {children}
                </main>
            </div>

            {/* MOBILE SLIDE-OUT MENU */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="relative w-[280px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 flex justify-between items-center border-b border-gray-100">
                            <span className="font-extrabold text-gray-900 tracking-widest text-lg">MENU</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-[#CC0000] bg-gray-50 p-2 rounded-full transition-colors">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="flex flex-col py-6 flex-1 overflow-y-auto">
                            <div className="px-6 flex flex-col gap-5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account & Settings</p>
                                {userRole === 'officer' && (
                                    <button onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 text-base font-bold text-gray-700 hover:bg-gray-50 p-2 -ml-2 rounded-xl transition-colors">
                                        <div className="bg-gray-100 p-2 rounded-xl text-gray-600"><Settings size={20} /></div> Settings
                                    </button>
                                )}
                                <button onClick={handleSwitchRoleClick} className="flex items-center gap-4 text-base font-bold text-blue-600 hover:bg-blue-50/50 p-2 -ml-2 rounded-xl transition-colors">
                                    <div className="bg-blue-50 p-2 rounded-xl"><RefreshCw size={20} /></div> {userRole === 'officer' ? 'Switch to Student' : 'Switch to Officer'}
                                </button>
                                <button onClick={handleLogoutClick} className="flex items-center gap-4 text-base font-bold text-[#CC0000] hover:bg-red-50/50 p-2 -ml-2 rounded-xl transition-colors">
                                    <div className="bg-red-50 p-2 rounded-xl"><LogOut size={20} /></div> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFICATION PERMISSION MODAL */}
            {showNotifModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-red-50 text-[#CC0000] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BellRing size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Stay in the Loop!</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Enable notifications to instantly know when officers post new announcements, events, and deadlines.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={enableNotifications}
                                className="w-full bg-[#CC0000] text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                            >
                                Allow Notifications
                            </button>
                            <button 
                                onClick={handleDismissModal}
                                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OFFICER AUTHENTICATION MODAL */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-red-50 p-3 rounded-2xl text-[#CC0000]">
                                <Lock size={26} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Officer Authentication</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Enter the secure officer password to switch back to administrative mode.
                        </p>
                        <form onSubmit={verifyOfficerPassword} className="flex flex-col gap-3">
                            <div className="relative w-full">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={officerPassword}
                                    onChange={(e) => { setOfficerPassword(e.target.value); setAuthError(false); }}
                                    placeholder="Enter officer password..." 
                                    autoFocus
                                    className="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 outline-none focus:border-red-300 text-gray-800 font-medium"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {authError && (
                                <p className="text-xs font-bold text-[#CC0000]">Incorrect password. Please try again.</p>
                            )}
                            <div className="flex gap-3 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAuthModalOpen(false)} 
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 rounded-xl bg-[#CC0000] text-white font-bold hover:bg-red-800 transition-colors shadow-sm"
                                >
                                    Authorize
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ANNOUNCEMENT PREVIEW MODAL */}
            {isAnnouncementModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAnnouncementModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh]">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-50 p-2.5 rounded-xl text-[#CC0000]">
                                    <Megaphone size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Messenger Announcement</h2>
                            </div>
                            <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-gray-400 hover:text-gray-800">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            Here is your auto-generated announcement based on your current tasks and events. Review and copy it directly to your Messenger group chat!
                        </p>
                        <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 font-mono text-xs text-gray-800 whitespace-pre-wrap select-all">
                            {announcementText}
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsAnnouncementModalOpen(false)} 
                                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleCopyClipboard} 
                                className="flex-1 py-3 rounded-xl bg-[#CC0000] text-white font-bold hover:bg-red-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                {copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                                {copied ? 'Copied to Clipboard!' : 'Copy Announcement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LOGOUT CONFIRMATION MODAL */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <LogOut size={32} className="text-[#CC0000]" strokeWidth={2.5} />
                            <h2 className="text-3xl font-bold text-gray-900">Log Out?</h2>
                        </div>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to log out of your session? You will need to sign in again to access the dashboard.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsLogoutModalOpen(false)} 
                                className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-lg"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout} 
                                className="flex-1 py-3.5 rounded-xl bg-[#B30000] text-white font-bold hover:bg-red-900 transition-colors text-lg shadow-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}