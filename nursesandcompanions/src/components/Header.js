import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4 text-primary">
          Nurses & Companions
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="mx-2">Home</Nav.Link>
            <Nav.Link as={Link} to="/about" className="mx-2">About Us</Nav.Link>
            <Nav.Link as={Link} to="/services" className="mx-2">Our Services</Nav.Link>
         
            <Nav.Link as={Link} to="/contact" className="mx-2">Contact Us</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 