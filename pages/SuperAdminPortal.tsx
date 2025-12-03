import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { firebaseUsersService, firebaseDepartmentsService } from '../services/firebaseService';
import { User, Role, Department } from '../types';
import { Upload, Plus, Users, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Trash2, Database, RefreshCw, Pencil, X, Building2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { USE_MOCK_DATA } from '../config/firebase';

const SuperAdminPortal: React.FC = () => {
  // User State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkUploadErrors, setBulkUploadErrors] = useState<{
    successCount: number;
    failedCount: number;
    errors: Array<{ email: string; reason: string }>;
  } | null>(null);
  const [isErrorDetailsOpen, setIsErrorDetailsOpen] = useState(false);

  // Department State (for dropdowns)
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Bulk Selection & Pagination States
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [usersPerPage] = useState(10);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

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
    setIsBulkDeleteModalOpen(false);
    setSelectedUserIds(new Set());
  };

  // Pagination helpers
  const getPaginatedUsers = () => {
    const startIndex = (currentUserPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return users.slice(startIndex, endIndex);
  };

  const totalUserPages = Math.ceil(users.length / usersPerPage);

  // Checkbox handlers
  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      const paginatedUsers = getPaginatedUsers();
      setSelectedUserIds(new Set(paginatedUsers.map(u => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const isAllUsersSelected = () => {
    const paginatedUsers = getPaginatedUsers();
    return paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.has(u.id));
  };

  const isSomeUsersSelected = () => {
    const paginatedUsers = getPaginatedUsers();
    return paginatedUsers.some(u => selectedUserIds.has(u.id)) && !isAllUsersSelected();
  };

  // Update indeterminate state of select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeUsersSelected();
    }
  }, [selectedUserIds, currentUserPage, users]);

  // Bulk delete handler
  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.size === 0) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const userIdsArray = Array.from(selectedUserIds);
      let successCount = 0;
      let failCount = 0;

      for (const userId of userIdsArray) {
        try {
          await firebaseUsersService.deleteUser(userId);
          successCount++;
        } catch (err: any) {
          console.error(`Failed to delete user ${userId}:`, err);
          failCount++;
        }
      }

      if (failCount > 0) {
        setError(`Bulk delete completed. Successfully deleted: ${successCount}, Failed: ${failCount}`);
      } else {
        setSuccess(`Successfully deleted ${successCount} user(s)`);
      }

      setSelectedUserIds(new Set());
      setIsBulkDeleteModalOpen(false);
      fetchUsers();
      
      // Reset to first page if current page becomes empty
      const newTotalPages = Math.ceil((users.length - successCount) / usersPerPage);
      if (currentUserPage > newTotalPages && newTotalPages > 0) {
        setCurrentUserPage(newTotalPages);
      } else if (newTotalPages === 0) {
        setCurrentUserPage(1);
      }
    } catch (err: any) {
      setError('Failed to delete users: ' + err.message);
    } finally {
      setActionLoading(false);
    }
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
    setBulkUploadErrors(null);
    setIsErrorDetailsOpen(false);
    setActionLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Valid roles for bulk upload (only manager and executive allowed)
      const validRoles: Role[] = ['manager', 'executive'];
      
      // Create a map for case-insensitive department lookup that returns exact database name
      const departmentMap = new Map<string, string>();
      departments.forEach(dept => {
        const key = dept.name.toLowerCase().trim();
        departmentMap.set(key, dept.name); // Store exact database name
      });
      
      // Get existing user emails (case-insensitive)
      const existingEmails = new Set(users.map(u => u.email.toLowerCase().trim()));
      
      // Track results
      let successCount = 0;
      const csvEmails = new Set<string>(); // Track emails in CSV for duplicate detection
      const addedEmails = new Set<string>(); // Track emails successfully added in this batch
      
      // First pass: Validate all rows
      const validationErrors: Array<{ email: string; reason: string }> = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        const email = normalizedRow.email?.toString().trim();
        const password = normalizedRow.password?.toString();
        const role = normalizedRow.role?.toString().toLowerCase().trim() || 'executive';
        const department = normalizedRow.department?.toString().trim();

        // Validate email
        if (!email) {
          validationErrors.push({ email: `Row ${i + 2}`, reason: 'Email is required' });
          continue;
        }

        const emailLower = email.toLowerCase();

        // Check for duplicate in CSV
        if (csvEmails.has(emailLower)) {
          validationErrors.push({ email, reason: 'Duplicate email in CSV file' });
          continue;
        }
        csvEmails.add(emailLower);

        // Check if email already exists in database or was added in this batch
        if (existingEmails.has(emailLower) || addedEmails.has(emailLower)) {
          validationErrors.push({ email, reason: 'Email already exists in database' });
          continue;
        }

        // Validate password
        if (!password) {
          validationErrors.push({ email, reason: 'Password is required' });
          continue;
        }

        // Validate role (only manager and executive allowed for bulk upload)
        if (!validRoles.includes(role as Role)) {
          validationErrors.push({ 
            email, 
            reason: `Invalid role "${role}". Only "manager" and "executive" roles are allowed for bulk upload. Admin and super_admin roles cannot be created via bulk upload.` 
          });
          continue;
        }

        // Validate department for manager and executive roles
        let validatedDepartment: string | undefined = undefined;
        if (role === 'manager' || role === 'executive') {
          if (!department) {
            validationErrors.push({ email, reason: 'Department is required for manager/executive roles' });
            continue;
          }
          
          // Check if department exists in database (case-insensitive lookup)
          const deptLower = department.toLowerCase().trim();
          const exactDeptName = departmentMap.get(deptLower);
          
          if (!exactDeptName) {
            validationErrors.push({ 
              email, 
              reason: `Department "${department}" does not exist in database. Available departments: ${departments.map(d => d.name).join(', ')}` 
            });
            continue;
          }
          
          // Use the exact department name from database (not user-provided)
          validatedDepartment = exactDeptName;
        }

        // All validations passed, add user
        try {
          await firebaseUsersService.addUser({
            email,
            password,
            role: role as Role,
            department: validatedDepartment,
            name: email.split('@')[0],
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`
          });
          successCount++;
          addedEmails.add(emailLower); // Track successfully added email
        } catch (err: any) {
          validationErrors.push({ 
            email, 
            reason: err.message || 'Failed to add user' 
          });
        }
      }

      // Update existing emails list for next iteration
      if (successCount > 0) {
        await fetchUsers();
      }

      // Show results
      if (validationErrors.length > 0) {
        setBulkUploadErrors({
          successCount,
          failedCount: validationErrors.length,
          errors: validationErrors
        });
        setError(''); // Clear simple error
        setIsErrorDetailsOpen(true); // Auto-expand error details
      } else if (successCount > 0) {
        setBulkUploadErrors(null);
        setIsErrorDetailsOpen(false);
        setSuccess(`Bulk upload successful! Added ${successCount} user(s).`);
      } else {
        setBulkUploadErrors(null);
        setIsErrorDetailsOpen(false);
        setError('No users were added. Please check your file format and data.');
      }

      e.target.value = '';
    } catch (err: any) {
      setError('Failed to process file: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };



  return (
    <>
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
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 whitespace-pre-line text-sm">{error}</div>
            </div>
          </div>
        )}
        {bulkUploadErrors && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden">
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-red-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-red-400 font-medium text-sm sm:text-base">
                        Bulk upload completed with errors
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-red-300/80">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                          <span>Successfully added: <span className="font-semibold text-emerald-400">{bulkUploadErrors.successCount}</span></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <AlertCircle size={14} className="flex-shrink-0" />
                          <span>Failed: <span className="font-semibold">{bulkUploadErrors.failedCount}</span></span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsErrorDetailsOpen(!isErrorDetailsOpen)}
                      className="flex items-center justify-center gap-1.5 text-red-400 hover:text-red-300 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 border border-red-500/20 sm:border-0 sm:w-auto w-full"
                    >
                      {isErrorDetailsOpen ? (
                        <>
                          <span>Hide Details</span>
                          <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          <span>View Details</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>
                  
                  {isErrorDetailsOpen && (
                    <div className="mt-4 pt-4 border-t border-red-500/20">
                      <div className="max-h-64 sm:max-h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {bulkUploadErrors.errors.map((err, index) => (
                          <div
                            key={index}
                            className="bg-dark-900/50 border border-red-500/10 rounded-lg p-3 text-sm hover:bg-dark-900/70 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-red-300 font-medium break-words text-sm sm:text-base">{err.email}</p>
                                <p className="text-red-400/80 text-xs sm:text-sm mt-1.5 break-words leading-relaxed">{err.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {bulkUploadErrors.errors.length > 20 && (
                        <p className="text-xs text-red-400/60 mt-3 text-center">
                          Showing all {bulkUploadErrors.errors.length} errors. Scroll to see more.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
        <div className="p-6 border-b border-dark-700 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">Registered Users</h2>
            {selectedUserIds.size > 0 && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                Delete Selected ({selectedUserIds.size})
              </button>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="bg-dark-900 text-gray-400 text-sm">
                <th className="p-4 font-medium w-12">
                  <input
                    type="checkbox"
                    checked={isAllUsersSelected()}
                    ref={selectAllCheckboxRef}
                    onChange={(e) => handleSelectAllUsers(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading users...
                    </td>
                </tr>
                ) : users.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                    No users found. Initialize DB or add a user.
                    </td>
                </tr>
                ) : (
                getPaginatedUsers().map((user) => (
                    <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-750 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                      />
                    </td>
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
        
        {/* Pagination */}
        {users.length > 0 && (
          <div className="p-4 border-t border-dark-700 flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-400">
              Showing {(currentUserPage - 1) * usersPerPage + 1} to {Math.min(currentUserPage * usersPerPage, users.length)} of {users.length} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentUserPage(prev => Math.max(1, prev - 1));
                  setSelectedUserIds(new Set()); // Clear selections on page change
                }}
                disabled={currentUserPage === 1}
                className="p-2 rounded-lg border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalUserPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    if (totalUserPages <= 7) return true;
                    if (page === 1 || page === totalUserPages) return true;
                    if (Math.abs(page - currentUserPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => {
                            setCurrentUserPage(page);
                            setSelectedUserIds(new Set()); // Clear selections on page change
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentUserPage === page
                              ? 'bg-primary-600 text-white'
                              : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              <button
                onClick={() => {
                  setCurrentUserPage(prev => Math.min(totalUserPages, prev + 1));
                  setSelectedUserIds(new Set()); // Clear selections on page change
                }}
                disabled={currentUserPage === totalUserPages}
                className="p-2 rounded-lg border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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

      {/* Bulk Delete Users Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Selected Users?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">{selectedUserIds.size}</span> selected user(s)? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsBulkDeleteModalOpen(false);
                    setSelectedUserIds(new Set());
                  }}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteUsers}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : `Delete ${selectedUserIds.size} User(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </>
  );
};

export default SuperAdminPortal;
