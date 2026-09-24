import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { collegeApi } from '../../api/client';
import { GraduationCap, Briefcase, Wrench, Bus, Flag, ArrowRight, AlertTriangle, Building, Shield } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('student');
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Student Fields
  const [collegeId, setCollegeId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedProgramName, setSelectedProgramName] = useState('');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('A');

  // Faculty Fields
  const [employeeId, setEmployeeId] = useState('');
  const [facultyDept, setFacultyDept] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');

  // Staff Fields
  const [staffType, setStaffType] = useState('maintenance');

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        setLoadingConfig(true);
        const res = await collegeApi.getPublicStructure();
        if (res.data.success) {
          if (!res.data.configured || !res.data.departments || res.data.departments.length === 0) {
            setIsConfigured(false);
          } else {
            setIsConfigured(true);
            setCollegeInfo(res.data.college);
            const depts = res.data.departments || [];
            const progs = res.data.programs || res.data.courses || [];
            setDepartments(depts);
            setPrograms(progs);
            setSections(res.data.sections || []);

            if (depts.length > 0) {
              setSelectedDeptId(depts[0]._id);
              setFacultyDept(depts[0].name);

              // Filter initial programs for the first department
              const initialProgs = progs.filter(p => p.department?._id === depts[0]._id || p.department === depts[0]._id);
              if (initialProgs.length > 0) {
                setSelectedProgramName(initialProgs[0].name);
              } else if (progs.length > 0) {
                setSelectedProgramName(progs[0].name);
              }
            }
          }
        } else {
          setIsConfigured(false);
        }
      } catch (err) {
        console.error('Failed to load college structure:', err);
        setIsConfigured(false);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchStructure();
  }, []);

  // Filter programs dynamically when department changes
  const availablePrograms = programs.filter(
    (p) => p.department?._id === selectedDeptId || p.department === selectedDeptId
  );

  const selectedProgramObj = programs.find((p) => p.name === selectedProgramName) || availablePrograms[0];
  const maxYears = selectedProgramObj?.duration || 4;
  const maxSemesters = selectedProgramObj?.totalSemesters || 8;

  const handleDeptChange = (deptId) => {
    setSelectedDeptId(deptId);
    const deptObj = departments.find(d => d._id === deptId);
    if (deptObj) {
      setFacultyDept(deptObj.name);
    }
    const matchingProgs = programs.filter(p => p.department?._id === deptId || p.department === deptId);
    if (matchingProgs.length > 0) {
      setSelectedProgramName(matchingProgs[0].name);
    } else {
      setSelectedProgramName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConfigured) {
      addToast('College setup has not been completed yet. Please contact the administrator.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const selectedDeptObj = departments.find(d => d._id === selectedDeptId);
      const departmentName = selectedDeptObj ? selectedDeptObj.name : (departments[0]?.name || 'General Sciences');

      const payload = {
        name,
        email,
        password,
        phone,
        role,
      };

      if (role === 'student') {
        payload.collegeId = collegeId;
        payload.department = departmentName;
        payload.course = selectedProgramName || (availablePrograms[0]?.name || 'B.Tech');
        payload.year = Number(year);
        payload.semester = Number(semester);
        payload.section = section;
      } else if (role === 'faculty') {
        payload.employeeId = employeeId;
        payload.department = facultyDept || departmentName;
        payload.designation = designation;
      } else if (['maintenance_staff', 'transport_staff', 'club_coordinator'].includes(role)) {
        payload.employeeId = employeeId || `STF-${Date.now().toString().slice(-4)}`;
        payload.staffType = staffType;
        payload.department = departmentName || 'Campus Operations';
      }

      const res = await register(payload);
      addToast(res.message || 'Registration successful! Welcome to CollegeHub.', 'success');

      if (role === 'student') navigate('/dashboard');
      else if (role === 'faculty') navigate('/faculty/dashboard');
      else if (role === 'maintenance_staff') navigate('/maintenance/dashboard');
      else if (role === 'transport_staff') navigate('/transport/dashboard');
      else if (role === 'club_coordinator') navigate('/club/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed. Please check your details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty', icon: Briefcase },
    { id: 'club_coordinator', label: 'Club Lead', icon: Flag },
    { id: 'maintenance_staff', label: 'Maintenance', icon: Wrench },
    { id: 'transport_staff', label: 'Transport', icon: Bus },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden py-12">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            {collegeInfo?.collegeCode ? collegeInfo.collegeCode.slice(0, 2) : 'CH'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {collegeInfo?.collegeName ? `Join ${collegeInfo.collegeName}` : 'Create CollegeHub Account'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {collegeInfo?.city && collegeInfo?.state
              ? `${collegeInfo.city}, ${collegeInfo.state} • Academic Session ${collegeInfo.currentAcademicYear || '2026-2027'}`
              : 'Join your smart campus collaboration network'}
          </p>
        </div>

        {/* Unconfigured Alert Banner */}
        {!loadingConfig && !isConfigured && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">College setup has not been completed yet.</p>
              <p className="text-slate-300">
                Please contact the campus administrator to initialize the college profile, departments, and academic programs.
              </p>
              <div className="pt-2">
                <Link
                  to="/setup-admin"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 underline"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Are you an Administrator? Start Setup Wizard →</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          {roleOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = role === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRole(opt.id)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Campus Email *
              </label>
              <input
                type="email"
                placeholder="rahul@collegehub.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* STUDENT SPECIFIC FIELDS */}
          {role === 'student' && (
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-4">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                <span>Student Academic Details</span>
                {collegeInfo?.collegeCode && (
                  <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                    {collegeInfo.collegeCode}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    College ID / Roll Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 23CSE1042"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department *
                  </label>
                  {departments.length > 0 ? (
                    <select
                      value={selectedDeptId}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-amber-400 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800">
                      No departments configured yet
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Program / Degree</label>
                  {availablePrograms.length > 0 ? (
                    <select
                      value={selectedProgramName}
                      onChange={(e) => setSelectedProgramName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {availablePrograms.map((p) => (
                        <option key={p._id} value={p.name}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. B.Tech"
                      value={selectedProgramName}
                      onChange={(e) => setSelectedProgramName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({ length: maxYears }, (_, i) => i + 1).map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                  {sections.length > 0 ? (
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {sections.map((sec) => (
                        <option key={sec._id} value={sec.name}>
                          Section {sec.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="A"
                      value={section}
                      onChange={(e) => setSection(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FACULTY SPECIFIC FIELDS */}
          {role === 'faculty' && (
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-4">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Faculty Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FAC-CSE-08"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department *
                  </label>
                  {departments.length > 0 ? (
                    <select
                      value={facultyDept}
                      onChange={(e) => setFacultyDept(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d.name}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={facultyDept}
                      onChange={(e) => setFacultyDept(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Associate Professor"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STAFF SPECIFIC FIELDS */}
          {['maintenance_staff', 'transport_staff', 'club_coordinator'].includes(role) && (
            <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-4">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Staff Identity
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Employee / Staff ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. STF-MNT-102"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !isConfigured}
            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Registering...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

