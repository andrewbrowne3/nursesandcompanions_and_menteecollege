import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Chip, List, ListItem,
  CircularProgress, Alert, Divider, Button
} from '@mui/material';
import {
  Payment, CalendarToday, Warning, ArrowForward, Error as ErrorIcon, CheckCircle, CreditCard
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DirectPaymentModal from './DirectPaymentModal';

const getCurrentSemester = () => {
  const currentMonth = new Date().getMonth() + 1;

  if (currentMonth >= 1 && currentMonth <= 5) {
    return 'Spring';
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    return 'Summer';
  } else {
    return 'Fall';
  }
};

const UpcomingPayments = () => {
  const currentSemester = getCurrentSemester();
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (userInfo) {
      fetchPayments();
    }
  }, [userInfo]);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/student/dashboard/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setPayments(response.data.payment_deadlines || []);
    } catch (error) {
      console.error('Error fetching payment deadlines:', error);
      setError('Unable to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const fetchFullPaymentData = async () => {
    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/students/${userInfo.username}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment data:', error);
      return null;
    }
  };

  const handlePayNow = async (payment) => {
    setSelectedPayment(payment);
    const data = await fetchFullPaymentData();
    setPaymentData(data);
    setShowPaymentModal(true);
  };

  const getUrgencyColor = (daysUntilDue) => {
    if (daysUntilDue < 0) return 'error'; // Overdue
    if (daysUntilDue <= 2) return 'error';
    if (daysUntilDue <= 5) return 'warning';
    return 'info';
  };

  const getPaymentStatusText = (daysUntilDue) => {
    if (daysUntilDue < 0) return 'OVERDUE';
    if (daysUntilDue === 0) return 'DUE TODAY';
    if (daysUntilDue <= 2) return 'URGENT';
    if (daysUntilDue <= 5) return 'DUE SOON';
    return 'UPCOMING';
  };

  const getPaymentStatusIcon = (daysUntilDue) => {
    if (daysUntilDue < 0) return <ErrorIcon fontSize="small" />;
    if (daysUntilDue <= 2) return <Warning fontSize="small" />;
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="dashboard-card">
      <Box className="dashboard-card-header">
        <Box className="card-header-content">
          <Payment className="card-header-icon" />
          <Typography variant="h6" className="dashboard-card-title">
            Upcoming Payments
          </Typography>
        </Box>
        <Chip
          icon={<CalendarToday fontSize="small" />}
          label={`${currentSemester} ${currentYear}`}
          color="primary"
          variant="outlined"
          className="semester-badge"
        />
      </Box>

      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
            <CircularProgress size={30} />
            <Typography variant="body2" sx={{ ml: 2 }}>Loading payments...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : payments.length > 0 ? (
          <>
            <List sx={{ py: 0 }}>
              {payments.map((payment, index) => (
                <React.Fragment key={payment.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 1.5,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      backgroundColor: payment.days_until_due < 0 ? 'rgba(211, 47, 47, 0.05)' : 'transparent'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color={payment.days_until_due < 0 ? 'error' : 'inherit'} sx={{ fontWeight: 700 }}>
                          ${payment.amount_due.toFixed(2)}
                        </Typography>
                        {getPaymentStatusIcon(payment.days_until_due)}
                      </Box>
                      <Chip
                        icon={getPaymentStatusIcon(payment.days_until_due)}
                        label={getPaymentStatusText(payment.days_until_due)}
                        color={getUrgencyColor(payment.days_until_due)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      {payment.program}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Due: {formatDate(payment.due_date)}
                        </Typography>
                        <Typography variant="caption" color={payment.days_until_due < 0 ? 'error' : 'textSecondary'} sx={{ fontWeight: 600, display: 'block' }}>
                          {payment.days_until_due < 0 ?
                            `${Math.abs(payment.days_until_due)} day${Math.abs(payment.days_until_due) !== 1 ? 's' : ''} overdue` :
                            `${payment.days_until_due} day${payment.days_until_due !== 1 ? 's' : ''} remaining`
                          }
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CreditCard />}
                        onClick={() => handlePayNow(payment)}
                        sx={{ ml: 2 }}
                      >
                        Pay Now
                      </Button>
                    </Box>
                  </ListItem>
                  {index < payments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              fullWidth
              sx={{ mt: 2 }}
              color="primary"
              onClick={() => navigate('/checkout')}
            >
              Make a Payment
            </Button>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Payment sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No upcoming payments
            </Typography>
            <Chip label="Account Current" color="success" size="small" sx={{ mt: 1 }} />
          </Box>
        )}
      </CardContent>

      {/* Payment Modal */}
      {selectedPayment && paymentData && (
        <DirectPaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
            setPaymentData(null);
          }}
          amount={selectedPayment.amount_due}
          paymentData={paymentData}
          onSuccess={() => {
            // Refresh payments after successful payment
            fetchPayments();
            setShowPaymentModal(false);
            setSelectedPayment(null);
            setPaymentData(null);
          }}
        />
      )}
    </Card>
  );
};

export default UpcomingPayments;
