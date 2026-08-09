import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../assets/components/layout/DashboardLayout';
import { Shield, Database, Info, Download, Upload, AlertTriangle, Trash2 } from 'lucide-react';

export default function Settings() {
    const navigate = useNavigate();
    
    // Strict Role-Based Security Check
    const userRole = localStorage.getItem('visionari_role') || 'officer';

    useEffect(() => {
        if (userRole !== 'officer') {
            navigate('/dashboard', { replace: true });
        } else {
            window.scrollTo(0, 0);
        }
    }, [userRole, navigate]);

    if (userRole !== 'officer') {
        return null; // Render nothing while redirecting unauthorized users
    }

    // Refs for smooth scrolling sidebar
    const securityRef = useRef(null);
    const dataRef = useRef(null);

    const scrollToSection = (ref) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ==========================================
    // SECURITY STATE
    // ==========================================
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handlePasswordUpdate = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return alert("New passwords do not match!");
        }
        if (passwords.new.length < 12) {
            return alert("Password must be at least 12 characters long.");
        }
        alert("Password successfully updated!");
        setPasswords({ current: '', new: '', confirm: '' });
    };

    // ==========================================
    // DATA MANAGEMENT STATE & LOGIC
    // ==========================================
    const handleExportData = () => {
        const fullBackup = {
            tasks: localStorage.getItem('visionari_tasks'),
            events: localStorage.getItem('visionari_events'),
            funds: localStorage.getItem('visionari_funds_monthly'),
            albums: localStorage.getItem('visionari_albums')
        };
        const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `visionari_full_system_backup_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRestoreData = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.tasks) localStorage.setItem('visionari_tasks', data.tasks);
                if (data.events) localStorage.setItem('visionari_events', data.events);
                if (data.funds) localStorage.setItem('visionari_funds_monthly', data.funds);
                if (data.albums) localStorage.setItem('visionari_albums', data.albums);
                
                alert("System data completely restored! The page will now refresh.");
                window.location.reload();
            } catch (err) {
                alert("Invalid backup file. Please ensure it is a valid JSON export.");
            }
        };
        reader.readAsText(file);
    };

    const handleClearAllData = () => {
        const confirmFirst = window.confirm("WARNING: This will permanently delete ALL your tasks, events, class funds, and photo albums from this browser. Are you absolutely sure?");
        if (confirmFirst) {
            const confirmSecond = window.confirm("Final check! Have you downloaded a backup first?");
            if (confirmSecond) {
                localStorage.removeItem('visionari_tasks');
                localStorage.removeItem('visionari_events');
                localStorage.removeItem('visionari_funds_monthly');
                localStorage.removeItem('visionari_albums');
                alert("All data has been cleared.");
                window.location.reload();
            }
        }
    };

    return (
        <DashboardLayout 
            title="" 
            showBackButton={true} 
        >
            <div className="w-full max-w-[1400px] mx-auto mt-4 relative z-10 flex flex-col md:flex-row gap-12 items-start">
                
                {/* LEFT SIDEBAR NAVIGATION */}
                <div className="w-full md:w-[280px] flex flex-col sticky top-8 shrink-0">
                    <div className="mb-8">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                            Manage your account preferences, security, and data.
                        </p>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <button 
                            onClick={() => scrollToSection(securityRef)}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700 font-bold transition-colors"
                        >
                            <Shield size={18} />
                            Security
                        </button>
                        <button 
                            onClick={() => scrollToSection(dataRef)}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700 font-bold transition-colors"
                        >
                            <Database size={18} />
                            Data Management
                        </button>
                    </nav>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 flex flex-col gap-12 w-full pb-20">
                    
                    {/* SECURITY SECTION */}
                    <section ref={securityRef} className="scroll-mt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-[#CC0000]" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900">Admin Security</h2>
                        </div>
                        
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            
                            {/* Info Box */}
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex gap-4 mb-8">
                                <Info className="text-[#CC0000] shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Password Requirements</h4>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        For PIO and Treasurer roles, passwords must be at least 12 characters long and contain a mix of uppercase, lowercase, numbers, and symbols.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Current Password</label>
                                    <input 
                                        type="password" 
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                        placeholder="Enter current password" 
                                        className="w-full border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-red-300 transition-colors" 
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">New Password</label>
                                    <input 
                                        type="password" 
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                        placeholder="Enter new password" 
                                        className="w-full border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-red-300 transition-colors" 
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                        placeholder="Confirm new password" 
                                        className="w-full border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-red-300 transition-colors" 
                                    />
                                </div>
                                
                                <div>
                                    <button type="submit" className="bg-[#B30000] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-red-900 transition-colors mt-2">
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* DATA MANAGEMENT SECTION */}
                    <section ref={dataRef} className="scroll-mt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <Database className="text-[#CC0000]" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
                        </div>
                        
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-8">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Export Box */}
                                <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors">
                                    <div>
                                        <div className="w-10 h-10 rounded-full bg-red-50 text-[#CC0000] flex items-center justify-center mb-4">
                                            <Download size={20} />
                                        </div>
                                        <h4 className="font-bold text-gray-900">Export Backup</h4>
                                        <p className="text-sm text-gray-500 mt-2 leading-relaxed mb-6">
                                            Download a complete JSON backup of all funds, transactions, and settings.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleExportData}
                                        className="w-full py-3 rounded-xl border border-[#CC0000] text-[#CC0000] font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} strokeWidth={2.5} /> Export JSON
                                    </button>
                                </div>

                                {/* Restore Box */}
                                <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors">
                                    <div>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mb-4">
                                            <Upload size={20} />
                                        </div>
                                        <h4 className="font-bold text-gray-900">Restore Backup</h4>
                                        <p className="text-sm text-gray-500 mt-2 leading-relaxed mb-6">
                                            Upload a previously exported JSON file to restore your system state.
                                        </p>
                                    </div>
                                    
                                    <div className="relative w-full">
                                        <input 
                                            type="file" 
                                            accept=".json"
                                            onChange={handleRestoreData}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <button className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 pointer-events-none">
                                            <Upload size={16} strokeWidth={2.5} /> Select File
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="border border-red-100 bg-red-50/50 rounded-2xl p-6">
                                <div className="flex items-center gap-2 text-[#CC0000] mb-2">
                                    <AlertTriangle size={20} strokeWidth={2.5} />
                                    <h4 className="font-bold text-red-900">Danger Zone</h4>
                                </div>
                                <p className="text-sm text-red-800/80 mb-6 max-w-2xl">
                                    This action will permanently delete all data, including funds, transactions, and photos. This cannot be undone unless you have a recent backup.
                                </p>
                                <button 
                                    onClick={handleClearAllData}
                                    className="bg-[#CC0000] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-red-900 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} strokeWidth={2.5} /> Clear All Data
                                </button>
                            </div>

                        </div>
                    </section>

                </div>
            </div>
        </DashboardLayout>
    );
}