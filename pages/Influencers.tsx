import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import { Influencer, Department, Campaign } from '../types';
import { dataService } from '../services/dataService';
import { firebaseDepartmentsService, firebaseRequestsService, firebaseInfluencersService } from '../services/firebaseService';
import { getSession } from '../services/authService';
import { MOCK_USERS } from '../constants';
import SearchableSelect, { Option } from '../components/SearchableSelect';
import SimpleSelect from '../components/SimpleSelect';
import MultiSelect from '../components/MultiSelect';
import { Search, Filter, Grid, List, Plus, X, Instagram, Youtube, ChevronDown, ChevronUp, Check, Pencil, Trash2, AlertTriangle, Users, User, Calendar, Lock, Clock, CheckCircle2, Loader2, Briefcase, IndianRupee, AlertCircle } from 'lucide-react';

// --- Component: Delete Confirmation Modal ---
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl border-l-4 border-l-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                <AlertTriangle size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">Delete Influencer?</h3>
                <p className="text-gray-400 text-sm mt-1">
                    Are you sure you want to delete this influencer? This action cannot be undone.
                </p>
            </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 mt-6">
            <button 
                onClick={onClose} 
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors text-sm font-medium"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm} 
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm shadow-lg shadow-red-600/20 flex items-center gap-2"
            >
                <Trash2 size={16} />
                Delete
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Component: Influencer Form Modal (Defined outside for stability) ---
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Influencer) => void;
  onDelete: (id: string) => void;
  editingInfluencer: Influencer | null;
  currentUserEmail: string | null;
  currentUserRole: string | null;
  currentUserDepartment?: string;
  departments: Department[];
}

const InfluencerFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, onSubmit, onDelete, editingInfluencer, currentUserEmail, currentUserRole, currentUserDepartment, departments }) => {
  const isEditMode = !!editingInfluencer;
  
  const availableLanguages = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'];
  const languageFormOptions: Option[] = availableLanguages.map(lang => ({ value: lang, label: lang }));

  // Check delete permission: Only Owner can delete (Managers and Executives for their own)
  const canDelete = isEditMode && (
    editingInfluencer?.createdBy && editingInfluencer.createdBy === currentUserEmail
  );

  // Helper to split existing mobile number into code and number
  const splitMobile = (fullMobile: string) => {
    if (!fullMobile) return { code: '+91', number: '' };
    const parts = fullMobile.split(' ');
    // Simple logic: if first part starts with +, treat as code
    if (parts.length > 1 && parts[0].startsWith('+')) {
        return { code: '+91', number: parts.slice(1).join(' ') }; // Always use +91
    }
    return { code: '+91', number: fullMobile };
  };

  const initialMobile = editingInfluencer?.mobile ? splitMobile(editingInfluencer.mobile) : { code: '+91', number: '' };

  // Store original influencer data for comparison
  const getOriginalFormData = useMemo(() => {
    if (!editingInfluencer || !isEditMode) return null;
    const originalMobile = splitMobile(editingInfluencer.mobile || '');
    const influencerStatus = editingInfluencer?.lastPromoBy ? 'existing' : 'new';
    return {
      fullName: editingInfluencer.name || '',
      email: editingInfluencer.email || '',
      mobileCountryCode: '+91',
      mobileNumber: originalMobile.number,
      pan: editingInfluencer.pan || '',
      platform1_name: 'Instagram',
      platform1_channel: editingInfluencer.platforms?.instagramChannel || '',
      platform1_username: editingInfluencer.platforms?.instagram || '',
      platform2_name: 'YouTube',
      platform2_channel: editingInfluencer.platforms?.youtubeChannel || '',
      platform2_username: editingInfluencer.platforms?.youtube || '',
      category: editingInfluencer.category || '',
      influencerType: editingInfluencer.type || '',
      languages: editingInfluencer.language ? editingInfluencer.language.split(', ') : [] as string[],
      influencerStatus: influencerStatus as 'new' | 'existing',
      lastPromoBy: editingInfluencer.lastPromoBy || '',
      lastPromoDate: editingInfluencer.lastPromoDate || '',
      lastPricePaid: editingInfluencer.lastPricePaid?.toString() || ''
    };
  }, [editingInfluencer, isEditMode]);

  // Initial State
  const [formData, setFormData] = useState({
    fullName: editingInfluencer?.name || '',
    email: editingInfluencer?.email || '',
    
    mobileCountryCode: '+91', // Always use +91 for India
    mobileNumber: initialMobile.number,

    pan: editingInfluencer?.pan || '', 
    
    platform1_name: 'Instagram',
    platform1_channel: editingInfluencer?.platforms?.instagramChannel || '',
    platform1_username: editingInfluencer?.platforms?.instagram || '',
    
    platform2_name: 'YouTube',
    platform2_channel: editingInfluencer?.platforms?.youtubeChannel || '',
    platform2_username: editingInfluencer?.platforms?.youtube || '',
    
    category: editingInfluencer?.category || '',
    influencerType: editingInfluencer?.type || '',
    languages: editingInfluencer?.language ? editingInfluencer.language.split(', ') : [] as string[],
    influencerStatus: isEditMode ? (editingInfluencer?.lastPromoBy ? 'existing' : 'new') : 'new' as 'new' | 'existing',
    lastPromoBy: editingInfluencer?.lastPromoBy || (isEditMode ? '' : (currentUserDepartment || '')),
    lastPromoDate: editingInfluencer?.lastPromoDate || '',
    lastPricePaid: editingInfluencer?.lastPricePaid?.toString() || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [panValidationStatus, setPanValidationStatus] = useState<'idle' | 'checking' | 'verified' | 'exists'>('idle');

  // Check if form has been modified
  const hasChanges = useMemo(() => {
    if (!isEditMode || !getOriginalFormData) return false;
    
    const original = getOriginalFormData;
    
    // Compare all form fields with original data
    const formLanguages = [...formData.languages].sort().join(', ');
    const originalLanguages = [...original.languages].sort().join(', ');
    
    return (
      formData.fullName !== original.fullName ||
      formData.email !== original.email ||
      formData.mobileNumber !== original.mobileNumber ||
      formData.pan !== original.pan ||
      formData.platform1_username !== original.platform1_username ||
      formData.platform1_channel !== original.platform1_channel ||
      formData.platform2_username !== original.platform2_username ||
      formData.platform2_channel !== original.platform2_channel ||
      formData.category !== original.category ||
      formData.influencerType !== original.influencerType ||
      formLanguages !== originalLanguages ||
      formData.lastPromoBy !== original.lastPromoBy ||
      formData.lastPromoDate !== original.lastPromoDate ||
      formData.lastPricePaid !== original.lastPricePaid
    );
  }, [formData, getOriginalFormData, isEditMode]);

  // Reset form when modal opens/closes or editing influencer changes
  useEffect(() => {
    if (!isOpen) {
      setPanValidationStatus('idle');
      return;
    }

    // Reset form data when modal opens or editing influencer changes
    const initialMobile = editingInfluencer?.mobile ? splitMobile(editingInfluencer.mobile) : { code: '+91', number: '' };
    const influencerStatus = isEditMode ? (editingInfluencer?.lastPromoBy ? 'existing' : 'new') : 'new' as 'new' | 'existing';
    
    setFormData({
      fullName: editingInfluencer?.name || '',
      email: editingInfluencer?.email || '',
      mobileCountryCode: '+91', // Always use +91
      mobileNumber: initialMobile.number,
      pan: editingInfluencer?.pan || '', 
      platform1_name: 'Instagram',
      platform1_channel: editingInfluencer?.platforms?.instagramChannel || '',
      platform1_username: editingInfluencer?.platforms?.instagram || '',
      platform2_name: 'YouTube',
      platform2_channel: editingInfluencer?.platforms?.youtubeChannel || '',
      platform2_username: editingInfluencer?.platforms?.youtube || '',
      category: editingInfluencer?.category || '',
      influencerType: editingInfluencer?.type || '',
      languages: editingInfluencer?.language ? editingInfluencer.language.split(', ') : [] as string[],
      influencerStatus: influencerStatus,
      lastPromoBy: editingInfluencer?.lastPromoBy || (influencerStatus === 'new' && currentUserDepartment ? currentUserDepartment : ''),
      lastPromoDate: editingInfluencer?.lastPromoDate || '',
      lastPricePaid: editingInfluencer?.lastPricePaid?.toString() || ''
    });
  }, [isOpen, editingInfluencer, isEditMode, currentUserDepartment]);

  // Debounced PAN validation
  useEffect(() => {
    if (!isOpen) return; // Don't validate if modal is closed
    
    if (!formData.pan || formData.pan.length !== 10) {
      setPanValidationStatus('idle');
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan)) {
      setPanValidationStatus('idle');
      return;
    }

    // Skip validation in edit mode if PAN hasn't changed
    if (isEditMode && editingInfluencer?.pan === formData.pan) {
      setPanValidationStatus('idle');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setPanValidationStatus('checking');
      try {
        const exists = await firebaseInfluencersService.checkPanExists(
          formData.pan, 
          isEditMode ? editingInfluencer?.id : undefined
        );
        setPanValidationStatus(exists ? 'exists' : 'verified');
      } catch (error) {
        console.error('Error checking PAN:', error);
        setPanValidationStatus('idle');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.pan, isEditMode, editingInfluencer?.id, editingInfluencer?.pan, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Input Masking / Immediate Validation
    if (field === 'mobileNumber') {
      // Only allow digits and max 10 chars
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: numericValue }));
      return;
    }

    if (field === 'pan') {
      // Uppercase and max 10 chars
      const upperValue = value.toUpperCase().slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: upperValue }));
      // Reset validation status when PAN changes (useEffect will handle the check)
      setPanValidationStatus('idle');
      return;
    }

    if (field === 'lastPricePaid') {
        // Only allow positive integers
        if (value === '' || /^\d+$/.test(value)) {
             setFormData(prev => ({ ...prev, [field]: value }));
        }
        return;
    }

    if (field === 'influencerStatus') {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            // If status is 'new', auto-set lastPromoBy to current user's department and clear promotion details
            if (value === 'new') {
                updated.lastPromoBy = currentUserDepartment || '';
                updated.lastPromoDate = '';
                updated.lastPricePaid = '';
            } else if (value === 'existing') {
                // If switching to existing, clear lastPromoBy so user can select
                updated.lastPromoBy = '';
            }
            return updated;
        });
        return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};

    // Required Fields Check
    if (!formData.fullName) newErrors.fullName = "Full Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.mobileNumber) newErrors.mobileNumber = "Mobile Number is required";
    if (!isEditMode && !formData.pan) newErrors.pan = "PAN is required";
    if (!formData.platform1_username) newErrors.platform1_username = "Username is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.influencerType) newErrors.influencerType = "Influencer Type is required";
    if (formData.languages.length === 0) newErrors.languages = "At least one language is required";

    // Mobile Validation
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) {
        newErrors.mobileNumber = "Mobile number must be exactly 10 digits.";
    }

    // PAN Validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.pan && !panRegex.test(formData.pan)) {
        newErrors.pan = "Invalid PAN format (e.g., ABCDE1234F).";
    }
    
    // Check if PAN already exists (only for new influencers)
    if (!isEditMode && formData.pan && panValidationStatus === 'exists') {
        newErrors.pan = "Influencer already registered with nxtwave";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(`input-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Try to focus if it's an input
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
            (element as HTMLElement).focus();
        }
      }
      return;
    }

    const fullMobile = `${formData.mobileCountryCode} ${formData.mobileNumber}`.trim();

    // Auto-set lastPromoBy for new influencers if not already set
    let finalLastPromoBy = formData.lastPromoBy;
    if (formData.influencerStatus === 'new' && !finalLastPromoBy && currentUserDepartment) {
      finalLastPromoBy = currentUserDepartment;
    }

    const influencerData: Influencer = {
      id: isEditMode ? editingInfluencer.id : `new_${Date.now()}`,
      name: formData.fullName,
      handle: formData.platform1_username.startsWith('@') ? formData.platform1_username : `@${formData.platform1_username}`,
      category: formData.category,
      type: formData.influencerType as any,
      avatar: isEditMode ? editingInfluencer.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`,
      email: formData.email,
      mobile: fullMobile,
      pan: formData.pan,
      language: formData.languages.join(', '),
      lastPricePaid: formData.lastPricePaid ? Number(formData.lastPricePaid) : 0,
      lastPromoDate: formData.lastPromoDate,
      lastPromoBy: finalLastPromoBy,
      platforms: {
        [formData.platform1_name.toLowerCase()]: formData.platform1_username,
        ...(formData.platform1_channel ? { [`${formData.platform1_name.toLowerCase()}Channel`]: formData.platform1_channel } : {}),
        ...(formData.platform2_username ? { [formData.platform2_name.toLowerCase()]: formData.platform2_username } : {}),
        ...(formData.platform2_channel ? { [`${formData.platform2_name.toLowerCase()}Channel`]: formData.platform2_channel } : {})
      } as any,
      createdBy: isEditMode ? editingInfluencer.createdBy : (currentUserEmail || undefined) // Preserve owner on edit, set new on create
    };

    onSubmit(influencerData);
  };

  // Dropdown Options
  const platformOptions: Option[] = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'YouTube', label: 'YouTube' }
  ];

  const categoryOptions: Option[] = [
    { value: 'Fashion', label: 'Fashion & Lifestyle' },
    { value: 'Tech', label: 'Tech & Gadgets' },
    { value: 'Food', label: 'Food & Dining' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Lifestyle', label: 'Lifestyle' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Fitness', label: 'Health & Fitness' },
    { value: 'Beauty', label: 'Beauty & Personal Care' },
    { value: 'Finance', label: 'Finance & Business' },
    { value: 'Entertainment', label: 'Entertainment' },
  ];

  const typeOptions: Option[] = [
    { value: 'Person', label: 'Person' },
    { value: 'Meme Page', label: 'Meme Page' },
    { value: 'Channel', label: 'Channel' },
    { value: 'Agency', label: 'Agency' },
  ];

  const influencerStatusOptions: Option[] = [
    { value: 'new', label: 'New Influencer' },
    { value: 'existing', label: 'Existing Influencer' },
  ];

  const deptOptions: Option[] = departments.map(d => ({ value: d.name, label: d.name }));

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden"
      onClick={onClose}
    >
      <form 
        onSubmit={handleSubmit}
        className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-5xl flex flex-col max-h-[90vh] relative animate-in fade-in zoom-in duration-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #15171E inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}</style>
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700 flex-shrink-0 bg-dark-900 rounded-t-xl z-10">
           <div>
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit Influencer' : 'Add New Influencer'}</h2>
              <p className="text-gray-400 text-sm mt-1">
                {isEditMode ? 'Update the details for this influencer.' : 'Enter the details for the new influencer.'}
              </p>
           </div>
           <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
           </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="space-y-8">
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      id="input-fullName"
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="e.g., Jane Doe" 
                      className={`w-full bg-dark-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'}`} 
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address <span className="text-red-500">*</span></label>
                    <input 
                      id="input-email"
                      type="email" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="name@example.com" 
                      className={`w-full bg-dark-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'}`} 
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                 </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <div className="w-24 flex-shrink-0 flex items-center justify-center bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white">
                            <span className="text-sm font-medium">+91</span>
                        </div>
                        <input 
                        id="input-mobileNumber"
                        type="text" 
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        placeholder="9876543210" 
                        className={`flex-1 bg-dark-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 ${errors.mobileNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'}`} 
                        />
                    </div>
                    {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN {isEditMode ? '' : <span className="text-red-500">*</span>}</label>
                    <div className="relative">
                      <input 
                        id="input-pan"
                        type="text" 
                        value={formData.pan}
                        onChange={(e) => handleInputChange('pan', e.target.value)}
                        placeholder={isEditMode ? "Hidden for security" : "ABCDE1234F"}
                        className={`w-full bg-dark-800 border rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-1 uppercase ${errors.pan ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : panValidationStatus === 'verified' ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500' : panValidationStatus === 'exists' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'}`} 
                      />
                      {formData.pan && formData.pan.length === 10 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {panValidationStatus === 'checking' && (
                            <Loader2 className="animate-spin text-gray-400" size={18} />
                          )}
                          {panValidationStatus === 'verified' && (
                            <CheckCircle2 className="text-emerald-500" size={18} />
                          )}
                          {panValidationStatus === 'exists' && (
                            <AlertTriangle className="text-red-500" size={18} />
                          )}
                        </div>
                      )}
                    </div>
                    {panValidationStatus === 'verified' && !errors.pan && (
                      <p className="text-emerald-500 text-xs mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Verified PAN
                      </p>
                    )}
                    {errors.pan && <p className="text-red-500 text-xs mt-1">{errors.pan}</p>}
                    {panValidationStatus === 'exists' && !errors.pan && (
                      <p className="text-red-500 text-xs mt-1">Influencer already registered with nxtwave</p>
                    )}
                 </div>
              </div>

              <div className="h-px bg-dark-700 my-2"></div>

              {/* Platform 1 */}
              <div>
                 <h3 className="text-md font-semibold text-white mb-4">Platform 1 (Required)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                       <SearchableSelect 
                         options={platformOptions}
                         value={formData.platform1_name}
                         onChange={(val) => handleInputChange('platform1_name', val)}
                         placeholder="Select Platform"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Channel Name</label>
                       <input 
                          type="text" 
                          value={formData.platform1_channel}
                          onChange={(e) => handleInputChange('platform1_channel', e.target.value)}
                          placeholder="e.g., Jane's World" 
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500" 
                      />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Username <span className="text-red-500">*</span></label>
                       <input 
                          id="input-platform1_username"
                          type="text" 
                          value={formData.platform1_username}
                          onChange={(e) => handleInputChange('platform1_username', e.target.value)}
                          placeholder="@janedoe" 
                          className={`w-full bg-dark-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 ${errors.platform1_username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'}`} 
                      />
                      {errors.platform1_username && <p className="text-red-500 text-xs mt-1">{errors.platform1_username}</p>}
                    </div>
                 </div>
              </div>

              {/* Platform 2 */}
              <div>
                 <h3 className="text-md font-semibold text-white mb-4">Platform 2 (Optional)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                       <SearchableSelect 
                         options={platformOptions}
                         value={formData.platform2_name}
                         onChange={(val) => handleInputChange('platform2_name', val)}
                         placeholder="Select Platform"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Channel Name</label>
                       <input 
                          type="text" 
                          value={formData.platform2_channel}
                          onChange={(e) => handleInputChange('platform2_channel', e.target.value)}
                          placeholder="e.g., Jane's World" 
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500" 
                      />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                       <input 
                          type="text" 
                          value={formData.platform2_username}
                          onChange={(e) => handleInputChange('platform2_username', e.target.value)}
                          placeholder="@janedoe" 
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500" 
                      />
                    </div>
                 </div>
              </div>
              {/* Details Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div id="input-category">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category / Niche <span className="text-red-500">*</span></label>
                    <SearchableSelect 
                         options={categoryOptions}
                         value={formData.category}
                         onChange={(val) => handleInputChange('category', val)}
                         placeholder="Select Category"
                       />
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                 </div>

                 <div id="input-influencerType">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Influencer Type <span className="text-red-500">*</span></label>
                    <SearchableSelect 
                         options={typeOptions}
                         value={formData.influencerType}
                         onChange={(val) => handleInputChange('influencerType', val)}
                         placeholder="Select Type"
                       />
                    {errors.influencerType && <p className="text-red-500 text-xs mt-1">{errors.influencerType}</p>}
                 </div>
                 
                 {/* Language Multi-Select Dropdown with Search */}
                 <div className="relative" id="input-languages">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language <span className="text-red-500">*</span></label>
                    <MultiSelect 
                        options={languageFormOptions}
                        value={formData.languages}
                        onChange={(val) => handleInputChange('languages', val)}
                        placeholder="Select Language(s)"
                        error={!!errors.languages}
                    />
                    {errors.languages && <p className="text-red-500 text-xs mt-1">{errors.languages}</p>}
                 </div>
              </div>

               {/* Influencer Status - Only show when not in edit mode */}
               {!isEditMode && (
                 <div className="space-y-6">
                   <div className="h-px bg-dark-700"></div>
                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Influencer Status <span className="text-red-500">*</span></label>
                     <SimpleSelect 
                          options={influencerStatusOptions}
                          value={formData.influencerStatus}
                          onChange={(val) => handleInputChange('influencerStatus', val)}
                          placeholder="Select Status"
                     />
                   </div>
                 </div>
               )}

               {/* Last Promotion Details - Only show for existing influencers or in edit mode */}
               {(isEditMode || formData.influencerStatus === 'existing') && (
                 <div className="space-y-6">
                   <div className="h-px bg-dark-700"></div>
                   <div>
                     <h3 className="text-md font-semibold text-white mb-4">Last Promotion Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">Last Promotion By</label>
                         <SearchableSelect 
                              options={deptOptions}
                              value={formData.lastPromoBy}
                              onChange={(val) => handleInputChange('lastPromoBy', val)}
                              placeholder="Select Dept"
                         />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Last Promotion Date</label>
                          <div className="relative">
                              <input 
                                type="date" 
                                value={formData.lastPromoDate}
                                onChange={(e) => handleInputChange('lastPromoDate', e.target.value)}
                                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 [color-scheme:dark]" 
                            />
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Last Price Paid (₹) excluding taxes</label>
                          <input 
                            type="text" 
                            value={formData.lastPricePaid}
                            onChange={(e) => handleInputChange('lastPricePaid', e.target.value)}
                            placeholder="400000" 
                            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500" 
                          />
                       </div>
                     </div>
                   </div>
                 </div>
               )}
           </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-700 bg-dark-900 rounded-b-xl flex-shrink-0 z-10">
             {/* Delete button only in Edit Mode AND Owner */}
             {canDelete && (
                 <button 
                     type="button" 
                     onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (editingInfluencer && editingInfluencer.id) {
                            onDelete(editingInfluencer.id);
                        }
                     }}
                     className="px-6 py-2.5 rounded-lg border border-red-900/50 text-red-500 hover:bg-red-900/20 transition-colors mr-auto flex items-center gap-2"
                 >
                     <Trash2 size={18} />
                     Delete
                 </button>
             )}

            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-dark-700 text-white hover:bg-dark-800 transition-colors">Cancel</button>
            {/* Show Save Changes button only when in edit mode AND there are changes, or when adding new influencer */}
            {(!isEditMode || hasChanges) && (
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20"
              >
                {isEditMode ? 'Save Changes' : 'Add Influencer'}
              </button>
            )}
        </div>
      </form>
    </div>
  );
};

