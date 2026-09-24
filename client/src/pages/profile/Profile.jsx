import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi, collegeApi } from '../../api/client';
import Modal from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Code2,
  Share2,
  Globe,
  Award,
  Edit3,
  Star,
  CheckCircle2,
  Camera,
  BookOpen,
} from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const targetUserId = id || currentUser?._id;
  const isMe = String(targetUserId) === String(currentUser?._id);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [skillsWanted, setSkillsWanted] = useState('');
  const [interests, setInterests] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [phone, setPhone] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await userApi.getProfile(targetUserId);
      if (res.data.success) {
        setProfileData(res.data);
        const p = res.data.profile || {};
        setBio(p.bio || '');
        setSkills(p.skills?.join(', ') || '');
        setSkillsWanted(p.skillsWanted?.join(', ') || '');
        setInterests(p.interests?.join(', ') || '');
        setGithub(p.github || '');
        setLinkedin(p.linkedin || '');
        setPortfolio(p.portfolio || '');
        setPhone(res.data.user?.phone || '');
      }
    } catch (err) {
      addToast('Failed to load profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId) fetchProfile();
  }, [targetUserId]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await userApi.uploadAvatar(formData);
      if (res.data.success) {
        addToast('Avatar updated!', 'success');
        refreshProfile();
        fetchProfile();
      }
    } catch (err) {
      addToast('Failed to upload avatar.', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (currentUser?.role === 'student') {
        await userApi.updateStudentProfile({
          bio,
          skills,
          skillsWanted,
          interests,
          github,
          linkedin,
          portfolio,
          phone,
        });
      } else if (currentUser?.role === 'faculty') {
        await userApi.updateFacultyProfile({
          bio,
          phone,
        });
      }

      addToast('Profile saved successfully!', 'success');
      setEditModalOpen(false);
      refreshProfile();
      fetchProfile();
    } catch (err) {
      addToast('Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading profile details..." />;

  const u = profileData?.user;
  const p = profileData?.profile;
  const projects = profileData?.projects || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Profile Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {u?.avatar ? (
                <img src={u.avatar} alt={u.name} className="w-24 h-24 rounded-3xl object-cover border-2 border-indigo-500/40 shadow-xl" />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                  {u?.name?.charAt(0)}
                </div>
              )}
              {isMe && (
                <label className="absolute inset-0 bg-slate-950/60 rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px] font-bold">
                  <Camera className="w-5 h-5 mb-1" />
                  <span>Change</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{u?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase">
                  {u?.role?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {p?.department} {p?.year ? `• Year ${p.year} (Sem ${p.semester})` : ''} {p?.collegeId ? `• ID: ${p.collegeId}` : ''}
              </p>

              {p?.rating && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mt-2">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{p.rating} / 5.0 Peer Rating</span>
                  <span className="text-slate-500">({p.ratingsCount || 0} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {isMe && (
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Bio */}
        {p?.bio && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <p className="text-sm text-slate-300 leading-relaxed">{p.bio}</p>
          </div>
        )}

        {/* Social Links */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-500" /><span>{u?.email}</span></div>
          {u?.phone && <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-500" /><span>{u?.phone}</span></div>}
          {p?.github && (
            <a href={p.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300">
              <Code2 className="w-4 h-4" /><span>GitHub</span>
            </a>
          )}
          {p?.linkedin && (
            <a href={p.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300">
              <Share2 className="w-4 h-4" /><span>LinkedIn</span>
            </a>
          )}
          {p?.portfolio && (
            <a href={p.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300">
              <Globe className="w-4 h-4" /><span>Portfolio</span>
            </a>
          )}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills I Know */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Skills I Know</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {p?.skills?.length > 0 ? (
              p.skills.map((s, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  {s}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Skills I Want to Learn</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {p?.skillsWanted?.length > 0 ? (
              p.skillsWanted.map((s, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                  {s}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">No learning interests specified yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Projects by User */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <span>Projects & Inventions</span>
        </h3>
        {projects.length === 0 ? (
          <p className="text-xs text-slate-500">No projects created or joined yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div key={proj._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {proj.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
            <textarea
              rows={3}
              placeholder="Tell others about your interests, passions, and background..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Skills You Know (comma-separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, Python, Figma"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Skills You Want to Learn</label>
              <input
                type="text"
                placeholder="Rust, Machine Learning, UI Design"
                value={skillsWanted}
                onChange={(e) => setSkillsWanted(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub URL</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn URL</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Portfolio Link</label>
              <input
                type="url"
                placeholder="https://myportfolio.dev"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            {saving ? 'Saving changes...' : 'Save Profile Details'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
