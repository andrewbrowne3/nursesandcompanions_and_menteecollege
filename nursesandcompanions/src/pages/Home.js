import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // We'll create this CSS file for custom styles
import ChatWidget from '../components/ChatWidget';
import ImagePreloader from '../components/ImagePreloader';

const Home = () => {
  // Image carousel state and effect
  const [index, setIndex] = useState(0);
  
  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };
  
  // Service images for the carousel
  const carouselImages = [
    { 
      src: '/assets/img/service1.jpg',
      title: 'IN HOME SERVICES',
      subtitle: '24/7 Professional Care'
    },
    { 
      src: '/assets/img/service2.jpg',
      title: 'PERSONAL CARE',
      subtitle: 'Compassionate Support'
    },
    { 
      src: '/assets/img/service3.jpg',
      title: 'NURSING SERVICES',
      subtitle: 'Expert Medical Assistance'
    },
    { 
      src: '/assets/img/service6.jpg',
      title: 'HOME CARE SERVICES',
      subtitle: 'Dedicated to Your Wellbeing'
    }
  ];

  // Sample testimonials data
  const testimonials = [
    {
      id: 1,
      name: 'Jennifer Smith',
      role: 'Client',
      image: '/assets/img/client2.png',
      testimonial: 'The nurses from Nurses & Companions have been incredible. They provided my mother with exceptional care during her recovery. Their professionalism and compassion made all the difference.'
    },
    {
      id: 2,
      name: 'Robert Johnson',
      role: 'Client',
      image: '/assets/img/client1.png',
      testimonial: 'We are extremely grateful for the attentive care provided to my father. The nursing assistants were not only skilled but also brought joy and comfort to his daily routine.'
    },
    {
      id: 3,
      name: 'Maria Rodriguez',
      role: 'Client',
      image: '/assets/img/client3.jpeg',
      testimonial: 'After my surgery, I needed professional care at home. Nurses & Companions exceeded my expectations with their dedicated service and attention to detail.'
    }
  ];

  return (
    <>
      <ImagePreloader images={carouselImages.map(image => image.src)} />
      <ImagePreloader images={testimonials.map(testimonial => testimonial.image)} />
      {/* Hero Section with Carousel */}
      <section className="hero-carousel-section">
        <Carousel 
          activeIndex={index} 
          onSelect={handleSelect}
          fade
          interval={3000}
          className="hero-carousel"
          pause={false}
        >
          {carouselImages.map((image, idx) => (
            <Carousel.Item key={idx} className="hero-carousel-item">
              <div className="carousel-img-container">
                <img
                  src={image.src}
                  alt={image.title}
                  className="carousel-image d-block"
                />
                <div className="carousel-overlay">
                  <Container className="h-100">
                    <Row className="h-100 align-items-center">
                      <Col lg={8} md={10} xs={12} className="text-white text-center text-md-start">
                        <h1 className="display-4 fw-bold mb-3">{image.title}</h1>
                        <p className="lead mb-4">{image.subtitle}</p>
                        <h2 className="mb-4">Professional & Compassionate Nursing Care</h2>
                        <div className="d-flex gap-3 flex-column flex-md-row justify-content-center justify-content-md-start">
                <Button as={Link} to="/services" variant="light" size="lg">Our Services</Button>
                <Button as={Link} to="/contact" variant="outline-light" size="lg">Contact Us</Button>
              </div>
            </Col>
          </Row>
        </Container>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </section>

      {/* Services Overview Section */}
      <section className="section-padding">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold">Our Healthcare Services</h2>
              <p className="lead">Comprehensive nursing assistant services tailored to your needs</p>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="service-card h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-4">
                    <i className="fas fa-user-nurse text-primary fa-3x"></i>
                  </div>
                  <Card.Title className="fw-bold mb-3">Personal Care</Card.Title>
                  <Card.Text>
                    Assistance with daily living activities including bathing, grooming, dressing, and mobility support to maintain dignity and independence.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="service-card h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-4">
                    <i className="fas fa-heartbeat text-primary fa-3x"></i>
                  </div>
                  <Card.Title className="fw-bold mb-3">Health Monitoring</Card.Title>
                  <Card.Text>
                    Regular monitoring of vital signs, medication management, and health condition tracking to ensure optimal health outcomes.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="service-card h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-4">
                    <i className="fas fa-home text-primary fa-3x"></i>
                  </div>
                  <Card.Title className="fw-bold mb-3">Companionship</Card.Title>
                  <Card.Text>
                    Emotional support and meaningful social interaction to combat loneliness and enhance overall quality of life and mental wellbeing.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-4 text-center">
            <Col>
              <Button as={Link} to="/services" variant="primary" size="lg">View All Services</Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold">Why Choose Nurses & Companions</h2>
              <p className="lead">What sets our nursing assistant services apart</p>
            </Col>
          </Row>
          <Row>
            <Col md={6} lg={3} className="mb-4">
              <div className="text-center">
                <div className="mb-3">
                  <i className="fas fa-certificate text-primary fa-3x"></i>
                </div>
                <h4 className="fw-bold">Certified Professionals</h4>
                <p>Our team consists of licensed and highly trained nursing assistants.</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="mb-4">
              <div className="text-center">
                <div className="mb-3">
                  <i className="fas fa-clock text-primary fa-3x"></i>
                </div>
                <h4 className="fw-bold">24/7 Availability</h4>
                <p>Round-the-clock care available to meet your schedule and needs.</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="mb-4">
              <div className="text-center">
                <div className="mb-3">
                  <i className="fas fa-hands-helping text-primary fa-3x"></i>
                </div>
                <h4 className="fw-bold">Personalized Care</h4>
                <p>Customized care plans designed around individual requirements.</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="mb-4">
              <div className="text-center">
                <div className="mb-3">
                  <i className="fas fa-heart text-primary fa-3x"></i>
                </div>
                <h4 className="fw-bold">Compassionate Approach</h4>
                <p>Care delivered with empathy, respect, and dignity.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold">What Our Clients Say</h2>
              <p className="lead">Testimonials from those we've had the privilege to serve</p>
            </Col>
          </Row>
          <Row>
            {testimonials.map(testimonial => (
              <Col md={4} key={testimonial.id} className="mb-4">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-4">
                    <div style={{ width: '120px', height: '120px', overflow: 'hidden' }} className="mx-auto mb-3">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="w-100 h-100 rounded-circle"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <h5 className="fw-bold text-center mb-1">{testimonial.name}</h5>
                    <p className="text-muted text-center mb-3">{testimonial.role}</p>
                    <Card.Text className="mb-0">"{testimonial.testimonial}"</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="fw-bold mb-3">Ready to experience our exceptional care?</h2>
              <p className="lead mb-0">Contact us today to schedule a consultation or learn more about our services.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button as={Link} to="/contact" variant="light" size="lg">Contact Us Today</Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Chat Widget */}
      <ChatWidget />
    </>
  );
};

export default Home; 
