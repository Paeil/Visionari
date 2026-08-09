import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../assets/components/layout/DashboardLayout';
import { Users, Wallet, Percent, AlertCircle, Download, Check, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../supabaseClient';

// ==========================================
// STUDENT LIST & SETUP
// ==========================================
const rawStudentNames = [
    "abordo", "alenzuela", "arcos", "balictar", "barabad", "bengaora", "binas", 
    "buenjemia", "buncag", "cachila", "catalino", "celeste", "dagohoy", "delizo", 
    "eslabra", "gain", "guancia", "herrera", "jaboneta", "lombendencio", "menez", 
    "nava", "ocana", "panaguiton", "polong", "sasi", "sinfuego", "sison", 
    "sorbito", "tacsagon", "tuvilla"
];

const formatName = (name) => name.charAt(0).toUpperCase() + name.slice(1);
const DAYS = ['D1', 'D2', 'D3', 'D4'];

const initializeStudents = () => {
    return rawStudentNames.map((name, i) => ({
        id: i + 1,
        name: formatName(name),
        checks: { daily: {} } 
    }));
};

const getWeeksInMonth = (monthName, yearString) => {
    const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
    const year = parseInt(yearString, 10);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    let validWeeks = 0;
    let date = new Date(year, monthIndex, 1);
    
    while (date.getMonth() === monthIndex) {
        if (date.getDay() === 1 && (date.getDate() + 3 <= daysInMonth)) {
            validWeeks++;
        }
        date.setDate(date.getDate() + 1);
    }
    
    return validWeeks < 4 ? 4 : validWeeks; 
};

export default function ClassFunds() {
    const navigate = useNavigate();

    // Fetch the role to determine view permissions
    const userRole = localStorage.getItem('visionari_role') || 'officer';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [viewMode, setViewMode] = useState('daily');
    const [selectedMonth, setSelectedMonth] = useState('August');
    const [selectedYear, setSelectedYear] = useState('2026');

    // ==========================================
    // DATA STORAGE BY MONTH-YEAR (SUPABASE SYNC & OFFLINE CACHE)
    // ==========================================
    const [fundsData, setFundsData] = useState({});

    useEffect(() => {
        fetchFundsData();
    }, []);

    const fetchFundsData = async () => {
        // 1. INSTANT OFFLINE BYPASS
        if (!navigator.onLine) {
            console.warn('Device is offline. Loading class funds instantly from cache...');
            const saved = localStorage.getItem('visionari_funds_monthly');
            if (saved) setFundsData(JSON.parse(saved));
            return;
        }

        // 2. ONLINE FETCH
        try {
            const { data, error } = await supabase.from('class_funds').select('*');
            if (error) throw error;
            
            if (data && data.length > 0) {
                const mappedData = {};
                data.forEach(row => {
                    mappedData[row.key] = row.data;
                });
                setFundsData(mappedData);
                localStorage.setItem('visionari_funds_monthly', JSON.stringify(mappedData));
            } else {
                const saved = localStorage.getItem('visionari_funds_monthly');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setFundsData(parsed);
                }
            }
        } catch (error) {
            const saved = localStorage.getItem('visionari_funds_monthly');
            if (saved) setFundsData(JSON.parse(saved));
        }
    };

    const saveFundsDataToCloud = async (newFundsData) => {
        setFundsData(newFundsData);
        localStorage.setItem('visionari_funds_monthly', JSON.stringify(newFundsData));

        try {
            for (const [key, value] of Object.entries(newFundsData)) {
                await supabase.from('class_funds').upsert({ key, data: value });
            }
        } catch (error) {
            console.error('Error saving class funds to Supabase:', error);
            // Even if offline, we already saved it to localStorage above so data isn't lost!
        }
    };

    const currentKey = `${selectedMonth}-${selectedYear}`;
    const storedStudents = fundsData[currentKey] || initializeStudents();

    // ==========================================
    // DYNAMIC MATH & SELF-HEALING LOGIC
    // ==========================================
    const activeWeeksCount = getWeeksInMonth(selectedMonth, selectedYear);
    const ACTIVE_WEEKS = Array.from({ length: activeWeeksCount }, (_, i) => `W${i + 1}`);
    const MAX_DAYS = activeWeeksCount * 4;
    const MAX_BALANCE = activeWeeksCount * 20;

    const students = storedStudents.map(student => {
        const dailyChecks = student.checks?.daily || {};

        const derivedWeekly = {};
        ACTIVE_WEEKS.forEach(w => {
            derivedWeekly[w] = DAYS.every(d => dailyChecks[`${w}-${d}`] === true);
        });

        const derivedMonthly = ACTIVE_WEEKS.every(w => derivedWeekly[w]);

        const checkedDaysCount = Object.keys(dailyChecks).filter(key => {
            const weekPrefix = key.split('-')[0];
            return dailyChecks[key] === true && ACTIVE_WEEKS.includes(weekPrefix);
        }).length;

        const progress = Math.round((checkedDaysCount / MAX_DAYS) * 100);
        const balance = MAX_BALANCE - (checkedDaysCount * 5); 

        return { 
            ...student, 
            checks: { daily: dailyChecks, weekly: derivedWeekly, monthly: derivedMonthly }, 
            progress, 
            balance, 
            checkedDaysCount 
        };
    });

    const totalStudents = students.length;
    const totalCollected = students.reduce((acc, curr) => acc + (MAX_BALANCE - curr.balance), 0);
    const outstandingBalance = students.reduce((acc, curr) => acc + curr.balance, 0);
    const paymentRate = totalStudents > 0 ? Math.round((totalCollected / (totalStudents * MAX_BALANCE)) * 100) : 0;

    // ==========================================
    // CASCADING CHECKBOX LOGIC
    // ==========================================
    const toggleCheck = (studentId, type, weekKey, dayKey) => {
        if (userRole !== 'officer') return;

        const newStudents = storedStudents.map(student => {
            if (student.id !== studentId) return student;

            let newDaily = { ...(student.checks?.daily || {}) };
            const currentStudentRender = students.find(s => s.id === studentId);

            if (type === 'monthly') {
                const isNowChecked = !currentStudentRender.checks.monthly;
                ACTIVE_WEEKS.forEach(w => {
                    DAYS.forEach(d => newDaily[`${w}-${d}`] = isNowChecked);
                });
            } 
            else if (type === 'weekly') {
                const isNowChecked = !currentStudentRender.checks.weekly[weekKey];
                DAYS.forEach(d => newDaily[`${weekKey}-${d}`] = isNowChecked);
            } 
            else if (type === 'daily') {
                const dayFullKey = `${weekKey}-${dayKey}`;
                newDaily[dayFullKey] = !newDaily[dayFullKey];
            }

            return {
                ...student,
                checks: { daily: newDaily } 
            };
        });

        const updatedFundsData = { ...fundsData, [currentKey]: newStudents };
        saveFundsDataToCloud(updatedFundsData);
    };

    // ==========================================
    // PDF BACKUP GENERATOR
    // ==========================================
    const handleClassFundsBackup = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(204, 0, 0);
            doc.text("VISIONARI", 14, 20);
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text(`Class Finance Tracking - ${selectedMonth} ${selectedYear} (${viewMode.toUpperCase()})`, 14, 28);
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

            let headers = ['Student', 'Progress', 'Balance'];
            if (viewMode === 'daily') headers = ['Student', 'Days Paid', 'Progress', 'Balance'];
            else if (viewMode === 'weekly') headers = ['Student', ...ACTIVE_WEEKS, 'Progress', 'Balance'];
            else headers = ['Student', 'Monthly Status', 'Progress', 'Balance'];

            const body = students.map(s => {
                if (viewMode === 'daily') return [s.name, `${s.checkedDaysCount} / ${MAX_DAYS} Days`, `${s.progress}%`, `₱${s.balance}`];
                else if (viewMode === 'weekly') {
                    const c = s.checks.weekly || {};
                    const weekStatus = ACTIVE_WEEKS.map(w => c[w] ? 'Yes' : 'No');
                    return [s.name, ...weekStatus, `${s.progress}%`, `₱${s.balance}`];
                } else return [s.name, s.checks.monthly ? 'Paid' : 'Unpaid', `${s.progress}%`, `₱${s.balance}`];
            });

            autoTable(doc, {
                startY: 42,
                head: [headers],
                body: body,
                headStyles: { fillColor: [204, 0, 0] },
                styles: { fontSize: 9, cellPadding: 4 },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });

            doc.save(`class_funds_${selectedMonth}_${selectedYear}_${viewMode}.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Could not generate Class Funds PDF backup.");
        }
    };

    return (
        <DashboardLayout 
            title={<>Class Finance<br />Tracking</>} 
            showBackButton={false} 
            rightActions={
                <div className="flex items-center gap-3">
                    {userRole === 'officer' && (
                        <button 
                            onClick={handleClassFundsBackup}
                            className="flex items-center gap-1.5 bg-white text-[#CC0000] border border-white/20 px-3.5 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm shrink-0"
                        >
                            <Download size={16} strokeWidth={2.5} />
                            <span className="hidden sm:inline">Backup PDF</span>
                        </button>
                    )}
                </div>
            }
        >
            <div className="w-full max-w-[1600px] mx-auto -mt-6 md:-mt-12 flex flex-col gap-6 md:gap-8 relative z-10">
                
                {/* METRICS SUMMARY CARDS - 2x2 on Mobile, 4x1 on Desktop */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 mt-4 md:mt-[80px]">
                    <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-5 h-[90px] sm:h-[120px]">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-50 text-[#CC0000] flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Total Students</p>
                            <h3 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-0.5 sm:mt-1 truncate">{totalStudents}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-5 h-[90px] sm:h-[120px]">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-50 text-[#CC0000] flex items-center justify-center shrink-0">
                            <Wallet className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Total Collected</p>
                            <h3 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-0.5 sm:mt-1 truncate">₱{totalCollected.toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-5 h-[90px] sm:h-[120px]">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-50 text-[#CC0000] flex items-center justify-center shrink-0">
                            <Percent className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Payment Rate</p>
                            <h3 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-0.5 sm:mt-1 truncate">{paymentRate}%</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-5 h-[90px] sm:h-[120px]">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-50 text-[#CC0000] flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Outs Bal</p>
                            <h3 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-0.5 sm:mt-1 truncate">₱{outstandingBalance.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                {/* CONTROLS BAR */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
                    <div className="flex w-full md:w-auto bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button 
                            onClick={() => setViewMode('daily')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${viewMode === 'daily' ? 'bg-[#CC0000] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            Daily
                        </button>
                        <button 
                            onClick={() => setViewMode('weekly')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-[#CC0000] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            Weekly
                        </button>
                        <button 
                            onClick={() => setViewMode('monthly')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-[#CC0000] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            Monthly
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="flex-1 md:flex-none bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold text-gray-700 outline-none focus:border-red-300 cursor-pointer"
                        >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="flex-1 md:flex-none bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold text-gray-700 outline-none focus:border-red-300 cursor-pointer"
                        >
                            {['2025', '2026', '2027'].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* FINANCE TRACKING TABLE */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className={`w-full text-center border-collapse ${viewMode === 'daily' ? 'min-w-[1000px] md:min-w-[1200px]' : viewMode === 'weekly' ? 'min-w-[500px] md:min-w-[800px]' : 'min-w-full md:min-w-[600px]'}`}>
                            
                            <thead>
                                <tr className="bg-[#B30000] text-white text-[10px] md:text-xs font-bold tracking-wider">
                                    <th rowSpan={viewMode === 'daily' ? 2 : 1} className="py-4 px-3 sm:px-6 rounded-tl-2xl w-[100px] sm:w-[200px] text-left sticky left-0 bg-[#B30000] z-10 border-b border-red-800">
                                        Student
                                    </th>
                                    
                                    {viewMode === 'daily' && ACTIVE_WEEKS.map((w, idx) => (
                                        <th key={w} colSpan={4} className={`py-3 px-2 border-b border-red-800 ${idx % 2 === 0 ? 'bg-[#990000]' : 'bg-[#B30000]'}`}>
                                            {w}
                                        </th>
                                    ))}

                                    {viewMode === 'weekly' && ACTIVE_WEEKS.map(w => (
                                        <th key={w} className="py-4 px-2 sm:px-4 w-[60px] sm:w-[80px] border-b border-red-800">{w}</th>
                                    ))}

                                    {viewMode === 'monthly' && (
                                        <th className="py-4 px-2 sm:px-4 w-[80px] sm:w-[100px] border-b border-red-800">{selectedMonth}</th>
                                    )}

                                    <th rowSpan={viewMode === 'daily' ? 2 : 1} className="py-4 px-4 sm:px-6 w-[120px] sm:w-[140px] border-b border-red-800">Progress</th>
                                    <th rowSpan={viewMode === 'daily' ? 2 : 1} className="py-4 px-4 sm:px-6 rounded-tr-2xl text-right w-[100px] sm:w-[120px] border-b border-red-800">Balance</th>
                                </tr>
                                
                                {viewMode === 'daily' && (
                                    <tr className="bg-[#B30000] text-white text-[9px] md:text-[10px] font-bold tracking-wider">
                                        {ACTIVE_WEEKS.map((w, idx) => (
                                            DAYS.map(d => (
                                                <th key={`${w}-${d}`} className={`py-2 px-1 ${idx % 2 === 0 ? 'bg-[#990000]' : 'bg-[#B30000]'}`}>{d}</th>
                                            ))
                                        ))}
                                    </tr>
                                )}
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-4 px-3 sm:px-6 text-xs sm:text-sm font-extrabold text-gray-900 text-left sticky left-0 bg-white group-hover:bg-gray-50/50 transition-colors z-10 max-w-[100px] sm:max-w-[200px] truncate">
                                            {student.name}
                                        </td>

                                        {/* DAILY CHECKBOXES */}
                                        {viewMode === 'daily' && ACTIVE_WEEKS.map((w, wIdx) => (
                                            DAYS.map(d => {
                                                const isChecked = !!student.checks?.daily?.[`${w}-${d}`];
                                                return (
                                                    <td key={`${w}-${d}`} className={`py-3 sm:py-4 px-1 ${wIdx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                                                        <button 
                                                            onClick={userRole === 'officer' ? () => toggleCheck(student.id, 'daily', w, d) : undefined}
                                                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[4px] sm:rounded-md border flex items-center justify-center mx-auto transition-all ${isChecked ? 'bg-[#B30000] border-[#B30000] text-white shadow-sm' : 'border-gray-300 bg-white'} ${userRole === 'officer' ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'}`}
                                                        >
                                                            {isChecked && <Check size={12} strokeWidth={3.5} />}
                                                        </button>
                                                    </td>
                                                );
                                            })
                                        ))}

                                        {/* WEEKLY CHECKBOXES */}
                                        {viewMode === 'weekly' && ACTIVE_WEEKS.map((week) => {
                                            const isChecked = !!student.checks?.weekly?.[week];
                                            return (
                                                <td key={week} className="py-4 px-2 sm:px-4">
                                                    <button 
                                                        onClick={userRole === 'officer' ? () => toggleCheck(student.id, 'weekly', week) : undefined}
                                                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border flex items-center justify-center mx-auto transition-all ${isChecked ? 'bg-[#B30000] border-[#B30000] text-white shadow-sm' : 'border-gray-300 bg-white'} ${userRole === 'officer' ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'}`}
                                                    >
                                                        {isChecked && <Check size={14} strokeWidth={3} />}
                                                    </button>
                                                </td>
                                            );
                                        })}

                                        {/* MONTHLY CHECKBOX */}
                                        {viewMode === 'monthly' && (
                                            <td className="py-4 px-2 sm:px-4">
                                                <button 
                                                    onClick={userRole === 'officer' ? () => toggleCheck(student.id, 'monthly') : undefined}
                                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border flex items-center justify-center mx-auto transition-all ${student.checks?.monthly ? 'bg-[#B30000] border-[#B30000] text-white shadow-sm' : 'border-gray-300 bg-white'} ${userRole === 'officer' ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'}`}
                                                >
                                                    {student.checks?.monthly && <Check size={14} strokeWidth={3} />}
                                                </button>
                                            </td>
                                        )}

                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-[#B30000] h-full rounded-full transition-all duration-300" 
                                                        style={{ width: `${student.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-bold text-gray-600 w-6 sm:w-8 text-right">{student.progress}%</span>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4 sm:px-6 text-right text-xs sm:text-sm font-extrabold text-[#B30000]">
                                            ₱{student.balance}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}