import React, { useState, useEffect } from 'react';
import '../Mybill.css';
import {
  Card, CardContent, Typography, Button,
  Box, Chip, Divider, Grid, CircularProgress, Alert
} from '@mui/material';
import {
  PaymentOutlined, CalendarToday, AccountBalanceWallet,
  Receipt, CreditCard, ShowChart, CheckCircle, Warning, Error as ErrorIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import DirectPaymentModal from './DirectPaymentModal';

const getCurrentSemester = () => {
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
  
  if (currentMonth >= 1 && currentMonth <= 5) {
      return 'Spring';
  } else if (currentMonth >= 6 && currentMonth <= 8) {
      return 'Summer';
  } else {
      return 'Fall';
  }
};

const Mybill = () => {
  const currentSemester = getCurrentSemester();
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  
  // Get user info from Redux store
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  
  // Get cart functions
  const { addBillToCart } = useCart();
  
  // State for payment data
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Fetch payment data for the logged-in user
  const fetchPaymentData = async () => {
    if (!userInfo || !userInfo.username) {
      console.log('No user info available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/students/${userInfo.username}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      console.log('Payment data response:', response.data);
      setPaymentData(response.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError('Unable to load payment information');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts and user info is available
  useEffect(() => {
    if (userInfo && userInfo.username) {
      fetchPaymentData();
    }
  }, [userInfo]);

  // Calculate current balance from payment data
  const getCurrentBalance = () => {
    if (!paymentData || !paymentData.payment_details) return 0;
    
    const details = paymentData.payment_details;
    let totalDue = 0;
    
    // Sum up all unpaid amounts from different program types
    if (details.certificate_courses) {
      details.certificate_courses.forEach(course => {
        totalDue += (course.amount_due || 0) - (course.amount_paid || 0);
      });
    }
    
    if (details.diploma_programs) {
      details.diploma_programs.forEach(program => {
        totalDue += (program.amount_due || 0) - (program.amount_paid || 0);
      });
    }
    
    if (details.associate_programs) {
      details.associate_programs.forEach(program => {
        totalDue += (program.amount_due || 0) - (program.amount_paid || 0);
      });
    }
    
    return totalDue;
  };

  const currentBalance = getCurrentBalance();

  // Helper functions from admin cohort page
  const getPaymentStatusIcon = (balance) => {
    if (balance === 0) return <CheckCircle color="success" fontSize="small" />;
    if (balance > 0 && balance < 500) return <Warning color="warning" fontSize="small" />;
    return <ErrorIcon color="error" fontSize="small" />;
  };

  const getPaymentStatusColor = (balance) => {
    if (balance === 0) return 'success';
    if (balance > 0 && balance < 500) return 'warning';
    return 'error';
  };

  const getPaymentStatusText = (balance) => {
    if (balance === 0) return 'Account Current';
    if (balance > 0 && balance < 500) return 'Outstanding';
    return 'Payment Required';
  };

  return (
    <Card className="bill-card dashboard-card">
      <Box className="dashboard-card-header">
        <Box className="card-header-content">
          <AccountBalanceWallet className="card-header-icon" />
          <Typography variant="h6" className="dashboard-card-title">
            My Bill
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
      
      <CardContent className="bill-content">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>Loading payment information...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : paymentData?.payment_details?.enrollment_status &&
             paymentData.payment_details.enrollment_status.status !== 'enrolled' ? (
          // Show enrollment status message when not enrolled
          <Box sx={{ textAlign: 'center', py: 5 }}>
            {paymentData.payment_details.enrollment_status.status === 'application_pending' ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Application Under Review
                </Typography>
                <Typography variant="body2">
                  Your application is being processed by our admissions team.
                  Payment information will be available once your enrollment is confirmed.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  No Active Enrollment
                </Typography>
                <Typography variant="body2">
                  You are not currently enrolled in any programs. Please submit an application
                  or contact our admissions team at admissions@menteecollege.com or (770) 931-5020.
                </Typography>
              </Alert>
            )}
            <Button
              variant="outlined"
              href="http://menteemedicalinstitute.org/menteeCollegeApplication.jsp"
              target="_blank"
              startIcon={<Receipt />}
              sx={{ mt: 2 }}
            >
              Submit Application
            </Button>
          </Box>
        ) : (
          <>
            <Box className="balance-summary">
              <Box className="balance-info">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="textSecondary" className="balance-label">
                  <Receipt fontSize="small" /> Current Balance
                </Typography>
                {getPaymentStatusIcon(currentBalance)}
              </Box>
              <Typography variant="h4" className="balance-amount" sx={{ mb: 1 }}>
                ${currentBalance.toFixed(2)}
              </Typography>
              <Chip
                label={getPaymentStatusText(currentBalance)}
                size="small"
                color={getPaymentStatusColor(currentBalance)}
                className="due-date-chip"
                icon={getPaymentStatusIcon(currentBalance)}
              />
              {currentBalance > 0 && paymentData?.payment_details?.next_due_date && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  Next payment due: {new Date(paymentData.payment_details.next_due_date).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          
            <Box className="payment-summary">
              {paymentData?.payment_details && (
                <>
                  {/* Show enrolled programs */}
                  {paymentData.payment_details.certificate_courses?.map((course, index) => (
                    <Box key={`cert-${index}`} className="payment-item">
                      <Typography variant="body2" className="payment-label">
                        {course.program_name || 'Certificate Program'}
                      </Typography>
                      <Typography variant="body1" className="payment-value">
                        ${((course.amount_due || 0) - (course.amount_paid || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  
                  {paymentData.payment_details.diploma_programs?.map((program, index) => (
                    <Box key={`diploma-${index}`} className="payment-item">
                      <Typography variant="body2" className="payment-label">
                        {program.program_name || 'Diploma Program'}
                      </Typography>
                      <Typography variant="body1" className="payment-value">
                        ${((program.amount_due || 0) - (program.amount_paid || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  
                  {paymentData.payment_details.associate_programs?.map((program, index) => (
                    <Box key={`assoc-${index}`} className="payment-item">
                      <Typography variant="body2" className="payment-label">
                        {program.program_name || 'Associates Program'}
                      </Typography>
                      <Typography variant="body1" className="payment-value">
                        ${((program.amount_due || 0) - (program.amount_paid || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  
                  {currentBalance > 0 && (
                    <>
                      <Divider className="payment-divider" />
                      <Box className="payment-item total">
                        <Typography variant="subtitle2" className="payment-label">
                          Total Due
                        </Typography>
                        <Typography variant="subtitle1" className="payment-value">
                          ${currentBalance.toFixed(2)}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {currentBalance === 0 && (
                    <Box className="payment-item total">
                      <Typography variant="subtitle2" className="payment-label">
                        Account Status
                      </Typography>
                      <Typography variant="subtitle1" className="payment-value credit">
                        Paid in Full
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              
              {(!paymentData?.payment_details || currentBalance === 0) && !loading && (
                <Box className="payment-item">
                  <Typography variant="body2" className="payment-label" sx={{ textAlign: 'center', width: '100%' }}>
                    {paymentData?.payment_details ? 'No outstanding balance' : 'No payment information available'}
                  </Typography>
                </Box>
              )}
            </Box>
            </Box>
            
            <Box className="bill-actions">
            {currentBalance > 0 ? (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CreditCard />}
                  className="pay-bill-button"
                  color="primary"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Pay ${currentBalance.toFixed(2)}
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ShowChart />}
                  className="payment-plan-button"
                  color="primary"
                >
                  Payment Plan Options
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Receipt />}
                className="payment-plan-button"
                color="success"
                disabled
              >
                Account Current
              </Button>
            )}
            </Box>
          </>
        )}
      </CardContent>

      {/* Payment Modal */}
      <DirectPaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={currentBalance}
        paymentData={paymentData}
        onSuccess={() => {
          // Refresh payment data after successful payment
          fetchPaymentData();
          setShowPaymentModal(false);
        }}
      />
    </Card>
  );
};

export default Mybill;
