import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Breadcrumbs,
  Link,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Home as HomeIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import CartSummary from './CartSummary';
import '../../Mybill.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const handleBackToDashboard = () => {
    navigate('/Dashboard');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/Dashboard');
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <CartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Shopping Cart
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Shopping Cart
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
        </Box>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <CartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Add programs or payments from your dashboard to get started.
              </Typography>
              <Button
                variant="contained"
                onClick={handleBackToDashboard}
                size="large"
              >
                Browse Programs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* Cart Items */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Cart Items
                    </Typography>
                    <Button
                      variant="text"
                      color="error"
                      onClick={handleClearCart}
                    >
                      Clear Cart
                    </Button>
                  </Box>
                  <CartSummary showCheckoutButton={false} />
                </CardContent>
              </Card>

              {/* Information Card */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Information
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      • Payment plan amounts represent your next scheduled payment
                    </Typography>
                    <Typography variant="body2">
                      • Full payment amounts cover the entire program cost
                    </Typography>
                    <Typography variant="body2">
                      • All payments are processed securely through Stripe
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            {/* Checkout Summary */}
            <Grid item xs={12} md={4}>
              <Card className="dashboard-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <CartSummary showCheckoutButton={true} maxHeight={400} />
                </CardContent>
              </Card>

              {/* Support Card */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Need Help?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    If you have questions about your payment or enrollment, contact our admissions team.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => window.open('mailto:admissions@menteecollege.com', '_blank')}
                  >
                    Contact Admissions
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default CartPage;