import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLocation } from 'react-router-dom';
import { Influencer } from '../types';
import { dataService } from '../services/dataService';
import SearchableSelect, { Option } from '../components/SearchableSelect';
import { Search, Filter, Grid, List, Plus, X, Instagram, Youtube, ChevronDown, ChevronUp, Check, Pencil, Trash2, AlertTriangle, Users, User, Calendar } from 'lucide-react';

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
}

const InfluencerFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, onSubmit, onDelete, editingInfluencer, currentUserEmail, currentUserRole }) => {
  if (!isOpen) return null;

  const isEditMode = !!editingInfluencer;
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  
  const availableLanguages = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'];

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
        return { code: parts[0], number: parts.slice(1).join(' ') };
    }
    return { code: '+91', number: fullMobile };
  };

  const initialMobile = editingInfluencer?.mobile ? splitMobile(editingInfluencer.mobile) : { code: '+91', number: '' };

  // Initial State
  const [formData, setFormData] = useState({
    fullName: editingInfluencer?.name || '',
    email: editingInfluencer?.email || '',
    
    mobileCountryCode: initialMobile.code,
    mobileNumber: initialMobile.number,

    pan: editingInfluencer?.pan || '', 
    
    platform1_name: 'Instagram',
    platform1_channel: '',
    platform1_username: editingInfluencer?.platforms?.instagram || '',
    
    platform2_name: 'YouTube',
    platform2_channel: '',
    platform2_username: editingInfluencer?.platforms?.youtube || '',
    
    category: editingInfluencer?.category || '',
    department: editingInfluencer?.department || '',
    languages: editingInfluencer?.language ? editingInfluencer.language.split(', ') : [] as string[],
    lastPromoBy: editingInfluencer?.lastPromoBy || 'Marketing',
    lastPromoDate: editingInfluencer?.lastPromoDate || '',
    lastPricePaid: editingInfluencer?.lastPricePaid?.toString() || ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => {
      const current = prev.languages;
      if (current.includes(lang)) {
        return { ...prev, languages: current.filter(l => l !== lang) };
      } else {
        return { ...prev, languages: [...current, lang] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict validation for required fields
    if (
        !formData.fullName || 
        !formData.platform1_username || 
        (!isEditMode && !formData.pan) ||
        !formData.email ||
        !formData.mobileNumber ||
        !formData.category ||
        !formData.department ||
        formData.languages.length === 0
    ) {
      alert("Please fill in all required fields marked with *.");
      return;
    }

    const fullMobile = `${formData.mobileCountryCode} ${formData.mobileNumber}`.trim();

    const influencerData: Influencer = {
      id: isEditMode ? editingInfluencer.id : `new_${Date.now()}`,
      name: formData.fullName,
      handle: formData.platform1_username.startsWith('@') ? formData.platform1_username : `@${formData.platform1_username}`,
      category: formData.category,
      department: formData.department,
      avatar: isEditMode ? editingInfluencer.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`,
      email: formData.email,
      mobile: fullMobile,
      pan: formData.pan,
      language: formData.languages.join(', '),
      lastPricePaid: formData.lastPricePaid ? Number(formData.lastPricePaid) : 0,
      lastPromoDate: formData.lastPromoDate,
      lastPromoBy: formData.lastPromoBy,
      platforms: {
        [formData.platform1_name.toLowerCase()]: formData.platform1_username,
        ...(formData.platform2_username ? { [formData.platform2_name.toLowerCase()]: formData.platform2_username } : {})
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

  const deptOptions: Option[] = [
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'HR', label: 'HR' },
    { value: 'Product', label: 'Product' },
    { value: 'Operations', label: 'Operations' },
  ];

  const countryOptions: Option[] = [
    { value: '+91', label: 'India (+91)' },
    { value: '+1', label: 'United States (+1)' },
    { value: '+44', label: 'United Kingdom (+44)' },
    { value: '+65', label: 'Singapore (+65)' },
    { value: '+61', label: 'Australia (+61)' },
    { value: '+971', label: 'UAE (+971)' },
    { value: '+81', label: 'Japan (+81)' },
    { value: '+49', label: 'Germany (+49)' },
    { value: '+33', label: 'France (+33)' },
    { value: '+86', label: 'China (+86)' },
  ];

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
                      type="text" 
                      required
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="e.g., Jane Doe" 
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="name@example.com" 
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                    />
                 </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <div className="w-40 flex-shrink-0">
                            <SearchableSelect 
                                options={countryOptions}
                                value={formData.mobileCountryCode}
                                onChange={(val) => handleInputChange('mobileCountryCode', val)}
                                placeholder="+91"
                            />
                        </div>
                        <input 
                        type="text" 
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        placeholder="9876543210" 
                        className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN {isEditMode ? '' : <span className="text-red-500">*</span>}</label>
                    <input 
                      type="text" 
                      required={!isEditMode}
                      value={formData.pan}
                      onChange={(e) => handleInputChange('pan', e.target.value)}
                      placeholder={isEditMode ? "Hidden for security" : "ABCD1234E"}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 uppercase" 
                    />
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
                          type="text" 
                          required
                          value={formData.platform1_username}
                          onChange={(e) => handleInputChange('platform1_username', e.target.value)}
                          placeholder="@janedoe" 
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500" 
                      />
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

              <div className="h-px bg-dark-700 my-2"></div>

              {/* Details Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category / Niche <span className="text-red-500">*</span></label>
                    <SearchableSelect 
                         options={categoryOptions}
                         value={formData.category}
                         onChange={(val) => handleInputChange('category', val)}
                         placeholder="Select Category"
                       />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department <span className="text-red-500">*</span></label>
                    <SearchableSelect 
                         options={deptOptions}
                         value={formData.department}
                         onChange={(val) => handleInputChange('department', val)}
                         placeholder="Select Department"
                       />
                 </div>
                 
                 {/* Language Multi-Select Dropdown with Search */}
                 <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language <span className="text-red-500">*</span></label>
                    <div 
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white cursor-pointer flex justify-between items-center"
                      onClick={() => {
                          setIsLangOpen(!isLangOpen);
                          setLangSearch('');
                      }}
                    >
                       <span className={`block truncate mr-2 ${formData.languages.length === 0 ? 'text-gray-500' : ''}`}>
                         {formData.languages.length > 0 ? formData.languages.join(', ') : 'Select Language(s)'}
                       </span>
                       {isLangOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                    </div>
                    
                    {isLangOpen && (
                       <div className="absolute top-full left-0 w-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {/* Search Bar for Languages */}
                          <div className="p-2 border-b border-dark-700 sticky top-0 bg-dark-800 z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input
                                    type="text"
                                    autoFocus
                                    value={langSearch}
                                    onChange={(e) => setLangSearch(e.target.value)}
                                    placeholder="Search language..."
                                    className="w-full bg-dark-900 border border-dark-700 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 placeholder-gray-600"
                                    onClick={(e) => e.stopPropagation()} 
                                />
                            </div>
                          </div>
                          
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                              {availableLanguages
                                .filter(lang => lang.toLowerCase().includes(langSearch.toLowerCase()))
                                .map(lang => (
                                 <div 
                                   key={lang}
                                   className="flex items-center px-4 py-3 hover:bg-dark-700 cursor-pointer"
                                   onClick={() => toggleLanguage(lang)}
                                 >
                                   <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors flex-shrink-0 ${formData.languages.includes(lang) ? 'bg-primary-600 border-primary-600' : 'border-gray-500'}`}>
                                      {formData.languages.includes(lang) && <Check size={14} className="text-white" />}
                                   </div>
                                   <span className="text-gray-200">{lang}</span>
                                 </div>
                              ))}
                              {availableLanguages.filter(lang => lang.toLowerCase().includes(langSearch.toLowerCase())).length === 0 && (
                                  <div className="p-3 text-sm text-gray-500 text-center">No languages found</div>
                              )}
                          </div>
                       </div>
                    )}
                    
                    {isLangOpen && (
                       <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                    )}
                 </div>
              </div>

               {/* Details Row 4 */}
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
                      type="number" 
                      value={formData.lastPricePaid}
                      onChange={(e) => handleInputChange('lastPricePaid', e.target.value)}
                      placeholder="400000" 
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500" 
                    />
                 </div>
              </div>
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
            <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20">
                 {isEditMode ? 'Save Changes' : 'Add Influencer'}
            </button>
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
}

