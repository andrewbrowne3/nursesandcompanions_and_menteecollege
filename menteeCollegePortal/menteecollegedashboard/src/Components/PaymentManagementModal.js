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
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Payment, Schedule, Delete, Warning, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const PaymentManagementModal = ({ open, onClose, student, onPaymentRecorded }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [formData, setFormData] = useState({
    amount_paid: '',
    program_type: '',
    program_id: '',
    payment_method: 'Credit Card'
  });

  const [programs, setPrograms] = useState({
    certificate_programs: [],
    diploma_programs: [],
    associates_programs: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentSchedules, setPaymentSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (open) {
      fetchPrograms();
      fetchPaymentSchedules();
    }
  }, [open]);

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

  const fetchPaymentSchedules = async () => {
    setSchedulesLoading(true);
    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(
        `${API_BASE}/api/admin/students/${student.username}/payment-schedules/`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      setPaymentSchedules(response.data.payment_schedules || []);
    } catch (error) {
      console.error('Error fetching payment schedules:', error);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this payment schedule?')) {
      return;
    }

    try {
      const authToken = userInfo?.token || userInfo?.access;
      await axios.delete(
        `${API_BASE}/api/admin/students/${student.username}/payment-schedules/${scheduleId}/`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      // Refresh the schedules list
      fetchPaymentSchedules();
      onPaymentRecorded(); // Refresh parent component data
    } catch (error) {
      console.error('Error deleting payment schedule:', error);
      setError(error.response?.data?.error || 'Failed to delete payment schedule');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Reset program_id when program_type changes
    if (name === 'program_type') {
      setFormData({
        ...formData,
        program_type: value,
        program_id: ''
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setPaymentResult(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.post(
        `${API_BASE}/api/admin/students/${student.username}/record-payment/`,
        formData,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      setSuccess(true);
      setPaymentResult(response.data);

      setTimeout(() => {
        onPaymentRecorded();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error recording payment:', error);
      setError(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount_paid: '',
      program_type: '',
      program_id: '',
      payment_method: 'Credit Card'
    });
    setError(null);
    setSuccess(false);
    setPaymentResult(null);
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.amount_paid &&
      parseFloat(formData.amount_paid) > 0 &&
      formData.program_type &&
      formData.program_id
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getScheduleStatusIcon = (schedule) => {
    if (schedule.fully_paid) return <CheckCircle color="success" fontSize="small" />;
    if (schedule.overdue) return <ErrorIcon color="error" fontSize="small" />;
    if (schedule.remaining_balance > 0) return <Warning color="warning" fontSize="small" />;
    return <CheckCircle color="success" fontSize="small" />;
  };

  const getScheduleStatusColor = (schedule) => {
    if (schedule.fully_paid) return 'success';
    if (schedule.overdue) return 'error';
    if (schedule.remaining_balance > 0) return 'warning';
    return 'default';
  };

  const getScheduleStatusText = (schedule) => {
    if (schedule.fully_paid) return 'Paid';
    if (schedule.overdue) return 'Overdue';
    if (schedule.total_paid > 0) return 'Partial';
    return 'Unpaid';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Payment />
          Record Payment for {student?.first_name} {student?.last_name}
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
            Payment recorded successfully!
          </Alert>
        )}

        {/* Payment Schedules Section */}
        {schedulesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : paymentSchedules.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">
                Active Payment Schedules
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {paymentSchedules.map((schedule) => (
                <Card key={schedule.id} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {schedule.program_name}
                          </Typography>
                          <Chip
                            label={getScheduleStatusText(schedule)}
                            color={getScheduleStatusColor(schedule)}
                            size="small"
                            icon={getScheduleStatusIcon(schedule)}
                          />
                        </Box>
                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Total Due:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              ${schedule.total_due?.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Paid:
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              ${schedule.total_paid?.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Balance:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color={schedule.fully_paid ? 'success.main' : 'warning.main'}>
                              ${schedule.remaining_balance?.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Due Date:
                            </Typography>
                            <Typography variant="body2" color={schedule.overdue ? 'error.main' : 'text.primary'}>
                              {formatDate(schedule.due_date)}
                            </Typography>
                          </Grid>
                        </Grid>
                        {schedule.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {schedule.description}
                          </Typography>
                        )}
                      </Box>
                      <Tooltip title="Delete schedule">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={schedule.total_paid > 0}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>
        ) : null}

        {paymentResult && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Payment Summary
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Amount Paid:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  ${paymentResult.payment?.amount_paid?.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Due:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  ${paymentResult.payment_schedule?.total_due?.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Paid:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  ${paymentResult.payment_schedule?.total_paid?.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Remaining Balance:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="bold" color={paymentResult.payment_schedule?.fully_paid ? 'success.main' : 'warning.main'}>
                  ${paymentResult.payment_schedule?.remaining_balance?.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Payment Amount"
              name="amount_paid"
              type="number"
              value={formData.amount_paid}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Grid>

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
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                disabled={loading}
                label="Payment Method"
              >
                <MenuItem value="Credit Card">Credit Card</MenuItem>
                <MenuItem value="Debit Card">Debit Card</MenuItem>
                <MenuItem value="Check">Check</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
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
          startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentManagementModal;
