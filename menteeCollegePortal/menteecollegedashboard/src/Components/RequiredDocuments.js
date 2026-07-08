import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, Button, TextField, CircularProgress, Alert,
  Snackbar, Tooltip, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';
const ALL = 'ALL';

export default function RequiredDocuments({ embedded = false }) {
  const navigate = useNavigate();
  const { userInfo } = useSelector((s) => s.userLogin);
  const token = userInfo?.token || userInfo?.access;
  const authHeader = { Authorization: `Bearer ${token}` };

  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [snack, setSnack] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/document-requirements/`, { headers: authHeader });
      setPrograms(res.data.programs || []);
      setCategories(res.data.categories || []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load requirements.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { if (token) fetchData(); }, [fetchData, token]);

  const isRequired = (cat, program) => {
    const reqs = cat.required_for_programs || [];
    if (program === ALL) return reqs.includes(ALL);
    return reqs.includes(ALL) || reqs.includes(program);
  };

  const saveCategory = async (catId, newReqs) => {
    // optimistic update
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, required_for_programs: newReqs } : c)));
    try {
      await axios.post(
        `${API_BASE}/api/admin/document-requirements/${catId}/`,
        { required_for_programs: newReqs },
        { headers: authHeader }
      );
    } catch (e) {
      setSnack({ type: 'error', msg: 'Save failed — reloading.' });
      fetchData();
    }
  };

  const toggle = (cat, program) => {
    let reqs = [...(cat.required_for_programs || [])];
    if (program === ALL) {
      reqs = reqs.includes(ALL) ? [] : [ALL];
    } else {
      // if currently ALL, expand to explicit per-program before removing one
      if (reqs.includes(ALL)) reqs = [...programs];
      reqs = reqs.includes(program) ? reqs.filter((p) => p !== program) : [...reqs, program];
    }
    saveCategory(cat.id, reqs);
  };

  const addDocumentType = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await axios.post(`${API_BASE}/api/admin/document-requirements/`, { name }, { headers: authHeader });
      setNewName('');
      setSnack({ type: 'success', msg: `Added “${name}”.` });
      fetchData();
    } catch (e) {
      setSnack({ type: 'error', msg: e.response?.data?.error || 'Could not add document type.' });
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: embedded ? 0 : 3 }} disableGutters={embedded}>
      {!embedded && (
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to admin
        </Button>
      )}

      <Typography variant="h4" sx={{ fontWeight: 600 }}>Required Documents</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Set which documents each program must have on file. Check “All Programs” to require a document
        of everyone, or check specific programs (e.g. Practical Nursing but not CNA).
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={1} sx={{ mb: 3 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>Document</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f1f5ff' }}>All Programs</TableCell>
                {programs.map((p) => (
                  <TableCell key={p} align="center" sx={{ fontWeight: 600 }}>{p}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={programs.length + 2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No document types yet — add one below.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => {
                  const all = (cat.required_for_programs || []).includes(ALL);
                  return (
                    <TableRow key={cat.id} hover>
                      <TableCell>
                        {cat.name}
                        {(cat.required_for_programs || []).length === 0 && (
                          <Chip label="not required" size="small" variant="outlined" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#f7f9ff' }}>
                        <Checkbox checked={all} onChange={() => toggle(cat, ALL)} />
                      </TableCell>
                      {programs.map((p) => (
                        <TableCell key={p} align="center">
                          <Tooltip title={all ? 'Required for all programs' : ''}>
                            <span>
                              <Checkbox
                                checked={isRequired(cat, p)}
                                disabled={all}
                                onChange={() => toggle(cat, p)}
                              />
                            </span>
                          </Tooltip>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add a new document type */}
      <Paper elevation={1} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 600 }}>Add a document type:</Typography>
        <TextField
          size="small"
          placeholder="e.g. Hepatitis B Titer"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addDocumentType()}
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={addDocumentType} disabled={!newName.trim()}>
          Add
        </Button>
      </Paper>

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
