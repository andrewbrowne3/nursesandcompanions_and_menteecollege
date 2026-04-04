import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Accordion } from 'react-bootstrap';

const Careers = () => {
  const [showApplication, setShowApplication] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  
  // Job listings data
  const jobs = [
    {
      id: 1,
      title: 'Certified Nursing Assistant (CNA)',
      type: 'Full-time / Part-time',
      location: 'Medical City, CA',
      description: 'We are seeking compassionate and dedicated Certified Nursing Assistants to join our team. As a CNA, you will provide essential care and support to our clients in their homes.',
      responsibilities: [
        'Assist clients with activities of daily living including bathing, grooming, and dressing',
        'Monitor and record vital signs and health conditions',
        'Provide mobility assistance and maintain a safe environment',
        'Prepare and serve meals according to dietary requirements',
        'Provide companionship and emotional support',
        'Document care provided and report changes in client condition'
      ],
      requirements: [
        'Current CNA certification',
        'At least 1 year of experience in home care or healthcare setting',
        'Valid driver\'s license and reliable transportation',
        'Strong communication and interpersonal skills',
        'Ability to work independently and as part of a team',
        'CPR and First Aid certification'
      ]
    },
    {
      id: 2,
      title: 'Licensed Practical Nurse (LPN)',
      type: 'Full-time',
      location: 'Medical City, CA',
      description: 'We are looking for skilled Licensed Practical Nurses to provide comprehensive care to our clients in their homes. The ideal candidate will have strong clinical skills and a compassionate approach to client care.',
      responsibilities: [
        'Administer medications and treatments as prescribed',
        'Monitor health conditions and report changes to healthcare providers',
        'Perform routine wound care and other clinical procedures',
        'Develop and implement care plans in collaboration with healthcare team',
        'Educate clients and families on health management',
        'Maintain accurate medical records'
      ],
      requirements: [
        'Current LPN license in good standing',
        'Minimum of 2 years nursing experience',
        'Experience in home healthcare preferred',
        'Strong assessment and documentation skills',
        'Excellent time management and organizational abilities',
        'Valid driver\'s license and reliable transportation'
      ]
    },
    {
      id: 3,
      title: 'Client Care Coordinator',
      type: 'Full-time',
      location: 'Medical City, CA',
      description: 'We are seeking a detail-oriented Client Care Coordinator to oversee our care scheduling and client relations. This role is vital in ensuring smooth service delivery and high client satisfaction.',
      responsibilities: [
        'Schedule and coordinate care services for clients',
        'Match clients with appropriate caregiving staff',
        'Respond to client inquiries and address concerns',
        'Maintain client records and service documentation',
        'Communicate with families, healthcare providers, and staff',
        'Conduct regular check-ins with clients to ensure satisfaction'
      ],
      requirements: [
        'Bachelor\'s degree in healthcare administration or related field',
        'Prior experience in healthcare coordination or scheduling',
        'Excellent interpersonal and communication skills',
        'Strong organizational and problem-solving abilities',
        'Proficiency in scheduling software and database management',
        'Knowledge of home healthcare regulations and best practices'
      ]
    }
  ];

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setShowApplication(true);
    window.scrollTo(0, 0);
  };

  const handleBackClick = () => {
    setShowApplication(false);
    setSelectedJob(null);
    setApplicationSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, this is where you would send the data to a server
    setApplicationSubmitted(true);
  };

  return (
    <>
      {/* Careers Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container>
          <Row className="py-4">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="fw-bold mb-4">Join Our Team</h1>
              <p className="lead">Build a rewarding career providing compassionate care as part of the Nurses & Companions family.</p>
            </Col>
          </Row>
        </Container>
      </section>

      {showApplication ? (
        /* Job Application Form */
        <section className="section-padding">
          <Container>
            {applicationSubmitted ? (
              <Row className="justify-content-center">
                <Col lg={8}>
                  <div className="text-center bg-light p-5 rounded shadow-sm">
                    <i className="fas fa-check-circle text-primary fa-4x mb-4"></i>
                    <h2 className="fw-bold mb-4">Application Submitted!</h2>
                    <p className="lead mb-4">Thank you for your interest in joining our team. We have received your application for the {selectedJob.title} position.</p>
                    <p>Our hiring team will review your qualifications and contact you if your experience matches our needs. This process typically takes 1-2 weeks.</p>
                    <Button variant="primary" className="mt-4" onClick={handleBackClick}>
                      Back to Careers
                    </Button>
                  </div>
                </Col>
              </Row>
            ) : (
              <>
                <Row className="mb-4">
                  <Col>
                    <Button variant="outline-primary" onClick={handleBackClick}>
                      <i className="fas fa-arrow-left me-2"></i> Back to Job Listings
                    </Button>
                  </Col>
                </Row>
                <Row className="justify-content-center">
                  <Col lg={10}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Body className="p-4">
                        <h2 className="fw-bold mb-4">Application for {selectedJob.title}</h2>
                        <div className="mb-4">
                          <span className="badge bg-primary me-2">{selectedJob.type}</span>
                          <span className="text-muted"><i className="fas fa-map-marker-alt me-2"></i>{selectedJob.location}</span>
                        </div>
                        <Form onSubmit={handleSubmit}>
                          <h4 className="fw-bold mb-3">Personal Information</h4>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control type="text" required />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control type="text" required />
                              </Form.Group>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" required />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control type="tel" required />
                              </Form.Group>
                            </Col>
                          </Row>
                          <Form.Group className="mb-4">
                            <Form.Label>Address</Form.Label>
                            <Form.Control type="text" required />
                          </Form.Group>

                          <h4 className="fw-bold mb-3">Professional Information</h4>
                          <Form.Group className="mb-3">
                            <Form.Label>Current Job Title</Form.Label>
                            <Form.Control type="text" />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Years of Experience</Form.Label>
                            <Form.Select required>
                              <option value="">Select years of experience</option>
                              <option value="0-1">Less than 1 year</option>
                              <option value="1-3">1-3 years</option>
                              <option value="3-5">3-5 years</option>
                              <option value="5-10">5-10 years</option>
                              <option value="10+">10+ years</option>
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Certifications (select all that apply)</Form.Label>
                            <div>
                              <Form.Check inline type="checkbox" label="CNA" id="cna-cert" />
                              <Form.Check inline type="checkbox" label="LPN" id="lpn-cert" />
                              <Form.Check inline type="checkbox" label="RN" id="rn-cert" />
                              <Form.Check inline type="checkbox" label="CPR" id="cpr-cert" />
                              <Form.Check inline type="checkbox" label="First Aid" id="first-aid-cert" />
                            </div>
                          </Form.Group>
                          <Form.Group className="mb-4">
                            <Form.Label>Upload Resume</Form.Label>
                            <Form.Control type="file" required />
                            <Form.Text className="text-muted">
                              Accepted formats: PDF, DOC, DOCX. Maximum file size: 5MB
                            </Form.Text>
                          </Form.Group>

                          <h4 className="fw-bold mb-3">Additional Information</h4>
                          <Form.Group className="mb-3">
                            <Form.Label>Why do you want to join our team?</Form.Label>
                            <Form.Control as="textarea" rows={4} required />
                          </Form.Group>
                          <Form.Group className="mb-4">
                            <Form.Label>Availability</Form.Label>
                            <Form.Select required>
                              <option value="">Select availability</option>
                              <option value="full-time">Full-time</option>
                              <option value="part-time">Part-time</option>
                              <option value="weekends">Weekends only</option>
                              <option value="evenings">Evenings only</option>
                              <option value="flexible">Flexible schedule</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Check
                              type="checkbox"
                              label="I certify that all information provided is true and complete to the best of my knowledge."
                              required
                            />
                          </Form.Group>

                          <Button type="submit" variant="primary" size="lg">
                            Submit Application
                          </Button>
                        </Form>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Container>
        </section>
      ) : (
        /* Job Listings Section */
        <section className="section-padding">
          <Container>
            <Row className="mb-5">
              <Col lg={8} className="mx-auto text-center">
                <h2 className="fw-bold mb-4">Current Opportunities</h2>
                <p className="lead">We're looking for compassionate professionals to join our dedicated team of caregivers</p>
              </Col>
            </Row>

            <Row>
              {jobs.map(job => (
                <Col lg={4} md={6} key={job.id} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="p-4">
                      <Card.Title className="fw-bold mb-2">{job.title}</Card.Title>
                      <div className="mb-3">
                        <span className="badge bg-primary me-2">{job.type}</span>
                        <span className="text-muted"><i className="fas fa-map-marker-alt me-1"></i> {job.location}</span>
                      </div>
                      <Card.Text>{job.description}</Card.Text>
                      <Accordion className="mt-3 mb-4">
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>Responsibilities</Accordion.Header>
                          <Accordion.Body>
                            <ul className="ps-3">
                              {job.responsibilities.map((item, index) => (
                                <li key={index} className="mb-2">{item}</li>
                              ))}
                            </ul>
                          </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                          <Accordion.Header>Requirements</Accordion.Header>
                          <Accordion.Body>
                            <ul className="ps-3">
                              {job.requirements.map((item, index) => (
                                <li key={index} className="mb-2">{item}</li>
                              ))}
                            </ul>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                      <Button variant="primary" onClick={() => handleApplyClick(job)}>
                        Apply Now
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Benefits Section */}
      {!showApplication && (
        <section className="section-padding bg-light">
          <Container>
            <Row className="text-center mb-5">
              <Col lg={8} className="mx-auto">
                <h2 className="fw-bold mb-4">Employee Benefits</h2>
                <p className="lead">Join our team and enjoy these great benefits</p>
              </Col>
            </Row>
            <Row>
              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-4 text-center">
                    <div className="mb-3">
                      <i className="fas fa-dollar-sign text-primary fa-3x"></i>
                    </div>
                    <h4 className="fw-bold mb-3">Competitive Pay</h4>
                    <Card.Text>We offer industry-leading compensation packages based on experience and qualifications.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-4 text-center">
                    <div className="mb-3">
                      <i className="fas fa-calendar-alt text-primary fa-3x"></i>
                    </div>
                    <h4 className="fw-bold mb-3">Flexible Scheduling</h4>
                    <Card.Text>Work schedules that accommodate your lifestyle and personal commitments.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-4 text-center">
                    <div className="mb-3">
                      <i className="fas fa-graduation-cap text-primary fa-3x"></i>
                    </div>
                    <h4 className="fw-bold mb-3">Career Growth</h4>
                    <Card.Text>Ongoing training and advancement opportunities to develop your professional skills.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-4 text-center">
                    <div className="mb-3">
                      <i className="fas fa-heartbeat text-primary fa-3x"></i>
                    </div>
                    <h4 className="fw-bold mb-3">Health Benefits</h4>
                    <Card.Text>Comprehensive health insurance plans for full-time employees and their families.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* Work Culture Section */}
      {!showApplication && (
        <section className="section-padding">
          <Container>
            <Row className="align-items-center">
              <Col lg={6} className="mb-4 mb-lg-0">
                <img src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="Team members" className="img-fluid rounded shadow-sm" />
              </Col>
              <Col lg={6}>
                <h2 className="fw-bold mb-4">Our Work Culture</h2>
                <p className="lead mb-4">At Nurses & Companions, we foster a supportive, inclusive, and collaborative environment where every team member can thrive.</p>
                <p>We believe that happy caregivers provide better care, which is why we prioritize employee well-being and job satisfaction. Our team-oriented approach encourages mutual support, knowledge sharing, and collective problem-solving.</p>
                <div className="mt-4">
                  <h5 className="fw-bold mb-3">We Value:</h5>
                  <div className="d-flex mb-3">
                    <div className="me-3"><i className="fas fa-check text-primary"></i></div>
                    <div><p className="mb-0"><strong>Respect</strong> - We treat each other, our clients, and their families with dignity and courtesy.</p></div>
                  </div>
                  <div className="d-flex mb-3">
                    <div className="me-3"><i className="fas fa-check text-primary"></i></div>
                    <div><p className="mb-0"><strong>Excellence</strong> - We strive for the highest standards in healthcare delivery and service.</p></div>
                  </div>
                  <div className="d-flex mb-3">
                    <div className="me-3"><i className="fas fa-check text-primary"></i></div>
                    <div><p className="mb-0"><strong>Teamwork</strong> - We collaborate and support each other to achieve common goals.</p></div>
                  </div>
                  <div className="d-flex">
                    <div className="me-3"><i className="fas fa-check text-primary"></i></div>
                    <div><p className="mb-0"><strong>Growth</strong> - We encourage continuous learning and professional development.</p></div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}
    </>
  );
};

export default Careers; 