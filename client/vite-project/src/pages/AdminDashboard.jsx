import React, { useState, useEffect } from 'react';
import API from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Users,
  FileText,
  UserCheck,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Edit,
  FolderPlus,
  Trash2,
  RefreshCw,
  Shield,
  UserX
} from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users');

  // Stats
  const [stats, setStats] = useState({
    pendingUsersCount: 0,
    totalUsersCount: 0,
    totalComplaintsCount: 0,
    pendingComplaintsCount: 0
  });

  // User Management State
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);

  // Selected Complaint for Status Update Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateSubject, setUpdateSubject] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [updatingComplaint, setUpdatingComplaint] = useState(false);

  // Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catMsg, setCatMsg] = useState('');

  // General Notification
  const [adminActionMsg, setAdminActionMsg] = useState({ type: '', text: '' });

  const getUserId = () => user?._id || user?.id;

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    fetchSummaryStats();
    fetchCategories();
    if (activeTab === 'users') {
      fetchUsersData();
    } else if (activeTab === 'complaints') {
      fetchComplaintsData();
    }
  }, [user?._id, user?.id, activeTab, userStatusFilter, complaintStatusFilter, complaintCategoryFilter]);

  const fetchSummaryStats = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const [pendingRes, usersRes, complaintsRes] = await Promise.all([
        API.get(`/users/${userId}/pending`),
        API.get(`/users/${userId}/all`),
        API.get(`/complaints/${userId}/all`)
      ]);

      setStats({
        pendingUsersCount: pendingRes.data.count || 0,
        totalUsersCount: usersRes.data.count || 0,
        totalComplaintsCount: complaintsRes.data.count || 0,
        pendingComplaintsCount: (complaintsRes.data.complaints || []).filter(
          (c) => c.status === 'PENDING'
        ).length
      });
    } catch (err) {
      console.error('Failed to fetch summary stats:', err);
    }
  };

  const fetchUsersData = async () => {
    const userId = getUserId();
    if (!userId) return;

    setUserLoading(true);
    try {
      const pendingRes = await API.get(`/users/${userId}/pending`);
      setPendingUsers(pendingRes.data.users || []);

      let url = `/users/${userId}/all`;
      if (userStatusFilter) url += `?status=${userStatusFilter}`;
      const allRes = await API.get(url);
      setAllUsers(allRes.data.users || []);
    } catch (err) {
      setAdminActionMsg({ type: 'danger', text: 'Failed to load user data' });
    } finally {
      setUserLoading(false);
    }
  };

  const fetchComplaintsData = async () => {
    const userId = getUserId();
    if (!userId) return;

    setComplaintLoading(true);
    try {
      let queryParams = [];
      if (complaintStatusFilter) queryParams.push(`status=${complaintStatusFilter}`);
      if (complaintCategoryFilter) queryParams.push(`category=${complaintCategoryFilter}`);
      let url = `/complaints/${userId}/all`;
      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

      const res = await API.get(url);
      setComplaints(res.data.complaints || []);
    } catch (err) {
      setAdminActionMsg({ type: 'danger', text: 'Failed to load complaints data' });
    } finally {
      setComplaintLoading(false);
    }
  };

  const fetchCategories = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await API.get(`/categories/${userId}`);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // User Actions (Approve / Reject / Change status / Change role)
  const handleUserStatusUpdate = async (targetUserId, newStatus) => {
    try {
      const res = await API.patch(`/users/${user._id}/status/${targetUserId}`, {
        status: newStatus
      });
      if (res.data.success) {
        setAdminActionMsg({ type: 'success', text: res.data.message });
        fetchUsersData();
        fetchSummaryStats();
      }
    } catch (err) {
      setAdminActionMsg({ type: 'danger', text: err.response?.data?.message || 'Action failed' });
    }
  };

  const handleUserRoleUpdate = async (targetUserId, newRole) => {
    try {
      const res = await API.patch(`/users/${user._id}/role/${targetUserId}`, {
        role: newRole
      });
      if (res.data.success) {
        setAdminActionMsg({ type: 'success', text: res.data.message });
        fetchUsersData();
      }
    } catch (err) {
      setAdminActionMsg({ type: 'danger', text: err.response?.data?.message || 'Action failed' });
    }
  };

  // Complaint Actions
  const handleOpenComplaintModal = (item) => {
    setSelectedComplaint(item);
    setUpdateStatus(item.status);
    setUpdateSubject(item.title || '');
    setAdminComment(item.adminComment || '');
  };

  const handleSaveComplaintStatus = async (e) => {
    e.preventDefault();
    const userId = getUserId();
    if (!selectedComplaint || !userId) return;
    setUpdatingComplaint(true);

    try {
      const res = await API.patch(`/complaints/${userId}/status/${selectedComplaint._id}`, {
        status: updateStatus,
        title: updateSubject,
        adminComment: adminComment
      });

      if (res.data.success) {
        setAdminActionMsg({ type: 'success', text: res.data.message });
        setSelectedComplaint(null);
        fetchComplaintsData();
        fetchSummaryStats();
      }
    } catch (err) {
      setAdminActionMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update complaint' });
    } finally {
      setUpdatingComplaint(false);
    }
  };

  // Category Actions
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatMsg('');

    if (!newCatName) {
      setCatMsg('Category name is required');
      return;
    }

    try {
      const res = await API.post(`/categories/${user._id}`, {
        name: newCatName,
        description: newCatDesc
      });

      if (res.data.success) {
        setCatMsg('Category created successfully!');
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      setCatMsg(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await API.delete(`/categories/${user._id}/${categoryId}`);
      if (res.data.success) {
        setAdminActionMsg({ type: 'success', text: 'Category deleted successfully' });
        fetchCategories();
      }
    } catch (err) {
      setAdminActionMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to delete category' });
    }
  };

  // User list search filter
  const filteredUsers = allUsers.filter((u) => {
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  // Complaints search filter
  const filteredComplaints = complaints.filter((c) => {
    if (!complaintSearch) return true;
    const term = complaintSearch.toLowerCase();
    return (
      c.title?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.userId?.name?.toLowerCase().includes(term) ||
      c.userId?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header flex-between">
        <div>
          <h1>Administrator Control Center</h1>
          <p>System management for user approvals, grievances, and category configurations.</p>
        </div>
        <button
          className="btn-secondary btn-sm"
          onClick={() => {
            fetchSummaryStats();
            if (activeTab === 'users') fetchUsersData();
            if (activeTab === 'complaints') fetchComplaintsData();
          }}
        >
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Data
        </button>
      </div>

      {/* Admin Notification Banner */}
      {adminActionMsg.text && (
        <div className={`alert alert-${adminActionMsg.type}`}>
          <span>{adminActionMsg.text}</span>
          <button className="btn-close-sm" onClick={() => setAdminActionMsg({ type: '', text: '' })}>
            &times;
          </button>
        </div>
      )}

      {/* Admin Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-pending">
            <UserCheck size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pendingUsersCount}</span>
            <span className="stat-label">Pending Users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-total">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalUsersCount}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-progress">
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalComplaintsCount}</span>
            <span className="stat-label">Total Complaints</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-rejected">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pendingComplaintsCount}</span>
            <span className="stat-label">Unresolved Complaints</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} style={{ marginRight: '6px' }} /> Manage Users ({stats.pendingUsersCount} Pending)
        </button>
        <button
          className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          <FileText size={16} style={{ marginRight: '6px' }} /> Manage Complaints
        </button>
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FolderPlus size={16} style={{ marginRight: '6px' }} /> Manage Categories
        </button>
      </div>

      {/* TAB 1: MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="tab-content">
          {/* Pending Users Approval Section */}
          <div className="panel-card mb-4">
            <div className="panel-header">
              <h2>Pending User Approvals ({pendingUsers.length})</h2>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="empty-state">No user registration approvals currently pending.</div>
            ) : (
              <div className="table-responsive">
                <table className="sober-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registered On</th>
                      <th>Status</th>
                      <th>Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u._id}>
                        <td className="font-semibold">{u.name}</td>
                        <td>{u.email}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <StatusBadge status={u.status} />
                        </td>
                        <td>
                          <button
                            className="btn-success btn-sm me-2"
                            onClick={() => handleUserStatusUpdate(u._id, 'ACTIVE')}
                          >
                            <Check size={14} style={{ marginRight: '4px' }} /> Approve
                          </button>
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleUserStatusUpdate(u._id, 'REJECTED')}
                          >
                            <X size={14} style={{ marginRight: '4px' }} /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Users Directory */}
          <div className="panel-card">
            <div className="panel-header flex-between">
              <h2>All User Directory</h2>
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>

                <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
              </div>
            </div>

            {userLoading ? (
              <div className="loading-state">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">No users matching search criteria.</div>
            ) : (
              <div className="table-responsive">
                <table className="sober-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>State Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td className="font-semibold">{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => handleUserRoleUpdate(u._id, e.target.value)}
                            className="select-inline"
                            disabled={u._id === user._id}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td>
                          <StatusBadge status={u.status} />
                        </td>
                        <td>
                          {u.role === 'ADMIN' ? (
                            <span className="text-muted small">
                              {u._id === user?._id || u._id === user?.id ? 'Current Admin Session' : 'Admin Protected'}
                            </span>
                          ) : u.status === 'ACTIVE' ? (
                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => handleUserStatusUpdate(u._id, 'DEACTIVATED')}
                            >
                              <UserX size={14} style={{ marginRight: '4px' }} /> Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn-outline btn-sm"
                              onClick={() => handleUserStatusUpdate(u._id, 'ACTIVE')}
                            >
                              <UserCheck size={14} style={{ marginRight: '4px' }} /> Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="tab-content">
          <div className="panel-card">
            <div className="panel-header flex-between">
              <h2>All Submitted Complaints</h2>
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by subject, detail, or user email..."
                    value={complaintSearch}
                    onChange={(e) => setComplaintSearch(e.target.value)}
                  />
                </div>

                <select
                  value={complaintStatusFilter}
                  onChange={(e) => setComplaintStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <select
                  value={complaintCategoryFilter}
                  onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {complaintLoading ? (
              <div className="loading-state">Loading complaints...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="empty-state">No complaints matching filter criteria.</div>
            ) : (
              <div className="table-responsive">
                <table className="sober-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Submitted By</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((c) => (
                      <tr key={c._id}>
                        <td className="font-semibold">{c.title}</td>
                        <td>{c.category?.name || 'N/A'}</td>
                        <td>
                          <div>{c.userId?.name || 'Unknown'}</div>
                          <small className="text-muted">{c.userId?.email}</small>
                        </td>
                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td>
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => handleOpenComplaintModal(c)}
                          >
                            <Edit size={14} style={{ marginRight: '4px' }} /> Update Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="tab-content">
          <div className="dashboard-content-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h2>Add Complaint Category</h2>
              </div>

              {catMsg && <div className="alert alert-info">{catMsg}</div>}

              <form onSubmit={handleAddCategory} className="sober-form">
                <div className="form-group">
                  <label htmlFor="catName">Category Name *</label>
                  <input
                    type="text"
                    id="catName"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. IT & Wi-Fi, Maintenance, Hostel"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="catDesc">Description</label>
                  <textarea
                    id="catDesc"
                    rows={3}
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Brief description of this complaint category..."
                  />
                </div>

                <button type="submit" className="btn-primary">
                  <FolderPlus size={16} style={{ marginRight: '6px' }} /> Create Category
                </button>
              </form>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h2>Configured Categories ({categories.length})</h2>
              </div>

              {categories.length === 0 ? (
                <div className="empty-state">No categories configured yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="sober-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Description</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={cat._id}>
                          <td className="font-semibold">{cat.name}</td>
                          <td>{cat.description || 'N/A'}</td>
                          <td>
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => handleDeleteCategory(cat._id)}
                            >
                              <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Complaint Update Modal */}
      {selectedComplaint && (
        <div className="modal-backdrop" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Process & Update Complaint</h3>
              <button className="btn-close" onClick={() => setSelectedComplaint(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveComplaintStatus}>
              <div className="modal-body">
                <div className="modal-detail-row">
                  <span className="detail-label">Submitted By:</span>
                  <span className="detail-value">
                    {selectedComplaint.userId?.name} ({selectedComplaint.userId?.email})
                  </span>
                </div>

                <div className="modal-detail-row">
                  <span className="detail-label">Category / Subject:</span>
                  <span className="detail-value font-bold">
                    [{selectedComplaint.category?.name}] {selectedComplaint.title}
                  </span>
                </div>

                <div className="modal-detail-box">
                  <h4>Complaint Description:</h4>
                  <p className="description-text">{selectedComplaint.description}</p>
                </div>

                <hr className="modal-divider" />

                <div className="form-group">
                  <label htmlFor="updateSubject">Complaint Subject / Title *</label>
                  <input
                    type="text"
                    id="updateSubject"
                    value={updateSubject}
                    onChange={(e) => setUpdateSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="updateStatus">Update Status *</label>
                  <select
                    id="updateStatus"
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    required
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="adminComment">Admin Remarks / Feedback Comment</label>
                  <textarea
                    id="adminComment"
                    rows={4}
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Enter resolution notes, assignment information, or rejection reasons..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updatingComplaint}>
                  {updatingComplaint ? 'Saving...' : 'Save & Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
