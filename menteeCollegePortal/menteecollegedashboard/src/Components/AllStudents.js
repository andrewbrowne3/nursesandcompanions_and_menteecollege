import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Tooltip,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Visibility,
  Search,
  Group,
  School,
  Person,
  PersonAdd
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import StudentDetailModal from './StudentDetailModal';
import AddStudentModal from './AddStudentModal';
import { Button } from '@mui/material';

const AllStudents = () => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (userInfo) {
      fetchAllStudents();
    }
  }, [userInfo]);

  useEffect(() => {
    // Filter students by program, then cohort, then free-text search.
    const term = searchTerm.trim().toLowerCase();
    const filtered = students.filter((student) => {
      const programName = student.cohort?.program_name || '';
      const cohortKey = student.cohort
        ? `${student.cohort.cohort_number}|${student.cohort.academic_year}`
        : '';

      if (programFilter !== 'all' && programName !== programFilter) return false;
      if (cohortFilter !== 'all' && cohortKey !== cohortFilter) return false;

      if (term) {
        return (
          student.first_name?.toLowerCase().includes(term) ||
          student.last_name?.toLowerCase().includes(term) ||
          student.username?.toLowerCase().includes(term) ||
          student.email?.toLowerCase().includes(term) ||
          student.cohort?.academic_year?.toLowerCase().includes(term)
        );
      }
      return true;
    });
    setFilteredStudents(filtered);
  }, [searchTerm, programFilter, cohortFilter, students]);

  // Reset cohort filter when it no longer belongs to the chosen program.
  useEffect(() => {
    setCohortFilter('all');
  }, [programFilter]);

  // Unique program names present in the data.
  const programOptions = [
    ...new Set(students.map((s) => s.cohort?.program_name).filter(Boolean)),
  ].sort();

  // Cohorts present, narrowed to the selected program if one is chosen.
  const cohortOptions = [
    ...new Map(
      students
        .filter((s) => s.cohort && (programFilter === 'all' || s.cohort.program_name === programFilter))
        .map((s) => [
          `${s.cohort.cohort_number}|${s.cohort.academic_year}`,
          { number: s.cohort.cohort_number, year: s.cohort.academic_year },
        ])
    ).entries(),
  ].sort((a, b) => b[1].number - a[1].number);

  const fetchAllStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;

      // Try to fetch from a students list endpoint
      // We'll need to create this endpoint or use existing ones
      let allStudents = [];

      // First, try to get all cohorts and their students
      const cohortsResponse = await axios.get(`${API_BASE}/api/cohorts/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const cohorts = Array.isArray(cohortsResponse.data)
        ? cohortsResponse.data
        : cohortsResponse.data?.results || [];

      // Fetch students for each cohort
      for (const cohort of cohorts) {
        try {
          const studentsResponse = await axios.get(
            `${API_BASE}/api/cohorts/${cohort.id}/students/`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          if (studentsResponse.data && Array.isArray(studentsResponse.data)) {
            allStudents = allStudents.concat(
              studentsResponse.data.map(student => ({
                ...student,
                cohort: cohort
              }))
            );
          }
        } catch (cohortErr) {
          console.error(`Error fetching students for cohort ${cohort.id}:`, cohortErr);
        }
      }

      // Remove duplicates by username
      const uniqueStudents = allStudents.reduce((acc, student) => {
        if (!acc.find(s => s.username === student.username)) {
          acc.push(student);
        }
        return acc;
      }, []);

      setStudents(uniqueStudents);
      setFilteredStudents(uniqueStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student) => {
    // Open the unified student profile page (courses, grades, compliance).
    navigate(`/students/${student.username}`);
  };

  const getProgramCount = (student) => {
    const certCount = student.enrolled_certificate_programs?.length || 0;
    const diplomaCount = student.enrolled_diploma_programs?.length || 0;
    const assocCount = student.enrolled_associates_programs?.length || 0;
    return certCount + diplomaCount + assocCount;
  };

  const getCoursesCount = (student) => {
    return student.course_enrollment_names?.length ||
           student.course_enrollments?.length ||
           0;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              All Students
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all enrolled students
            </Typography>
          </Box>
          {userInfo?.isAdmin && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setShowAddStudentModal(true)}
            >
              Add Student
            </Button>
          )}
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">Total Students</Typography>
                </Box>
                <Typography variant="h4">{students.length}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group color="info" sx={{ mr: 2 }} />
                  <Typography variant="h6">With Cohorts</Typography>
                </Box>
                <Typography variant="h4">
                  {students.filter(s => s.cohort).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <School color="success" sx={{ mr: 2 }} />
                  <Typography variant="h6">Active Programs</Typography>
                </Box>
                <Typography variant="h4">
                  {students.reduce((sum, s) => sum + getProgramCount(s), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters: Program -> Cohort -> Search */}
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Program</InputLabel>
              <Select
                label="Program"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
              >
                <MenuItem value="all">All programs</MenuItem>
                {programOptions.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Cohort</InputLabel>
              <Select
                label="Cohort"
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
              >
                <MenuItem value="all">All cohorts</MenuItem>
                {cohortOptions.map(([key, c]) => (
                  <MenuItem key={key} value={key}>
                    Cohort {c.number} · {c.year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, username, email, or cohort..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredStudents.length} of {students.length} students
              {programFilter !== 'all' && ` · ${programFilter}`}
            </Typography>
          </Grid>
        </Grid>

        {/* Students Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Cohort</TableCell>
                  <TableCell align="center">Programs</TableCell>
                  <TableCell align="center">Courses</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                        {searchTerm ? 'No students found matching your search' : 'No students found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id || student.username} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {student.first_name?.[0]}{student.last_name?.[0]}
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
                      <TableCell>
                        {student.cohort ? (
                          <Chip
                            label={`${student.cohort.academic_year} - Cohort ${student.cohort.cohort_number}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No cohort
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getProgramCount(student)}
                          size="small"
                          color={getProgramCount(student) > 0 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getCoursesCount(student)}
                          size="small"
                          color={getCoursesCount(student) > 0 ? 'info' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View & Manage Student">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
            fetchAllStudents(); // Refresh the list
          }}
        />
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddStudentModal
          open={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onStudentAdded={() => {
            setShowAddStudentModal(false);
            fetchAllStudents(); // Refresh the list
          }}
        />
      )}
    </Box>
  );
};

export default AllStudents;
