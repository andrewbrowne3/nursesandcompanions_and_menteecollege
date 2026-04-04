import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  Box,
  Chip,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  PaymentOutlined,
  CalendarToday
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartSummary = ({ showCheckoutButton = true, maxHeight = null }) => {
  const { 
    cartItems, 
    cartTotal, 
    removeFromCart, 
    updateQuantity,
    itemCount 
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const formatPaymentType = (paymentType) => {
    return paymentType === 'installment' ? 'Next Payment' : 'Full Payment';
  };

  const getProgramTypeColor = (programType) => {
    switch (programType) {
      case 'certificate': return 'primary';
      case 'diploma': return 'secondary';
      case 'associates': return 'info';
      default: return 'default';
    }
  };

  if (cartItems.length === 0) {
    return (
      <Card sx={{ maxHeight }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Cart
          </Typography>
          <Alert severity="info">
            Your cart is empty. Add programs or payments to get started.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxHeight }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Your Cart ({itemCount} items)
        </Typography>
        
        <List 
          sx={{ 
            maxHeight: maxHeight ? `${maxHeight - 200}px` : 'auto',
            overflow: 'auto',
            mb: 2 
          }}
        >
          {cartItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">
                        {item.program_name}
                      </Typography>
                      <Chip 
                        label={item.program_type} 
                        size="small" 
                        color={getProgramTypeColor(item.program_type)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {formatPaymentType(item.payment_type)}
                      </Typography>
                      {item.due_date && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Due: {new Date(item.due_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          × ${item.amount.toFixed(2)} = ${(item.amount * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => removeFromCart(item.id)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < cartItems.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Total:
          </Typography>
          <Typography variant="h6" color="primary">
            ${cartTotal.toFixed(2)}
          </Typography>
        </Box>

        {showCheckoutButton && (
          <Button
            variant="contained"
            fullWidth
            startIcon={<PaymentOutlined />}
            onClick={handleCheckout}
            size="large"
            disabled={cartItems.length === 0}
          >
            Proceed to Checkout
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CartSummary;