const InfluencerDetailsModal: React.FC<DetailsModalProps> = ({ influencer, onClose, onEdit, showEditAction }) => (
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

      {/* Social Handles List */}
      <div className="space-y-4 mb-8">
          {influencer.platforms?.instagram && (
              <div className="flex items-center gap-3 text-white">
                  <Instagram className="text-pink-500" size={22} />
                  <span className="font-semibold">{influencer.platforms.instagram}</span>
              </div>
          )}
          {influencer.platforms?.youtube && (
              <div className="flex items-center gap-3 text-white">
                  <Youtube className="text-red-500" size={22} />
                  <span className="font-semibold">{influencer.platforms.youtube}</span>
              </div>
          )}
      </div>

      {/* Details Data */}
      <div className="space-y-3 mb-8">
          <div className="text-gray-300 font-medium">
              Last Price Paid: <span className="text-white">₹{influencer.lastPricePaid?.toLocaleString('en-IN') || 'N/A'}</span>
          </div>
          <div className="text-gray-300 font-medium">
              Last Promo: <span className="text-white">{influencer.lastPromoDate || 'N/A'}</span>
          </div>
          <div className="text-gray-300 font-medium">
              Email: <span className="text-white">{influencer.email || '•••••••••'}</span>
          </div>
          <div className="text-gray-300 font-medium">
              Mobile: <span className="text-white">{influencer.mobile || '•••••••••'}</span>
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
    </div>
  </div>
);

