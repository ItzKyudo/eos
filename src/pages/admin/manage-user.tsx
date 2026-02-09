import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Swal from 'sweetalert2'; // Import SweetAlert2
import {
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';

interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  profiles?: {
    country_flag: string;
    rating_classic: number;
    last_seen: string;
  };
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', role: '' });
  const API_URL = 'https://eos-server-jxy0.onrender.com';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/users?page=${page}&search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        // Handle both Array and Object responses safely
        if (Array.isArray(data)) {
          setUsers(data);
          setTotalPages(1);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
          setTotalPages(data.totalPages || 1);
        } else {
          setUsers([]);
        }
      } else {
        console.error("Fetch failed:", data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Network error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);
  const handleBanToggle = async (userId: string, currentRole: string) => {
    const action = currentRole === 'banned' ? 'unban' : 'ban';
    const actionText = currentRole === 'banned' ? 'Unban' : 'Ban';
    const confirmColor = currentRole === 'banned' ? '#10B981' : '#d33';
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you really want to ${actionText.toLowerCase()} this user?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${actionText} them!`
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        // 2. Success Notification
        Swal.fire(
          'Success!',
          `User has been ${action}ned successfully.`,
          'success'
        );
        fetchUsers();
      } else {
        // Error Notification
        const err = await res.json();
        Swal.fire('Error', err.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error occurred', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    // 1. Password Verification Step
    const { value: password } = await Swal.fire({
      title: 'Admin Verification',
      text: 'Enter your password to proceed',
      input: 'password',
      inputPlaceholder: 'Enter your password',
      showCancelButton: true,
      confirmButtonText: 'Verify',
      confirmButtonColor: '#e63e3e',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter your password!';
        }
        return null;
      }
    });

    if (!password) return; // User cancelled

    try {
      const token = localStorage.getItem('token');
      // Verify Password with Backend
      const verifyRes = await fetch(`${API_URL}/api/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (!verifyRes.ok) {
        Swal.fire('Error', 'Incorrect password. Action denied.', 'error');
        return;
      }

      // 2. Phrase Confirmation Step
      const { value: phrase } = await Swal.fire({
        title: 'Final Confirmation',
        text: 'Type "I want to delete this user" to confirm.',
        input: 'text',
        inputPlaceholder: 'I want to delete this user',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Permanently Delete',
        inputValidator: (value) => {
          if (value !== 'I want to delete this user') {
            return 'Incorrect phrase. Deletion cancelled.';
          }
          return null;
        }
      });

      if (!phrase) return; // User failed or cancelled

      // 3. Execute Soft Delete
      const deleteRes = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (deleteRes.ok) {
        Swal.fire(
          'Deleted!',
          'User account has been anonymized and deactivated.',
          'success'
        );
        fetchUsers();
      } else {
        const err = await deleteRes.json();
        Swal.fire('Error', err.message || 'Failed to delete user', 'error');
      }

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Network error occurred', 'error');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({ username: user.username, email: user.email, role: user.role });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'User details have been saved successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const err = await res.json();
        Swal.fire('Error', err.message || 'Failed to update user', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error occurred', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage player accounts and roles</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400 flex justify-center items-center gap-2"><Loader className="animate-spin" /> Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No users found</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                          {user.profiles?.country_flag || '🌍'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'banned' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <Ban size={12} /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded transition-colors"
                        title="Edit User"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleBanToggle(user.user_id, user.role)}
                        className={`p-2 rounded transition-colors ${user.role === 'banned' ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                        title={user.role === 'banned' ? 'Unban' : 'Ban'}
                      >
                        {user.role === 'banned' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user.user_id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Edit User</h3>
              <button onClick={() => setEditingUser(null)}><XCircle size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="player">Player</option>
                  <option value="admin">Admin</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;