import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLocation } from 'react-router-dom';
import { User, Role, Department } from '../types';
import { firebaseUsersService, firebaseDepartmentsService } from '../services/firebaseService';
import { USE_MOCK_DATA } from '../config/firebase';
import { MOCK_USERS } from '../constants';
import { Users, Shield, Building2, Crown, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const RoleAssignment: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentUserEmail = params.get('email');

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [fetchedDepts] = await Promise.all([
            firebaseDepartmentsService.getDepartments()
        ]);
        setDepartments(fetchedDepts);

        if (USE_MOCK_DATA) {
          setUsers(MOCK_USERS);
        } else {
          const allUsers = await firebaseUsersService.getUsers();
          setUsers(allUsers);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setToast({ message: 'Failed to load data', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleUpdate = async (userId: string, newRole: Role, newDepartment?: string) => {
    try {
      if (USE_MOCK_DATA) {
        // Update in local state for mock mode
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, role: newRole, department: newDepartment || u.department }
            : u
        ));
        setToast({ message: 'Role updated successfully (mock mode)', type: 'success' });
      } else {
        await firebaseUsersService.updateUserRole(userId, newRole, newDepartment);
        // Reload users
        const updatedUsers = await firebaseUsersService.getUsers();
        setUsers(updatedUsers);
        setToast({ message: 'Role updated successfully', type: 'success' });
      }
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating role:', error);
      setToast({ message: 'Failed to update role', type: 'error' });
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin':
        return <Crown className="text-purple-500" size={18} />;
      case 'executive':
        return <Shield className="text-emerald-500" size={18} />;
      case 'manager':
        return <Building2 className="text-blue-500" size={18} />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'executive':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'manager':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Edit Modal Component
  const EditRoleModal = () => {
    if (!editingUser) return null;

    const [selectedRole, setSelectedRole] = useState<Role>(editingUser.role);
    const [selectedDepartment, setSelectedDepartment] = useState<string>(editingUser.department || '');

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
      >
        <div 
          className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-700">
            <div>
              <h2 className="text-xl font-bold text-white">Edit User Role</h2>
              <p className="text-gray-400 text-sm mt-1">{editingUser.email}</p>
            </div>
            <button 
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="manager">Manager</option>
                <option value="executive">Executive</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {selectedRole === 'manager' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(selectedRole === 'executive' || selectedRole === 'admin') && selectedDepartment && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Department (Optional)</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">None</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-700">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }}
              className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedRole === 'manager' && !selectedDepartment) {
                  setToast({ message: 'Department is required for managers', type: 'error' });
                  return;
                }
                handleRoleUpdate(editingUser.id, selectedRole, selectedDepartment || undefined);
              }}
              className="px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <p className="text-gray-400">Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-2xl border flex items-center gap-3 animation-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-900/90 border-emerald-500 text-white' 
            : 'bg-red-900/90 border-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Role Assignment</h1>
          <p className="text-gray-400">Manage user roles and permissions</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500 w-full md:w-64 text-slate-200 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-dark-800/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-white/5 bg-dark-900/50">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full object-cover border border-dark-700"
                      />
                      <span className="font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.department ? (
                      <span className="px-2.5 py-1 rounded-md bg-dark-900 border border-dark-700 text-xs font-medium text-gray-300">
                        {user.department}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setIsEditModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-colors text-sm font-medium"
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && <EditRoleModal />}
    </Layout>
  );
};

export default RoleAssignment;

