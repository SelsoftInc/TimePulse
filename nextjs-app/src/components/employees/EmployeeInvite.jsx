'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PERMISSIONS } from '@/utils/roles';
import PermissionGuard from '../common/PermissionGuard';

const EmployeeInvite = () => {
  const { subdomain } = useParams();
  // Removed unused checkPermission from useAuth to satisfy lint
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteHistory, setInviteHistory] = useState([
    { id: 1, email: 'john.doe@example.com', name: 'John Doe', position: 'Developer', status: 'Pending', sentDate: '2025-07-05' },
    { id: 2, email: 'jane.smith@example.com', name: 'Jane Smith', position: 'Designer', status: 'Registered', sentDate: '2025-07-03' },
    { id: 3, email: 'mike.johnson@example.com', name: 'Mike Johnson', position: 'QA Engineer', status: 'Expired', sentDate: '2025-06-25' }
  ]);

  const handleGenerateLink = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real app, this would make an API call to generate a unique registration link
    setTimeout(() => {
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const link = `${window.location.origin}/register/${subdomain}/${token}`;
      setGeneratedLink(link);
      
      // Add to invite history
      const newInvite = {
        id: inviteHistory.length + 1,
        email,
        name,
        position,
        status: 'Pending',
        sentDate: new Date().toISOString().split('T')[0]
      };
      
      setInviteHistory([newInvite, ...inviteHistory]);
      setLoading(false);
    }, 1000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    // In a real app, this would send an email with the registration link
    alert(`Email with registration link sent to ${email}`);
  };

  const handleResendInvite = (id) => {
    // In a real app, this would resend the invitation email
    alert(`Invitation resent to employee #${id}`);
  };

  const handleRevokeInvite = (id) => {
    // In a real app, this would revoke the invitation
    setInviteHistory(inviteHistory.map(invite => 
      invite.id === id ? {...invite, status: 'Revoked'} : invite
    ));
  };

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.CREATE_EMPLOYEE}>
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block-head nk-block-head-sm">
                <div className="nk-block-between">
                  <div className="nk-block-head-content">
                    <h3 className="nk-block-title page-title">Invite Employees</h3>
                    <div className="nk-block-des text-soft">
                      <p>Generate registration links for new employees.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nk-block">
                <div className="row g-gs">
                  <div className="col-lg-5">
                    <div className="card card-bordered h-100">
                      <div className="card-inner">
                        <div className="card-head">
                          <h5 className="card-title">Generate Registration Link</h5>
                        </div>
                        <form onSubmit={handleGenerateLink}>
                          <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <div className="form-control-wrap">
                              <input 
                                type="email" 
                                className="form-control" 
                                id="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <div className="form-control-wrap">
                              <input 
                                type="text" 
                                className="form-control" 
                                id="name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label" htmlFor="position">Position</label>
                            <div className="form-control-wrap">
                              <input 
                                type="text" 
                                className="form-control" 
                                id="position" 
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label" htmlFor="department">Department</label>
                            <div className="form-control-wrap">
                              <select 
                                className="form-select" 
                                id="department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                              >
                                <option value="">Select Department</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Design">Design</option>
                                <option value="Product">Product</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="HR">HR</option>
                                <option value="Finance">Finance</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <button 
                              type="submit" 
                              className="btn btn-primary"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                  Generating...
                                </>
                              ) : 'Generate Link'}
                            </button>
                          </div>
                        </form>

                        {generatedLink && (
                          <div className="form-group mt-4">
                            <label className="form-label">Registration Link</label>
                            <div className="form-control-wrap">
                              <div className="input-group">
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  value={generatedLink} 
                                  readOnly 
                                />
                                <div className="input-group-append">
                                  <button 
                                    className="btn btn-outline-primary" 
                                    type="button"
                                    onClick={handleCopyLink}
                                  >
                                    {copied ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="form-note mt-3">
                              <button 
                                className="btn btn-dim btn-outline-primary"
                                onClick={handleSendEmail}
                              >
                                <em className="icon ni ni-mail me-1"></em>
                                Send via Email
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="card card-bordered h-100">
                      <div className="card-inner">
                        <div className="card-title-group align-start mb-3">
                          <div className="card-title">
                            <h5 className="title">Invitation History</h5>
                          </div>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Employee</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th>Sent Date</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inviteHistory.map(invite => (
                                <tr key={invite.id}>
                                  <td>
                                    <div className="user-card">
                                      <div className="user-info">
                                        <span className="tb-lead">{invite.name}</span>
                                        <span className="sub-text">{invite.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{invite.position}</td>
                                  <td>
                                    <span className={`badge badge-dot badge-${
                                      invite.status === 'Registered' ? 'success' : 
                                      invite.status === 'Pending' ? 'warning' : 
                                      invite.status === 'Revoked' ? 'danger' : 'gray'
                                    }`}>
                                      {invite.status}
                                    </span>
                                  </td>
                                  <td>{invite.sentDate}</td>
                                  <td>
                                    {invite.status === 'Pending' && (
                                      <>
                                        <button 
                                          className="btn btn-sm btn-icon btn-trigger me-1" 
                                          onClick={() => handleResendInvite(invite.id)}
                                          title="Resend Invite"
                                        >
                                          <em className="icon ni ni-mail"></em>
                                        </button>
                                        <button 
                                          className="btn btn-sm btn-icon btn-trigger text-danger" 
                                          onClick={() => handleRevokeInvite(invite.id)}
                                          title="Revoke Invite"
                                        >
                                          <em className="icon ni ni-cross-circle"></em>
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default EmployeeInvite;
