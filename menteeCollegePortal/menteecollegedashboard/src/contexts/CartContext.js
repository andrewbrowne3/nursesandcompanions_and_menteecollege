import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_CART: 'SET_CART',
  CALCULATE_TOTAL: 'CALCULATE_TOTAL'
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case CART_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case CART_ACTIONS.SET_CART:
      const total = action.payload.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
      return { 
        ...state, 
        items: action.payload, 
        total: total,
        loading: false 
      };
    
    case CART_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(item => 
        item.program_id === action.payload.program_id && 
        item.program_type === action.payload.program_type
      );
      
      let newItems;
      if (existingItem) {
        // Update quantity if item exists
        newItems = state.items.map(item =>
          item.program_id === action.payload.program_id && 
          item.program_type === action.payload.program_type
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }
      
      const newTotal = newItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
      return { 
        ...state, 
        items: newItems, 
        total: newTotal 
      };
    
    case CART_ACTIONS.REMOVE_ITEM:
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      const filteredTotal = filteredItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
      return { 
        ...state, 
        items: filteredItems, 
        total: filteredTotal 
      };
    
    case CART_ACTIONS.UPDATE_QUANTITY:
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0); // Remove items with 0 quantity
      
      const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
      return { 
        ...state, 
        items: updatedItems, 
        total: updatedTotal 
      };
    
    case CART_ACTIONS.CLEAR_CART:
      return { 
        ...state, 
        items: [], 
        total: 0 
      };
    
    default:
      return state;
  }
};

// Initial State
const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Get user info from Redux store
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Load cart from localStorage on mount
  useEffect(() => {
    if (userInfo?.username) {
      const savedCart = localStorage.getItem(`cart_${userInfo.username}`);
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart);
          dispatch({ type: CART_ACTIONS.SET_CART, payload: cartData });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem(`cart_${userInfo.username}`);
        }
      }
    }
  }, [userInfo]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (userInfo?.username) {
      localStorage.setItem(`cart_${userInfo.username}`, JSON.stringify(state.items));
    }
  }, [state.items, userInfo]);

  // Cart Actions
  const addToCart = (item) => {
    // Item structure: { program_id, program_type, program_name, amount, payment_type, due_date?, quantity: 1 }
    const cartItem = {
      id: `${item.program_type}_${item.program_id}_${Date.now()}`,
      program_id: item.program_id,
      program_type: item.program_type, // 'certificate', 'diploma', 'associates'
      program_name: item.program_name,
      amount: parseFloat(item.amount),
      payment_type: item.payment_type, // 'installment' or 'full'
      due_date: item.due_date || null,
      quantity: item.quantity || 1,
      added_at: new Date().toISOString()
    };

    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: cartItem });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { id: itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    if (userInfo?.username) {
      localStorage.removeItem(`cart_${userInfo.username}`);
    }
  };

  // Add current bill balance to cart
  const addBillToCart = (paymentData) => {
    if (!paymentData?.payment_details) return;

    const details = paymentData.payment_details;
    
    // Add certificate courses
    details.certificate_courses?.forEach(course => {
      const balance = (course.amount_due || 0) - (course.amount_paid || 0);
      if (balance > 0) {
        addToCart({
          program_id: course.id || course.program_name,
          program_type: 'certificate',
          program_name: course.program_name || 'Certificate Program',
          amount: balance,
          payment_type: 'installment', // Assume installment for existing balances
          due_date: paymentData.payment_details.next_due_date
        });
      }
    });

    // Add diploma programs
    details.diploma_programs?.forEach(program => {
      const balance = (program.amount_due || 0) - (program.amount_paid || 0);
      if (balance > 0) {
        addToCart({
          program_id: program.id || program.program_name,
          program_type: 'diploma',
          program_name: program.program_name || 'Diploma Program',
          amount: balance,
          payment_type: 'installment',
          due_date: paymentData.payment_details.next_due_date
        });
      }
    });

    // Add associate programs
    details.associate_programs?.forEach(program => {
      const balance = (program.amount_due || 0) - (program.amount_paid || 0);
      if (balance > 0) {
        addToCart({
          program_id: program.id || program.program_name,
          program_type: 'associates',
          program_name: program.program_name || 'Associates Program',
          amount: balance,
          payment_type: 'installment',
          due_date: paymentData.payment_details.next_due_date
        });
      }
    });
  };

  // Get cart item count
  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const contextValue = {
    // State
    cartItems: state.items,
    cartTotal: state.total,
    loading: state.loading,
    error: state.error,
    itemCount: getItemCount(),
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    addBillToCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;