// --- Component: Influencer Details Modal ---
interface DetailsModalProps {
  influencer: Influencer;
  onClose: () => void;
  onEdit: (inf: Influencer) => void;
  showEditAction: boolean;
  currentUserRole: string | null;
  currentUserEmail: string | null;
  currentUserName: string | null;
  currentUserDepartment?: string;
}

const InfluencerDetailsModal: React.FC<DetailsModalProps> = ({ 
  influencer, 
  onClose, 
  onEdit, 
  showEditAction,
  currentUserRole,
  currentUserEmail,
  currentUserName,
  currentUserDepartment
}) => {
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'revoked'>('none');
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const [showCampaignSummary, setShowCampaignSummary] = useState(false);
  const [showLastCampaignDetail, setShowLastCampaignDetail] = useState(false);

  // Check if influencer has completed any campaigns
  const hasCompletedCampaigns = !!(influencer.lastPricePaid && influencer.lastPricePaid > 0) || !!influencer.lastPromoDate;

  useEffect(() => {
    let isMounted = true;
    const checkAccess = async () => {
      if (currentUserRole === 'executive' && currentUserEmail) {
        try {
          const requests = await firebaseRequestsService.getRequestsByUser(currentUserEmail);
          if (isMounted) {
            const request = requests.find(r => r.influencerId === influencer.id);
            if (request) {
              setRequestStatus(request.status);
            }
          }
        } catch (error) {
          console.error('Error checking access:', error);
        }
      }
    };
    checkAccess();
    return () => { isMounted = false; };
  }, [currentUserRole, currentUserEmail, influencer.id]);

  const handleRequestAccess = async () => {
    // Request must go to the Executive's own department manager
    if (!currentUserEmail) {
      alert('User information missing. Cannot request access.');
      return;
    }

    if (!currentUserDepartment) {
      alert('You are not assigned to a department. Please contact your administrator to assign a department before requesting access.');
      return;
    }
    
    setIsLoadingRequest(true);
    try {
      await firebaseRequestsService.addRequest({
        requesterId: currentUserEmail,
        requesterName: currentUserName || 'Unknown User',
        requesterEmail: currentUserEmail,
        influencerId: influencer.id,
        influencerName: influencer.name,
        department: currentUserDepartment,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setRequestStatus('pending');
    } catch (error) {
      console.error('Error requesting access:', error);
      alert('Failed to request access.');
    } finally {
      setIsLoadingRequest(false);
    }
  };

  const showMobile = currentUserRole !== 'executive' || requestStatus === 'approved';

  return (
  <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
  >
    <div 
      className="bg-black border border-dark-700 rounded-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
        <X size={24} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-5 mb-6">
          <img src={influencer.avatar} alt={influencer.name} className="w-20 h-20 rounded-full object-cover border-2 border-dark-700" />
          <div>
              <h2 className="text-2xl font-bold text-white leading-tight">{influencer.name}</h2>
              <div className="flex items-center gap-2 text-primary-500 mt-1">
                  <Instagram size={18} />
                  <span className="font-medium">{influencer.handle}</span>
              </div>
          </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-3 mb-8">
          <span className="bg-dark-800 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium border border-dark-700 capitalize">
              {influencer.category}
          </span>
          {influencer.language && (
              <span className="bg-dark-800 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium border border-dark-700 capitalize">
                  {influencer.language}
              </span>
          )}
          {influencer.type && (
              <span className="bg-dark-800 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium border border-dark-700 capitalize">
                  {influencer.type}
              </span>
          )}
          {influencer.department && (
              <span className="bg-dark-800 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium border border-dark-700 capitalize">
                  {influencer.department}
              </span>
          )}
          {influencer.location && (
              <span className="bg-dark-800 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium border border-dark-700">
                  {influencer.location}
              </span>
          )}
      </div>

      {/* Social Handles - Horizontal Layout */}
      {(influencer.platforms?.instagram || influencer.platforms?.youtube) && (
        <div className="flex items-center gap-6 mb-8">
          {influencer.platforms?.instagram && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-medium">Instagram:</span>
              <div className="flex items-center gap-2 text-white">
                <Instagram className="text-pink-500" size={18} />
                <span className="font-semibold">{influencer.platforms.instagram}</span>
              </div>
            </div>
          )}
          {influencer.platforms?.youtube && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-medium">YouTube:</span>
              <div className="flex items-center gap-2 text-white">
                <Youtube className="text-red-500" size={18} />
                <span className="font-semibold">{influencer.platforms.youtube}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Data */}
      <div className="space-y-3 mb-8">
          {/* Show button for existing influencers, or button for new influencers */}
          {hasCompletedCampaigns ? (
            <div className="flex justify-center py-4">
              <button
                onClick={() => setShowLastCampaignDetail(true)}
                className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2"
              >
                <Briefcase size={18} />
                View Campaign Details
              </button>
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <button
                onClick={() => setShowCampaignSummary(true)}
                className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2"
              >
                <Briefcase size={18} />
                View Campaign Details
              </button>
            </div>
          )}
          <div className="text-gray-300 font-medium">
              Email: <span className="text-white">{influencer.email || '•••••••••'}</span>
          </div>
          <div className="text-gray-300 font-medium flex items-center gap-2 flex-wrap">
              Mobile: 
              {showMobile ? (
                <span className="text-white">{influencer.mobile || '•••••••••'}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">••••••••••</span>
                  {requestStatus === 'none' && (
                     <button 
                       onClick={handleRequestAccess} 
                       disabled={isLoadingRequest} 
                       className="flex items-center gap-1 px-2 py-1 rounded bg-primary-600/20 text-primary-500 text-xs hover:bg-primary-600/30 transition-colors disabled:opacity-50"
                     >
                       <Lock size={12} /> Request Access
                     </button>
                  )}
                  {requestStatus === 'pending' && (
                     <span className="text-yellow-500 flex items-center gap-1 text-xs bg-yellow-500/10 px-2 py-1 rounded">
                       <Clock size={12} /> Pending Approval
                     </span>
                  )}
                   {requestStatus === 'rejected' && (
                     <span className="text-red-500 flex items-center gap-1 text-xs bg-red-500/10 px-2 py-1 rounded">
                       Request Rejected
                     </span>
                  )}
                </div>
              )}
          </div>
          <div className="text-gray-300 font-medium">
              Added By: <span className="text-white text-xs">{influencer.createdBy || 'System'}</span>
          </div>
      </div>

      {/* Floating Edit Action - Conditionally Rendered */}
      {showEditAction && (
          <div className="flex justify-end mt-4">
               <button 
                  onClick={() => onEdit(influencer)}
                  className="w-12 h-12 rounded-full bg-primary-600/20 hover:bg-primary-600/40 flex items-center justify-center text-primary-500 hover:text-primary-400 transition-colors border border-primary-600/30"
                  title="Edit Influencer"
              >
                   <Pencil size={20} />
               </button>
          </div>
      )}

      {/* Last Campaign Detail Modal */}
      {showLastCampaignDetail && (
        <LastCampaignDetailModal
          influencer={influencer}
          onClose={() => setShowLastCampaignDetail(false)}
        />
      )}

      {/* Campaign Summary Modal */}
      {showCampaignSummary && (
        <CampaignSummaryModal
          influencer={influencer}
          onClose={() => setShowCampaignSummary(false)}
        />
      )}
    </div>
  </div>
  );
};

// --- Component: Last Campaign Detail Modal ---
interface LastCampaignDetailModalProps {
  influencer: Influencer;
  onClose: () => void;
}

const LastCampaignDetailModal: React.FC<LastCampaignDetailModalProps> = ({ influencer, onClose }) => {
  const [lastCampaign, setLastCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLastCampaign = async () => {
      try {
        setIsLoading(true);
        const allCampaigns = await dataService.getCampaigns();
        
        // Filter campaigns for this influencer
        const influencerCampaigns = allCampaigns.filter(c => c.influencerId === influencer.id);
        
        if (influencerCampaigns.length > 0) {
          // Sort by completion date (if completed), status change date, creation date, or start date to get the most recent
          const sortedCampaigns = influencerCampaigns.sort((a, b) => {
            const dateA = a.completionDate || a.statusChangeDate || a.createdAt || a.startDate || '';
            const dateB = b.completionDate || b.statusChangeDate || b.createdAt || b.startDate || '';
            
            // Handle empty strings and invalid dates
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            const timeA = new Date(dateA).getTime();
            const timeB = new Date(dateB).getTime();
            
            // Handle invalid dates
            if (isNaN(timeA) && isNaN(timeB)) return 0;
            if (isNaN(timeA)) return 1;
            if (isNaN(timeB)) return -1;
            
            return timeB - timeA;
          });
          setLastCampaign(sortedCampaigns[0]);
        } else {
          setLastCampaign(null);
        }
      } catch (error) {
        console.error('Error loading last campaign:', error);
        setLastCampaign(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadLastCampaign();
  }, [influencer.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Approved': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Summary of Campaign by {influencer.name}</h2>
            <p className="text-gray-400 text-sm mt-1">All campaign activities and details</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Social Handles - Horizontal */}
        {(influencer.platforms?.instagram || influencer.platforms?.youtube) && (
          <div className="px-6 pt-4 pb-2 border-b border-dark-700">
            <div className="flex items-center gap-6">
              {influencer.platforms?.instagram && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-medium">Instagram:</span>
                  <div className="flex items-center gap-2 text-white">
                    <Instagram className="text-pink-500" size={18} />
                    <span className="font-semibold">{influencer.platforms.instagram}</span>
                  </div>
                </div>
              )}
              {influencer.platforms?.youtube && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-medium">YouTube:</span>
                  <div className="flex items-center gap-2 text-white">
                    <Youtube className="text-red-500" size={18} />
                    <span className="font-semibold">{influencer.platforms.youtube}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
          {/* Last Promotion Details Card - Show if influencer has last promotion data */}
          {(influencer.lastPromoDate || influencer.lastPromoBy || (influencer.lastPricePaid && influencer.lastPricePaid > 0)) && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500/50 transition-colors">
              <h3 className="text-lg font-bold text-white mb-4">Last Promotion Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {influencer.lastPromoDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="text-gray-400" size={16} />
                    <div>
                      <span className="text-gray-500 text-xs">Last Campaign Date:</span>
                      <span className="text-white text-sm ml-2">{formatDate(influencer.lastPromoDate)}</span>
                    </div>
                  </div>
                )}
                {influencer.lastPromoBy && (
                  <div className="flex items-center gap-2">
                    <Users className="text-gray-400" size={16} />
                    <div>
                      <span className="text-gray-500 text-xs">Last Campaign Department:</span>
                      <span className="text-white text-sm ml-2">{influencer.lastPromoBy}</span>
                    </div>
                  </div>
                )}
                {influencer.lastPricePaid && influencer.lastPricePaid > 0 && (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="text-gray-400" size={16} />
                    <div>
                      <span className="text-gray-500 text-xs">Last Campaign Budget:</span>
                      <span className="text-white text-sm ml-2">₹{influencer.lastPricePaid.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campaign Card from Database */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : !lastCampaign ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-400 text-lg font-medium">No campaigns found</p>
              <p className="text-gray-500 text-sm mt-2">This influencer hasn't been assigned any campaigns yet.</p>
            </div>
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{lastCampaign.name}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lastCampaign.status)}`}>
                      {lastCampaign.status}
                    </span>
                    <span className="text-gray-400 text-sm">
                      <span className="text-gray-500">Department:</span> {lastCampaign.department}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400" size={16} />
                  <div>
                    <span className="text-gray-500 text-xs">Start Date:</span>
                    <span className="text-white text-sm ml-2">{formatDate(lastCampaign.startDate)}</span>
                  </div>
                </div>
                {lastCampaign.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={16} />
                    <div>
                      <span className="text-gray-500 text-xs">Campaign Created At:</span>
                      <span className="text-white text-sm ml-2">
                        {(() => {
                          try {
                            const date = new Date(lastCampaign.createdAt);
                            return date.toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });
                          } catch {
                            return lastCampaign.createdAt;
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                )}
                {(() => {
                  // Check if endDate exists and is not an empty string
                  // Handle cases where endDate might be null, undefined, empty string, or whitespace
                  const endDateValue = lastCampaign.endDate;
                  const hasEndDate = endDateValue && 
                                    typeof endDateValue === 'string' && 
                                    endDateValue.trim() !== '' &&
                                    endDateValue.trim().toLowerCase() !== 'null' &&
                                    endDateValue.trim().toLowerCase() !== 'undefined';
                  
                  return hasEndDate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={16} />
                      <div>
                        <span className="text-gray-500 text-xs">End Date:</span>
                        <span className="text-white text-sm ml-2">{formatDate(endDateValue)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="text-yellow-400" size={16} />
                      <div>
                        <span className="text-gray-500 text-xs">Status:</span>
                        <span className="text-yellow-400 text-sm ml-2">Campaign is not ended</span>
                      </div>
                    </div>
                  );
                })()}
                {lastCampaign.completionDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-400" size={16} />
                    <div>
                      <span className="text-gray-500 text-xs">Completed:</span>
                      <span className="text-white text-sm ml-2">{formatDate(lastCampaign.completionDate)}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <IndianRupee className="text-gray-400" size={16} />
                  <div>
                    <span className="text-gray-500 text-xs">Budget:</span>
                    <span className="text-white text-sm ml-2">₹{lastCampaign.budget?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                </div>
              </div>

              {lastCampaign.deliverables && (
                <div className="mb-3">
                  <span className="text-gray-500 text-xs">Deliverables:</span>
                  <p className="text-white text-sm mt-1">{lastCampaign.deliverables}</p>
                </div>
              )}

              {lastCampaign.completionSummary && (
                <div className="mt-3 pt-3 border-t border-dark-700">
                  <span className="text-gray-500 text-xs">Completion Summary:</span>
                  <p className="text-gray-300 text-sm mt-1">{lastCampaign.completionSummary}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-dark-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Component: Campaign Summary Modal ---
interface CampaignSummaryModalProps {
  influencer: Influencer;
  onClose: () => void;
}

const CampaignSummaryModal: React.FC<CampaignSummaryModalProps> = ({ influencer, onClose }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setIsLoading(true);
        const allCampaigns = await dataService.getCampaigns();
        // Filter campaigns for this influencer
        const influencerCampaigns = allCampaigns.filter(c => c.influencerId === influencer.id);
        setCampaigns(influencerCampaigns);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCampaigns();
  }, [influencer.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Approved': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Summary of Campaign by {influencer.name}</h2>
            <p className="text-gray-400 text-sm mt-1">All campaign activities and details</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Social Handles - Horizontal */}
        {(influencer.platforms?.instagram || influencer.platforms?.youtube) && (
          <div className="px-6 pt-4 pb-2 border-b border-dark-700">
            <div className="flex items-center gap-6">
              {influencer.platforms?.instagram && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-medium">Instagram:</span>
                  <div className="flex items-center gap-2 text-white">
                    <Instagram className="text-pink-500" size={18} />
                    <span className="font-semibold">{influencer.platforms.instagram}</span>
                  </div>
                </div>
              )}
              {influencer.platforms?.youtube && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-medium">YouTube:</span>
                  <div className="flex items-center gap-2 text-white">
                    <Youtube className="text-red-500" size={18} />
                    <span className="font-semibold">{influencer.platforms.youtube}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-400 text-lg font-medium">No campaigns found</p>
              <p className="text-gray-500 text-sm mt-2">This influencer hasn't been assigned any campaigns yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-primary-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{campaign.name}</h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <span className="text-gray-400 text-sm">
                          <span className="text-gray-500">Department:</span> {campaign.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={16} />
                      <div>
                        <span className="text-gray-500 text-xs">Start Date:</span>
                        <span className="text-white text-sm ml-2">{formatDate(campaign.startDate)}</span>
                      </div>
                    </div>
                    {campaign.createdAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="text-gray-400" size={16} />
                        <div>
                          <span className="text-gray-500 text-xs">Campaign Created At:</span>
                          <span className="text-white text-sm ml-2">{formatDateTime(campaign.createdAt)}</span>
                        </div>
                      </div>
                    )}
                    {(() => {
                      // Check if endDate exists and is not an empty string
                      const endDateValue = campaign.endDate;
                      const hasEndDate = endDateValue && 
                                        typeof endDateValue === 'string' && 
                                        endDateValue.trim() !== '' &&
                                        endDateValue.trim().toLowerCase() !== 'null' &&
                                        endDateValue.trim().toLowerCase() !== 'undefined';
                      
                      return hasEndDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="text-gray-400" size={16} />
                          <div>
                            <span className="text-gray-500 text-xs">End Date:</span>
                            <span className="text-white text-sm ml-2">{formatDate(endDateValue)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-yellow-400" size={16} />
                          <div>
                            <span className="text-gray-500 text-xs">Status:</span>
                            <span className="text-yellow-400 text-sm ml-2">Campaign is not ended</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2">
                      <IndianRupee className="text-gray-400" size={16} />
                      <div>
                        <span className="text-gray-500 text-xs">Budget:</span>
                        <span className="text-white text-sm ml-2">₹{campaign.budget?.toLocaleString('en-IN') || '0'}</span>
                      </div>
                    </div>
                  </div>

                  {campaign.deliverables && (
                    <div className="mb-3">
                      <span className="text-gray-500 text-xs">Deliverables:</span>
                      <p className="text-white text-sm mt-1">{campaign.deliverables}</p>
                    </div>
                  )}

                  {campaign.completionSummary && (
                    <div className="mt-3 pt-3 border-t border-dark-700">
                      <span className="text-gray-500 text-xs">Completion Summary:</span>
                      <p className="text-gray-300 text-sm mt-1">{campaign.completionSummary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-dark-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const Influencers: React.FC = () => {
  const sessionUser = getSession();
  const currentUserEmail = sessionUser?.email || '';
  const currentUserName = sessionUser?.name || '';
  const currentUserRole = sessionUser?.role || '';
  const currentUserDepartment = sessionUser?.department;

  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  
  // Tab State: 'all' or 'my'
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // View State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string[]>([]);
  
  // Load initial influencers (async)
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [influencersData, departmentsData] = await Promise.all([
            dataService.getInfluencers(),
            firebaseDepartmentsService.getDepartments()
        ]);
        setInfluencers(influencersData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Derived state for Filtering
  const filteredInfluencers = useMemo(() => {
    return influencers.filter(inf => {
      // 1. Search Filter
      const matchesSearch = inf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            inf.handle.toLowerCase().includes(searchQuery.toLowerCase());
      // 2. Category Filter
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(inf.category);

      // 3. Language Filter
      const matchesLanguage = languageFilter.length === 0 || (inf.language && languageFilter.some(lang => inf.language.includes(lang)));
      
      // 4. Tab Filter
      let matchesTab = true;
      if (activeTab === 'my') {
         // If tab is 'my', checking user email match. 
         // Note: If no email in session (guest), this returns empty.
         matchesTab = !!(currentUserEmail && inf.createdBy === currentUserEmail);
      }
      
      return matchesSearch && matchesCategory && matchesLanguage && matchesTab;
    });
  }, [influencers, searchQuery, categoryFilter, languageFilter, activeTab, currentUserEmail]);

  const handleEditClick = (influencer: Influencer) => {
    setEditingInfluencer(influencer);
    setSelectedInfluencer(null);
    setIsFormModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingInfluencer(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (influencerData: Influencer) => {
    try {
      let updatedList;
      if (editingInfluencer) {
        updatedList = await dataService.updateInfluencer(influencerData);
      } else {
        updatedList = await dataService.addInfluencer(influencerData);
      }
      setInfluencers(updatedList);
      setIsFormModalOpen(false);
      setEditingInfluencer(null);
      // Switch to 'my' tab after adding/editing to see the change immediately if we were there
      if (!editingInfluencer) setActiveTab('my');
    } catch (error) {
      console.error('Error saving influencer:', error);
      alert('Failed to save influencer. Please try again.');
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
        try {
          const updatedList = await dataService.deleteInfluencer(deleteTargetId);
          setInfluencers(updatedList);
          // Reset all modals
          setIsDeleteModalOpen(false);
          setIsFormModalOpen(false);
          setEditingInfluencer(null);
          setSelectedInfluencer(null);
          setDeleteTargetId(null);
        } catch (error) {
          console.error('Error deleting influencer:', error);
          alert('Failed to delete influencer. Please try again.');
        }
    }
  };

  const categoryOptions: Option[] = [
    { value: 'Fashion', label: 'Fashion & Lifestyle' },
    { value: 'Tech', label: 'Tech & Gadgets' },
    { value: 'Food', label: 'Food & Dining' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Lifestyle', label: 'Lifestyle' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Fitness', label: 'Health & Fitness' },
    { value: 'Beauty', label: 'Beauty & Personal Care' },
    { value: 'Finance', label: 'Finance & Business' },
    { value: 'Entertainment', label: 'Entertainment' },
  ];

  const languageOptions: Option[] = [
      { value: 'Telugu', label: 'Telugu' },
      { value: 'Hindi', label: 'Hindi' },
      { value: 'English', label: 'English' },
      { value: 'Tamil', label: 'Tamil' },
      { value: 'Kannada', label: 'Kannada' },
      { value: 'Malayalam', label: 'Malayalam' },
      { value: 'Marathi', label: 'Marathi' },
      { value: 'Bengali', label: 'Bengali' },
      { value: 'Gujarati', label: 'Gujarati' },
      { value: 'Punjabi', label: 'Punjabi' },
  ];
  
  // Only allow editing in "My Influencers" tab (which implies ownership check happened by tab filter already)
  const showEditActions = activeTab === 'my';

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Influencers</h1>
          <p className="text-gray-400">{filteredInfluencers.length} influencers found.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
           <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or handle..." 
                className="w-full md:w-64 bg-dark-800 border border-dark-700 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500 text-slate-200 placeholder-gray-600 transition-all"
              />
           </div>
          
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${isFilterOpen ? 'bg-dark-700 border-primary-500 text-white' : 'bg-dark-800 border-dark-700 text-gray-300 hover:text-white hover:border-gray-500'}`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
          
           <div className="flex bg-dark-800 rounded-lg border border-dark-700 p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
              >
                <List size={18} />
              </button>
           </div>
           
           <button 
             onClick={handleCreateClick}
             className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2 ml-2"
           >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Influencer</span>
           </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-dark-800 p-1 rounded-xl w-fit mb-6 border border-dark-700">
          <button 
             onClick={() => setActiveTab('all')}
             className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            All Influencers
          </button>
          <button 
             onClick={() => setActiveTab('my')}
             className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <User size={16} />
            My Influencers
          </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                   <MultiSelect 
                       options={categoryOptions}
                       value={categoryFilter}
                       onChange={setCategoryFilter}
                       placeholder="Filter by Category"
                   />
                </div>
                {/* Language Filter */}
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Language</label>
                   <MultiSelect 
                       options={languageOptions}
                       value={languageFilter}
                       onChange={setLanguageFilter}
                       placeholder="Filter by Language"
                   />
                </div>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredInfluencers.map((influencer) => (
            <div 
                key={influencer.id} 
                className="bg-dark-800 border border-dark-700 rounded-xl p-5 transition-all group flex flex-col relative hover:border-primary-500 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] hover:-translate-y-1"
            >
                {/* Clickable Area for Details */}
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedInfluencer(influencer)}>
                    <img src={influencer.avatar} alt={influencer.name} className="w-14 h-14 rounded-full object-cover border-2 border-dark-700 group-hover:border-primary-500/50 transition-colors" />
                    <div className="overflow-hidden flex-1">
                        <h3 className="text-base font-bold text-white truncate group-hover:text-primary-400 transition-colors">{influencer.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{influencer.handle}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-dark-900 text-xs text-gray-400 border border-dark-700">{influencer.category}</span>
                            {influencer.department && (
                                <span className="px-2 py-0.5 rounded-full bg-dark-900 text-xs text-gray-400 border border-dark-700">{influencer.department}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit and Delete Buttons on card for 'My Influencers' tab */}
                {showEditActions && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(influencer);
                            }}
                            className="p-2 rounded-lg bg-dark-900/80 border border-dark-600 text-gray-400 hover:text-white hover:border-primary-500 hover:bg-primary-600 transition-all"
                            title="Edit Influencer"
                        >
                            <Pencil size={14} />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRequest(influencer.id);
                            }}
                            className="p-2 rounded-lg bg-dark-900/80 border border-dark-600 text-gray-400 hover:text-white hover:border-red-500 hover:bg-red-600 transition-all"
                            title="Delete Influencer"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
            ))}
            {filteredInfluencers.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                    <p className="text-lg font-medium mb-1">No influencers found.</p>
                    <p className="text-sm opacity-70">
                        {activeTab === 'my' 
                            ? "You haven't added any influencers yet." 
                            : "Try adjusting your search or filters."}
                    </p>
                </div>
            )}
        </div>
      ) : (
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-dark-900/50 text-gray-400 text-sm border-b border-dark-700">
                            <th className="px-6 py-4 font-semibold">Influencer</th>
                            <th className="px-6 py-4 font-semibold">Category</th>
                            <th className="px-6 py-4 font-semibold">Department</th>
                            <th className="px-6 py-4 font-semibold">Platforms</th>
                            <th className="px-6 py-4 font-semibold">Location</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {filteredInfluencers.map((influencer) => (
                            <tr key={influencer.id} className="hover:bg-dark-700/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={influencer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <div className="font-medium text-white">{influencer.name}</div>
                                            <div className="text-xs text-gray-500">{influencer.handle}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 rounded-full bg-dark-900 border border-dark-700 text-xs font-medium text-gray-300">
                                        {influencer.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {influencer.department || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        {influencer.platforms?.instagram && <Instagram size={16} className="text-pink-500" />}
                                        {influencer.platforms?.youtube && <Youtube size={16} className="text-red-500" />}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {influencer.location || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => setSelectedInfluencer(influencer)}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md bg-dark-900 border border-dark-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                                        >
                                            View Details
                                        </button>
                                        
                                        {showEditActions && (
                                            <>
                                                <button 
                                                    onClick={() => handleEditClick(influencer)}
                                                    className="p-1.5 rounded-md bg-dark-900 border border-dark-700 text-gray-400 hover:text-white hover:border-primary-500 hover:bg-primary-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteRequest(influencer.id)}
                                                    className="p-1.5 rounded-md bg-dark-900 border border-dark-700 text-gray-400 hover:text-white hover:border-red-500 hover:bg-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredInfluencers.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                    No influencers found matching your filters.
                </div>
            )}
        </div>
      )}

      {/* Modals */}
      {selectedInfluencer && (
          <InfluencerDetailsModal 
            influencer={selectedInfluencer} 
            onClose={() => setSelectedInfluencer(null)}
            onEdit={handleEditClick}
            showEditAction={showEditActions} // Only show edit button in modal if in 'My' tab
            currentUserRole={currentUserRole}
            currentUserEmail={currentUserEmail}
            currentUserName={currentUserName}
            currentUserDepartment={currentUserDepartment}
          />
      )}

      <InfluencerFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteRequest}
        editingInfluencer={editingInfluencer}
        currentUserEmail={currentUserEmail}
        currentUserRole={currentUserRole}
        currentUserDepartment={currentUserDepartment}
        departments={departments}
      />
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
      />
    </>
  );
};

export default Influencers;