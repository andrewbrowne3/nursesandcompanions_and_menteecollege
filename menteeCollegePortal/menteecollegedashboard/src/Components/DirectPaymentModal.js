import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Close,
  Payment,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Load Stripe with live key from environment variable
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51OYUmeLYZVs4AvpzzN1H64gsNGZYLLIzJeomzcS4BhLcoGsBa1XMUKd8StPIukXnyeCMv3tvaNrpFtEUtBTTMEB9009BUITLfD'
);

const PaymentForm = ({ amount, paymentData, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, success, error

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const authToken = userInfo?.token || userInfo?.access;
        const response = await axios.post(
          `${API_BASE}/api/create-payment-intent`,
          {
            username: userInfo.username,
            totalCost: amount,
            studentData: {
              studentId: userInfo.id || paymentData?.id,
              firstName: userInfo.first_name || paymentData?.first_name,
              lastName: userInfo.last_name || paymentData?.last_name,
            }
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );

        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onError('Failed to initialize payment. Please try again.');
      }
    };

    if (userInfo && amount > 0) {
      createPaymentIntent();
    }
  }, [userInfo, amount, API_BASE, onError, paymentData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/Dashboard`,
      },
      redirect: 'if_required', // Don't redirect, handle in app
    });

    setProcessing(false);

    if (error) {
      setPaymentStatus('error');
      onError(error.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setPaymentStatus('success');
      setTimeout(() => {
        onSuccess(paymentIntent);
      }, 2000);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your payment of ${amount.toFixed(2)} has been processed successfully.
        </Typography>
      </Box>
    );
  }

  if (!clientSecret) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Initializing payment...
        </Typography>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
          <PaymentElement />
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={processing}
          fullWidth
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!stripe || processing}
          startIcon={processing ? <CircularProgress size={20} /> : <Payment />}
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </Box>
    </form>
  );
};

const DirectPaymentModal = ({ open, onClose, paymentData, amount, onSuccess }) => {
  const [error, setError] = useState(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSuccess = (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    setError(null);
    onSuccess();
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  // Calculate payment breakdown
  const getPaymentBreakdown = () => {
    if (!paymentData || !paymentData.payment_details) return [];

    const breakdown = [];

    // Certificate courses
    if (paymentData.payment_details.certificate_courses) {
      paymentData.payment_details.certificate_courses.forEach(course => {
        const balance = (course.amount_due || 0) - (course.amount_paid || 0);
        if (balance > 0) {
          breakdown.push({
            name: course.program_name || 'Certificate Program',
            amount: balance
          });
        }
      });
    }

    // Diploma programs
    if (paymentData.payment_details.diploma_programs) {
      paymentData.payment_details.diploma_programs.forEach(program => {
        const balance = (program.amount_due || 0) - (program.amount_paid || 0);
        if (balance > 0) {
          breakdown.push({
            name: program.program_name || 'Diploma Program',
            amount: balance
          });
        }
      });
    }

    // Associates programs
    if (paymentData.payment_details.associate_programs) {
      paymentData.payment_details.associate_programs.forEach(program => {
        const balance = (program.amount_due || 0) - (program.amount_paid || 0);
        if (balance > 0) {
          breakdown.push({
            name: program.program_name || 'Associates Program',
            amount: balance
          });
        }
      });
    }

    return breakdown;
  };

  const breakdown = getPaymentBreakdown();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Payment Checkout
          </Typography>
          <Button
            onClick={handleClose}
            size="small"
            sx={{ minWidth: 'auto' }}
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Payment Breakdown */}
        {breakdown.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Payment Summary
            </Typography>
            <List dense disablePadding>
              {breakdown.map((item, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                  <Typography variant="body2">
                    ${item.amount.toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Total Amount
              </Typography>
              <Typography variant="h6" color="primary">
                ${amount.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Stripe Payment Form */}
        <Elements stripe={stripePromise}>
          <PaymentForm
            amount={amount}
            paymentData={paymentData}
            onSuccess={handleSuccess}
            onError={handleError}
            onClose={handleClose}
          />
        </Elements>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Powered by Stripe • Secure Payment Processing
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DirectPaymentModal;
