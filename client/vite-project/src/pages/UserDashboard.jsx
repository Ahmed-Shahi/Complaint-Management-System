import React, { useState, useEffect } from 'react';
import API from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { PlusCircle, Search, FileText, Clock, CheckCircle2, XCircle, AlertCircle, Eye, RefreshCw } from 'lucide-react';

const UserDashboard = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search and filter
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    category: '',
    description: ''
  });

  // Selected Complaint Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    if (user?._id || user?.id) {
      fetchCategories();
      fetchMyComplaints();
    }
  }, [user?._id, user?.id, filterStatus]);

  const fetchCategories = async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    try {
      const res = await API.get(`/categories/${userId}`);
      if (res.data.success) {
        const fetchedCats = res.data.categories || [];
        setCategories(fetchedCats);
        console.log("Categories Fetched:", fetchedCats);

        if (fetchedCats.length > 0) {
          setNewComplaint((prev) => ({
            ...prev,
            category: prev.category || fetchedCats[0]._id
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchMyComplaints = async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    setLoading(true);
    try {
      let url = `/complaints/${userId}/my-complaints`;
      if (filterStatus) url += `?status=${filterStatus}`;
      const res = await API.get(url);
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      setErrorMsg('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newComplaint.title || !newComplaint.description || !newComplaint.category) {
      setErrorMsg('Please complete all required fields (Category, Title, Description)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post(`/complaints/${user._id}`, {
        title: newComplaint.title,
        description: newComplaint.description,
        category: newComplaint.category
      });

      if (res.data.success) {
        setSuccessMsg('Complaint submitted successfully!');
        setNewComplaint({ title: '', category: categories[0]?._id || '', description: '' });
        fetchMyComplaints();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter complaints by local search term
  const filteredComplaints = complaints.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.title?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.category?.name?.toLowerCase().includes(term)
    );
  });

  // Calculate stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;
  const rejectedCount = complaints.filter((c) => c.status === 'REJECTED').length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Student / User Dashboard</h1>
        <p>Submit new grievances and monitor real-time review progress.</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-total">
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalCount}</span>
            <span className="stat-label">Total Submitted</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-pending">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-progress">
            <RefreshCw size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{inProgressCount}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-resolved">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{resolvedCount}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-rejected">
            <XCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{rejectedCount}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* Submit Complaint Card */}
        <div className="panel-card">
          <div className="panel-header">
            <PlusCircle size={20} style={{ marginRight: '8px', color: '#2563eb' }} />
            <h2>Submit New Complaint</h2>
          </div>

          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleCreateComplaint} className="sober-form">
            <div className="form-group">
              <label htmlFor="category">Select Category *</label>
              <select
                id="category"
                value={newComplaint.category}
                onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                required
              >
                <option value="" disabled>-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Complaint Subject / Title *</label>
              <input
                type="text"
                id="title"
                value={newComplaint.title}
                onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                placeholder="e.g. Projector in Room 302 not functioning"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Detailed Description *</label>
              <textarea
                id="description"
                rows={5}
                value={newComplaint.description}
                onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                placeholder="Provide complete details regarding the problem..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        {/* Complaints History Card */}
        <div className="panel-card">
          <div className="panel-header flex-between">
            <h2>My Submitted Complaints</h2>
            <button className="btn-secondary btn-sm" onClick={fetchMyComplaints}>
              <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh
            </button>
          </div>

          {/* Search and Status Filters */}
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-select-wrapper">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="empty-state">No complaints found.</div>
          ) : (
            <div className="table-responsive">
              <table className="sober-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((item) => (
                    <tr key={item._id}>
                      <td className="font-semibold">{item.title}</td>
                      <td>{item.category?.name || 'N/A'}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <button
                          className="btn-outline btn-sm"
                          onClick={() => setSelectedComplaint(item)}
                        >
                          <Eye size={14} style={{ marginRight: '4px' }} /> View
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

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="modal-backdrop" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complaint Details</h3>
              <button className="btn-close" onClick={() => setSelectedComplaint(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Subject:</span>
                <span className="detail-value font-bold">{selectedComplaint.title}</span>
              </div>

              <div className="modal-detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{selectedComplaint.category?.name || 'N/A'}</span>
              </div>

              <div className="modal-detail-row">
                <span className="detail-label">Submitted On:</span>
                <span className="detail-value">{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
              </div>

              <div className="modal-detail-row">
                <span className="detail-label">Current Status:</span>
                <span className="detail-value">
                  <StatusBadge status={selectedComplaint.status} />
                </span>
              </div>

              <div className="modal-detail-box">
                <h4>Description:</h4>
                <p className="description-text">{selectedComplaint.description}</p>
              </div>

              <div className="modal-detail-box admin-response-box">
                <h4>Admin Feedback / Remarks:</h4>
                {selectedComplaint.adminComment ? (
                  <p className="admin-comment-text">{selectedComplaint.adminComment}</p>
                ) : (
                  <p className="text-muted font-italic">No administrative comments provided yet.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedComplaint(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
