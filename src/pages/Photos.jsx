import React, { useState, useEffect } from 'react';
import DashboardLayout from '../assets/components/layout/DashboardLayout';
import { Pencil, Trash2, Calendar, UploadCloud, X, TriangleAlert, Plus, Download } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Photos() {
    // Fetch the role to determine view permissions
    const userRole = localStorage.getItem('visionari_role') || 'officer';

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0);
        fetchAlbums();
    }, []);

    // Load albums from Supabase
    const [albums, setAlbums] = useState([]);

  const fetchAlbums = async () => {
        // 1. INSTANT OFFLINE BYPASS
        if (!navigator.onLine) {
            console.warn('Device is offline. Loading albums instantly from cache...');
            const cached = localStorage.getItem('visionari_albums_cache');
            if (cached) setAlbums(JSON.parse(cached));
            return;
        }

        // 2. ONLINE FETCH
        try {
            const { data, error } = await supabase.from('photos').select('*');
            if (error) throw error;

            if (data && data.length > 0) {
                const formatted = data.map(item => ({
                    id: item.id,
                    title: item.title,
                    date: item.date,
                    desc: item.description, 
                    itemCount: item.itemcount,
                    driveLink: item.drivelink,
                    coverImage: item.coverimage
                }));
                setAlbums(formatted);
                localStorage.setItem('visionari_albums_cache', JSON.stringify(formatted));
            } else {
                setAlbums([]);
                localStorage.setItem('visionari_albums_cache', JSON.stringify([]));
            }
        } catch (error) {
            const cached = localStorage.getItem('visionari_albums_cache');
            if (cached) setAlbums(JSON.parse(cached));
        }
    };

    // Modal States
    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    
    // Form & Target States
    const [editingAlbumId, setEditingAlbumId] = useState(null);
    const [deletingAlbumId, setDeletingAlbumId] = useState(null);
    
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [desc, setDesc] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [coverImage, setCoverImage] = useState('');

    // Handle Image Upload (Convert to Base64)
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Open Modal for Creating
    const handleOpenCreate = () => {
        setEditingAlbumId(null);
        setTitle('');
        setDate('');
        setDesc('');
        setDriveLink('');
        setCoverImage('');
        setIsAlbumModalOpen(true);
    };

    // Open Modal for Editing
    const handleOpenEdit = (album) => {
        setEditingAlbumId(album.id);
        setTitle(album.title);
        setDate(album.date);
        setDesc(album.desc);
        setDriveLink(album.driveLink);
        setCoverImage(album.coverImage);
        setIsAlbumModalOpen(true);
    };

    // Save Album (Create or Edit)
    const handleSaveAlbum = async () => {
        if (!title || !driveLink) return alert("Title and Google Drive Link are required!");

        if (editingAlbumId) {
            const targetAlbum = albums.find(a => a.id === editingAlbumId);
            const updatedFields = {
                title,
                date,
                description: desc,
                drivelink: driveLink,
                coverimage: coverImage || targetAlbum.coverImage
            };

            try {
                const { error } = await supabase
                    .from('photos')
                    .update(updatedFields)
                    .eq('id', editingAlbumId);

                if (error) throw error;

                const updatedAlbums = albums.map(a => a.id === editingAlbumId ? {
                    ...a, title, date, desc, driveLink, coverImage: coverImage || a.coverImage
                } : a);
                
                setAlbums(updatedAlbums);
                localStorage.setItem('visionari_albums_cache', JSON.stringify(updatedAlbums));
            } catch (error) {
                console.error('Error updating album:', error);
                alert('Failed to update album in cloud. Check internet connection.');
            }
        } else {
            const newAlbumObj = {
                id: Date.now(),
                title,
                date,
                desc,
                itemCount: "0",
                driveLink,
                coverImage: coverImage || "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=800&auto=format&fit=crop"
            };

            const dbPayload = {
                id: newAlbumObj.id,
                title: newAlbumObj.title,
                date: newAlbumObj.date,
                description: newAlbumObj.desc,
                itemcount: newAlbumObj.itemCount,
                drivelink: newAlbumObj.driveLink,
                coverimage: newAlbumObj.coverImage
            };

            try {
                const { error } = await supabase.from('photos').insert([dbPayload]);
                if (error) throw error;
                
                const updatedAlbums = [newAlbumObj, ...albums];
                setAlbums(updatedAlbums);
                localStorage.setItem('visionari_albums_cache', JSON.stringify(updatedAlbums));
            } catch (error) {
                console.error('Error creating album:', error);
                alert('Failed to save album to cloud. Check internet connection.');
            }
        }
        setIsAlbumModalOpen(false);
    };

    // Delete Album
    const confirmDelete = async () => {
        try {
            const { error } = await supabase.from('photos').delete().eq('id', deletingAlbumId);
            if (error) throw error;
            
            const updatedAlbums = albums.filter(a => a.id !== deletingAlbumId);
            setAlbums(updatedAlbums);
            localStorage.setItem('visionari_albums_cache', JSON.stringify(updatedAlbums));
        } catch (error) {
            console.error('Error deleting album:', error);
            alert('Failed to delete album from cloud. Check internet connection.');
        }
        setIsDeleteModalOpen(false);
    };

    // ==========================================
    // BACKUP & RESTORE LOGIC
    // ==========================================
    const handleDownloadBackup = () => {
        const backupData = JSON.stringify(albums, null, 2);
        const blob = new Blob([backupData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `visionari_photo_gallery_backup_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRestoreBackup = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const restoredAlbums = JSON.parse(event.target.result);
                if (Array.isArray(restoredAlbums)) {
                    // Push restored albums to Supabase
                    const dbPayloads = restoredAlbums.map(a => ({
                        id: a.id || Date.now(),
                        title: a.title,
                        date: a.date,
                        description: a.desc,
                        itemcount: a.itemCount || "0",
                        drivelink: a.driveLink,
                        coverimage: a.coverImage
                    }));

                    await supabase.from('photos').upsert(dbPayloads);
                    setAlbums(restoredAlbums);
                    localStorage.setItem('visionari_albums_cache', JSON.stringify(restoredAlbums));
                    setIsBackupModalOpen(false);
                    alert("Gallery successfully restored to cloud!");
                } else {
                    alert("Invalid backup file format.");
                }
            } catch (err) {
                alert("Error reading the backup file.");
            }
        };
        reader.readAsText(file);
    };

    // Format Date helper
    const formatDate = (dateString) => {
        if (!dateString) return "No date set";
        const options = { year: 'numeric', month: 'short', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options).toUpperCase();
    };

    return (
        <DashboardLayout 
            title="Class Photo Gallery" 
            showBackButton={false} 
            rightActions={
                <div className="flex items-center gap-3">
                    {/* ONLY SHOW THESE ACTIONS IF OFFICER */}
                    {userRole === 'officer' && (
                        <>
                            <button 
                                onClick={() => setIsBackupModalOpen(true)}
                                className="flex items-center gap-2 bg-[#B30000] text-white border border-white/20 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#990000] transition-colors shadow-sm"
                            >
                                <Download size={16} strokeWidth={2.5} /> Backup/Restore
                            </button>

                            <button 
                                onClick={handleOpenCreate}
                                className="flex items-center gap-2 bg-white text-[#CC0000] px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <Plus size={18} strokeWidth={2.5} /> Add Album
                            </button>
                        </>
                    )}
                </div>
            }
        >
            <div className="w-full max-w-[1600px] mx-auto -mt-6 relative z-10 mt-[30px]">
                
                {/* PHOTO ALBUMS GRID */}
                {albums.length === 0 ? (
                    <div className="w-full bg-white border border-dashed border-gray-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-sm">
                        <p className="text-gray-400 font-bold mb-2 text-lg">No albums yet!</p>
                        <p className="text-gray-400 text-sm">Click "Add Album" to create your first gallery folder.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {albums.map(album => (
                            <div key={album.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
                                
                                {/* Cover Image */}
                                <div className="h-56 w-full overflow-hidden relative bg-gray-100">
                                    <img 
                                        src={album.coverImage} 
                                        alt={album.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                {/* Card Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 pr-4">{album.title}</h3>
                                        
                                        {/* ONLY SHOW EDIT/DELETE ICONS IF OFFICER */}
                                        {userRole === 'officer' && (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <button onClick={() => handleOpenEdit(album)} className="hover:text-gray-800 transition-colors">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => { setDeletingAlbumId(album.id); setIsDeleteModalOpen(true); }} className="hover:text-[#CC0000] transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2 leading-relaxed">
                                        {album.desc}
                                    </p>

                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6 tracking-wide">
                                        <Calendar size={14} className="mb-0.5" />
                                        <span>{formatDate(album.date)}</span>
                                        <span className="mx-1">•</span>
                                        <span>{album.itemCount} ITEMS</span>
                                    </div>

                                    {/* Redirect to Google Drive - VISIBLE TO EVERYONE */}
                                    <button 
                                        onClick={() => window.open(album.driveLink, '_blank')}
                                        className="w-full py-3.5 rounded-xl bg-[#CC0000] text-white font-bold text-sm hover:bg-red-800 transition-colors shadow-sm"
                                    >
                                        View Images
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* ==================================================
                ADD / EDIT ALBUM MODAL (Officers Only)
            ================================================== */}
            {userRole === 'officer' && isAlbumModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAlbumModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">{editingAlbumId ? 'Edit Album' : 'Create New Album'}</h2>
                            <button onClick={() => setIsAlbumModalOpen(false)} className="text-gray-400 hover:text-gray-800"><X size={24} /></button>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Album Name</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Gala 2024" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-200 text-gray-800" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Event Date</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-200 text-gray-800" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Description (Optional)</label>
                                <textarea rows="3" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief details about the event..." className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-200 resize-none text-gray-800"></textarea>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Google Drive Folder Link</label>
                                <input type="url" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="https://drive.google.com/..." className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-200 text-gray-800" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Upload Cover Image</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative overflow-hidden group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                                    />
                                    
                                    {coverImage ? (
                                        <img src={coverImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                                    ) : null}

                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-3 relative z-10 group-hover:bg-red-50 group-hover:text-[#CC0000] transition-colors">
                                        <UploadCloud size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 relative z-10">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-1 relative z-10">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center gap-4">
                            <button onClick={() => setIsAlbumModalOpen(false)} className="px-8 py-3 rounded-xl border border-[#CC0000] text-[#CC0000] font-bold hover:bg-red-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveAlbum} className="px-8 py-3 rounded-xl bg-[#CC0000] text-white font-bold hover:bg-red-800 transition-colors shadow-sm">
                                {editingAlbumId ? 'Save Changes' : 'Create Album'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================
                BACKUP / RESTORE MODAL (Officers Only)
            ================================================== */}
            {userRole === 'officer' && isBackupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsBackupModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Backup & Restore</h2>
                            <button onClick={() => setIsBackupModalOpen(false)} className="text-gray-400 hover:text-gray-800">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                            Save a secure copy of your photo gallery settings (including Google Drive links), or restore them from a previous backup file.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={handleDownloadBackup}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-bold hover:bg-gray-100 transition-colors"
                            >
                                <Download size={20} className="text-[#CC0000]" />
                                Download Backup (.json)
                            </button>

                            <div className="relative w-full">
                                <input 
                                    type="file" 
                                    accept=".json"
                                    onChange={handleRestoreBackup}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <button className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#CC0000] text-white font-bold hover:bg-red-800 transition-colors shadow-sm pointer-events-none">
                                    <UploadCloud size={20} />
                                    Restore from File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================
                DELETE ALBUM MODAL (Officers Only)
            ================================================== */}
            {userRole === 'officer' && isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <TriangleAlert size={32} className="text-[#CC0000]" strokeWidth={2.5} />
                            <h2 className="text-3xl font-bold text-gray-900">Delete Album?</h2>
                        </div>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to delete this album? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-lg">
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