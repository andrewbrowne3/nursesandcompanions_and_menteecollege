import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  PaymentOutlined,
  Security,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useSelector } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';

// Load Stripe with your publishable key from environment variable
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51OYUmeLYZVs4AvpzzN1H64gsNGZYLLIzJeomzcS4BhLcoGsBa1XMUKd8StPIukXnyeCMv3tvaNrpFtEUtBTTMEB9009BUITLfD'
);

const CheckoutForm = ({ cartItems, cartTotal, userInfo, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  
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
            totalCost: cartTotal,
            studentData: {
              studentId: userInfo.id,
              firstName: userInfo.first_name,
              lastName: userInfo.last_name,
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

    if (userInfo && cartTotal > 0) {
      createPaymentIntent();
    }
  }, [userInfo, cartTotal, API_BASE, onError]);

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
      onError(error.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

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
        <Typography variant="h6" gutterBottom>
          Payment Information
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
          <PaymentElement />
        </Paper>
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={!stripe || processing}
        startIcon={processing ? <CircularProgress size={20} /> : <PaymentOutlined />}
        sx={{ py: 1.5 }}
      >
        {processing ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}
      </Button>
    </form>
  );
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, success, error
  const [paymentMessage, setPaymentMessage] = useState('');
  
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // Handle empty cart
  if (cartItems.length === 0) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Container maxWidth="sm">
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <ErrorIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Your Cart is Empty
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Add items to your cart before proceeding to checkout.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/Dashboard')}
                sx={{ mr: 2 }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/cart')}
              >
                View Cart
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentStatus('success');
    setPaymentMessage('Payment successful! Your payment has been processed.');
    clearCart();
    
    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      navigate('/Dashboard');
    }, 3000);
  };

  const handlePaymentError = (message) => {
    setPaymentStatus('error');
    setPaymentMessage(message);
  };

  const handleBackToCart = () => {
    navigate('/cart');
  };

  if (paymentStatus === 'success') {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="sm">
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {paymentMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to dashboard in a moment...
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        py: 4
      }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBackToCart}
              sx={{ mr: 2 }}
            >
              Back to Cart
            </Button>
            <Typography variant="h4">
              Secure Checkout
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Order Summary */}
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  
                  <List disablePadding>
                    {cartItems.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2">
                                  {item.program_name}
                                </Typography>
                                <Chip 
                                  label={item.program_type} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={`${item.payment_type === 'installment' ? 'Next Payment' : 'Full Payment'} × ${item.quantity}`}
                          />
                          <Typography variant="subtitle1">
                            ${(item.amount * item.quantity).toFixed(2)}
                          </Typography>
                        </ListItem>
                        {index < cartItems.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Total:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${cartTotal.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Security color="primary" />
                    <Typography variant="h6">
                      Secure Payment
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your payment information is encrypted and secure. We use Stripe to process payments safely.
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Payment Form */}
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  {paymentStatus === 'error' && (
                    <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
                      {paymentMessage}
                    </Alert>
                  )}

                  <CheckoutForm
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    userInfo={userInfo}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />

                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      By completing this payment, you agree to the terms and conditions of Mentee College.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>
    </Elements>
  );
};

export default CheckoutPage;