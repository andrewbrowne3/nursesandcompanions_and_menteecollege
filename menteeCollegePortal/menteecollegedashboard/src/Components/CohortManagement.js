import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
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
  InputAdornment
} from '@mui/material';
import {
  School,
  Group,
  CalendarToday,
  Search,
  FilterList,
  Visibility,
  Download,
  Email,
  TrendingUp,
  AttachMoney
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import CohortDetail from './CohortDetail';

const CohortManagement = () => {
  const navigate = useNavigate();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // State management
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [programTypeFilter, setProgramTypeFilter] = useState('all');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Stats state
  const [stats, setStats] = useState({
    totalCohorts: 0,
    totalStudents: 0,
    activePrograms: 0,
    averageClassSize: 0
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Fetch cohorts data
  const fetchCohorts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/cohorts/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Ensure we always have an array
      const cohortsArray = Array.isArray(response.data) 
        ? response.data 
        : response.data?.results || response.data?.data || [];
      
      setCohorts(cohortsArray);
      calculateStats(cohortsArray);
    } catch (err) {
      console.error('Error fetching cohorts:', err);
      setError('Failed to load cohorts data');
      // Set empty array as fallback
      setCohorts([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = (cohortsData) => {
    // Ensure cohortsData is an array
    const cohortArray = Array.isArray(cohortsData) ? cohortsData : [];
    
    const totalStudents = cohortArray.reduce((sum, cohort) => 
      sum + (cohort.student_count || 0), 0
    );
    const activeCohorts = cohortArray.filter(c => c.is_active);
    
    setStats({
      totalCohorts: cohortArray.length,
      totalStudents: totalStudents,
      activePrograms: activeCohorts.length,
      averageClassSize: cohortArray.length > 0 ? 
        Math.round(totalStudents / cohortArray.length) : 0
    });
  };

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      fetchCohorts();
    } else if (userInfo) {
      navigate('/Dashboard');
    }
  }, [userInfo]);

  // Filter cohorts based on search and filters
  const filteredCohorts = Array.isArray(cohorts) ? cohorts.filter(cohort => {
    const matchesSearch = searchTerm === '' || 
      cohort.cohort_number?.toString().includes(searchTerm) ||
      cohort.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cohort.academic_year?.includes(searchTerm);
    
    const matchesProgramType = programTypeFilter === 'all' || 
      cohort.program_type === programTypeFilter;
    
    const matchesAcademicYear = academicYearFilter === 'all' || 
      cohort.academic_year === academicYearFilter;
    
    const matchesActive = activeFilter === 'all' || 
      (activeFilter === 'active' && cohort.is_active) ||
      (activeFilter === 'inactive' && !cohort.is_active);
    
    return matchesSearch && matchesProgramType && matchesAcademicYear && matchesActive;
  }) : [];

  // Get unique academic years for filter
  const academicYears = Array.isArray(cohorts) ? 
    [...new Set(cohorts.map(c => c.academic_year))].filter(Boolean) : [];

  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort);
    setShowDetail(true);
  };

  const handleExportCohorts = () => {
    // Convert cohorts to CSV
    const headers = ['Academic Year', 'Cohort Number', 'Program Type', 'Program Name', 'Student Count', 'Active', 'Start Date', 'End Date'];
    const csvContent = [
      headers.join(','),
      ...filteredCohorts.map(cohort => [
        cohort.academic_year,
        cohort.cohort_number,
        cohort.program_type,
        cohort.program_name,
        cohort.student_count,
        cohort.is_active ? 'Yes' : 'No',
        cohort.start_date || '',
        cohort.end_date || ''
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohorts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getProgramTypeColor = (type) => {
    switch(type) {
      case 'certificate': return 'primary';
      case 'diploma': return 'secondary';
      case 'associates': return 'info';
      default: return 'default';
    }
  };

  if (showDetail && selectedCohort) {
    return (
      <CohortDetail 
        cohort={selectedCohort} 
        onBack={() => {
          setShowDetail(false);
          setSelectedCohort(null);
        }}
      />
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Cohort Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage student cohorts, view enrollment details, and track program progress
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <School color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">Total Cohorts</Typography>
                </Box>
                <Typography variant="h4">{stats.totalCohorts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group color="info" sx={{ mr: 2 }} />
                  <Typography variant="h6">Total Students</Typography>
                </Box>
                <Typography variant="h4">{stats.totalStudents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp color="success" sx={{ mr: 2 }} />
                  <Typography variant="h6">Active Programs</Typography>
                </Box>
                <Typography variant="h4">{stats.activePrograms}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday color="warning" sx={{ mr: 2 }} />
                  <Typography variant="h6">Avg. Class Size</Typography>
                </Box>
                <Typography variant="h4">{stats.averageClassSize}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search cohorts..."
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
              
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Program Type"
                  value={programTypeFilter}
                  onChange={(e) => setProgramTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="certificate">Certificate</MenuItem>
                  <MenuItem value="diploma">Diploma</MenuItem>
                  <MenuItem value="associates">Associates</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Academic Year"
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {academicYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => {
                      setSearchTerm('');
                      setProgramTypeFilter('all');
                      setAcademicYearFilter('all');
                      setActiveFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleExportCohorts}
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Cohorts Table */}
        <Card>
          <CardContent>
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
                      <TableCell>Academic Year</TableCell>
                      <TableCell>Cohort #</TableCell>
                      <TableCell>Program Type</TableCell>
                      <TableCell>Program Name</TableCell>
                      <TableCell align="center">Students</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCohorts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                            No cohorts found matching your criteria
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCohorts.map((cohort) => (
                        <TableRow key={cohort.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {cohort.academic_year}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cohort.cohort_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={cohort.program_type} 
                              size="small" 
                              color={getProgramTypeColor(cohort.program_type)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cohort.program_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <Group fontSize="small" color="action" />
                              <Typography variant="body2">
                                {cohort.student_count || 0}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cohort.start_date ? 
                                new Date(cohort.start_date).toLocaleDateString() : 
                                'Not set'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={cohort.is_active ? 'Active' : 'Inactive'} 
                              size="small" 
                              color={cohort.is_active ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton 
                                color="primary" 
                                onClick={() => handleViewDetails(cohort)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Email Students">
                              <IconButton color="info">
                                <Email />
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
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CohortManagement;