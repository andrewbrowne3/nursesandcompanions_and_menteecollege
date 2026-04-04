import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AddStudentModal = ({ open, onClose, onStudentAdded }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    DOB: '',
    password: '',
    phone_number: '',
    cohort_id: ''
  });

  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (open) {
      fetchCohorts();
    }
  }, [open]);

  const fetchCohorts = async () => {
    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/admin/resources/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCohorts(response.data.cohorts || []);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.post(
        `${API_BASE}/api/admin/students/create/`,
        formData,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onStudentAdded();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Error creating student:', error);
      setError(error.response?.data?.error || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      DOB: '',
      password: '',
      phone_number: '',
      cohort_id: ''
    });
    setError(null);
    setSuccess(false);
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.username &&
      formData.email &&
      formData.first_name &&
      formData.last_name &&
      formData.DOB &&
      formData.password
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          Add New Student
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Student created successfully!
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Date of Birth"
              name="DOB"
              type="date"
              value={formData.DOB}
              onChange={handleChange}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter student password"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              disabled={loading}
              placeholder="123-456-7890"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Cohort (Optional)</InputLabel>
              <Select
                name="cohort_id"
                value={formData.cohort_id}
                onChange={handleChange}
                disabled={loading}
                label="Cohort (Optional)"
              >
                <MenuItem value="">
                  <em>No Cohort</em>
                </MenuItem>
                {cohorts.map((cohort) => (
                  <MenuItem key={cohort.id} value={cohort.id}>
                    {cohort.program_name} - {cohort.academic_year} Cohort {cohort.cohort_number}
                    {!cohort.is_active && ' (Inactive)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid() || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
        >
          {loading ? 'Creating...' : 'Create Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudentModal;
