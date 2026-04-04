import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Box, Card, CardContent, 
  Grid, Divider, Chip, CircularProgress, Alert,
  Paper, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  School, ExpandMore, LocalHospital, 
  Science, LocalLibrary, BarChart, MedicalServices, Code
} from '@mui/icons-material';
import '../CourseListView.css';

const CourseListView = () => {
  const [courseCategories, setCourseCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch categorized courses
        const categoryResponse = await axios.get('/api/courses/categories/');
        setCourseCategories(categoryResponse.data);
        
        // Fetch stats
        const statsResponse = await axios.get('/api/courses/stats/');
        setStats(statsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, []);

  // Helper function to get the appropriate icon for a category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'nursing':
        return <LocalHospital />;
      case 'medical':
        return <MedicalServices />;
      case 'tech':
        return <Code />;
      case 'general_education':
        return <LocalLibrary />;
      default:
        return <School />;
    }
  };

  return (
    <Container className="course-list-container">
      <Typography variant="h4" component="h1" className="page-title">
        Courses Catalog
      </Typography>
      <Typography variant="subtitle1" className="page-subtitle">
        Browse all available courses by category
      </Typography>

      {loading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading courses...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" className="error-alert">
          {error}
        </Alert>
      ) : (
        <>
          {/* Stats Section */}
          {stats && (
            <Card className="stats-card">
              <CardContent>
                <Box className="stats-header">
                  <BarChart className="stats-icon" />
                  <Typography variant="h6" component="h2">
                    Course Statistics
                  </Typography>
                </Box>
                <Divider className="stats-divider" />
                <Grid container spacing={3} className="stats-grid">
                  <Grid item xs={12} sm={4}>
                    <Box className="stat-item">
                      <Typography variant="h5" className="stat-value">
                        {stats.total_courses}
                      </Typography>
                      <Typography variant="body2" className="stat-label">
                        Total Courses
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box className="stat-item">
                      <Typography variant="h5" className="stat-value">
                        {stats.certificate_courses}
                      </Typography>
                      <Typography variant="body2" className="stat-label">
                        Certificate Courses
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box className="stat-item">
                      <Typography variant="h5" className="stat-value">
                        {stats.average_credit_hours}
                      </Typography>
                      <Typography variant="body2" className="stat-label">
                        Avg. Credit Hours
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Categories Section */}
          <Box className="categories-container">
            {courseCategories.map((category) => (
              <Accordion key={category.category} className="category-accordion">
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  className="category-header"
                >
                  <Box className="category-title">
                    {getCategoryIcon(category.category)}
                    <Typography variant="h6">
                      {category.display_name}
                    </Typography>
                    <Chip 
                      label={`${category.courses.length} courses`} 
                      size="small" 
                      className="category-count"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails className="category-details">
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Course Name</TableCell>
                          <TableCell>CRN</TableCell>
                          <TableCell align="center">Credit Hours</TableCell>
                          <TableCell align="right">Application Fee</TableCell>
                          <TableCell align="right">Tuition</TableCell>
                          <TableCell align="center">Certificate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {category.courses.map((course) => (
                          <TableRow key={course.id} className="course-row">
                            <TableCell component="th" scope="row">
                              <Typography variant="body2" className="course-name">
                                {course.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {course.CRN}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={course.credit_hours} 
                                size="small" 
                                className="credit-chip"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {course.application_price ? (
                                <Typography variant="body2">
                                  ${parseFloat(course.application_price).toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" className="text-muted">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {course.tuition_price ? (
                                <Typography variant="body2">
                                  ${parseFloat(course.tuition_price).toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" className="text-muted">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={course.is_certificate_course ? "Yes" : "No"} 
                                size="small" 
                                color={course.is_certificate_course ? "success" : "default"}
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </>
      )}
    </Container>
  );
};

export default CourseListView; 