import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Breadcrumbs,
  Link,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  ArrowBack,
  Group,
  CalendarToday,
  School,
  AttachMoney,
  Visibility,
  Email,
  AccountCircle,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
  Download
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import StudentDetailModal from './StudentDetailModal';

const CohortDetail = ({ cohort, onBack }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // State management
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [cohortStats, setCohortStats] = useState({
    totalBalance: 0,
    paidStudents: 0,
    unpaidStudents: 0,
    averageBalance: 0
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Fetch students in this cohort
  const fetchCohortStudents = async () => {
    setLoading(true);
    setError(null);
    
    const authToken = userInfo?.token || userInfo?.access;
    
    try {
      // Use existing student detail endpoint with cohort filtering
      const response = await axios.get(`${API_BASE}/api/cohorts/${cohort.id}/students/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data) {
        setStudents(response.data);
        calculateCohortStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching cohort students:', err);
      // Fallback: try to get all students and filter by cohort
      try {
        const studentResponse = await axios.get(`${API_BASE}/api/students/`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { cohort_id: cohort.id }
        });
        
        if (studentResponse.data) {
          const cohortStudents = Array.isArray(studentResponse.data) 
            ? studentResponse.data 
            : studentResponse.data.results || [];
          
          // Fetch payment details for each student
          const studentsWithPayments = await Promise.all(
            cohortStudents.map(async (student) => {
              try {
                const paymentResponse = await axios.get(`${API_BASE}/api/students/${student.username}/`, {
                  headers: { Authorization: `Bearer ${authToken}` }
                });
                return {
                  ...student,
                  payment_details: paymentResponse.data.payment_details || {}
                };
              } catch (paymentErr) {
                console.error(`Error fetching payment for ${student.username}:`, paymentErr);
                return { ...student, payment_details: {} };
              }
            })
          );
          
          setStudents(studentsWithPayments);
          calculateCohortStats(studentsWithPayments);
        }
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        setError('Failed to load cohort students');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate cohort statistics
  const calculateCohortStats = (studentsData) => {
    let totalBalance = 0;
    let paidStudents = 0;
    let unpaidStudents = 0;

    studentsData.forEach(student => {
      if (student.payment_details) {
        let studentBalance = 0;
        
        // Calculate balance from all program types
        ['certificate_courses', 'diploma_programs', 'associate_programs'].forEach(programType => {
          if (student.payment_details[programType]) {
            student.payment_details[programType].forEach(program => {
              const balance = (program.total_due || program.amount_due || 0) - 
                            (program.total_paid || program.amount_paid || 0);
              studentBalance += balance;
            });
          }
        });

        totalBalance += studentBalance;
        
        if (studentBalance > 0) {
          unpaidStudents++;
        } else {
          paidStudents++;
        }
      } else {
        unpaidStudents++; // Assume unpaid if no payment details
      }
    });

    setCohortStats({
      totalBalance: totalBalance,
      paidStudents: paidStudents,
      unpaidStudents: unpaidStudents,
      averageBalance: studentsData.length > 0 ? totalBalance / studentsData.length : 0
    });
  };

  useEffect(() => {
    if (cohort && userInfo) {
      fetchCohortStudents();
    }
  }, [cohort, userInfo]);

  const getStudentBalance = (student) => {
    if (!student.payment_details) return 0;
    
    let balance = 0;
    ['certificate_courses', 'diploma_programs', 'associate_programs'].forEach(programType => {
      if (student.payment_details[programType]) {
        student.payment_details[programType].forEach(program => {
          balance += (program.total_due || program.amount_due || 0) - 
                    (program.total_paid || program.amount_paid || 0);
        });
      }
    });
    
    return balance;
  };

  const getPaymentStatusIcon = (balance) => {
    if (balance === 0) return <CheckCircle color="success" fontSize="small" />;
    if (balance > 0 && balance < 500) return <Warning color="warning" fontSize="small" />;
    return <ErrorIcon color="error" fontSize="small" />;
  };

  const getPaymentStatusColor = (balance) => {
    if (balance === 0) return 'success';
    if (balance > 0 && balance < 500) return 'warning';
    return 'error';
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const handleExportStudents = () => {
    // Convert students to CSV
    const headers = ['Name', 'Username', 'Email', 'Program Type', 'Current Balance', 'Payment Status', 'Enrollment Date'];
    const csvContent = [
      headers.join(','),
      ...students.map(student => {
        const balance = getStudentBalance(student);
        return [
          `${student.first_name} ${student.last_name}`,
          student.username,
          student.email || (student.user && student.user.email) || '',
          cohort.program_type,
          balance.toFixed(2),
          balance === 0 ? 'Paid' : 'Outstanding',
          student.created_at ? new Date(student.created_at).toLocaleDateString() : ''
        ].join(',');
      })
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohort_${cohort.academic_year}_${cohort.cohort_number}_students.csv`;
    a.click();
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <School sx={{ mr: 0.5 }} fontSize="inherit" />
            Cohort Management
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Group sx={{ mr: 0.5 }} fontSize="inherit" />
            {cohort.academic_year} - Cohort {cohort.cohort_number}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {cohort.academic_year} - Cohort {cohort.cohort_number}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {cohort.program_name} ({cohort.program_type})
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
          >
            Back to Cohorts
          </Button>
        </Box>

        {/* Cohort Information Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">Total Students</Typography>
                </Box>
                <Typography variant="h4">{students.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Enrolled in this cohort
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney color="success" sx={{ mr: 2 }} />
                  <Typography variant="h6">Total Outstanding</Typography>
                </Box>
                <Typography variant="h4">${cohortStats.totalBalance.toFixed(2)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Across all students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle color="success" sx={{ mr: 2 }} />
                  <Typography variant="h6">Paid Students</Typography>
                </Box>
                <Typography variant="h4">{cohortStats.paidStudents}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {students.length > 0 ? Math.round((cohortStats.paidStudents / students.length) * 100) : 0}% of cohort
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday color="info" sx={{ mr: 2 }} />
                  <Typography variant="h6">Program Dates</Typography>
                </Box>
                <Typography variant="body1">
                  {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'Not set'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  to {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'Ongoing'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Student Roster */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Student Roster ({students.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Email />}
                  onClick={() => {
                    // TODO: Implement bulk email functionality
                    alert('Bulk email functionality would be implemented here');
                  }}
                >
                  Email All
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleExportStudents}
                >
                  Export List
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="center">Current Balance</TableCell>
                      <TableCell>Payment Status</TableCell>
                      <TableCell>Program Progress</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                            No students found in this cohort
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => {
                        const balance = getStudentBalance(student);
                        return (
                          <TableRow key={student.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  {student.first_name ? 
                                    `${student.first_name[0]}${student.last_name ? student.last_name[0] : ''}` :
                                    <AccountCircle />
                                  }
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {student.first_name} {student.last_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {student.id}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {student.username}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {student.email || (student.user && student.user.email) || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                {getPaymentStatusIcon(balance)}
                                <Typography variant="body2" fontWeight="medium">
                                  ${balance.toFixed(2)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={balance === 0 ? 'Current' : balance > 500 ? 'Overdue' : 'Due'}
                                size="small"
                                color={getPaymentStatusColor(balance)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUp fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  In Progress
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View Details">
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleViewStudent(student)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Send Email">
                                <IconButton color="info">
                                  <Email />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          open={showStudentModal}
          onClose={() => {
            setShowStudentModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </Box>
  );
};

export default CohortDetail;