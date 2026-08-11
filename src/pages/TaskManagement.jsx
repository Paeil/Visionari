import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../assets/components/layout/DashboardLayout';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    X,
    TriangleAlert,
} from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// ============================================================
// COURSE / CATEGORY OPTIONS
// ============================================================

const COURSE_OPTIONS = [
    'Analytics Application (CIS 221)',
    'Business Intelligence (CIS 216)',
    'Evaluation of Business Performance (CIS 213)',
    'Seminars and Field Study (CC 209)',
    'Thesis Writing for IS 2 (CIS 212)',
    'Systems Infrastructure and Integration (CIS 229)',
    'Ordinary Task',
    'Routine Task',
];

// ============================================================
// REUSABLE TASK FORM COMPONENT
// ============================================================

const TaskForm = ({
    taskTitle, setTaskTitle,
    taskDate, setTaskDate,
    taskPriority, setTaskPriority,
    taskCourse, setTaskCourse,
    taskDesc, setTaskDesc,
}) => (
    <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Task Name</label>
            <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-200 text-gray-800"
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Due Date</label>
                <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-200 text-gray-800"
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Priority</label>
                <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200 h-[50px]">
                    <button
                        type="button"
                        onClick={() => setTaskPriority('Priority')}
                        className={`flex-1 rounded-lg text-sm font-bold transition-all ${taskPriority === 'Priority' ? 'bg-white text-[#CC0000] shadow-sm border border-red-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Priority
                    </button>
                    <button
                        type="button"
                        onClick={() => setTaskPriority('Secondary')}
                        className={`flex-1 rounded-lg text-sm font-bold transition-all ${taskPriority === 'Secondary' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Secondary
                    </button>
                </div>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Category / Course</label>
            <select
                value={taskCourse}
                onChange={(e) => setTaskCourse(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white text-gray-800"
            >
                <option value="">Select Category</option>
                {COURSE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Task Description</label>
            <textarea
                rows="3"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Enter task details..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none text-gray-800"
            />
        </div>
    </div>
);

// ============================================================
// REUSABLE TASK CARD (Moved outside to prevent click glitches)
// ============================================================
const TaskCard = ({ task, type, userRole, formatDisplayDate, onEdit, onDelete }) => {
    const isPriority = type === 'priority';
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden relative flex justify-between gap-6 group hover:shadow-md transition-shadow">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPriority ? 'bg-[#CC0000]' : 'bg-[#E65C00]'}`} />
            <div className="flex flex-col pl-2 min-w-0">
                <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                <div className="flex items-center gap-3 mb-3 mt-1 flex-wrap">
                    <p className="text-sm font-semibold text-gray-500">Due: {formatDisplayDate(task.date)}</p>
                    {task.course && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isPriority ? 'text-[#CC0000] bg-red-50' : 'text-[#E65C00] bg-orange-50'}`}>
                            {task.course}
                        </span>
                    )}
                </div>
                {task.description ? (
                    <p className="text-sm text-gray-600 leading-relaxed pr-4">{task.description}</p>
                ) : (
                    <p className="text-sm text-gray-400 italic">No description provided.</p>
                )}
            </div>
            {userRole === 'officer' && (
                <div className="flex flex-col items-center gap-3 shrink-0 pt-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(task); }} 
                        className="text-gray-300 hover:text-gray-800 transition-colors" 
                        title="Edit task"
                    >
                        <Pencil size={20} />
                    </button>
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            const taskId = task.id || task.uuid || task.task_id; // Database fallback
                            onDelete(taskId); 
                        }} 
                        className="text-gray-300 hover:text-[#CC0000] transition-colors" 
                        title="Delete task"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TaskManagement() {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('visionari_role') || 'officer';

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [taskToDelete, setTaskToDelete] = useState(null);
    const [taskToEdit, setTaskToEdit] = useState(null);

    const [taskTitle, setTaskTitle] = useState('');
    const [taskDate, setTaskDate] = useState('');
    const [taskPriority, setTaskPriority] = useState('Priority');
    const [taskCourse, setTaskCourse] = useState('');
    const [taskDesc, setTaskDesc] = useState('');

    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        if (!navigator.onLine) {
            console.warn('Device is offline. Loading tasks instantly from cache...');
            const cached = localStorage.getItem('visionari_tasks_cache');
            if (cached) setTasks(JSON.parse(cached));
            return;
        }

        try {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) throw error;
            
            setTasks(data || []);
            if (data) localStorage.setItem('visionari_tasks_cache', JSON.stringify(data));
        } catch (error) {
            const cached = localStorage.getItem('visionari_tasks_cache');
            if (cached) setTasks(JSON.parse(cached));
        }
    };

    const priorityTasks = tasks.filter(task => task.category?.toLowerCase() === 'priority');
    const secondaryTasks = tasks.filter(task => task.category?.toLowerCase() === 'secondary');

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'No date';
        if (!dateString.includes('-')) return dateString;
        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return 'No date';
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    };

    const resetForm = (priority = 'Priority') => {
        setTaskTitle('');
        setTaskDate('');
        setTaskPriority(priority);
        setTaskCourse('');
        setTaskDesc('');
    };

    const openAddModal = (priority = 'Priority') => {
        if (userRole !== 'officer') return;
        resetForm(priority);
        setIsAddModalOpen(true);
    };

    const handleAddTask = async () => {
        if (userRole !== 'officer' || !taskTitle.trim()) return;

        const newTask = {
            id: Date.now(),
            title: taskTitle.trim(),
            date: taskDate,
            description: taskDesc.trim(),
            category: taskPriority,
            course: taskCourse,
            status: 'pending',
        };

        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        localStorage.setItem('visionari_tasks_cache', JSON.stringify(updatedTasks));

        resetForm();
        setIsAddModalOpen(false);

        try {
            const { error } = await supabase.from('tasks').insert([newTask]);
            if (error) throw error;
            
            await fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: "New Task Assigned! 📝", 
                    body: `${taskTitle.trim()} (Due: ${taskDate ? formatDisplayDate(taskDate) : 'TBA'})` 
                })
            });
            
        } catch (error) {
            console.warn('Task saved locally to cache, but cloud sync failed (offline).', error);
        }
    };

    const openDeleteModal = (taskId) => {
        if (userRole !== 'officer') return;
        if (!taskId) {
            console.error("Task ID is missing. Check your Supabase column names!");
            return;
        }
        setTaskToDelete(taskId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userRole !== 'officer' || taskToDelete == null) return;

        const idToDelete = taskToDelete;

        // Force string comparison to prevent integer/UUID mismatch bugs
        const updatedTasks = tasks.filter(task => String(task.id) !== String(idToDelete));
        
        setTasks(updatedTasks);
        localStorage.setItem('visionari_tasks_cache', JSON.stringify(updatedTasks));

        setTaskToDelete(null);
        setIsDeleteModalOpen(false);

        try {
            const { error } = await supabase.from('tasks').delete().eq('id', idToDelete);
            if (error) throw error;
        } catch (error) {
            console.warn('Task deleted locally from cache, but cloud sync failed (offline).', error);
        }
    };

    const openEditModal = (task) => {
        if (userRole !== 'officer') return;
        setTaskToEdit(task);
        setTaskTitle(task.title || '');
        setTaskDate(task.date?.includes('-') ? task.date : '');
        setTaskPriority(task.category || 'Priority');
        setTaskCourse(task.course || '');
        setTaskDesc(task.description || '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (userRole !== 'officer' || !taskTitle.trim() || !taskToEdit) return;

        const updatedFields = {
            title: taskTitle.trim(),
            date: taskDate,
            category: taskPriority,
            course: taskCourse,
            description: taskDesc.trim(),
        };

        const updatedTasks = tasks.map((task) => String(task.id) !== String(taskToEdit.id) ? task : { ...task, ...updatedFields });
        setTasks(updatedTasks);
        localStorage.setItem('visionari_tasks_cache', JSON.stringify(updatedTasks));

        const editId = taskToEdit.id;
        setTaskToEdit(null);
        setIsEditModalOpen(false);
        resetForm();

        try {
            const { error } = await supabase.from('tasks').update(updatedFields).eq('id', editId);
            if (error) throw error;
        } catch (error) {
            console.warn('Task updated locally in cache, but cloud sync failed (offline).', error);
        }
    };

    const closeAddModal = () => { setIsAddModalOpen(false); resetForm(); };
    const closeEditModal = () => { setIsEditModalOpen(false); setTaskToEdit(null); resetForm(); };

    return (
        <DashboardLayout title="Task Management" showBackButton={true}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-[70px] sm:mt-[100px]">
                
                {/* PRIORITY TASKS */}
                <section className="flex flex-col w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Priority Tasks</h2>
                        {userRole === 'officer' && (
                            <button onClick={() => openAddModal('Priority')} className="text-[#CC0000] bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors">
                                <Plus size={16} strokeWidth={3} /> New Task
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-4">
                        {priorityTasks.length > 0 ? (
                            priorityTasks.map((task) => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    type="priority" 
                                    userRole={userRole}
                                    formatDisplayDate={formatDisplayDate}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteModal}
                                />
                            ))
                        ) : (
                            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                                <p className="text-sm text-gray-400 font-medium">No priority tasks yet.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* SECONDARY TASKS */}
                <section className="flex flex-col w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Secondary Tasks</h2>
                        {userRole === 'officer' && (
                            <button onClick={() => openAddModal('Secondary')} className="text-[#CC0000] bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors">
                                <Plus size={16} strokeWidth={3} /> New Task
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-4">
                        {secondaryTasks.length > 0 ? (
                            secondaryTasks.map((task) => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    type="secondary" 
                                    userRole={userRole}
                                    formatDisplayDate={formatDisplayDate}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteModal}
                                />
                            ))
                        ) : (
                            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                                <p className="text-sm text-gray-400 font-medium">No secondary tasks yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* CREATE MODAL */}
            {userRole === 'officer' && isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAddModal} />
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
                            <button type="button" onClick={closeAddModal} className="text-gray-400 hover:text-gray-800 transition-colors"><X size={24} /></button>
                        </div>
                        <TaskForm 
                            taskTitle={taskTitle} setTaskTitle={setTaskTitle} taskDate={taskDate} setTaskDate={setTaskDate}
                            taskPriority={taskPriority} setTaskPriority={setTaskPriority} taskCourse={taskCourse} setTaskCourse={setTaskCourse}
                            taskDesc={taskDesc} setTaskDesc={setTaskDesc}
                        />
                        <div className="p-6 pt-4 flex justify-end gap-3 bg-white border-t border-gray-50">
                            <button type="button" onClick={closeAddModal} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                            <button type="button" onClick={handleAddTask} disabled={!taskTitle.trim()} className="px-6 py-2.5 rounded-xl bg-[#CC0000] text-white font-bold hover:bg-red-800 disabled:opacity-50 transition-colors shadow-sm">Create Task</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {userRole === 'officer' && isEditModalOpen && taskToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditModal} />
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Task</h2>
                            <button type="button" onClick={closeEditModal} className="text-gray-400 hover:text-gray-800 transition-colors"><X size={24} /></button>
                        </div>
                        <TaskForm 
                            taskTitle={taskTitle} setTaskTitle={setTaskTitle} taskDate={taskDate} setTaskDate={setTaskDate}
                            taskPriority={taskPriority} setTaskPriority={setTaskPriority} taskCourse={taskCourse} setTaskCourse={setTaskCourse}
                            taskDesc={taskDesc} setTaskDesc={setTaskDesc}
                        />
                        <div className="p-6 pt-4 flex justify-end gap-3 bg-white border-t border-gray-50">
                            <button type="button" onClick={closeEditModal} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                            <button type="button" onClick={handleSaveEdit} disabled={!taskTitle.trim()} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black disabled:opacity-50 transition-colors shadow-sm">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {userRole === 'officer' && isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <TriangleAlert size={32} className="text-[#CC0000]" strokeWidth={2.5} />
                            <h2 className="text-3xl font-bold text-gray-900">Delete Task?</h2>
                        </div>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">Are you sure you want to delete this task? This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-lg">Cancel</button>
                            <button type="button" onClick={confirmDelete} className="flex-1 py-3.5 rounded-xl bg-[#B30000] text-white font-bold hover:bg-red-900 transition-colors text-lg shadow-sm">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}