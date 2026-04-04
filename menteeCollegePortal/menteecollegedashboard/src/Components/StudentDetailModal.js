import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  MenuItem,
  TextField
} from '@mui/material';
import {
  AccountCircle,
  Email,
  Phone,
  CalendarToday,
  School,
  AttachMoney,
  Receipt,
  Payment,
  Close,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  History,
  Description,
  Edit,
  MenuBook,
  Settings,
  Grade,
  Schedule
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import CourseAssignmentModal from './CourseAssignmentModal';
import ProgramEnrollmentModal from './ProgramEnrollmentModal';
import GradeManagementModal from './GradeManagementModal';
import PaymentManagementModal from './PaymentManagementModal';
import CreatePaymentScheduleModal from './CreatePaymentScheduleModal';

const StudentDetailModal = ({ student, open, onClose }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // State management
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Admin management state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [studentData, setStudentData] = useState(null);

  // Contact editing state
  const [editingContact, setEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    email: '',
    phone_number: ''
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Fetch detailed student information
  const fetchStudentDetails = async () => {
    if (!student || !userInfo) return;

    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;

      // Fetch student payment details
      const response = await axios.get(`${API_BASE}/api/students/${student.username}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setStudentData(response.data);
      setPaymentDetails(response.data.payment_details || {});
      setAssignedCourses(response.data.course_enrollment_names || []);

      // Extract payment history if available
      const history = [];
      ['certificate_courses', 'diploma_programs', 'associate_programs'].forEach(programType => {
        if (response.data.payment_details && response.data.payment_details[programType]) {
          response.data.payment_details[programType].forEach(program => {
            if (program.payment_history) {
              history.push(...program.payment_history);
            }
          });
        }
      });

      // Sort payment history by date (most recent first)
      history.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
      setPaymentHistory(history);

      // Fetch available cohorts for admin
      if (userInfo.isAdmin) {
        const cohortsResponse = await axios.get(`${API_BASE}/api/cohorts/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setCohorts(Array.isArray(cohortsResponse.data) ? cohortsResponse.data : []);
      }

    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && student) {
      fetchStudentDetails();
    }
  }, [open, student]);

  // Handle cohort change
  const handleCohortChange = async (event) => {
    const cohortId = event.target.value;

    try {
      const authToken = userInfo?.token || userInfo?.access;

      await axios.patch(
        `${API_BASE}/api/admin/students/${student.username}/update-cohort/`,
        { cohort_id: cohortId || null },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Refresh student data
      fetchStudentDetails();
    } catch (err) {
      console.error('Error updating cohort:', err);
      setError('Failed to update cohort assignment');
    }
  };

  // Handle contact info update
  const handleContactUpdate = async () => {
    try {
      const authToken = userInfo?.token || userInfo?.access;

      await axios.patch(
        `${API_BASE}/api/admin/students/${student.username}/update-contact/`,
        contactData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setEditingContact(false);
      fetchStudentDetails();
    } catch (err) {
      console.error('Error updating contact info:', err);
      setError('Failed to update contact information');
    }
  };

  const handleStartEditContact = () => {
    setContactData({
      email: student.email || (student.user && student.user.email) || '',
      phone_number: student.phone_number || ''
    });
    setEditingContact(true);
  };

  const calculateTotalBalance = () => {
    if (!paymentDetails) return 0;
    
    let totalBalance = 0;
    ['certificate_courses', 'diploma_programs', 'associate_programs'].forEach(programType => {
      if (paymentDetails[programType]) {
        paymentDetails[programType].forEach(program => {
          totalBalance += (program.total_due || program.amount_due || 0) - 
                         (program.total_paid || program.amount_paid || 0);
        });
      }
    });
    
    return totalBalance;
  };

  const getPaymentStatusIcon = (balance) => {
    if (balance === 0) return <CheckCircle color="success" />;
    if (balance > 0 && balance < 500) return <Warning color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const getPaymentStatusText = (balance) => {
    if (balance === 0) return 'Account Current';
    if (balance > 0 && balance < 500) return 'Payment Due';
    return 'Overdue';
  };

  const getPaymentStatusColor = (balance) => {
    if (balance === 0) return 'success';
    if (balance > 0 && balance < 500) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const currentBalance = calculateTotalBalance();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              {student.first_name ? 
                `${student.first_name[0]}${student.last_name ? student.last_name[0] : ''}` :
                <AccountCircle />
              }
            </Avatar>
            <Box>
              <Typography variant="h6">
                {student.first_name} {student.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student.username} • Student ID: {student.id}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Left Column - Student Information */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Student Information
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AccountCircle />
                      </ListItemIcon>
                      <ListItemText
                        primary="Full Name"
                        secondary={`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A'}
                      />
                    </ListItem>
                    
                    {userInfo?.isAdmin && editingContact ? (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <TextField
                            fullWidth
                            size="small"
                            label="Email"
                            value={contactData.email}
                            onChange={(e) => setContactData({...contactData, email: e.target.value})}
                          />
                        </ListItem>

                        <ListItem>
                          <ListItemIcon>
                            <Phone />
                          </ListItemIcon>
                          <TextField
                            fullWidth
                            size="small"
                            label="Phone"
                            value={contactData.phone_number}
                            onChange={(e) => setContactData({...contactData, phone_number: e.target.value})}
                          />
                        </ListItem>

                        <ListItem>
                          <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              onClick={() => setEditingContact(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={handleContactUpdate}
                            >
                              Save
                            </Button>
                          </Box>
                        </ListItem>
                      </>
                    ) : (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={student.email || (student.user && student.user.email) || 'N/A'}
                          />
                          {userInfo?.isAdmin && (
                            <IconButton size="small" onClick={handleStartEditContact}>
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                        </ListItem>

                        <ListItem>
                          <ListItemIcon>
                            <Phone />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={student.phone_number || 'N/A'}
                          />
                        </ListItem>
                      </>
                    )}
                    
                    <ListItem>
                      <ListItemIcon>
                        <CalendarToday />
                      </ListItemIcon>
                      <ListItemText
                        primary="Enrolled"
                        secondary={formatDate(student.created_at)}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <School />
                      </ListItemIcon>
                      <ListItemText
                        primary="Payment Plan"
                        secondary={student.on_payment_plan ? 'Yes' : 'No'}
                      />
                    </ListItem>

                    {/* Cohort Selector (Admin Only) */}
                    {userInfo?.isAdmin && (
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday />
                        </ListItemIcon>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Cohort Assignment
                          </Typography>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={student.cohort?.id || ''}
                            onChange={handleCohortChange}
                            sx={{ mt: 0.5 }}
                          >
                            <MenuItem value="">
                              <em>No Cohort</em>
                            </MenuItem>
                            {cohorts.map((cohort) => (
                              <MenuItem key={cohort.id} value={cohort.id}>
                                {cohort.academic_year} - Cohort {cohort.cohort_number}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>

              {/* Assigned Courses (Admin Only) */}
              {userInfo?.isAdmin && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Assigned Courses
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => setShowCourseModal(true)}
                      >
                        Manage
                      </Button>
                    </Box>

                    {assignedCourses.length > 0 ? (
                      <List dense>
                        {assignedCourses.map((courseName, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <MenuBook fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={courseName} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No courses assigned
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Grade Management (Admin Only) */}
              {userInfo?.isAdmin && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Grades
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Grade />}
                        onClick={() => setShowGradeModal(true)}
                      >
                        Manage Grades
                      </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      View and update final grades for all courses
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Payment Status Summary */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Payment Status
                    </Typography>
                    {userInfo?.isAdmin && (
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Schedule />}
                          onClick={() => setShowCreateScheduleModal(true)}
                          fullWidth
                        >
                          Create Schedule
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => setShowPaymentModal(true)}
                          fullWidth
                        >
                          Record Payment
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getPaymentStatusIcon(currentBalance)}
                    <Typography variant="h6">
                      ${currentBalance.toFixed(2)}
                    </Typography>
                  </Box>

                  <Chip
                    label={getPaymentStatusText(currentBalance)}
                    color={getPaymentStatusColor(currentBalance)}
                    size="small"
                  />

                  {paymentDetails && paymentDetails.next_due_date && currentBalance > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Due: {formatDate(paymentDetails.next_due_date)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Detailed Information */}
            <Grid item xs={12} md={8}>
              {/* Program Enrollments */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Program Enrollments
                    </Typography>
                    {userInfo?.isAdmin && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Settings />}
                        onClick={() => setShowProgramModal(true)}
                      >
                        Manage Programs
                      </Button>
                    )}
                  </Box>

                  {paymentDetails && (
                    <Box>
                      {/* Certificate Programs */}
                      {paymentDetails.certificate_courses && paymentDetails.certificate_courses.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Certificate Programs
                          </Typography>
                          {paymentDetails.certificate_courses.map((program, index) => {
                            const balance = (program.total_due || program.amount_due || 0) - 
                                          (program.total_paid || program.amount_paid || 0);
                            return (
                              <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                      {program.program_name || 'Certificate Program'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        Balance: ${balance.toFixed(2)}
                                      </Typography>
                                      {getPaymentStatusIcon(balance)}
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                      )}

                      {/* Diploma Programs */}
                      {paymentDetails.diploma_programs && paymentDetails.diploma_programs.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="secondary" gutterBottom>
                            Diploma Programs
                          </Typography>
                          {paymentDetails.diploma_programs.map((program, index) => {
                            const balance = (program.total_due || program.amount_due || 0) - 
                                          (program.total_paid || program.amount_paid || 0);
                            return (
                              <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                      {program.program_name || 'Diploma Program'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        Balance: ${balance.toFixed(2)}
                                      </Typography>
                                      {getPaymentStatusIcon(balance)}
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                      )}

                      {/* Associates Programs */}
                      {paymentDetails.associate_programs && paymentDetails.associate_programs.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="info.main" gutterBottom>
                            Associates Programs
                          </Typography>
                          {paymentDetails.associate_programs.map((program, index) => {
                            const balance = (program.total_due || program.amount_due || 0) - 
                                          (program.total_paid || program.amount_paid || 0);
                            return (
                              <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                      {program.program_name || 'Associates Program'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        Balance: ${balance.toFixed(2)}
                                      </Typography>
                                      {getPaymentStatusIcon(balance)}
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                      )}

                      {(!paymentDetails.certificate_courses || paymentDetails.certificate_courses.length === 0) &&
                       (!paymentDetails.diploma_programs || paymentDetails.diploma_programs.length === 0) &&
                       (!paymentDetails.associate_programs || paymentDetails.associate_programs.length === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          No program enrollments found
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payment History
                    </Typography>
                    
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Reference</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paymentHistory.slice(0, 10).map((payment, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {formatDate(payment.date || payment.created_at)}
                              </TableCell>
                              <TableCell>
                                ${(payment.amount || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {payment.method || 'Card'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={payment.status || 'Completed'}
                                  size="small"
                                  color="success"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {payment.reference || payment.transaction_id || 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={<Email />}
          onClick={() => {
            const email = student.email || (student.user && student.user.email);
            if (email) {
              window.open(`mailto:${email}`, '_blank');
            } else {
              alert('No email address found for this student');
            }
          }}
        >
          Send Email
        </Button>
        <Button
          variant="contained"
          startIcon={<Receipt />}
          onClick={() => {
            // TODO: Navigate to full student profile or payment details
            alert('Full student profile would be opened here');
          }}
        >
          View Full Profile
        </Button>
      </DialogActions>

      {/* Course Assignment Modal */}
      {showCourseModal && (
        <CourseAssignmentModal
          student={student}
          open={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          onUpdate={fetchStudentDetails}
        />
      )}

      {/* Program Enrollment Modal */}
      {showProgramModal && (
        <ProgramEnrollmentModal
          student={student}
          open={showProgramModal}
          onClose={() => setShowProgramModal(false)}
          onUpdate={fetchStudentDetails}
        />
      )}

      {/* Grade Management Modal */}
      {showGradeModal && (
        <GradeManagementModal
          student={student}
          open={showGradeModal}
          onClose={() => setShowGradeModal(false)}
          onUpdate={fetchStudentDetails}
        />
      )}

      {/* Payment Management Modal */}
      {showPaymentModal && (
        <PaymentManagementModal
          student={student}
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentRecorded={fetchStudentDetails}
        />
      )}

      {/* Create Payment Schedule Modal */}
      {showCreateScheduleModal && (
        <CreatePaymentScheduleModal
          student={student}
          open={showCreateScheduleModal}
          onClose={() => setShowCreateScheduleModal(false)}
          onScheduleCreated={fetchStudentDetails}
        />
      )}
    </Dialog>
  );
};

export default StudentDetailModal;