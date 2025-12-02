import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { firebaseDepartmentsService } from '../services/firebaseService';
import { Department } from '../types';
import { Upload, Plus, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Trash2, Database, Building2, Pencil, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { USE_MOCK_DATA } from '../config/firebase';

const DepartmentManagement: React.FC = () => {
  // Department State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHod, setNewDeptHod] = useState('');

  // Modal States
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isDeleteDeptModalOpen, setIsDeleteDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptHod, setEditDeptHod] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

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
    setNewDeptName('');
    setNewDeptHod('');
    setSelectedDept(null);
    setIsDeleteDeptModalOpen(false);
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      if (!newDeptName || !newDeptHod) {
        throw new Error('Department Name and HOD Name are required');
      }

      await firebaseDepartmentsService.addDepartment({
        name: newDeptName,
        hodName: newDeptHod
      });

      setSuccess(`Department ${newDeptName} added successfully`);
      resetForm();
      fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to add department');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteDeptModal = (dept: Department) => {
    setSelectedDept(dept);
    setIsDeleteDeptModalOpen(true);
  };

  const confirmDeleteDept = async () => {
    if (!selectedDept) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await firebaseDepartmentsService.deleteDepartment(selectedDept.id);
      setSuccess('Department deleted successfully');
      resetForm();
      fetchDepartments();
    } catch (err: any) {
      setError('Failed to delete department: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDeptModal = (dept: Department) => {
    setSelectedDept(dept);
    setEditDeptName(dept.name);
    setEditDeptHod(dept.hodName);
    setIsEditDeptModalOpen(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
        await firebaseDepartmentsService.updateDepartment(selectedDept.id, {
            name: editDeptName,
            hodName: editDeptHod
        });
        setSuccess('Department updated successfully');
        setIsEditDeptModalOpen(false);
        setSelectedDept(null);
        fetchDepartments();
    } catch (err: any) {
        setError('Failed to update department: ' + err.message);
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const deptsToAdd: Omit<Department, 'id'>[] = [];

      for (const row of jsonData) {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          // Normalize keys to handle case sensitivity and spaces
          // Expected: departmentName, hodName
          const cleanKey = key.toLowerCase().replace(/\s/g, '');
          if (cleanKey.includes('department') || cleanKey === 'name') normalizedRow.name = row[key];
          if (cleanKey.includes('hod')) normalizedRow.hodName = row[key];
        });

        if (normalizedRow.name && normalizedRow.hodName) {
          deptsToAdd.push({
            name: normalizedRow.name,
            hodName: normalizedRow.hodName
          });
        } else {
            failCount++;
        }
      }

      if (deptsToAdd.length > 0) {
          await firebaseDepartmentsService.bulkAddDepartments(deptsToAdd);
          successCount = deptsToAdd.length;
      }

      setSuccess(`Bulk upload complete. Added: ${successCount}, Failed/Skipped: ${failCount}`);
      fetchDepartments();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <h3 className="text-gray-400">Total Departments</h3>
            <Building2 className="text-primary-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{departments.length}</p>
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

        {/* Department Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Single Department */}
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={20} className="text-primary-500" />
            Add New Department
            </h2>
            <form onSubmit={handleAddDepartment} className="space-y-4" autoComplete="off">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Department Name</label>
                <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                placeholder="e.g., Marketing"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">HOD Name</label>
                <input
                type="text"
                value={newDeptHod}
                onChange={(e) => setNewDeptHod(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                placeholder="e.g., John Smith"
                required
                />
            </div>

            <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                Add Department
            </button>
            </form>
        </div>

        {/* Bulk Upload Departments */}
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-emerald-500" />
            Bulk Upload Departments
            </h2>
            <div className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors">
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleDeptFileUpload}
                className="hidden"
                id="dept-file-upload"
                disabled={actionLoading}
            />
            <label
                htmlFor="dept-file-upload"
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
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="bg-dark-800 p-2 rounded">Department Name</div>
                <div className="bg-dark-800 p-2 rounded">HOD Name</div>
            </div>
            </div>
        </div>
        </div>

        {/* Departments List */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="p-6 border-b border-dark-700">
            <h2 className="text-xl font-bold text-white">Departments</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="bg-dark-900 text-gray-400 text-sm">
                <th className="p-4 font-medium">Department Name</th>
                <th className="p-4 font-medium">HOD Name</th>
                <th className="p-4 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {deptLoading ? (
                <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading departments...
                    </td>
                </tr>
                ) : departments.length === 0 ? (
                <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                    No departments found. Add a department.
                    </td>
                </tr>
                ) : (
                departments.map((dept) => (
                    <tr key={dept.id} className="border-b border-dark-700 hover:bg-dark-750 transition-colors">
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                            <Building2 size={16} />
                        </div>
                        <span className="text-white font-medium">{dept.name}</span>
                        </div>
                    </td>
                    <td className="p-4 text-gray-300">
                        {dept.hodName}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => openEditDeptModal(dept)}
                                className="p-2 hover:bg-dark-600 rounded-lg text-gray-400 hover:text-primary-400 transition-colors"
                                title="Edit Department"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => openDeleteDeptModal(dept)}
                                className="p-2 hover:bg-dark-600 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete Department"
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

        {/* Edit Department Modal */}
        {isEditDeptModalOpen && selectedDept && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Edit Department</h3>
                        <button onClick={() => setIsEditDeptModalOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleUpdateDepartment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Department Name</label>
                            <input
                                type="text"
                                value={editDeptName}
                                onChange={(e) => setEditDeptName(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">HOD Name</label>
                            <input
                                type="text"
                                value={editDeptHod}
                                onChange={(e) => setEditDeptHod(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditDeptModalOpen(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-dark-600 text-gray-300 hover:bg-dark-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Delete Department Confirmation Modal */}
        {isDeleteDeptModalOpen && selectedDept && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="text-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Department?</h3>
                <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">{selectedDept.name}</span>? This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                <button
                    onClick={resetForm}
                    className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={confirmDeleteDept}
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
      </div>
    </>
  );
};

export default DepartmentManagement;