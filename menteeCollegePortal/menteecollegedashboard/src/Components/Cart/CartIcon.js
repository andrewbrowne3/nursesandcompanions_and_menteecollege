import React from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartIcon = ({ color = 'inherit', size = 'medium' }) => {
  const { itemCount, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <Tooltip 
      title={`Cart (${itemCount} items) - $${cartTotal.toFixed(2)}`}
      placement="bottom"
    >
      <IconButton 
        color={color}
        size={size}
        onClick={handleCartClick}
        sx={{ 
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge 
          badgeContent={itemCount} 
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              minWidth: '18px',
              height: '18px'
            }
          }}
        >
          <ShoppingCart />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default CartIcon;