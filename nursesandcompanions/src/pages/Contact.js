import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: ''
  });
  
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
    } else {
      // In a real application, this is where you would send the data to a server
      setSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        inquiryType: '',
        message: ''
      });
      setValidated(false);
    }
  };

  return (
    <>
      {/* Contact Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container>
          <Row className="py-4">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="fw-bold mb-4">Contact Us</h1>
              <p className="lead">Reach out to learn more about our nursing assistant services or to schedule a consultation.</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Information and Form */}
      <section className="section-padding">
        <Container>
          <Row>
            <Col lg={5} className="mb-5 mb-lg-0">
              <h2 className="fw-bold mb-4">Get In Touch</h2>
              <p className="mb-5">We're here to answer any questions you may have about our nursing assistant services. Feel free to reach out to us using any of the following methods:</p>
              
              <div className="mb-4">
                <h5 className="fw-bold mb-3">Office Hours</h5>
                <p className="mb-1">Monday - Friday: 8:30 AM - 5:00 PM</p>
                <p className="mb-1">Saturday: Closed but always avaliable by phone!</p>
                <p className="mb-1">Sunday: Closed but always avaliable by phone!</p>
                <p className="text-muted">24/7 phone support </p>
              </div>

              <div className="mb-4">
                <h5 className="fw-bold mb-3">Contact Details</h5>
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="d-flex">
                    <div className="me-3">
                      <i className="fas fa-map-marker-alt text-primary fa-2x"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Address</h6>
                      <p className="mb-0">3545 Cruse Rd Suite 100 Lawrenceville, Ga 30044</p>
                    </div>
                  </Card.Body>
                </Card>
                
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="d-flex">
                    <div className="me-3">
                      <i className="fas fa-phone text-primary fa-2x"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Phone</h6>
                      <p className="mb-0">(770) 897 6569</p>
                    </div>
                  </Card.Body>
                </Card>
                
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="d-flex">
                    <div className="me-3">
                      <i className="fas fa-envelope text-primary fa-2x"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Email</h6>
                      <p className="mb-0">administrator@atlanta-staffing.org</p>
                    </div>
                  </Card.Body>
                </Card>
              </div>
              
              <div>
                <h5 className="fw-bold mb-3">Connect With Us</h5>
                <div>
                  <a href="https://facebook.com" className="me-3 text-dark fs-4" aria-label="Facebook">
                    <i className="fab fa-facebook-f"></i>
                  </a>
             
                  <a href="https://instagram.com" className="text-dark fs-4" aria-label="Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <div className="contact-form p-4 p-md-5 shadow-sm">
                <h2 className="fw-bold mb-4">Send Us a Message</h2>
                
                {submitted ? (
                  <div className="alert alert-success">
                    <h5 className="fw-bold">Thank you for reaching out!</h5>
                    <p className="mb-0">We've received your message and will contact you shortly. If you need immediate assistance, please call us at (555) 123-4567.</p>
                  </div>
                ) : (
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please provide your first name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please provide your last name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please provide a valid email address.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please provide a valid phone number.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Type of Inquiry</Form.Label>
                      <Form.Select
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select an option</option>
                        <option value="generalInquiry">General Inquiry</option>
                        <option value="serviceInfo">Service Information</option>
                        <option value="pricing">Pricing Questions</option>
                        <option value="scheduling">Scheduling Consultation</option>
                        <option value="employment">Employment Opportunities</option>
                        <option value="other">Other</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select an inquiry type.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Your Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a message.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Button type="submit" variant="primary" size="lg">
                      Send Message
                    </Button>
                  </Form>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Map Section */}
      <section className="mt-5">
        <div className="bg-light py-5">
          <Container>
            <Row className="text-center mb-5">
              <Col>
                <h2 className="fw-bold">Find Us</h2>
                <p className="lead">Visit our office or schedule a consultation</p>
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="shadow-sm rounded overflow-hidden">
                  <iframe
                    src="https://maps.google.com/maps?q=3545+Cruse+Rd+Suite+100+Lawrenceville+GA+30044&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Nurses & Companions Office Location - 3545 Cruse Rd Suite 100 Lawrenceville GA 30044"
                  ></iframe>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </section>
    </>
  );
};

export default Contact; 
