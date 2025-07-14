import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDocuments = () => {
  const { subdomain } = useParams();
  const { user } = useAuth();
  
  // Use user info for personalization and subdomain for navigation
  const userName = user?.name || 'Employee';
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    file: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        // In a real app, fetch from API
        // For now, using mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock documents data
        const mockDocuments = [
          {
            id: '1',
            title: 'Employment Contract',
            description: 'Your signed employment contract',
            fileName: 'contract_2025.pdf',
            fileSize: '1.2 MB',
            uploadedBy: 'HR Department',
            uploadedAt: '2025-01-15T10:00:00Z',
            category: 'contract',
            isShared: false
          },
          {
            id: '2',
            title: 'Employee Handbook',
            description: 'Company policies and procedures',
            fileName: 'employee_handbook_v3.pdf',
            fileSize: '3.5 MB',
            uploadedBy: 'HR Department',
            uploadedAt: '2025-01-10T14:30:00Z',
            category: 'policy',
            isShared: false
          },
          {
            id: '3',
            title: 'Direct Deposit Form',
            description: 'Your completed direct deposit form',
            fileName: 'direct_deposit_2025.pdf',
            fileSize: '0.8 MB',
            uploadedBy: 'You',
            uploadedAt: '2025-02-05T09:15:00Z',
            category: 'financial',
            isShared: false
          },
          {
            id: '4',
            title: 'Tax Form W-4',
            description: 'Your tax withholding form',
            fileName: 'w4_2025.pdf',
            fileSize: '0.5 MB',
            uploadedBy: 'You',
            uploadedAt: '2025-02-05T09:20:00Z',
            category: 'tax',
            isShared: false
          },
          {
            id: '5',
            title: 'Benefits Enrollment',
            description: 'Your benefits selection for 2025',
            fileName: 'benefits_2025.pdf',
            fileSize: '1.0 MB',
            uploadedBy: 'HR Department',
            uploadedAt: '2025-01-20T11:45:00Z',
            category: 'benefits',
            isShared: false
          }
        ];
        
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument(prev => ({
        ...prev,
        file: e.target.files[0]
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form
    if (!newDocument.title || !newDocument.file) {
      setError('Please provide a title and select a file');
      return;
    }
    
    setUploadingFile(true);
    
    try {
      // In a real app, send to API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock new document
      const newDoc = {
        id: `new-${Date.now()}`,
        title: newDocument.title,
        description: newDocument.description || '',
        fileName: newDocument.file.name,
        fileSize: `${(newDocument.file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedBy: 'You',
        uploadedAt: new Date().toISOString(),
        category: 'other',
        isShared: false
      };
      
      // Update state
      setDocuments(prev => [newDoc, ...prev]);
      
      // Reset form
      setNewDocument({
        title: '',
        description: '',
        file: null
      });
      
      // Reset file input
      document.getElementById('document-file').value = '';
      
      setSuccess('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document');
    } finally {
      setUploadingFile(false);
    }
  };
  
  const deleteDocument = async (id) => {
    try {
      // In a real app, send to API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update state
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      setSuccess('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };
  
  const shareDocument = async (id) => {
    try {
      // In a real app, send to API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update state
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, isShared: !doc.isShared } : doc
      ));
      
      setSuccess('Document sharing status updated');
    } catch (error) {
      console.error('Error updating document sharing:', error);
      setError('Failed to update document sharing');
    }
  };
  
  const filteredDocuments = filter === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === filter);
  
  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading documents...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">My Documents</h3>
                  <div className="nk-block-des text-soft">
                    <p>Welcome {userName}, access and manage your important documents for {subdomain}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="alert alert-danger alert-icon">
                <em className="icon ni ni-alert-circle"></em>
                <strong>{error}</strong>
              </div>
            )}
            
            {success && (
              <div className="alert alert-success alert-icon">
                <em className="icon ni ni-check-circle"></em>
                <strong>{success}</strong>
              </div>
            )}
            
            <div className="nk-block">
              <div className="row g-gs">
                <div className="col-lg-8">
                  <div className="card card-bordered">
                    <div className="card-inner border-bottom">
                      <div className="card-title-group">
                        <div className="card-title">
                          <h6 className="title">Document Library</h6>
                        </div>
                        <div className="card-tools">
                          <div className="form-inline flex-nowrap">
                            <div className="form-wrap w-150px">
                              <select 
                                className="form-select" 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                              >
                                <option value="all">All Documents</option>
                                <option value="contract">Contracts</option>
                                <option value="policy">Policies</option>
                                <option value="financial">Financial</option>
                                <option value="tax">Tax</option>
                                <option value="benefits">Benefits</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-inner p-0">
                      <div className="nk-tb-list nk-tb-ulist">
                        <div className="nk-tb-item nk-tb-head">
                          <div className="nk-tb-col"><span>Document</span></div>
                          <div className="nk-tb-col tb-col-md"><span>Size</span></div>
                          <div className="nk-tb-col tb-col-lg"><span>Uploaded By</span></div>
                          <div className="nk-tb-col tb-col-lg"><span>Date</span></div>
                          <div className="nk-tb-col nk-tb-col-tools"></div>
                        </div>
                        
                        {filteredDocuments.length > 0 ? (
                          filteredDocuments.map(doc => (
                            <div key={doc.id} className="nk-tb-item">
                              <div className="nk-tb-col">
                                <div className="user-card">
                                  <div className="user-avatar bg-light">
                                    <span>
                                      {doc.fileName.endsWith('.pdf') && <em className="icon ni ni-file-pdf"></em>}
                                      {doc.fileName.endsWith('.doc') && <em className="icon ni ni-file-doc"></em>}
                                      {doc.fileName.endsWith('.docx') && <em className="icon ni ni-file-doc"></em>}
                                      {doc.fileName.endsWith('.xls') && <em className="icon ni ni-file-xls"></em>}
                                      {doc.fileName.endsWith('.xlsx') && <em className="icon ni ni-file-xls"></em>}
                                      {doc.fileName.endsWith('.ppt') && <em className="icon ni ni-file-ppt"></em>}
                                      {doc.fileName.endsWith('.pptx') && <em className="icon ni ni-file-ppt"></em>}
                                      {doc.fileName.endsWith('.jpg') && <em className="icon ni ni-img"></em>}
                                      {doc.fileName.endsWith('.jpeg') && <em className="icon ni ni-img"></em>}
                                      {doc.fileName.endsWith('.png') && <em className="icon ni ni-img"></em>}
                                      {doc.fileName.endsWith('.gif') && <em className="icon ni ni-img"></em>}
                                      {doc.fileName.endsWith('.zip') && <em className="icon ni ni-file-zip"></em>}
                                      {doc.fileName.endsWith('.txt') && <em className="icon ni ni-file-text"></em>}
                                      {!doc.fileName.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|zip|txt)$/) && <em className="icon ni ni-file"></em>}
                                    </span>
                                  </div>
                                  <div className="user-info">
                                    <span className="tb-lead">{doc.title}</span>
                                    <span>{doc.description}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="nk-tb-col tb-col-md">
                                <span>{doc.fileSize}</span>
                              </div>
                              <div className="nk-tb-col tb-col-lg">
                                <span>{doc.uploadedBy}</span>
                              </div>
                              <div className="nk-tb-col tb-col-lg">
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="nk-tb-col nk-tb-col-tools">
                                <ul className="nk-tb-actions gx-1">
                                  <li>
                                    <div className="drodown">
                                      <button className="dropdown-toggle btn btn-icon btn-trigger" data-bs-toggle="dropdown">
                                        <em className="icon ni ni-more-h"></em>
                                      </button>
                                      <div className="dropdown-menu dropdown-menu-end">
                                        <ul className="link-list-opt no-bdr">
                                          <li>
                                            <button className="dropdown-item" onClick={() => {
                                              // In a real app, this would download the file
                                              alert(`Downloading ${doc.fileName}`);
                                            }}>
                                              <em className="icon ni ni-download"></em>
                                              <span>Download</span>
                                            </button>
                                          </li>
                                          <li>
                                            <button className="dropdown-item" onClick={() => {
                                              shareDocument(doc.id);
                                            }}>
                                              <em className={`icon ni ni-${doc.isShared ? 'shield' : 'share'}`}></em>
                                              <span>{doc.isShared ? 'Make Private' : 'Share'}</span>
                                            </button>
                                          </li>
                                          {doc.uploadedBy === 'You' && (
                                            <li>
                                              <button className="dropdown-item" onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this document?')) {
                                                  deleteDocument(doc.id);
                                                }
                                              }}>
                                                <em className="icon ni ni-trash"></em>
                                                <span>Delete</span>
                                              </button>
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4">
                            <em className="icon ni ni-file-text" style={{ fontSize: '2rem' }}></em>
                            <p className="mt-2">No documents found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4">
                  <div className="card card-bordered h-100">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-3">
                        <div className="card-title">
                          <h6 className="title">Upload Document</h6>
                        </div>
                      </div>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">Document Title</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                name="title"
                                value={newDocument.title}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">Description (Optional)</label>
                              <textarea 
                                className="form-control" 
                                name="description"
                                value={newDocument.description}
                                onChange={handleInputChange}
                                rows="2"
                              ></textarea>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">File</label>
                              <div className="form-control-wrap">
                                <input 
                                  type="file" 
                                  className="form-control" 
                                  id="document-file"
                                  onChange={handleFileChange}
                                  required
                                />
                              </div>
                              <div className="form-note">
                                Max file size: 10MB
                              </div>
                            </div>
                          </div>
                          <div className="col-12">
                            <button 
                              type="submit" 
                              className="btn btn-primary"
                              disabled={uploadingFile}
                            >
                              {uploadingFile ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                  Uploading...
                                </>
                              ) : 'Upload Document'}
                            </button>
                          </div>
                        </div>
                      </form>
                      
                      <div className="mt-5">
                        <h6 className="title">Document Tips</h6>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item px-0">
                            <em className="icon ni ni-check-circle-fill text-success me-2"></em>
                            Keep your important documents secure
                          </li>
                          <li className="list-group-item px-0">
                            <em className="icon ni ni-check-circle-fill text-success me-2"></em>
                            Upload tax forms for easy access
                          </li>
                          <li className="list-group-item px-0">
                            <em className="icon ni ni-check-circle-fill text-success me-2"></em>
                            Share documents with HR when needed
                          </li>
                        </ul>
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
  );
};

export default EmployeeDocuments;
