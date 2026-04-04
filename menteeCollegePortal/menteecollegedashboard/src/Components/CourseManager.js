import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, IconButton, Box,
  FormControl, InputLabel, Select, MenuItem, Grid, Snackbar, Alert,
  Switch, FormControlLabel, Chip
} from '@mui/material';
import {
  Add, Edit, Delete, Refresh, Search, Clear
} from '@mui/icons-material';
import '../CourseManager.css';

const CourseManager = () => {
  // State variables
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    name: '',
    CRN: '',
    credit_hours: 1,
    application_price: '',
    tuition_price: '',
    is_certificate_course: true
  });
  const [editMode, setEditMode] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filterName, setFilterName] = useState('');
  const [filterCertificate, setFilterCertificate] = useState('');

  // Course options based on the model choices
  const courseOptions = [
    "Nursing Assistant", "EKG Technician", "Phlebotomy", "Ultrasound Program", 
    "MA", "MA(associates)", "Patient Care Technician", "Algebra", "Ultrasound", 
    "Nurse Ethics", "Physics", "Biology", "English", 
    "Medical Terminology for Allied Health Sciences", "Nurse Ethics"
  ];

  // Fetch courses from the API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Construct the filter params
      let url = '/api/courses/';
      const params = new URLSearchParams();
      
      if (filterName) {
        params.append('name', filterName);
      }
      
      if (filterCertificate !== '') {
        params.append('is_certificate', filterCertificate);
      }
      
      // Add params to URL if any exist
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setCourses(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch courses. Please try again later.');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Handlers
  const handleOpenDialog = (course = null) => {
    if (course) {
      setCurrentCourse({
        ...course,
        application_price: course.application_price || '',
        tuition_price: course.tuition_price || ''
      });
      setEditMode(true);
    } else {
      setCurrentCourse({
        name: '',
        CRN: '',
        credit_hours: 1,
        application_price: '',
        tuition_price: '',
        is_certificate_course: true
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse({
      ...currentCourse,
      [name]: value
    });
  };

  const handleSwitchChange = (e) => {
    setCurrentCourse({
      ...currentCourse,
      is_certificate_course: e.target.checked
    });
  };

  const handleSubmit = async () => {
    try {
      // Prepare the data with proper number types
      const courseData = {
        ...currentCourse,
        credit_hours: parseInt(currentCourse.credit_hours),
        application_price: currentCourse.application_price ? parseFloat(currentCourse.application_price) : null,
        tuition_price: currentCourse.tuition_price ? parseFloat(currentCourse.tuition_price) : null
      };

      if (editMode) {
        // Update existing course
        await axios.put(`/api/courses/${currentCourse.id}/update/`, courseData);
        setSnackbar({
          open: true,
          message: 'Course updated successfully',
          severity: 'success'
        });
      } else {
        // Create new course
        await axios.post('/api/courses/create/', courseData);
        setSnackbar({
          open: true,
          message: 'Course created successfully',
          severity: 'success'
        });
      }
      
      // Close dialog and refresh the list
      setOpenDialog(false);
      fetchCourses();
    } catch (err) {
      console.error('Error saving course:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.error || 'Something went wrong'}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setConfirmDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`/api/courses/${courseToDelete.id}/delete/`);
      setSnackbar({
        open: true,
        message: 'Course deleted successfully',
        severity: 'success'
      });
      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.error || 'Failed to delete course'}`,
        severity: 'error'
      });
    } finally {
      setConfirmDeleteDialog(false);
      setCourseToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClearFilters = () => {
    setFilterName('');
    setFilterCertificate('');
    fetchCourses();
  };

  return (
    <Container className="course-manager-container">
      <Typography variant="h4" className="section-title">
        Course Management
      </Typography>
      <Typography variant="subtitle1" className="section-description">
        Add, edit, and manage courses in the system
      </Typography>

      {/* Filters */}
      <Paper className="filter-paper">
        <Box className="filter-container">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search by Course Name"
                variant="outlined"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={() => setFilterName('')}>
                      {filterName && <Clear />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Certificate Course</InputLabel>
                <Select
                  value={filterCertificate}
                  onChange={(e) => setFilterCertificate(e.target.value)}
                  label="Certificate Course"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Search />}
                onClick={fetchCourses}
                fullWidth
              >
                Filter
              </Button>
            </Grid>
            <Grid item xs={6} sm={2}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Action buttons */}
      <Box className="action-buttons">
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add New Course
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchCourses}
        >
          Refresh List
        </Button>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" className="error-alert">
          {error}
        </Alert>
      )}

      {/* Courses table */}
      <TableContainer component={Paper} className="table-container">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Name</TableCell>
              <TableCell>CRN</TableCell>
              <TableCell>Credit Hours</TableCell>
              <TableCell>Application Price</TableCell>
              <TableCell>Tuition Price</TableCell>
              <TableCell>Certificate Course</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No courses found
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.CRN}</TableCell>
                  <TableCell>{course.credit_hours}</TableCell>
                  <TableCell>
                    {course.application_price !== null
                      ? `$${parseFloat(course.application_price).toFixed(2)}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {course.tuition_price !== null
                      ? `$${parseFloat(course.tuition_price).toFixed(2)}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={course.is_certificate_course ? 'Yes' : 'No'}
                      color={course.is_certificate_course ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenDialog(course)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(course)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Course Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Course' : 'Add New Course'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Course Name</InputLabel>
                <Select
                  name="name"
                  value={currentCourse.name}
                  onChange={handleInputChange}
                  label="Course Name"
                  required
                >
                  {courseOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="CRN"
                label="CRN"
                variant="outlined"
                value={currentCourse.CRN}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                margin="normal"
                name="credit_hours"
                label="Credit Hours"
                type="number"
                variant="outlined"
                value={currentCourse.credit_hours}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                margin="normal"
                name="application_price"
                label="Application Price"
                type="number"
                variant="outlined"
                value={currentCourse.application_price}
                onChange={handleInputChange}
                inputProps={{ step: "0.01", min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                margin="normal"
                name="tuition_price"
                label="Tuition Price"
                type="number"
                variant="outlined"
                value={currentCourse.tuition_price}
                onChange={handleInputChange}
                inputProps={{ step: "0.01", min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentCourse.is_certificate_course}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Is Certificate Course"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editMode ? 'Update' : 'Add'} Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialog} onClose={() => setConfirmDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the course "{courseToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseManager; 