import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Box, Container, Typography, Paper, Grid, Chip, Divider, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SchoolIcon from '@mui/icons-material/School';
import GradeManagementModal from './GradeManagementModal';
import PaymentManagementModal from './PaymentManagementModal';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

const STATUS = {
  submitted: { color: 'success', icon: <CheckCircleIcon color="success" />, label: 'Submitted' },
  missing:   { color: 'error',   icon: <CancelIcon color="error" />,        label: 'Missing' },
  expired:   { color: 'warning', icon: <WarningAmberIcon color="warning" />, label: 'Expired' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString();
};

export default function StudentProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((s) => s.userLogin);
  const token = userInfo?.token || userInfo?.access;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGrades, setShowGrades] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [uploadItem, setUploadItem] = useState(null); // compliance item being uploaded
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null); // compliance item being deleted
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState(null);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE}/api/admin/students/${username}/profile/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  }, [username, token]);

  useEffect(() => {
    if (token) fetchProfile();
  }, [fetchProfile, token]);

  const handleUpload = async () => {
    if (!file || !uploadItem) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('title', `${data.first_name} ${data.last_name} — ${uploadItem.category}`);
    fd.append('scope', 'individual');
    if (data.cohort?.id) fd.append('cohort_id', data.cohort.id);
    fd.append('student_username', data.username);
    fd.append('category_id', uploadItem.category_id);
    fd.append('is_public', false);
    fd.append('file', file);
    try {
      await axios.post(`${API_BASE}/api/documents/`, fd, {
        headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
      });
      setSnack({ type: 'success', msg: `${uploadItem.category} uploaded.` });
      setUploadItem(null);
      setFile(null);
      fetchProfile();
    } catch (e) {
      setSnack({ type: 'error', msg: e.response?.data?.error || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const viewDoc = async (docId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/documents/${docId}/download/`, {
        headers: authHeader,
      });
      window.open(res.data.download_url, '_blank', 'noopener');
    } catch {
      setSnack({ type: 'error', msg: 'Could not open document.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.document) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/api/documents/${deleteItem.document.id}/`, { headers: authHeader });
      setSnack({ type: 'success', msg: `${deleteItem.category} removed.` });
      setDeleteItem(null);
      fetchProfile();
    } catch (e) {
      setSnack({ type: 'error', msg: e.response?.data?.error || 'Delete failed.' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  if (!data) return null;

  const comp = data.compliance || { items: [], required_count: 0, complete_count: 0 };
  const pct = comp.required_count ? Math.round((comp.complete_count / comp.required_count) * 100) : 0;
  const studentForModals = { ...data, username: data.username };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }} className="student-profile">
      {/* print styles: hide nav + action buttons when printing */}
      <style>{`@media print {
        .no-print { display: none !important; }
        .MuiAppBar-root, header { display: none !important; }
        body { background: #fff; }
      }`}</style>

      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back to students</Button>
        <Button startIcon={<PrintIcon />} variant="outlined" onClick={() => window.print()}>
          Print file
        </Button>
      </Box>

      {/* ===== Header card ===== */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {data.first_name} {data.last_name}
            </Typography>
            <Typography color="text.secondary">@{data.username} · {data.email || 'no email'}</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {data.cohort && (
                <>
                  <Chip icon={<SchoolIcon />} label={`Cohort ${data.cohort.cohort_number}`} size="small" />
                  <Chip label={data.cohort.academic_year} size="small" variant="outlined" />
                  <Chip label={data.cohort.program_type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                </>
              )}
              {data.on_payment_plan && <Chip label="Payment plan" size="small" color="info" variant="outlined" />}
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="overline" color="text.secondary">GPA</Typography>
            <Typography variant="h5">
              {data.academic?.cumulative_gpa != null ? data.academic.cumulative_gpa.toFixed(2) : '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.academic?.academic_standing || 'No academic record'}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="overline" color="text.secondary">File compliance</Typography>
            <Typography variant="h5" color={pct === 100 ? 'success.main' : 'error.main'}>
              {comp.complete_count}/{comp.required_count}
            </Typography>
            <Typography variant="body2" color="text.secondary">{pct}% complete</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* ===== Courses + grades ===== */}
        <Grid item xs={12} md={7}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Courses & Grades</Typography>
              <Button className="no-print" size="small" variant="outlined" onClick={() => setShowGrades(true)}>
                Manage grades
              </Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {data.courses.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>No course records yet.</Typography>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell align="center">Term</TableCell>
                      <TableCell align="center">Credits</TableCell>
                      <TableCell align="center">Grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.course_name || '—'}</TableCell>
                        <TableCell align="center">{c.semester} {c.year}</TableCell>
                        <TableCell align="center">{c.credit_hours ?? '—'}</TableCell>
                        <TableCell align="center">
                          {c.grade_released
                            ? <strong>{c.grade || '—'}</strong>
                            : <Chip label="Pending" size="small" variant="outlined" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* ===== Payments ===== */}
          <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Payments</Typography>
              <Button className="no-print" size="small" variant="outlined" onClick={() => setShowPayment(true)}>
                Manage payments
              </Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {data.on_payment_plan ? 'On a payment plan.' : 'No payment plan on file.'}
              {data.payment_details?.next_due_date && ` Next due: ${fmtDate(data.payment_details.next_due_date)}.`}
            </Typography>
          </Paper>
        </Grid>

        {/* ===== Document compliance checklist ===== */}
        <Grid item xs={12} md={5}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6">Document Compliance</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Required file for accreditation — upload directly against any missing item.
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {comp.items.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No required documents configured.
              </Typography>
            ) : (
              comp.items.map((item) => {
                const meta = STATUS[item.status] || STATUS.missing;
                return (
                  <Box
                    key={item.category_id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: '1px solid #eee' }}
                  >
                    {meta.icon}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography noWrap>{item.category}</Typography>
                      {item.document && (
                        <Typography variant="caption" color="text.secondary" noWrap component="div">
                          {item.document.file_name} · {fmtDate(item.document.uploaded_at)}
                        </Typography>
                      )}
                    </Box>
                    {(item.status === 'submitted' || item.status === 'expired') && item.document ? (
                      <>
                        <Tooltip title="View document">
                          <IconButton size="small" className="no-print" onClick={() => viewDoc(item.document.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete document">
                          <IconButton
                            size="small"
                            className="no-print"
                            color="error"
                            onClick={() => setDeleteItem(item)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : null}
                    {item.status !== 'submitted' && (
                      <Button
                        size="small"
                        className="no-print"
                        startIcon={<UploadFileIcon />}
                        onClick={() => { setUploadItem(item); setFile(null); }}
                      >
                        Upload
                      </Button>
                    )}
                  </Box>
                );
              })
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ===== Upload dialog ===== */}
      <Dialog open={!!uploadItem} onClose={() => !uploading && setUploadItem(null)} fullWidth maxWidth="sm">
        <DialogTitle>Upload: {uploadItem?.category}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            For {data.first_name} {data.last_name}. This file is tagged to “{uploadItem?.category}”
            and will satisfy that requirement on their record.
          </Typography>
          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
            {file ? file.name : 'Choose file'}
            <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadItem(null)} disabled={uploading}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete confirmation ===== */}
      <Dialog open={!!deleteItem} onClose={() => !deleting && setDeleteItem(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete this document?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove <strong>{deleteItem?.document?.file_name}</strong> ({deleteItem?.category}) from{' '}
            {data.first_name} {data.last_name}'s file? This deletes the file and marks the requirement as missing again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItem(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {showGrades && (
        <GradeManagementModal
          student={studentForModals}
          open={showGrades}
          onClose={() => setShowGrades(false)}
          onUpdate={fetchProfile}
        />
      )}
      {showPayment && (
        <PaymentManagementModal
          student={studentForModals}
          open={showPayment}
          onClose={() => setShowPayment(false)}
          onPaymentRecorded={fetchProfile}
        />
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? <Alert severity={snack.type} onClose={() => setSnack(null)}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Container>
  );
}
