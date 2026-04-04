import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../actions/userActions';
import FormContainer from '../FormContainer';
import Form from 'react-bootstrap/Form';

import Button from '@mui/material/Button';


const LoginPage = ({history }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = location.search ?  location.search.split('=')[1] : '/';

  const userLogin = useSelector(state => state.userLogin);
  const { loading, error, userInfo } = userLogin; 

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Logging in with username:', username, 'and password:', password);
    dispatch(login(username, password)); 
  };

  useEffect(() => {
    console.log('In useEffect, userInfo is:', userInfo);
    if (userInfo) {
      console.log('User is logged in, redirecting to:', redirect);
      alert("Login successful!");
      navigate("/Dashboard"); 
      
    }
  }, [userInfo, navigate, redirect]);
  
  return (
    <FormContainer >
      <h2 id="LoginForm">Login</h2>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      <Form onSubmit={handleLogin}>
        <Form.Group controlId='username'>
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
          />
        </Form.Group>
        <Button type='submit' variant='contained'>Login</Button>
      </Form>

   
      <br/>
      <br/>
    </FormContainer>
    

  );
};
  
export default LoginPage;
