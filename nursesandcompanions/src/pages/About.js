import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import ImagePreloader from '../components/ImagePreloader';

const About = () => {
  // Sample team data
  const teamMembers = [
    {
      id: 1,
      name: 'Veronica Browne-Wiseman',
      role: 'Founder & CEO',
      image: '/assets/img/Veronica.png',
      bio: 'Veronica founded Nurses & Companions with a vision to provide exceptional in-home nursing care. Her passion for healthcare and commitment to quality has shaped our company\'s mission and values from the very beginning.'
    },
    {
      id: 2,
      name: 'Derek Browne',
      role: 'Marketing Director',
      image: '/assets/img/Derek.png',
      bio: 'Derek leads our marketing initiatives and community outreach programs. His strategic approach to building relationships has helped establish Nurses & Companions as a trusted name in healthcare services.'
    },
    {
      id: 3,
      name: 'Andrew Browne',
      role: 'Head of IT Services',
      image: '/assets/img/Andrew.JPG',
      bio: 'Andrew oversees all technology infrastructure and digital systems that support our operations. His expertise ensures our team has the tools needed to deliver efficient and coordinated care to our clients.'
    },
    {
      id: 4,
      name: 'Emily Cueto',
      role: 'Administrative Assistant',
      image: '/assets/img/Emilly.png',
      bio: 'Emily provides essential administrative support that keeps our operations running smoothly. Her attention to detail and organizational skills help ensure our clients receive seamless service coordination.'
    },
    {
      id: 5,
      name: 'Faron Wiseman',
      role: 'Director of Client Relations',
      image: '/assets/img/Faron.jpg',
      bio: 'Faron oversees client relationships and ensures exceptional service delivery. Her dedication to client satisfaction and strong communication skills help maintain the trust and confidence our families place in our care services.'
    }
  ];

  // Extract all images that need to be preloaded
  const imagesToPreload = [
    ...teamMembers.map(member => member.image),
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
  ];

  return (
    <ImagePreloader images={imagesToPreload}>
      {/* About Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container>
          <Row className="py-4">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="fw-bold mb-4">About Nurses & Companions</h1>
              <p className="lead">Dedicated to providing exceptional nursing assistant services with compassion, dignity, and professionalism since 2012.</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Our Story Section */}
      <section className="section-padding">
        <Container>
          <Row>
            <Col lg={6} className="mb-4 mb-lg-0">
              <h2 className="fw-bold mb-4">Our Story</h2>
              <p>Nurses & Companions was founded in 2012 by a group of healthcare professionals who recognized the growing need for quality in-home nursing assistant services. What began as a small team serving a local community has grown into a trusted healthcare provider with a reputation for excellence.</p>
              <p>Over the years, we've remained committed to our founding principles: personalized care, professional excellence, and genuine compassion. We understand that each client has unique needs, and we work diligently to provide tailored care that supports health, independence, and quality of life.</p>
              <p>Today, Nurses & Companions continues to expand our services while maintaining the personal touch and attention to detail that has defined our care from the beginning.</p>
            </Col>
            <Col lg={6}>
              <div className="rounded shadow-sm overflow-hidden h-100">
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="Nursing team" className="img-fluid w-100 h-100 object-fit-cover" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mission and Values Section */}
      <section className="section-padding bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col lg={8} className="mx-auto">
              <h2 className="fw-bold mb-4">Our Mission & Values</h2>
              <p className="lead">Guiding principles that drive our commitment to exceptional care</p>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-4">
              <div className="bg-white p-4 rounded shadow-sm h-100">
                <h3 className="fw-bold mb-3">Our Mission</h3>
                <p>Serving our community with quality home care services that meets the demands of seniors and the disabled</p>
                <p className="mb-0">We strive to be a trusted partner in healthcare, delivering personalized support that addresses the unique needs of each individual we serve.</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="bg-white p-4 rounded shadow-sm h-100">
                <h3 className="fw-bold mb-3">Our Core Values</h3>
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <div className="d-flex">
                      <div className="me-3"><i className="fas fa-heart text-primary fa-2x"></i></div>
                      <div>
                        <h5 className="fw-bold">Compassion</h5>
                        <p>We provide care with genuine empathy, kindness, and respect for each client's dignity.</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex">
                      <div className="me-3"><i className="fas fa-trophy text-primary fa-2x"></i></div>
                      <div>
                        <h5 className="fw-bold">Excellence</h5>
                        <p>We uphold the highest standards of professional care and continuous improvement.</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex">
                      <div className="me-3"><i className="fas fa-user-shield text-primary fa-2x"></i></div>
                      <div>
                        <h5 className="fw-bold">Integrity</h5>
                        <p>We conduct ourselves with honesty, reliability, and ethical practice in all interactions.</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex">
                      <div className="me-3"><i className="fas fa-hands-helping text-primary fa-2x"></i></div>
                      <div>
                        <h5 className="fw-bold">Personalization</h5>
                        <p className="mb-0">We recognize the individuality of each client and tailor our services accordingly.</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Our Team Section */}
      <section className="section-padding">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold">Our Leadership Team</h2>
              <p className="lead">Experienced professionals dedicated to excellence in healthcare</p>
            </Col>
          </Row>
          <Row>
            {teamMembers.map(member => (
              <Col lg className="mb-4" key={member.id}>
                <Card className="border-0 shadow-sm h-100">
                  <div style={{ height: '300px', overflow: 'hidden' }}>
                    <Card.Img 
                      variant="top" 
                      src={member.image} 
                      alt={member.name}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <Card.Body className="text-center">
                    <Card.Title className="fw-bold mb-1">{member.name}</Card.Title>
                    <p className="text-primary mb-3">{member.role}</p>
                    <Card.Text>{member.bio}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Statistics Section */}
       <center>

      <section className="section-padding bg-primary text-white">
               <Container>
          <Row className="text-center">
            <Col md={3} className="mb-4 mb-md-0">
              <div>
                <h2 className="fw-bold display-4 mb-2">13+</h2>
                <p className="fs-5 mb-0">Years of Service</p>
              </div>
            </Col>
            <Col md={3} className="mb-4 mb-md-0">
              <div>
                <h2 className="fw-bold display-4 mb-2">300+</h2>
                <p className="fs-5 mb-0">Clients Served</p>
              </div>
            </Col>
                       <Col md={3}>
              <div>
                <h2 className="fw-bold display-4 mb-2">24/7</h2>
                <p className="fs-5 mb-0">Care Availability</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

        </center>
      {/* Call to Action */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="fw-bold mb-3">Ready to learn more about our team and services?</h2>
              <p className="lead mb-0">Contact us today to discuss how we can provide exceptional care for you or your loved ones.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <a href="/contact" className="btn btn-primary btn-lg">Contact Us Today</a>
            </Col>
          </Row>
        </Container>
      </section>
    </ImagePreloader>
  );
};

export default About; 
