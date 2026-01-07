import React, { useState, useEffect, useRef } from 'react';
import supabase from '../../config/supabase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: { username: string; email: string; avatar_url?: string };
  onSave: (username: string, email: string, avatar_url?: string) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const [form, setForm] = useState(initialData);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setForm(initialData);
    setMessage('');
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Manually construct the URL as per user requirement
      const manualUrl = `https://qkkvavhvyidylqjgbsrs.supabase.co/storage/v1/object/public/avatars/${filePath}`;

      setForm(prev => ({ ...prev, avatar_url: manualUrl }));
      setMessage('Image uploaded! Click Save to apply.');

    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage('Error uploading image. Check Supabase bucket permissions.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(form.username, form.email, form.avatar_url);
      setMessage('Success! Closing...');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setMessage(err.message || 'Update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] w-full max-w-md p-6 rounded-xl border border-slate-600 shadow-2xl relative animate-fadeIn">
        <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-500 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={form.avatar_url || "/api/placeholder/200/200"}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-xs font-bold text-white">CHANGE</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {uploading && <span className="text-xs text-blue-400 animate-pulse">Uploading...</span>}
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#0f172a] border border-slate-600 rounded px-3 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#0f172a] border border-slate-600 rounded px-3 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {message && (
            <div className={`text-sm font-bold text-center ${message.includes('Success') || message.includes('Image') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-semibold transition text-sm">CANCEL</button>
            <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition text-sm disabled:opacity-50">
              SAVE CHANGES
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;