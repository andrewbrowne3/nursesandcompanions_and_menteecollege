import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Toolbar,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const DocumentViewer = ({ open, onClose, document, onDownload }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoom, setZoom] = useState(100);

  // Get user info from Redux store for authentication
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (open && document) {
      loadPreview();
    } else {
      // Clean up when dialog closes
      setPreviewUrl(null);
      setError(null);
      setZoom(100);
    }
  }, [open, document]);

  const loadPreview = async () => {
    if (!document || !document.s3_key) {
      setError('Document not available for preview');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      if (!userInfo || !authToken) {
        setError('Authentication token not found. Please log in again.');
        console.log('Auth debug - userInfo:', userInfo);
        return;
      }
      
      const response = await axios.get(`${API_BASE}/api/documents/${document.id}/download/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setPreviewUrl(response.data.download_url);
    } catch (error) {
      console.error('Error loading preview:', error);
      setError('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'pptx':
      case 'ppt':
        return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading preview...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Box>
      );
    }

    if (!previewUrl) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>No preview available</Typography>
        </Box>
      );
    }

    const fileType = document.file_type?.toLowerCase();

    // Handle different file types
    if (['jpg', 'jpeg', 'png'].includes(fileType)) {
      return (
        <Box sx={{ textAlign: 'center', height: 500, overflow: 'auto' }}>
          <img
            src={previewUrl}
            alt={document.title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          />
        </Box>
      );
    }

    if (fileType === 'pdf') {
      return (
        <Box sx={{ height: 600, width: '100%' }}>
          <iframe
            src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH&zoom=${zoom}`}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={document.title}
          />
        </Box>
      );
    }

    if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(fileType)) {
      // Use Google Docs Viewer for Office documents
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`;
      
      return (
        <Box sx={{ height: 600, width: '100%' }}>
          <iframe
            src={googleViewerUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={document.title}
          />
        </Box>
      );
    }

    if (fileType === 'txt' && document.extracted_text) {
      return (
        <Box sx={{ 
          height: 500, 
          overflow: 'auto', 
          padding: 2, 
          backgroundColor: '#f5f5f5',
          fontFamily: 'monospace',
          fontSize: `${zoom / 100}rem`
        }}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {document.extracted_text}
          </pre>
        </Box>
      );
    }

    // Fallback for unsupported file types
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          {getFileTypeIcon(fileType)}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {document.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Preview not available for {fileType?.toUpperCase()} files
        </Typography>
        {document.preview_text && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, maxWidth: 400 }}>
            <Typography variant="body2">
              {document.preview_text}
            </Typography>
          </Box>
        )}
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => onDownload && onDownload(document.id, document.file_name)}
          sx={{ mt: 2 }}
        >
          Download to View
        </Button>
      </Box>
    );
  };

  if (!document) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="span">
              {getFileTypeIcon(document.file_type)} {document.title}
            </Typography>
            <Chip 
              label={document.file_type?.toUpperCase() || 'Unknown'} 
              size="small" 
              color="primary" 
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Toolbar */}
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOutIcon />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
            {zoom}%
          </Typography>
          <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomInIcon />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => onDownload && onDownload(document.id, document.file_name)}
        >
          Download
        </Button>
      </Toolbar>

      <DialogContent sx={{ p: 0, flex: 1 }}>
        {renderPreview()}
      </DialogContent>

      <DialogActions>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1 }}>
            {document.cohort_details && (
              <Typography variant="body2" color="text.secondary">
                {document.cohort_details.year} Cohort {document.cohort_details.cohort_number} - {document.cohort_details.program_name}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Uploaded: {new Date(document.uploaded_at).toLocaleDateString()} by {document.uploaded_by_name}
            </Typography>
          </Box>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentViewer;