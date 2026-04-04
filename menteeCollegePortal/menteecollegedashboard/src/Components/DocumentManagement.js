import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
  Grid,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import DocumentViewer from './DocumentViewer';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../actions/userActions';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cohortsLoading, setCohortsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // Tab state for document organization
  
  // Get user info from Redux store for authentication
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Filter states
  const [filters, setFilters] = useState({
    academic_year: '',
    cohort_number: '',
    program_type: '',
    category_id: '',
    is_mandatory: '',
    search: '',
    student_name: '',
  });
  
  // Upload form states
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category_id: '',
    cohort_id: '',
    scope: 'cohort',
    file: null,
    is_public: true,
    is_mandatory: false,
    requires_signature: false,
    student_username: '',
  });
  
  // Username validation state
  const [usernameValidation, setUsernameValidation] = useState({
    isValidating: false,
    isValid: false,
    studentName: '',
    error: ''
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Debounce timer for username validation
  const [validationTimer, setValidationTimer] = useState(null);

  // Validate username function
  const validateUsername = async (username) => {
    const authToken = userInfo?.token || userInfo?.access;
    if (!authToken || !username.trim()) {
      setUsernameValidation({
        isValidating: false,
        isValid: false,
        studentName: '',
        error: ''
      });
      return;
    }

    setUsernameValidation(prev => ({ ...prev, isValidating: true, error: '' }));

    try {
      const response = await axios.get(`${API_BASE}/api/students/${username.trim()}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      // Extract student name from response
      const studentData = response.data;
      const studentName = `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || 
                         studentData.email || 
                         studentData.username;

      setUsernameValidation({
        isValidating: false,
        isValid: true,
        studentName: studentName,
        error: ''
      });

    } catch (error) {
      console.log('Username validation error:', error);
      setUsernameValidation({
        isValidating: false,
        isValid: false,
        studentName: '',
        error: error.response?.status === 404 ? 'Student not found' : 'Validation error'
      });
    }
  };

  // Debounced username validation
  const handleUsernameChange = (username) => {
    setUploadForm({ ...uploadForm, student_username: username });

    // Clear existing timer
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    // Reset validation state immediately
    setUsernameValidation({
      isValidating: false,
      isValid: false,
      studentName: '',
      error: ''
    });

    // Set new timer for validation (500ms delay)
    if (username.trim()) {
      const timer = setTimeout(() => {
        validateUsername(username);
      }, 500);
      setValidationTimer(timer);
    }
  };

  // Handle token errors globally
  const handleTokenError = (error) => {
    // Only handle specific token errors, not all 401s
    if (error.response?.data?.code === 'token_not_valid' ||
        (error.response?.status === 401 && error.response?.data?.detail?.includes('token'))) {
      console.log('Token error detected:', error.response?.data);
      showSnackbar('Session expired - please log in again', 'error');
      // Comment out automatic logout for now to debug
      // dispatch(logout());
      // navigate('/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    console.log('DocumentManagement mounted, userInfo:', userInfo);
    console.log('Is staff?:', userInfo?.is_staff);
    console.log('Full userInfo object:', JSON.stringify(userInfo, null, 2));
    // Check for either 'token' or 'access' field (JWT returns 'access')
    const authToken = userInfo?.token || userInfo?.access;
    if (userInfo && authToken) {
      console.log('Fetching documents with token:', authToken);
      fetchDocuments();
      fetchCohorts();
      fetchCategories();
    } else {
      console.log('No userInfo or token available');
      console.log('UserInfo structure:', userInfo);
    }
  }, [userInfo]);

  useEffect(() => {
    const authToken = userInfo?.token || userInfo?.access;
    if (userInfo && authToken) {
      fetchDocuments();
    }
  }, [filters]);

  const fetchDocuments = async () => {
    const authToken = userInfo?.token || userInfo?.access;
    if (!userInfo || !authToken) {
      showSnackbar('Please log in to view documents', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const url = `${API_BASE}/api/documents/?${params}`;
      console.log('Fetching documents from:', url);
      console.log('Using auth token:', authToken);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Documents API full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      
      // Handle paginated or non-paginated response
      let documentsData = [];
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          documentsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          documentsData = response.data.results;
          console.log('Paginated response - count:', response.data.count);
          console.log('Next page:', response.data.next);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          documentsData = response.data.data;
        }
      }
      
      console.log('Processed documents array:', documentsData);
      console.log('Number of documents:', documentsData.length);
      
      // Log Individual documents for debugging
      const individualDocs = documentsData.filter(d => d.scope === 'individual');
      if (individualDocs.length > 0) {
        console.log('=== INDIVIDUAL DOCUMENTS DEBUG ===');
        individualDocs.forEach(doc => {
          console.log(`Document: ${doc.title}`);
          console.log('  Scope:', doc.scope);
          console.log('  Assigned Students:', doc.assigned_students);
        });
      }
      
      // Log S3 URLs for debugging
      if (documentsData.length > 0) {
        console.log('=== DOCUMENT S3 DEBUG ===');
        console.log('First document full data:', documentsData[0]);
        console.log('Sample document with S3 info:', {
          title: documentsData[0].title,
          s3_url: documentsData[0].s3_url,
          s3_key: documentsData[0].s3_key,
          file: documentsData[0].file,
          download_url: documentsData[0].download_url
        });
        
        // Check all documents for S3 URLs
        const docsWithS3 = documentsData.filter(d => d.s3_url);
        const docsWithS3Key = documentsData.filter(d => d.s3_key);
        console.log(`Documents with s3_url: ${docsWithS3.length}/${documentsData.length}`);
        console.log(`Documents with s3_key: ${docsWithS3Key.length}/${documentsData.length}`);
        
        // If we have s3_key but no s3_url, construct it
        documentsData = documentsData.map(doc => {
          if (!doc.s3_url && doc.s3_key) {
            // Construct S3 URL from s3_key
            const bucketName = 'andrewslearningimage-bucket'; // Based on your example URL
            doc.s3_url = `https://${bucketName}.s3.amazonaws.com/${doc.s3_key}`;
            console.log(`Constructed S3 URL for ${doc.title}: ${doc.s3_url}`);
          }
          return doc;
        });
        
        // Debug individual student documents
        const individualDocs = documentsData.filter(d => d.scope === 'individual');
        console.log('=== INDIVIDUAL DOCUMENTS DEBUG ===');
        console.log('Individual documents count:', individualDocs.length);
        if (individualDocs.length > 0) {
          console.log('First individual doc:', individualDocs[0]);
          console.log('Assigned students:', individualDocs[0].assigned_students);
        }
      }
      
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error fetching documents:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      if (!handleTokenError(error)) {
        const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Error fetching documents';
        showSnackbar(errorMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCohorts = async () => {
    const authToken = userInfo?.token || userInfo?.access;
    if (!userInfo || !authToken) return;
    
    setCohortsLoading(true);
    try {
      // Try the ViewSet endpoint first, fall back to the old endpoint if it fails
      let response;
      try {
        response = await axios.get(`${API_BASE}/api/cohorts/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('Fetched cohorts from /api/cohorts/:', response.data);
      } catch (apiError) {
        console.log('Failed to fetch from /api/cohorts/, trying /cohorts-list/');
        response = await axios.get(`${API_BASE}/cohorts-list/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('Fetched cohorts from /cohorts-list/:', response.data);
      }
      
      // Handle paginated or non-paginated response
      let cohortsData = [];
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          cohortsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          cohortsData = response.data.results;
        }
      }
      
      console.log('Processed cohorts:', cohortsData);
      setCohorts(cohortsData);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      console.error('Error response:', error.response?.data);
      if (!handleTokenError(error)) {
        showSnackbar('Error loading cohorts', 'error');
      }
    } finally {
      setCohortsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const authToken = userInfo?.token || userInfo?.access;
    if (!userInfo || !authToken) return;
    
    try {
      const response = await axios.get(`${API_BASE}/api/document-categories/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Categories API response:', response.data);
      
      // Handle paginated or non-paginated response
      let categoriesData = [];
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          categoriesData = response.data.results;
        }
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error response:', error.response?.data);
      handleTokenError(error);
    }
  };

  const handleFileUpload = async () => {
    const authToken = userInfo?.token || userInfo?.access;
    if (!userInfo || !authToken) {
      showSnackbar('Please log in to upload documents', 'error');
      return;
    }

    // Validate required fields based on scope
    if (!uploadForm.title || !uploadForm.file) {
      showSnackbar('Please provide a title and file', 'error');
      return;
    }
    
    if ((uploadForm.scope === 'cohort' || uploadForm.scope === 'individual') && !uploadForm.cohort_id) {
      showSnackbar('Please select a cohort', 'error');
      return;
    }
    
    if (uploadForm.scope === 'individual' && !uploadForm.student_username.trim()) {
      showSnackbar('Please provide a student username', 'error');
      return;
    }
    
    if (uploadForm.scope === 'individual' && !usernameValidation.isValid) {
      showSnackbar('Please enter a valid student username', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('scope', uploadForm.scope);
    if (uploadForm.category_id) {
      formData.append('category_id', uploadForm.category_id);
    }
    // Only add cohort_id for cohort/individual scope documents
    if ((uploadForm.scope === 'cohort' || uploadForm.scope === 'individual') && uploadForm.cohort_id) {
      formData.append('cohort_id', uploadForm.cohort_id);
    }
    formData.append('is_public', uploadForm.is_public);
    formData.append('is_mandatory', uploadForm.is_mandatory);
    formData.append('requires_signature', uploadForm.requires_signature);
    
    // Add student username for individual scope
    if (uploadForm.scope === 'individual' && uploadForm.student_username.trim()) {
      formData.append('student_username', uploadForm.student_username.trim());
    }
    
    if (uploadForm.file) {
      formData.append('file', uploadForm.file);
    }

    try {
      await axios.post(`${API_BASE}/api/documents/`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      
      showSnackbar('Document uploaded successfully', 'success');
      setUploadDialogOpen(false);
      fetchDocuments();
      resetUploadForm();
    } catch (error) {
      console.error('Error uploading document:', error);
      if (!handleTokenError(error)) {
        const errorMessage = error.response?.data?.error || 'Error uploading document';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const handlePreview = (document) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  const handleDownload = async (documentId, fileName) => {
    const authToken = userInfo?.token || userInfo?.access;
    if (!userInfo || !authToken) {
      showSnackbar('Please log in to download documents', 'error');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/documents/${documentId}/download/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Open the download URL in a new tab
      window.open(response.data.download_url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      if (!handleTokenError(error)) {
        showSnackbar('Error downloading document', 'error');
      }
    }
  };

  const handleDelete = async (documentId) => {
    const authToken = userInfo?.token || userInfo?.access;
    if (!userInfo || !authToken) {
      showSnackbar('Please log in to delete documents', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/documents/${documentId}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      showSnackbar('Document deleted successfully', 'success');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      if (!handleTokenError(error)) {
        showSnackbar('Error deleting document', 'error');
      }
    }
  };

  const applyFilters = () => {
    setFilterDialogOpen(false);
    fetchDocuments();
  };

  const resetFilters = () => {
    setFilters({
      academic_year: '',
      cohort_number: '',
      program_type: '',
      category_id: '',
      is_mandatory: '',
      search: '',
      student_name: '',
    });
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      category_id: '',
      cohort_id: '',
      scope: 'cohort',
      file: null,
      is_public: true,
      is_mandatory: false,
      requires_signature: false,
      student_username: '',
    });
    setUsernameValidation({
      isValidating: false,
      isValid: false,
      studentName: '',
      error: ''
    });
    if (validationTimer) {
      clearTimeout(validationTimer);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Helper functions for document organization
  const getDocumentsByScope = (scope) => {
    return documents.filter(doc => doc.scope === scope);
  };

  const getTabDocuments = () => {
    const scopes = ['individual', 'cohort', 'program', 'general'];
    return getDocumentsByScope(scopes[currentTab]);
  };

  const getTabLabel = (index) => {
    const labels = [
      'Individual Students',
      'Cohort Documents', 
      'Program Materials',
      'General Resources'
    ];
    const scopes = ['individual', 'cohort', 'program', 'general'];
    const count = getDocumentsByScope(scopes[index]).length;
    return `${labels[index]} (${count})`;
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Document Management
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
              sx={{ mr: 2 }}
            >
              Filter
            </Button>
            {userInfo && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  console.log('Opening upload dialog, cohorts state:', cohorts);
                  console.log('User info:', userInfo);
                  setUploadDialogOpen(true);
                }}
              >
                Upload Document
              </Button>
            )}
          </Box>
        </Box>

        {/* Document Organization Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="document organization tabs">
            <Tab label={getTabLabel(0)} />
            <Tab label={getTabLabel(1)} />
            <Tab label={getTabLabel(2)} />
            <Tab label={getTabLabel(3)} />
          </Tabs>
        </Box>

        {/* Student Name Search Bar - Only show for Individual Students tab */}
        {currentTab === 0 && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search by Student Name"
              placeholder="Enter first name, last name, or username..."
              value={filters.student_name}
              onChange={(e) => setFilters({ ...filters, student_name: e.target.value })}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <FilterIcon color="action" />
                  </Box>
                ),
              }}
              helperText="Search for documents by student's first name, last name, or username"
            />
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Cohort/Assigned To</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Uploaded By</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getTabDocuments().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                        No documents found in this category.
                        {userInfo?.is_staff && ' Click "Upload Document" to add new documents.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getTabDocuments().map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        {doc.s3_url ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <a 
                              href={doc.s3_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                textDecoration: 'none', 
                                color: '#1976d2',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={`Open document in new tab: ${doc.s3_url}`}
                            >
                              {doc.title}
                              <OpenInNewIcon sx={{ fontSize: 16 }} />
                            </a>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{doc.title}</span>
                            {doc.s3_key && (
                              <Chip 
                                label="No S3 URL" 
                                size="small" 
                                color="warning" 
                                sx={{ fontSize: '10px', height: '18px' }}
                                title={`Has s3_key: ${doc.s3_key} but no s3_url`}
                              />
                            )}
                            {!doc.s3_key && (
                              <Chip 
                                label="No S3" 
                                size="small" 
                                color="error" 
                                sx={{ fontSize: '10px', height: '18px' }}
                                title="Document has no S3 information"
                              />
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={doc.scope_display || doc.scope} 
                          size="small"
                          color={
                            doc.scope === 'individual' ? 'primary' :
                            doc.scope === 'cohort' ? 'secondary' :
                            doc.scope === 'program' ? 'success' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {doc.scope === 'individual' ? (
                          <Box>
                            {doc.cohort_details && (
                              <Typography variant="caption" color="textSecondary" display="block">
                                {doc.cohort_details.academic_year} Cohort {doc.cohort_details.cohort_number}
                              </Typography>
                            )}
                            {doc.assigned_students && doc.assigned_students.length > 0 ? (
                              <>
                                <Typography variant="caption" color="textSecondary">
                                  Assigned to:
                                </Typography>
                                {doc.assigned_students.map((student, idx) => (
                                  <Chip
                                    key={student.id}
                                    label={student.full_name || student.username}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ ml: idx > 0 ? 0.5 : 0, mb: 0.5, display: 'inline-flex' }}
                                    title={`${student.full_name} (${student.username})`}
                                  />
                                ))}
                              </>
                            ) : (
                              <Typography variant="caption" color="warning.main">
                                No students assigned yet
                              </Typography>
                            )}
                          </Box>
                        ) : doc.cohort_details ? 
                          `${doc.cohort_details.academic_year} Cohort ${doc.cohort_details.cohort_number}` : 
                          doc.scope === 'program' ? 'Program-wide' : 
                          doc.scope === 'general' ? 'All Programs' : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{doc.category_name || 'Uncategorized'}</TableCell>
                      <TableCell>{doc.file_type?.toUpperCase() || 'N/A'}</TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>{doc.uploaded_by_name || 'Unknown'}</TableCell>
                      <TableCell>
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box>
                          {doc.is_mandatory && (
                            <Chip label="Mandatory" color="error" size="small" sx={{ mr: 0.5 }} />
                          )}
                          {doc.is_public ? (
                            <Chip label="Public" color="success" size="small" />
                          ) : (
                            <Chip label="Private" color="warning" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="info"
                          onClick={() => handlePreview(doc)}
                          title="Preview"
                          sx={{ mr: 1 }}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={() => handleDownload(doc.id, doc.file_name)}
                          title="Download"
                          sx={{ mr: 1 }}
                        >
                          <DownloadIcon />
                        </IconButton>
                        {userInfo && (
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Document Scope</InputLabel>
                <Select
                  value={uploadForm.scope}
                  onChange={(e) => {
                    setUploadForm({ 
                      ...uploadForm, 
                      scope: e.target.value, 
                      cohort_id: '',
                      student_username: '' 
                    });
                  }}
                  label="Document Scope"
                >
                  <MenuItem value="individual">Individual Student</MenuItem>
                  <MenuItem value="cohort">Entire Cohort</MenuItem>
                  <MenuItem value="program">Program-wide</MenuItem>
                  <MenuItem value="general">General/All Programs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(uploadForm.scope === 'cohort' || uploadForm.scope === 'individual') && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Cohort</InputLabel>
                  <Select
                    value={uploadForm.cohort_id}
                    onChange={(e) => {
                      setUploadForm({ ...uploadForm, cohort_id: e.target.value });
                    }}
                    label="Cohort"
                  >
                    {cohortsLoading ? (
                      <MenuItem disabled value="">
                        Loading cohorts...
                      </MenuItem>
                    ) : cohorts.length === 0 ? (
                      <MenuItem disabled value="">
                        No cohorts available
                      </MenuItem>
                    ) : (
                      cohorts.map((cohort) => (
                        <MenuItem key={cohort.id} value={cohort.id}>
                          {cohort.academic_year} Cohort {cohort.cohort_number} - {cohort.program_name || cohort.program_type || 'No Program'}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {uploadForm.scope === 'individual' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Student Username"
                  placeholder="Enter student username"
                  value={uploadForm.student_username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  helperText={
                    usernameValidation.isValidating ? "Validating username..." :
                    usernameValidation.isValid ? `Valid student: ${usernameValidation.studentName}` :
                    usernameValidation.error ? usernameValidation.error :
                    "Enter the student's username to assign this document"
                  }
                  InputProps={{
                    endAdornment: usernameValidation.isValidating ? (
                      <CircularProgress size={20} />
                    ) : usernameValidation.isValid ? (
                      <CheckCircleIcon color="success" />
                    ) : usernameValidation.error && uploadForm.student_username ? (
                      <ErrorIcon color="error" />
                    ) : null
                  }}
                  error={!!(usernameValidation.error && uploadForm.student_username)}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={uploadForm.category_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, category_id: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <input
                type="file"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  {uploadForm.file ? uploadForm.file.name : 'Choose File'}
                </Button>
              </label>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadForm.is_public}
                    onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
                  />
                }
                label="Public (visible to all cohort students)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadForm.is_mandatory}
                    onChange={(e) => setUploadForm({ ...uploadForm, is_mandatory: e.target.checked })}
                  />
                }
                label="Mandatory (students must acknowledge)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadForm.requires_signature}
                    onChange={(e) => setUploadForm({ ...uploadForm, requires_signature: e.target.checked })}
                  />
                }
                label="Requires signature"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={
              !uploadForm.title || 
              !uploadForm.file || 
              ((uploadForm.scope === 'cohort' || uploadForm.scope === 'individual') && !uploadForm.cohort_id) ||
              (uploadForm.scope === 'individual' && (!uploadForm.student_username.trim() || !usernameValidation.isValid))
            }
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Documents</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by title, description, or filename"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Student Name"
                value={filters.student_name}
                onChange={(e) => setFilters({ ...filters, student_name: e.target.value })}
                placeholder="Search by student's first name, last name, or username"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Academic Year"
                placeholder="2024-2025"
                value={filters.academic_year}
                onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Cohort Number"
                type="number"
                value={filters.cohort_number}
                onChange={(e) => setFilters({ ...filters, cohort_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Program Type</InputLabel>
                <Select
                  value={filters.program_type}
                  onChange={(e) => setFilters({ ...filters, program_type: e.target.value })}
                  label="Program Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="certificate">Certificate</MenuItem>
                  <MenuItem value="diploma">Diploma</MenuItem>
                  <MenuItem value="associates">Associates</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category_id}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={filters.is_mandatory}
                  onChange={(e) => setFilters({ ...filters, is_mandatory: e.target.value })}
                  label="Document Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Mandatory</MenuItem>
                  <MenuItem value="false">Optional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters}>Reset</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={applyFilters} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Viewer Dialog */}
      <DocumentViewer
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onDownload={handleDownload}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentManagement;
