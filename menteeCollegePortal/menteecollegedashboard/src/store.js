// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import { userLoginReducer } from './reducers/userReducers';

// Load cart items from localStorage

// Load user info from localStorage
const userInfoFromStorage = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;

// Initial state
const initialState = {
    userLogin: { userInfo: userInfoFromStorage },

};

// Configure store
const store = configureStore({
  reducer: {
    userLogin: userLoginReducer,
   
  },
  preloadedState: initialState,
});

export { store };
export default store;
