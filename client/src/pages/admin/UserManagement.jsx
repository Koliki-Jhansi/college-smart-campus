import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { Users, Search, Filter, CheckCircle, XCircle, Shield, UserX, UserCheck, AlertTriangle } from 'lucide-react';

export const UserManagement = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, user: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveStaff = async (userId, approve) => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/users/${userId}/approve-staff`, { approve });
      showToast(`Staff account ${approve ? 'approved' : 'rejected'} successfully`, 'success');
      fetchUsers();
      setConfirmModal({ open: false, action: null, user: null });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update approval status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(true);
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      showToast(`User status updated to ${newStatus}`, 'success');
      fetchUsers();
      setConfirmModal({ open: false, action: null, user: null });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.collegeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && u.isApprovedStaff === false) ||
      (statusFilter === 'active' && u.status === 'active' && u.isApprovedStaff !== false) ||
      (statusFilter === 'suspended' && u.status === 'suspended');

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">Admin</Badge>;
      case 'faculty':
        return <Badge variant="primary">Faculty</Badge>;
      case 'club_coordinator':
        return <Badge variant="accent">Club Coordinator</Badge>;
      case 'maintenance_staff':
        return <Badge variant="warning">Maintenance Staff</Badge>;
      case 'transport_staff':
        return <Badge variant="info">Transport Staff</Badge>;
      default:
        return <Badge variant="default">Student</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="text-indigo-400" />
            User Management & Access Control
          </h1>
          <p className="text-sm text-slate-400">
            Review registered students, approve staff credentials, manage roles and permissions.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, roll number, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="club_coordinator">Club Coordinators</option>
            <option value="maintenance_staff">Maintenance Staff</option>
            <option value="transport_staff">Transport Staff</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Staff Approval</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading platform users..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match your criteria"
          description={
            users.length === 0
              ? 'No users have registered on the platform yet.'
              : 'Try clearing or modifying your search filters.'
          }
        />
      ) : (
        <div className="glass-card rounded-xl overflow-hidden border border-slate-700/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">ID / Reg No.</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 overflow-hidden shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {u.collegeId || u.employeeId || 'N/A'}
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {u.department?.name || u.department?.code || u.department || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {u.role !== 'student' && u.role !== 'admin' && !u.isApprovedStaff ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pending Approval
                        </span>
                      ) : u.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <UserX className="w-3.5 h-3.5" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <UserCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* If pending staff approval */}
                        {u.role !== 'student' && u.role !== 'admin' && !u.isApprovedStaff && (
                          <>
                            <button
                              onClick={() => setConfirmModal({ open: true, action: 'approve_staff', user: u })}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Approve Staff Credentials"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => setConfirmModal({ open: true, action: 'reject_staff', user: u })}
                              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Reject Staff Credentials"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}

                        {/* Toggle active / suspend */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setConfirmModal({ open: true, action: 'toggle_status', user: u })}
                            className={`p-1.5 rounded transition-colors ${
                              u.status === 'suspended'
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                            }`}
                            title={u.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                          >
                            {u.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: null, user: null })}
        title={
          confirmModal.action === 'approve_staff'
            ? 'Approve Staff Account'
            : confirmModal.action === 'reject_staff'
            ? 'Reject Staff Account'
            : confirmModal.action === 'toggle_status' && confirmModal.user?.status === 'active'
            ? 'Suspend User Account'
            : 'Reactivate User Account'
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to perform this action for{' '}
            <strong className="text-slate-100">{confirmModal.user?.name}</strong> ({confirmModal.user?.email})?
          </p>

          {confirmModal.action === 'approve_staff' && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
              This will grant elevated privileges for the role: <strong>{confirmModal.user?.role}</strong>.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <button
              type="button"
              onClick={() => setConfirmModal({ open: false, action: null, user: null })}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                if (confirmModal.action === 'approve_staff') {
                  handleApproveStaff(confirmModal.user._id, true);
                } else if (confirmModal.action === 'reject_staff') {
                  handleApproveStaff(confirmModal.user._id, false);
                } else if (confirmModal.action === 'toggle_status') {
                  handleToggleStatus(confirmModal.user._id, confirmModal.user.status);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                confirmModal.action === 'approve_staff'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : confirmModal.action === 'reject_staff' ||
                    (confirmModal.action === 'toggle_status' && confirmModal.user?.status === 'active')
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
