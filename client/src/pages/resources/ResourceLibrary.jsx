import React, { useState, useEffect } from 'react';
import { resourceApi, collegeApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { LoadingState, Pagination } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  FileText,
  Search,
  Upload,
  Download,
  Bookmark,
  Flag,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  File,
} from 'lucide-react';

const ResourceLibrary = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'bookmarks'
  const [resources, setResources] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [semester, setSemester] = useState('All');
  const [type, setType] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Upload Modal Form
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [uploadDept, setUploadDept] = useState('');
  const [uploadSem, setUploadSem] = useState(1);
  const [uploadType, setUploadType] = useState('Notes');
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState(null);

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedResId, setSelectedResId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await resourceApi.getResources({ search, department, semester, type, page, limit: 9 });
      if (res.data.success) {
        setResources(res.data.resources || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await resourceApi.getMyBookmarks();
      if (res.data.success) {
        setBookmarks(res.data.resources || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const res = await collegeApi.getPublicStructure();
      if (res.data.success) {
        const depts = res.data.departments || [];
        setDepartments(depts);
        if (depts.length > 0) setUploadDept(depts[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  useEffect(() => {
    if (activeTab === 'explore') fetchResources();
    else fetchBookmarks();
  }, [activeTab, department, semester, type, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResources();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('description', description);
      formData.append('department', uploadDept || departments[0]?.name || 'General');
      formData.append('semester', uploadSem);
      formData.append('type', uploadType);
      if (externalUrl) formData.append('externalUrl', externalUrl);
      if (file) formData.append('file', file);

      await resourceApi.uploadResource(formData);
      addToast('Resource uploaded successfully!', 'success');
      setUploadModalOpen(false);
      setTitle('');
      setSubject('');
      setDescription('');
      setExternalUrl('');
      setFile(null);
      fetchResources();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload resource.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resItem) => {
    try {
      const res = await resourceApi.recordDownload(resItem._id);
      if (res.data.success) {
        // Update local count
        setResources((prev) =>
          prev.map((r) => (r._id === resItem._id ? { ...r, downloadCount: res.data.downloadCount } : r))
        );

        if (res.data.fileUrl) {
          window.open(res.data.fileUrl, '_blank');
        } else if (res.data.externalUrl) {
          window.open(res.data.externalUrl, '_blank');
        }
      }
    } catch (err) {
      addToast('Error downloading resource.', 'error');
    }
  };

  const handleToggleBookmark = async (resId) => {
    try {
      const res = await resourceApi.toggleBookmark(resId);
      addToast(res.data.message, 'success');
      setResources((prev) =>
        prev.map((r) => (r._id === resId ? { ...r, isBookmarked: res.data.bookmarked } : r))
      );
      if (activeTab === 'bookmarks') fetchBookmarks();
    } catch (err) {
      addToast('Error updating bookmark.', 'error');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await resourceApi.reportResource(selectedResId, { reason: reportReason });
      addToast('Resource reported. Campus moderators notified.', 'info');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err) {
      addToast('Error reporting resource.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-indigo-400" />
            <span>Academic Resource Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Community notes, lecture presentations, previous question papers, and tutorial references
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'explore' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Materials
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'bookmarks' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Saved ({bookmarks.length})
            </button>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resource</span>
          </button>
        </div>
      </div>

      {activeTab === 'explore' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <form onSubmit={handleSearchSubmit} className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes, topics, subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Resource Types</option>
                <option value="Notes">Notes</option>
                <option value="PDF">PDF</option>
                <option value="Presentation">Presentation</option>
                <option value="Question Paper">Question Paper</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Reference Material">Reference Material</option>
                <option value="Useful Link">Useful Link</option>
              </select>
            </div>
          </form>

          {/* Resources Grid */}
          {loading ? (
            <LoadingState message="Loading campus resources from MongoDB..." />
          ) : resources.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No resources found"
              description="Be the first to upload lecture notes or study materials for your branch."
              actionLabel="Upload Material"
              onAction={() => setUploadModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((item) => (
                <div key={item._id} className="glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {item.type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {item.department} (Sem {item.semester})
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1 line-clamp-1">{item.title}</h3>
                    <p className="text-xs font-semibold text-indigo-300 mb-2">Subject: {item.subject}</p>
                    {item.description && <p className="text-xs text-slate-400 line-clamp-2 mb-4">{item.description}</p>}

                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                      <span>{item.downloadCount || 0} downloads</span>
                      <span>•</span>
                      <span>By {item.uploadedBy?.name || 'Student'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                    >
                      <Download className="w-4 h-4" />
                      <span>{item.fileUrl ? 'Download File' : 'Open Link'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleBookmark(item._id)}
                      className={`p-2 rounded-xl border transition-all ${
                        item.isBookmarked
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Save"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedResId(item._id);
                        setReportModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400"
                      title="Report"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      ) : (
        /* Saved Bookmarks */
        <div className="space-y-6">
          {loading ? (
            <LoadingState message="Loading your saved materials..." />
          ) : bookmarks.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved resources"
              description="Click the bookmark icon on any resource card to save it for quick exam revision."
              actionLabel="Explore Materials"
              onAction={() => setActiveTab('explore')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((item) => (
                <div key={item._id} className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">{item.type}</span>
                    <h3 className="text-base font-bold text-white mt-1">{item.title}</h3>
                    <p className="text-xs text-indigo-300 mt-0.5">{item.subject}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Access Material</span>
                    </button>
                    <button
                      onClick={() => handleToggleBookmark(item._id)}
                      className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    >
                      <Bookmark className="w-4 h-4 fill-amber-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Learning Resource">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g. Unit 3 Full Notes - Database Management Systems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subject *</label>
              <input
                type="text"
                placeholder="e.g. DBMS / CS302"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Notes">Notes</option>
                <option value="PDF">PDF</option>
                <option value="Presentation">Presentation</option>
                <option value="Question Paper">Question Paper</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Reference Material">Reference Material</option>
                <option value="Useful Link">Useful Link</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={uploadDept}
                onChange={(e) => setUploadDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
              <select
                value={uploadSem}
                onChange={(e) => setUploadSem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Attach File (PDF, Docs, PPT)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">OR External URL Link</label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            {uploading ? 'Uploading...' : 'Publish Resource'}
          </button>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Inappropriate Material">
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for reporting</label>
            <textarea
              rows={3}
              placeholder="Explain why this content violates academic policies..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
          >
            Submit Report
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceLibrary;
