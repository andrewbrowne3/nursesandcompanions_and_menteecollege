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
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import { Schedule, Calculate } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const CreatePaymentScheduleModal = ({ open, onClose, student, onScheduleCreated }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [formData, setFormData] = useState({
    program_type: '',
    program_id: '',
    amount_due: '',
    due_date: '',
    auto_calculate: true,
    description: ''
  });

  const [programs, setPrograms] = useState({
    certificate_programs: [],
    diploma_programs: [],
    associates_programs: []
  });

  const [calculatedCost, setCalculatedCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (open) {
      fetchPrograms();
    }
  }, [open]);

  useEffect(() => {
    // Auto-calculate when program is selected and auto_calculate is true
    if (formData.auto_calculate && formData.program_type && formData.program_id) {
      calculateCost();
    } else {
      setCalculatedCost(null);
    }
  }, [formData.program_type, formData.program_id, formData.auto_calculate]);

  const fetchPrograms = async () => {
    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/admin/resources/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setPrograms({
        certificate_programs: response.data.programs?.certificate_programs || [],
        diploma_programs: response.data.programs?.diploma_programs || [],
        associates_programs: response.data.programs?.associates_programs || []
      });
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const calculateCost = async () => {
    setCalculating(true);
    try {
      const authToken = userInfo?.token || userInfo?.access;

      // Make a test call to create_payment_schedule with auto_calculate=true
      // to get the calculated cost without actually creating it
      const response = await axios.post(
        `${API_BASE}/api/admin/students/${student.username}/create-payment-schedule/`,
        {
          program_type: formData.program_type,
          program_id: formData.program_id,
          auto_calculate: true,
          due_date: '2099-12-31', // Temporary date for calculation
          _calculate_only: true
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.payment_schedule) {
        setCalculatedCost(response.data.payment_schedule.amount_due);
        setFormData(prev => ({
          ...prev,
          amount_due: response.data.payment_schedule.amount_due.toString()
        }));
      }
    } catch (error) {
      console.error('Error calculating cost:', error);
      // If calculation fails, just allow manual entry
      setCalculatedCost(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Reset program_id when program_type changes
    if (name === 'program_type') {
      setFormData({
        ...formData,
        program_type: value,
        program_id: '',
        amount_due: ''
      });
      setCalculatedCost(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.post(
        `${API_BASE}/api/admin/students/${student.username}/create-payment-schedule/`,
        formData,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onScheduleCreated();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Error creating payment schedule:', error);
      setError(error.response?.data?.error || 'Failed to create payment schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      program_type: '',
      program_id: '',
      amount_due: '',
      due_date: '',
      auto_calculate: true,
      description: ''
    });
    setCalculatedCost(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.program_type &&
      formData.program_id &&
      formData.due_date &&
      (formData.auto_calculate || (formData.amount_due && parseFloat(formData.amount_due) > 0))
    );
  };

  const getAvailablePrograms = () => {
    if (!formData.program_type) return [];

    switch (formData.program_type) {
      case 'certificate':
        return programs.certificate_programs;
      case 'diploma':
        return programs.diploma_programs;
      case 'associates':
        return programs.associates_programs;
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule />
          Create Payment Schedule for {student?.first_name} {student?.last_name}
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
            Payment schedule created successfully!
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Program Type</InputLabel>
              <Select
                name="program_type"
                value={formData.program_type}
                onChange={handleChange}
                disabled={loading}
                label="Program Type"
              >
                <MenuItem value="certificate">Certificate</MenuItem>
                <MenuItem value="diploma">Diploma</MenuItem>
                <MenuItem value="associates">Associates</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required disabled={!formData.program_type}>
              <InputLabel>Program</InputLabel>
              <Select
                name="program_id"
                value={formData.program_id}
                onChange={handleChange}
                disabled={loading || !formData.program_type}
                label="Program"
              >
                {getAvailablePrograms().map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="auto_calculate"
                  checked={formData.auto_calculate}
                  onChange={handleChange}
                  disabled={loading}
                />
              }
              label="Auto-calculate amount from program pricing"
            />
          </Grid>

          {calculatedCost !== null && formData.auto_calculate && (
            <Grid item xs={12}>
              <Alert severity="info" icon={<Calculate />}>
                <Typography variant="body2" fontWeight="bold">
                  Calculated Cost: ${calculatedCost.toFixed(2)}
                </Typography>
                <Typography variant="caption">
                  Based on program courses and pricing
                </Typography>
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Amount Due"
              name="amount_due"
              type="number"
              value={formData.amount_due}
              onChange={handleChange}
              disabled={loading || (formData.auto_calculate && calculating)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Due Date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleChange}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (Optional)"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              placeholder="e.g., First installment, Scholarship applied, etc."
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              This will create a payment schedule that tracks what the student owes. Use "Record Payment" to log actual payments against this schedule.
            </Typography>
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
          startIcon={loading ? <CircularProgress size={20} /> : <Schedule />}
        >
          {loading ? 'Creating...' : 'Create Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePaymentScheduleModal;
