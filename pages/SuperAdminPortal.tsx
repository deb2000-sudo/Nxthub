import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { firebaseUsersService, firebaseDepartmentsService } from '../services/firebaseService';
import { User, Role, Department } from '../types';
import { Upload, Plus, Users, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Trash2, Database, RefreshCw, Pencil, X, Building2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { USE_MOCK_DATA } from '../config/firebase';

const SuperAdminPortal: React.FC = () => {
  // User State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Department State (for dropdowns)
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // User Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('executive');
  const [newUserDepartment, setNewUserDepartment] = useState('');

  useEffect(() => {
    fetchDepartments(); // Always fetch departments for dropdowns
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await firebaseUsersService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDeptLoading(true);
      const fetchedDepts = await firebaseDepartmentsService.getDepartments();
      setDepartments(fetchedDepts);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
    } finally {
      setDeptLoading(false);
    }
  };

  const resetForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('executive');
    setNewUserDepartment('');
    setSelectedUser(null);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  // --- User Management Handlers ---

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      if (!newUserEmail || (!newUserPassword && !selectedUser)) {
        throw new Error('Email and password are required');
      }

      await firebaseUsersService.addUser({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        department: (newUserRole === 'manager' || newUserRole === 'executive') ? newUserDepartment : undefined,
        name: newUserEmail.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${newUserEmail}&background=random`
      });

      setSuccess(`User ${newUserEmail} ${selectedUser ? 'updated' : 'saved'} successfully`);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setNewUserEmail(user.email);
    setNewUserRole(user.role);
    setNewUserDepartment(user.department || '');
    setNewUserPassword(''); // Reset password field
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await firebaseUsersService.deleteUser(selectedUser.id);
      setSuccess('User deleted successfully');
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError('Failed to delete user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      let successCount = 0;
      let failCount = 0;

      for (const row of jsonData) {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        const email = normalizedRow.email;
        const password = normalizedRow.password;
        const role = (normalizedRow.role || 'executive').toLowerCase();
        const department = normalizedRow.department;

        if (email && password) {
          try {
            await firebaseUsersService.addUser({
              email,
              password,
              role: role as Role,
              department: (role === 'manager' || role === 'executive') ? department : undefined,
              name: email.split('@')[0],
              avatar: `https://ui-avatars.com/api/?name=${email}&background=random`
            });
            successCount++;
          } catch (err) {
            console.error(`Failed to add user ${email}:`, err);
            failCount++;
          }
        }
      }

      setSuccess(`Bulk upload complete. Added: ${successCount}, Failed: ${failCount}`);
      fetchUsers();
      e.target.value = '';
    } catch (err: any) {
      setError('Failed to process file: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };



  return (
    <Layout title="Admin Portal" role="super_admin">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">Database Status</h3>
              <Database className={USE_MOCK_DATA ? "text-yellow-500" : "text-emerald-500"} size={24} />
            </div>
            <p className="text-lg font-bold text-white mb-2">
              {USE_MOCK_DATA ? 'Mock Mode' : 'Connected'}
            </p>
          </div>
          
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400">Total Users</h3>
            <Users className="text-primary-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400">Managers</h3>
            <Users className="text-emerald-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">
            {users.filter(u => u.role === 'manager').length}
            </p>
          </div>
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400">Executives</h3>
            <Users className="text-blue-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">
            {users.filter(u => u.role === 'executive').length}
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        {/* Content Area */}
        {/* User Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Single User */}
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={20} className="text-primary-500" />
            Add New User
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4" autoComplete="off">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                placeholder="user@example.com"
                required
                autoComplete="new-password"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                placeholder="Password"
                required
                autoComplete="new-password"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as Role)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                <option value="executive">Executive</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                </select>
            </div>
            
            {(newUserRole === 'manager' || newUserRole === 'executive') && (
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
                <select
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                    required
                >
                    <option value="" disabled>Select Department</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                </select>
                </div>
            )}

            <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                Add User
            </button>
            </form>
        </div>

        {/* Bulk Upload Users */}
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-emerald-500" />
            Bulk Upload Users
            </h2>
            <div className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors">
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleUserFileUpload}
                className="hidden"
                id="user-file-upload"
                disabled={actionLoading}
            />
            <label
                htmlFor="user-file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
            >
                <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center">
                {actionLoading ? (
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                ) : (
                    <Upload className="text-gray-400" size={32} />
                )}
                </div>
                <div>
                <p className="text-white font-medium">Click to upload sheet</p>
                <p className="text-sm text-gray-500 mt-1">Supports .xlsx, .csv</p>
                </div>
            </label>
            </div>
            <div className="mt-4 p-4 bg-dark-900 rounded-lg text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-2">Expected Format:</p>
            <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                <div className="bg-dark-800 p-2 rounded">email</div>
                <div className="bg-dark-800 p-2 rounded">password</div>
                <div className="bg-dark-800 p-2 rounded">role</div>
                <div className="bg-dark-800 p-2 rounded">department</div>
            </div>
            </div>
        </div>
        </div>

        {/* Users List */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="p-6 border-b border-dark-700">
            <h2 className="text-xl font-bold text-white">Registered Users</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="bg-dark-900 text-gray-400 text-sm">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading users...
                    </td>
                </tr>
                ) : users.length === 0 ? (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                    No users found. Initialize DB or add a user.
                    </td>
                </tr>
                ) : (
                users.map((user) => (
                    <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-750 transition-colors">
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                        />
                        <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                        </div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' || user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                        user.role === 'manager' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-blue-500/10 text-blue-400'
                        }`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td className="p-4 text-gray-300">
                        {user.department || '-'}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => openEditModal(user)}
                            className="p-2 hover:bg-dark-600 rounded-lg text-gray-400 hover:text-primary-400 transition-colors"
                            title="Edit User"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => openDeleteModal(user)}
                            className="p-2 hover:bg-dark-600 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete User"
                        >
                            <Trash2 size={16} />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Pencil size={20} className="text-primary-500" />
              Edit User
            </h2>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  disabled
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  placeholder="Leave empty to keep current"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="executive">Executive</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {(newUserRole === 'manager' || newUserRole === 'executive') && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
                  <select
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                    required
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete User?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">{selectedUser.email}</span>? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </Layout>
  );
};

export default SuperAdminPortal;