// --- Main Page Component ---
const Influencers: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentUserEmail = params.get('email');
  const currentUserRole = params.get('role');

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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');
  
  // Load initial influencers (async)
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadInfluencers = async () => {
      try {
        setIsLoading(true);
        const data = await dataService.getInfluencers();
        setInfluencers(data);
      } catch (error) {
        console.error('Error loading influencers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInfluencers();
  }, []);

  // Derived state for Filtering
  const filteredInfluencers = useMemo(() => {
    return influencers.filter(inf => {
      // 1. Search Filter
      const matchesSearch = inf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            inf.handle.toLowerCase().includes(searchQuery.toLowerCase());
      // 2. Category Filter
      const matchesCategory = categoryFilter === 'All' || inf.category === categoryFilter;

      // 3. Language Filter
      const matchesLanguage = languageFilter === 'All' || (inf.language && inf.language.includes(languageFilter));
      
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
    { value: 'All', label: 'All Categories' },
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
      { value: 'All', label: 'All Languages' },
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
    <Layout>
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
                   <SearchableSelect 
                       options={categoryOptions}
                       value={categoryFilter}
                       onChange={setCategoryFilter}
                       placeholder="Filter by Category"
                   />
                </div>
                {/* Language Filter */}
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">Language</label>
                   <SearchableSelect 
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

                {/* Edit Button directly on card for 'My Influencers' tab */}
                {showEditActions && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(influencer);
                        }}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-dark-900/80 border border-dark-600 text-gray-400 hover:text-white hover:border-primary-500 hover:bg-primary-600 transition-all opacity-0 group-hover:opacity-100"
                        title="Edit Influencer"
                    >
                        <Pencil size={14} />
                    </button>
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
                                            <button 
                                                onClick={() => handleEditClick(influencer)}
                                                className="p-1.5 rounded-md bg-dark-900 border border-dark-700 text-gray-400 hover:text-white hover:border-primary-500 hover:bg-primary-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
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
      />
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
      />
    </Layout>
  );
};

export default Influencers;