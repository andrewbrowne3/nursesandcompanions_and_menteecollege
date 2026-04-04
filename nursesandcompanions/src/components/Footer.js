import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <Container>
        <Row>
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="mb-4">Nurses & Companions</h5>
            <p>Providing professional and compassionate nursing assistant services to those in need. Our team is committed to delivering the highest quality of care.</p>
          </Col>
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="mb-4">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/" className="text-decoration-none text-light">Home</Link></li>
              <li className="mb-2"><Link to="/about" className="text-decoration-none text-light">About Us</Link></li>
              <li className="mb-2"><Link to="/services" className="text-decoration-none text-light">Our Services</Link></li>
              <li className="mb-2"><Link to="/careers" className="text-decoration-none text-light">Careers</Link></li>
              <li className="mb-2"><Link to="/contact" className="text-decoration-none text-light">Contact Us</Link></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5 className="mb-4">Contact Information</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><i className="fas fa-map-marker-alt me-2"></i>3545 Cruse Rd Suite 100 Lawrenceville, Ga 30044</li>
              <li className="mb-2"><i className="fas fa-phone me-2"></i>(770) 897 6569</li>
              <li className="mb-2"><i className="fas fa-envelope me-2"></i>administrator@atlanta-staffing.org</li>
            </ul>
            <div className="mt-3">
              <a href="https://facebook.com" className="text-light me-3" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="https://twitter.com" className="text-light me-3" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="https://linkedin.com" className="text-light" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row>
          <Col className="text-center">
            <p className="mb-0">&copy; {new Date().getFullYear()} Nurses & Companions. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 
