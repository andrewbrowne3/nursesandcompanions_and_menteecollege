import React from 'react';
import { Container, Row, Col, Card, Button, Accordion } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Services = () => {
  // Services data
  const services = [
    {
      id: 1,
      title: 'Personal Care',
      icon: 'fas fa-user-nurse',
      description: 'Compassionate assistance with activities of daily living.',
      details: 'Our nursing assistants provide dignified help with bathing, grooming, dressing, toileting, and mobility. We understand the importance of maintaining independence while receiving necessary support.'
    },
    {
      id: 2,
      title: 'Health Monitoring',
      icon: 'fas fa-heartbeat',
      description: 'Regular monitoring of vital health indicators.',
      details: 'We track vital signs, monitor medications, and observe changes in health conditions. Our nursing assistants are trained to recognize and report significant health changes to ensure timely medical intervention when needed.'
    },
    {
      id: 3,
      title: 'Medication Management',
      icon: 'fas fa-pills',
      description: 'Assistance with medication schedules and administration.',
      details: 'Our team helps ensure medications are taken on schedule and as prescribed. We provide reminders, assistance with organization, and monitoring for potential side effects or interactions.'
    },
    {
      id: 4,
      title: 'Companionship',
      icon: 'fas fa-hands-helping',
      description: 'Meaningful social interaction and emotional support.',
      details: 'Beyond physical care, we provide conversation, companionship, and recreational activities that enhance mental and emotional well-being, combating loneliness and isolation.'
    }  
  ];

  // FAQs data
  const faqs = [
    {
      id: 1,
      question: 'How are your nursing assistants screened and trained?',
      answer: 'All our nursing assistants undergo rigorous background checks, certification verification, and reference checks. Additionally, they complete our comprehensive in-house training program that covers client care techniques, emergency procedures, communication skills, and specialized care approaches. We also provide ongoing education to ensure our team stays current with best practices.'
    },
    {
      id: 2,
      question: 'Can we request a specific nursing assistant?',
      answer: 'Yes, we encourage establishing a consistent relationship between clients and nursing assistants. We make every effort to match clients with compatible caregivers and maintain that relationship. You can request specific nursing assistants based on previous positive experiences.'
    },
    {
      id: 3,
      question: 'What are your service hours?',
      answer: 'We provide flexible scheduling with 24/7 availability. Services can be arranged on an hourly basis, for full days, overnight, or as live-in care, depending on your needs. We offer everything from a few hours per week to around-the-clock care.'
    },
    {
      id: 4,
      question: 'How do you handle emergency situations?',
      answer: 'All our nursing assistants are trained in emergency protocols and basic first aid. In case of a medical emergency, they will call emergency services immediately and then notify designated family contacts. We maintain detailed emergency contact information and medical history for quick reference.'
    },
    {
      id: 5,
      question: 'Are your services covered by insurance or Medicare?',
      answer: 'Some long-term care insurance policies cover our services. While traditional Medicare generally doesn\'t cover non-medical home care, some Medicare Advantage plans may offer limited coverage. We can provide documentation to help you submit claims to your insurance provider.'
    }
  ];

  return (
    <>
      {/* Services Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container>
          <Row className="py-4">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="fw-bold mb-4">Our Healthcare Services</h1>
              <p className="lead">Comprehensive nursing assistant services tailored to meet your individual needs with compassion and expertise.</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Services Overview */}
      <section className="section-padding">
        <Container>
          <Row className="mb-5">
            <Col lg={8} className="mx-auto text-center">
              <h2 className="fw-bold mb-4">How We Can Help</h2>
              <p className="lead">Our skilled nursing assistants provide a wide range of services designed to support health, independence, and quality of life</p>
            </Col>
          </Row>
          <Row>
            {services.map(service => (
              <Col md={6} lg={3} key={service.id} className="mb-4">
                <Card className="h-100 shadow-sm border-0 service-card">
                  <Card.Body className="p-4">
                    <div className="mb-4 text-center">
                      <i className={`${service.icon} text-primary fa-3x`}></i>
                    </div>
                    <Card.Title className="fw-bold text-center mb-3">{service.title}</Card.Title>
                    <Card.Text>{service.description}</Card.Text>
                    <hr />
                    <Card.Text>{service.details}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Care Process Section */}
      <section className="section-padding bg-light">
        <Container>
          <Row className="mb-5">
            <Col lg={8} className="mx-auto text-center">
              <h2 className="fw-bold mb-4">Our Care Process</h2>
              <p className="lead">We follow a comprehensive approach to ensure you receive personalized, effective care</p>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="position-relative">
                <div className="timeline-line d-none d-md-block"></div>
                <Row className="mb-5">
                  <Col md={6} className="text-md-end">
                    <div className="bg-white p-4 rounded shadow-sm mb-4 mb-md-0 position-relative">
                      <span className="timeline-circle d-none d-md-block bg-primary text-white">1</span>
                      <h4 className="fw-bold">Initial Consultation</h4>
                      <p className="mb-0">We begin with a comprehensive assessment of your needs, preferences, and health requirements. This helps us understand your unique situation and develop a preliminary care plan.</p>
                    </div>
                  </Col>
                  <Col md={6}></Col>
                </Row>
                <Row className="mb-5">
                  <Col md={6}></Col>
                  <Col md={6}>
                    <div className="bg-white p-4 rounded shadow-sm position-relative">
                      <span className="timeline-circle d-none d-md-block bg-primary text-white">2</span>
                      <h4 className="fw-bold">Care Plan Development</h4>
                      <p className="mb-0">Based on the initial assessment, our nursing supervisor creates a detailed care plan tailored to your specific needs. This plan outlines services, schedules, and special considerations for your care.</p>
                    </div>
                  </Col>
                </Row>
                <Row className="mb-5">
                  <Col md={6} className="text-md-end">
                    <div className="bg-white p-4 rounded shadow-sm mb-4 mb-md-0 position-relative">
                      <span className="timeline-circle d-none d-md-block bg-primary text-white">3</span>
                      <h4 className="fw-bold">Caregiver Matching</h4>
                      <p className="mb-0">We carefully select nursing assistants whose skills, experience, and personality best match your needs and preferences, ensuring a compatible and effective care relationship.</p>
                    </div>
                  </Col>
                  <Col md={6}></Col>
                </Row>
                <Row>
                  <Col md={6}></Col>
                  <Col md={6}>
                    <div className="bg-white p-4 rounded shadow-sm position-relative">
                      <span className="timeline-circle d-none d-md-block bg-primary text-white">4</span>
                      <h4 className="fw-bold">Ongoing Care & Evaluation</h4>
                      <p className="mb-0">We provide regular care according to the established plan, with ongoing supervision and periodic reassessments to ensure the care continues to meet your changing needs.</p>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQs Section */}
      <section className="section-padding">
        <Container>
          <Row className="mb-5">
            <Col lg={8} className="mx-auto text-center">
              <h2 className="fw-bold mb-4">Frequently Asked Questions</h2>
              <p className="lead">Find answers to common questions about our nursing assistant services</p>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Accordion>
                {faqs.map((faq, index) => (
                  <Accordion.Item key={faq.id} eventKey={index.toString()}>
                    <Accordion.Header>{faq.question}</Accordion.Header>
                    <Accordion.Body>
                      {faq.answer}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="fw-bold mb-3">Ready to arrange care for yourself or a loved one?</h2>
              <p className="lead mb-0">Contact us today to schedule a free consultation and learn more about our services.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button as={Link} to="/contact" variant="light" size="lg">Contact Us Today</Button>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Services; 
