import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collegeApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Settings,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  Shield,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  LayoutGrid,
} from 'lucide-react';

const CollegeSetup = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wizardMode, setWizardMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Active Management Tab (when not in wizard mode)
  const [activeTab, setActiveTab] = useState('profile');

  // STEP 1 — COLLEGE PROFILE
  const [collegeName, setCollegeName] = useState('');
  const [shortName, setShortName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeLogo, setCollegeLogo] = useState('');
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2026-2027');
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);

  // SLA Settings
  const [slaCritical, setSlaCritical] = useState(1);
  const [slaHigh, setSlaHigh] = useState(4);
  const [slaMedium, setSlaMedium] = useState(12);
  const [slaLow, setSlaLow] = useState(48);

  // STEP 2 — DEPARTMENTS
  const [departments, setDepartments] = useState([]);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptIsActive, setDeptIsActive] = useState(true);
  const [editingDeptId, setEditingDeptId] = useState(null);

  // STEP 3 — PROGRAMS / COURSES
  const [programs, setPrograms] = useState([]);
  const [progModalOpen, setProgModalOpen] = useState(false);
  const [progName, setProgName] = useState('');
  const [progCode, setProgCode] = useState('');
  const [progDeptId, setProgDeptId] = useState('');
  const [progDegree, setProgDegree] = useState('B.Tech');
  const [progDuration, setProgDuration] = useState(4);
  const [progSemesters, setProgSemesters] = useState(8);
  const [progDesc, setProgDesc] = useState('');
  const [progIsActive, setProgIsActive] = useState(true);
  const [editingProgId, setEditingProgId] = useState(null);

  // STEP 4 — ACADEMIC STRUCTURE
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [newAcademicYear, setNewAcademicYear] = useState('2026-2027');
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionSemester, setSectionSemester] = useState(1);
  const [sectionMaxStudents, setSectionMaxStudents] = useState(60);

  // STEP 5 — CAMPUS CONFIGURATION (FACILITIES & RESOURCES)
  const [resources, setResources] = useState([]);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resName, setResName] = useState('');
  const [resCategory, setResCategory] = useState('Computer Lab');
  const [resLocation, setResLocation] = useState('');
  const [resBuilding, setResBuilding] = useState('');
  const [resBlock, setResBlock] = useState('');
  const [resRoom, setResRoom] = useState('');
  const [resCapacity, setResCapacity] = useState(40);
  const [resDescription, setResDescription] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, deptsRes, progsRes, yearsRes, sectionsRes, resourcesRes] = await Promise.all([
        collegeApi.getConfig().catch(() => ({ data: { config: {} } })),
        collegeApi.getDepartments().catch(() => ({ data: { departments: [] } })),
        collegeApi.getCourses().catch(() => ({ data: { courses: [] } })),
        collegeApi.getAcademicYears().catch(() => ({ data: { years: [] } })),
        collegeApi.getSections().catch(() => ({ data: { sections: [] } })),
        collegeApi.getCampusResources().catch(() => ({ data: { resources: [] } })),
      ]);

      const c = configRes.data?.config || {};
      setCollegeName(c.collegeName || '');
      setShortName(c.shortName || '');
      setCollegeCode(c.collegeCode || '');
      setAddress(c.address || '');
      setCity(c.city || '');
      setState(c.state || '');
      setWebsite(c.website || '');
      setContactEmail(c.contactEmail || '');
      setPhone(c.phone || '');
      setCollegeLogo(c.collegeLogo || '');
      setCurrentAcademicYear(c.currentAcademicYear || '2026-2027');
      setIsSetupCompleted(Boolean(c.collegeSetupCompleted));

      if (c.slaSettings) {
        setSlaCritical(c.slaSettings.Critical || 1);
        setSlaHigh(c.slaSettings.High || 4);
        setSlaMedium(c.slaSettings.Medium || 12);
        setSlaLow(c.slaSettings.Low || 48);
      }

      const depts = deptsRes.data?.departments || [];
      setDepartments(depts);
      if (depts.length > 0 && !progDeptId) {
        setProgDeptId(depts[0]._id);
      }

      setPrograms(progsRes.data?.courses || []);
      setAcademicYears(yearsRes.data?.years || []);
      setSections(sectionsRes.data?.sections || []);
      setResources(resourcesRes.data?.resources || []);

      // If setup was already completed, default to management tabs, but allow wizard
      if (c.collegeSetupCompleted) {
        setWizardMode(false);
      } else {
        setWizardMode(true);
      }
    } catch (err) {
      console.error('Failed to load college config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // STEP 1 Save
  const handleSaveCollegeProfile = async (e) => {
    if (e) e.preventDefault();
    if (!collegeName.trim() || !collegeCode.trim()) {
      addToast('College Name and Code are required.', 'error');
      return false;
    }

    try {
      setSubmitting(true);
      await collegeApi.updateConfig({
        collegeName,
        shortName,
        collegeCode,
        address,
        city,
        state,
        website,
        contactEmail,
        phone,
        collegeLogo,
        currentAcademicYear,
        slaSettings: {
          Critical: Number(slaCritical),
          High: Number(slaHigh),
          Medium: Number(slaMedium),
          Low: Number(slaLow),
        },
      });
      addToast('Institution Profile updated successfully!', 'success');
      return true;
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving college details.', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 2 Department CRUD
  const handleSaveDept = async (e) => {
    e.preventDefault();
    try {
      if (editingDeptId) {
        await collegeApi.updateDepartment(editingDeptId, {
          name: deptName,
          code: deptCode,
          headOfDepartment: deptHead,
          description: deptDesc,
          isActive: deptIsActive,
        });
        addToast('Department updated!', 'success');
      } else {
        await collegeApi.createDepartment({
          name: deptName,
          code: deptCode,
          headOfDepartment: deptHead,
          description: deptDesc,
          isActive: deptIsActive,
        });
        addToast('Department created!', 'success');
      }
      setDeptModalOpen(false);
      setDeptName('');
      setDeptCode('');
      setDeptHead('');
      setDeptDesc('');
      setEditingDeptId(null);
      const res = await collegeApi.getDepartments();
      setDepartments(res.data.departments || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error creating department.', 'error');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await collegeApi.deleteDepartment(id);
      addToast('Department deleted.', 'info');
      const res = await collegeApi.getDepartments();
      setDepartments(res.data.departments || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error deleting department.', 'error');
    }
  };

  // STEP 3 Program CRUD
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: progName,
        code: progCode,
        department: progDeptId,
        degreeType: progDegree,
        duration: Number(progDuration),
        totalSemesters: Number(progSemesters),
        description: progDesc,
        isActive: progIsActive,
      };

      if (editingProgId) {
        await collegeApi.updateCourse(editingProgId, payload);
        addToast('Program updated!', 'success');
      } else {
        await collegeApi.createCourse(payload);
        addToast('Program created!', 'success');
      }
      setProgModalOpen(false);
      setProgName('');
      setProgCode('');
      setProgDesc('');
      setEditingProgId(null);
      const res = await collegeApi.getCourses();
      setPrograms(res.data.courses || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving program.', 'error');
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
    try {
      await collegeApi.deleteCourse(id);
      addToast('Program removed.', 'info');
      const res = await collegeApi.getCourses();
      setPrograms(res.data.courses || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error deleting program.', 'error');
    }
  };

  // STEP 4 Academic Structure
  const handleCreateYear = async (e) => {
    e.preventDefault();
    try {
      await collegeApi.createAcademicYear({ year: newAcademicYear, isCurrent: true });
      addToast('Academic Year created and set as active!', 'success');
      setYearModalOpen(false);
      const res = await collegeApi.getAcademicYears();
      setAcademicYears(res.data.years || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error creating academic year.', 'error');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await collegeApi.createSection({
        name: sectionName,
        semester: Number(sectionSemester),
        maxStudents: Number(sectionMaxStudents),
      });
      addToast('Section created!', 'success');
      setSectionModalOpen(false);
      setSectionName('');
      const res = await collegeApi.getSections();
      setSections(res.data.sections || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error creating section.', 'error');
    }
  };

  const handleDeleteSection = async (id) => {
    try {
      await collegeApi.deleteSection(id);
      addToast('Section removed.', 'info');
      const res = await collegeApi.getSections();
      setSections(res.data.sections || []);
    } catch (err) {
      addToast('Error removing section.', 'error');
    }
  };

  // STEP 5 Campus Resources
  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      await collegeApi.createCampusResource({
        name: resName,
        category: resCategory,
        location: resLocation,
        building: resBuilding,
        block: resBlock,
        roomNumber: resRoom,
        capacity: Number(resCapacity),
        description: resDescription,
      });
      addToast('Campus facility registered!', 'success');
      setResourceModalOpen(false);
      setResName('');
      setResLocation('');
      setResBuilding('');
      setResBlock('');
      setResRoom('');
      setResDescription('');
      const res = await collegeApi.getCampusResources();
      setResources(res.data.resources || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error registering resource.', 'error');
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      await collegeApi.deleteCampusResource(id);
      addToast('Campus facility deleted.', 'info');
      const res = await collegeApi.getCampusResources();
      setResources(res.data.resources || []);
    } catch (err) {
      addToast('Error deleting facility.', 'error');
    }
  };

  // STEP 6 — COMPLETE SETUP WIZARD
  const handleFinalizeSetup = async () => {
    try {
      setSubmitting(true);
      await collegeApi.completeSetup({
        collegeName,
        shortName,
        collegeCode,
        address,
        city,
        state,
        website,
        contactEmail,
        phone,
        currentAcademicYear,
      });
      setIsSetupCompleted(true);
      setWizardMode(false);
      addToast('🎉 First-Time College Setup Completed! Your campus portal is now live.', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to complete college setup.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Connecting to CollegeHub Administrative core in MongoDB..." />;

  const wizardSteps = [
    { num: 1, label: 'Institution Profile', desc: 'Name, code, contacts & city' },
    { num: 2, label: 'Departments', desc: 'Academic disciplines' },
    { num: 3, label: 'Programs & Degrees', desc: 'B.Tech, BCA, MCA, etc.' },
    { num: 4, label: 'Academic Structure', desc: 'Years, semesters & sections' },
    { num: 5, label: 'Campus Facilities', desc: 'Labs, auditoriums & halls' },
    { num: 6, label: 'Finalize & Launch', desc: 'Review & activate portal' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold w-fit mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>{isSetupCompleted ? 'Campus Configuration Active' : 'First-Time Setup Mode'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isSetupCompleted ? (collegeName || 'College Management & Structure') : 'First-Time College Setup Wizard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
            {isSetupCompleted
              ? 'Manage college profile, departments, academic degrees, sections, and campus facilities'
              : 'Complete the 6-step guided wizard to configure your campus and enable student & faculty registrations.'}
          </p>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWizardMode(!wizardMode)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all shadow-md"
          >
            {wizardMode ? <LayoutGrid className="w-4 h-4 text-indigo-400" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
            <span>{wizardMode ? 'Switch to Management Tabs' : 'Launch Setup Wizard'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WIZARD MODE: 6 STEP GUIDED SETUP */}
      {/* ========================================================================= */}
      {wizardMode ? (
        <div className="space-y-6">
          {/* Wizard Step Progress Tracker */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
            {wizardSteps.map((s) => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex flex-col p-3 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : isPast
                      ? 'bg-slate-800/80 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-extrabold mb-1">
                    <span>STEP {s.num}</span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-xs font-bold truncate">{s.label}</div>
                </button>
              );
            })}
          </div>

          {/* STEP 1 — COLLEGE */}
          {currentStep === 1 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  <span>Step 1: Institution Identity & Core Information</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your college name, acronym, location, and official campus email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">College / Institution Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. National Institute of Technology & Science"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Short Name / Acronym</label>
                  <input
                    type="text"
                    placeholder="e.g. NITS"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">College Code (Unique) *</label>
                  <input
                    type="text"
                    placeholder="e.g. NITS-CAMPUS"
                    value={collegeCode}
                    onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Address</label>
                  <input
                    type="text"
                    placeholder="Knowledge City, Academic Block 1"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    placeholder="admin@collegehub.edu"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Helpline Phone</label>
                  <input
                    type="text"
                    placeholder="+91 80 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Website</label>
                  <input
                    type="url"
                    placeholder="https://collegehub.edu"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Academic Session</label>
                  <input
                    type="text"
                    placeholder="2026-2027"
                    value={currentAcademicYear}
                    onChange={(e) => setCurrentAcademicYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await handleSaveCollegeProfile();
                    if (ok) setCurrentStep(2);
                  }}
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Save & Continue to Departments</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — DEPARTMENTS */}
          {currentStep === 2 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-400" />
                    <span>Step 2: Academic Departments</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Add the academic departments (e.g. Computer Science, Electrical, Mechanical).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingDeptId(null);
                    setDeptName('');
                    setDeptCode('');
                    setDeptHead('');
                    setDeptDesc('');
                    setDeptModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Department</span>
                </button>
              </div>

              {departments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Departments Added Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click "Add Department" to register your first academic division.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Department Name</th>
                        <th className="p-3">Code</th>
                        <th className="p-3">Head of Dept</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {departments.map((d) => (
                        <tr key={d._id} className="hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-white">{d.name}</td>
                          <td className="p-3 font-mono text-indigo-400 font-bold">{d.code}</td>
                          <td className="p-3">{d.headOfDepartment || '—'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteDept(d._id)}
                              className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (departments.length === 0) {
                      addToast('Please add at least one department before continuing.', 'warning');
                    } else {
                      setCurrentStep(3);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Continue to Programs & Degrees</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — PROGRAMS */}
          {currentStep === 3 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <span>Step 3: Academic Programs & Degrees</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Create degree courses (e.g. B.Tech in CSE, BCA, MBA) linked to your departments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProgId(null);
                    setProgName('');
                    setProgCode('');
                    setProgDesc('');
                    if (departments.length > 0) setProgDeptId(departments[0]._id);
                    setProgModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Program</span>
                </button>
              </div>

              {programs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Programs Configured Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Add programs so registering students can pick their degree and branch.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Program Name</th>
                        <th className="p-3">Code</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Degree</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Semesters</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {programs.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-white">{p.name}</td>
                          <td className="p-3 font-mono text-indigo-400 font-bold">{p.code}</td>
                          <td className="p-3">{p.department?.name || p.departmentCode}</td>
                          <td className="p-3">{p.degreeType}</td>
                          <td className="p-3">{p.duration || 4} Years</td>
                          <td className="p-3">{p.totalSemesters || 8} Sems</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProgram(p._id)}
                              className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 2</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (programs.length === 0) {
                      addToast('Please add at least one program before continuing.', 'warning');
                    } else {
                      setCurrentStep(4);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Continue to Academic Structure</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — ACADEMIC STRUCTURE */}
          {currentStep === 4 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <span>Step 4: Academic Structure & Sections</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure active academic sessions and class sections (e.g. Section A, Section B).
                </p>
              </div>

              {/* Academic Years */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Academic Years / Sessions</h4>
                  <button
                    type="button"
                    onClick={() => setYearModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Session</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {academicYears.map((y) => (
                    <div key={y._id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{y.year}</div>
                        {y.isCurrent && <span className="text-[10px] text-emerald-400 font-bold">● Active Session</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Class Sections</h4>
                  <button
                    type="button"
                    onClick={() => setSectionModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sections.map((sec) => (
                    <div key={sec._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Section {sec.name}</div>
                        <div className="text-[10px] text-slate-400">Sem {sec.semester} • Max {sec.maxStudents}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec._id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 3</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Continue to Campus Facilities</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — CAMPUS CONFIGURATION */}
          {currentStep === 5 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                    <span>Step 5: Campus Facilities & Bookable Resources</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Optionally add computer labs, AI labs, seminar halls, and auditoriums for CampusSlot booking.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setResourceModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Facility</span>
                </button>
              </div>

              {resources.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Facilities Added Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    You can add labs and auditoriums now or manage them anytime later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {resources.map((res) => (
                    <div key={res._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white">{res.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                            {res.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{res.location} {res.building ? `• ${res.building}` : ''}</p>
                        <div className="text-[11px] text-slate-500 mt-2">Capacity: {res.capacity} people</div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(res._id)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Proceed to Final Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 — COMPLETE & LAUNCH */}
          {currentStep === 6 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">Ready to Launch CollegeHub!</h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  You have configured your institution profile, academic departments, programs, and facilities.
                  Finalizing will activate student and faculty registration.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-white">{collegeCode || 'N/A'}</div>
                  <div className="text-xs text-slate-400 mt-1">College Code</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-indigo-400">{departments.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Departments</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-purple-400">{programs.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Programs</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-400">{resources.length}</div>
                  <div className="text-xs text-slate-400 mt-1">Facilities / Labs</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 5</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeSetup}
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2"
                >
                  <span>Complete Setup & Open Campus</span>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* MANAGEMENT TABS MODE (Full CRUD after setup completed) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
            {[
              { id: 'profile', label: 'College Profile & SLAs', icon: Building },
              { id: 'departments', label: `Departments (${departments.length})`, icon: GraduationCap },
              { id: 'courses', label: `Programs (${programs.length})`, icon: BookOpen },
              { id: 'structure', label: `Structure & Sections (${sections.length})`, icon: Calendar },
              { id: 'resources', label: `Campus Facilities (${resources.length})`, icon: MapPin },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveCollegeProfile} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  <span>College Institution Configuration</span>
                </h3>

                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">College Name *</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">College Code *</label>
                  <input
                    type="text"
                    value={collegeCode}
                    onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current Academic Session</label>
                  <input
                    type="text"
                    value={currentAcademicYear}
                    onChange={(e) => setCurrentAcademicYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SLA Limits */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>CampusFix Configurable SLA Durations (Hours)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-rose-400 mb-1">Critical (Hours)</label>
                    <input
                      type="number"
                      value={slaCritical}
                      onChange={(e) => setSlaCritical(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-1">High (Hours)</label>
                    <input
                      type="number"
                      value={slaHigh}
                      onChange={(e) => setSlaHigh(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-400 mb-1">Medium (Hours)</label>
                    <input
                      type="number"
                      value={slaMedium}
                      onChange={(e) => setSlaMedium(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Low (Hours)</label>
                    <input
                      type="number"
                      value={slaLow}
                      onChange={(e) => setSlaLow(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Manage Departments</h3>
                <button
                  onClick={() => {
                    setEditingDeptId(null);
                    setDeptName('');
                    setDeptCode('');
                    setDeptHead('');
                    setDeptDesc('');
                    setDeptModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Department</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">Department Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Head of Dept</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {departments.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-white">{d.name}</td>
                        <td className="p-3 font-mono text-indigo-400 font-bold">{d.code}</td>
                        <td className="p-3">{d.headOfDepartment || '—'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteDept(d._id)}
                            className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PROGRAMS */}
          {activeTab === 'courses' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Manage Degree Programs</h3>
                <button
                  onClick={() => {
                    setEditingProgId(null);
                    setProgName('');
                    setProgCode('');
                    setProgDesc('');
                    if (departments.length > 0) setProgDeptId(departments[0]._id);
                    setProgModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Program</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">Program Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Degree</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {programs.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-white">{p.name}</td>
                        <td className="p-3 font-mono text-indigo-400 font-bold">{p.code}</td>
                        <td className="p-3">{p.department?.name || p.departmentCode}</td>
                        <td className="p-3">{p.degreeType}</td>
                        <td className="p-3">{p.duration || 4} Years ({p.totalSemesters || 8} Sems)</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteProgram(p._id)}
                            className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: STRUCTURE & SECTIONS */}
          {activeTab === 'structure' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Academic Years & Sections</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setYearModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Session</span>
                  </button>
                  <button
                    onClick={() => setSectionModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Section</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Academic Sessions</h4>
                  <div className="space-y-2">
                    {academicYears.map((y) => (
                      <div key={y._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{y.year}</span>
                        {y.isCurrent && <span className="text-[10px] text-emerald-400 font-bold">● Active</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Sections</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sections.map((sec) => (
                      <div key={sec._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">Section {sec.name}</div>
                          <div className="text-[10px] text-slate-400">Sem {sec.semester}</div>
                        </div>
                        <button onClick={() => handleDeleteSection(sec._id)} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CAMPUS FACILITIES */}
          {activeTab === 'resources' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Campus Facilities & Labs</h3>
                <button
                  onClick={() => setResourceModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Facility</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {resources.map((res) => (
                  <div key={res._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white">{res.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                          {res.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{res.location}</p>
                      <div className="text-[11px] text-slate-500 mt-2">Capacity: {res.capacity} students</div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleDeleteResource(res._id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Department Modal */}
      <Modal isOpen={deptModalOpen} onClose={() => setDeptModalOpen(false)} title="Add Academic Department">
        <form onSubmit={handleSaveDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department Name *</label>
            <input
              type="text"
              placeholder="e.g. Computer Science & Engineering"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department Code *</label>
            <input
              type="text"
              placeholder="e.g. CSE"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Head of Department (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Dr. A. K. Sharma"
              value={deptHead}
              onChange={(e) => setDeptHead(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Save Department
          </button>
        </form>
      </Modal>

      {/* Program Modal */}
      <Modal isOpen={progModalOpen} onClose={() => setProgModalOpen(false)} title="Add Degree Program">
        <form onSubmit={handleSaveProgram} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Program Name *</label>
            <input
              type="text"
              placeholder="e.g. B.Tech in Artificial Intelligence"
              value={progName}
              onChange={(e) => setProgName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Program Code *</label>
              <input
                type="text"
                placeholder="e.g. BTECH-AI"
                value={progCode}
                onChange={(e) => setProgCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
              <select
                value={progDeptId}
                onChange={(e) => setProgDeptId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Degree Type</label>
              <select
                value={progDegree}
                onChange={(e) => setProgDegree(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Sc">M.Sc</option>
                <option value="MBA">MBA</option>
                <option value="BBA">BBA</option>
                <option value="Diploma">Diploma</option>
                <option value="Ph.D">Ph.D</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Years)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={progDuration}
                onChange={(e) => {
                  setProgDuration(e.target.value);
                  setProgSemesters(Number(e.target.value) * 2);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Semesters</label>
              <input
                type="number"
                min={1}
                max={12}
                value={progSemesters}
                onChange={(e) => setProgSemesters(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Save Program
          </button>
        </form>
      </Modal>

      {/* Academic Year Modal */}
      <Modal isOpen={yearModalOpen} onClose={() => setYearModalOpen(false)} title="Register Academic Session">
        <form onSubmit={handleCreateYear} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year (e.g. 2026-2027)</label>
            <input
              type="text"
              value={newAcademicYear}
              onChange={(e) => setNewAcademicYear(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
          >
            Save Session
          </button>
        </form>
      </Modal>

      {/* Section Modal */}
      <Modal isOpen={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title="Create Class Section">
        <form onSubmit={handleCreateSection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Section Name * (e.g. A, B, C)</label>
            <input
              type="text"
              placeholder="A"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
              <input
                type="number"
                min={1}
                max={12}
                value={sectionSemester}
                onChange={(e) => setSectionSemester(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Max Capacity</label>
              <input
                type="number"
                value={sectionMaxStudents}
                onChange={(e) => setSectionMaxStudents(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
          >
            Save Section
          </button>
        </form>
      </Modal>

      {/* Facility / Campus Resource Modal */}
      <Modal isOpen={resourceModalOpen} onClose={() => setResourceModalOpen(false)} title="Register Campus Facility">
        <form onSubmit={handleSaveResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Facility Name *</label>
            <input
              type="text"
              placeholder="e.g. Turing AI & High Performance Computing Lab"
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={resCategory}
                onChange={(e) => setResCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Computer Lab">Computer Lab</option>
                <option value="AI Lab">AI Lab</option>
                <option value="Electronics Lab">Electronics Lab</option>
                <option value="Classroom">Classroom</option>
                <option value="Seminar Hall">Seminar Hall</option>
                <option value="Auditorium">Auditorium</option>
                <option value="Conference Room">Conference Room</option>
                <option value="Sports Ground">Sports Ground</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity</label>
              <input
                type="number"
                value={resCapacity}
                onChange={(e) => setResCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location *</label>
              <input
                type="text"
                placeholder="e.g. Ground Floor"
                value={resLocation}
                onChange={(e) => setResLocation(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Building</label>
              <input
                type="text"
                placeholder="Block A"
                value={resBuilding}
                onChange={(e) => setResBuilding(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Room No</label>
              <input
                type="text"
                placeholder="Lab 102"
                value={resRoom}
                onChange={(e) => setResRoom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
          >
            Save Facility
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CollegeSetup;
