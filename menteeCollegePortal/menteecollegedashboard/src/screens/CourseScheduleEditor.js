import React, { useState } from 'react';
import {
  Container, Box, Typography, Card, Grid, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, Snackbar, Alert, Chip, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, ArrowBack, Schedule, EventAvailable, 
  School, Room, Person, Save, CalendarToday
} from '@mui/icons-material';
import './CourseScheduleEditor.css';
import Header from '../Components/Header';

const CourseScheduleEditor = () => {
  // Sample course data - in a real app this would come from an API
  const initialCourses = [
    {
      id: 1,
      code: 'NUR101',
      name: 'Introduction to Nursing',
      credits: 3,
      days: 'Mon, Wed',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      room: 'Health Sciences 301',
      instructor: 'Dr. Sarah Johnson',
      status: 'Registered'
    },
    {
      id: 2,
      code: 'NUR102',
      name: 'Anatomy & Physiology',
      credits: 4,
      days: 'Tue, Thu',
      startTime: '11:00 AM',
      endTime: '01:00 PM',
      room: 'Health Sciences 205',
      instructor: 'Dr. Michael Chen',
      status: 'Registered'
    },
    {
      id: 3,
      code: 'NUR103',
      name: 'Fundamentals of Nursing Practice',
      credits: 4,
      days: 'Wed, Fri',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      room: 'Nursing Lab 102',
      instructor: 'Prof. Emily Rodriguez',
      status: 'Registered'
    }
  ];

  // State variables
  const [courses, setCourses] = useState(initialCourses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeOptions = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM'
  ];

  // Handlers
  const handleAddCourse = () => {
    setCurrentCourse({
      id: courses.length + 1,
      code: '',
      name: '',
      credits: 3,
      days: '',
      startTime: '',
      endTime: '',
      room: '',
      instructor: '',
      status: 'Pending'
    });
    setEditMode(false);
    setDialogOpen(true);
  };

  const handleEditCourse = (course) => {
    setCurrentCourse({...course});
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(courses.filter(course => course.id !== courseId));
    setSnackbar({
      open: true,
      message: 'Course deleted successfully',
      severity: 'success'
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentCourse(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse({
      ...currentCourse,
      [name]: value
    });
  };

  const handleSaveCourse = () => {
    if (editMode) {
      setCourses(courses.map(course => 
        course.id === currentCourse.id ? currentCourse : course
      ));
      setSnackbar({
        open: true,
        message: 'Course updated successfully',
        severity: 'success'
      });
    } else {
      setCourses([...courses, currentCourse]);
      setSnackbar({
        open: true,
        message: 'Course added successfully',
        severity: 'success'
      });
    }
    setDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  // Get current semester and year
  const getCurrentSemester = () => {
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 1 && currentMonth <= 5) {
        return 'Spring';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
        return 'Summer';
    } else {
        return 'Fall';
    }
  };
  
  const currentSemester = getCurrentSemester();
  const currentYear = new Date().getFullYear();

  // Calculate total credit hours
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <div className="course-schedule-page">
      <Header />
      <Container maxWidth="lg" className="course-schedule-container">
        <Box className="page-header">
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            href="/Dashboard" 
            className="back-button"
          >
            Back to Dashboard
          </Button>
          <Box className="header-title">
            <School className="header-icon" />
            <Typography variant="h4" component="h1">
              Course Schedule Editor
            </Typography>
          </Box>
          <Chip 
            icon={<CalendarToday />}
            label={`${currentSemester} ${currentYear}`}
            color="primary"
            className="semester-chip"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card className="summary-card">
              <Box className="summary-header">
                <Typography variant="h6">Schedule Summary</Typography>
              </Box>
              <Box className="summary-content">
                <Box className="summary-item">
                  <EventAvailable className="summary-icon" />
                  <Typography variant="body1">
                    <strong>Registered Courses:</strong> {courses.length}
                  </Typography>
                </Box>
                <Box className="summary-item">
                  <School className="summary-icon" />
                  <Typography variant="body1">
                    <strong>Total Credit Hours:</strong> {totalCredits}
                  </Typography>
                </Box>
                <Box className="summary-item">
                  <Schedule className="summary-icon" />
                  <Typography variant="body1">
                    <strong>Status:</strong> Active
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card className="schedule-card">
              <Box className="schedule-header">
                <Typography variant="h6">Course Schedule</Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<Add />}
                  onClick={handleAddCourse}
                  className="add-course-btn"
                >
                  Add Course
                </Button>
              </Box>
              <Divider />
              <TableContainer component={Paper} className="schedule-table-container">
                <Table className="schedule-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Code</TableCell>
                      <TableCell>Course Name</TableCell>
                      <TableCell>Credits</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Instructor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell><strong>{course.code}</strong></TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.credits}</TableCell>
                        <TableCell>
                          <Box className="schedule-cell">
                            <Schedule fontSize="small" className="cell-icon" />
                            <span>{course.days}</span>
                            <span className="time-range">{course.startTime} - {course.endTime}</span>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box className="location-cell">
                            <Room fontSize="small" className="cell-icon" />
                            {course.room}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box className="instructor-cell">
                            <Person fontSize="small" className="cell-icon" />
                            {course.instructor}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={course.status} 
                            color={course.status === 'Registered' ? 'success' : 'primary'}
                            size="small"
                            className="status-chip"
                          />
                        </TableCell>
                        <TableCell>
                          <Box className="action-cell">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleEditCourse(course)}
                              className="edit-btn"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="delete-btn"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box className="schedule-footer">
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<Save />}
                  className="save-schedule-btn"
                  onClick={() => setSnackbar({
                    open: true,
                    message: 'Schedule saved successfully',
                    severity: 'success'
                  })}
                >
                  Save Schedule
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Add/Edit Course Dialog */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="md">
          <DialogTitle>{editMode ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  autoFocus
                  margin="dense"
                  name="code"
                  label="Course Code"
                  fullWidth
                  variant="outlined"
                  value={currentCourse?.code || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  name="credits"
                  label="Credit Hours"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={currentCourse?.credits || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  name="name"
                  label="Course Name"
                  fullWidth
                  variant="outlined"
                  value={currentCourse?.name || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  name="days"
                  label="Days"
                  select
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => selected.join(', ')
                  }}
                  fullWidth
                  variant="outlined"
                  value={currentCourse?.days?.split(', ') || []}
                  onChange={(e) => setCurrentCourse({
                    ...currentCourse,
                    days: e.target.value.join(', ')
                  })}
                >
                  {dayOptions.map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" margin="dense">
                  <InputLabel>Start Time</InputLabel>
                  <Select
                    name="startTime"
                    value={currentCourse?.startTime || ''}
                    onChange={handleInputChange}
                    label="Start Time"
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={`start-${time}`} value={time}>{time}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" margin="dense">
                  <InputLabel>End Time</InputLabel>
                  <Select
                    name="endTime"
                    value={currentCourse?.endTime || ''}
                    onChange={handleInputChange}
                    label="End Time"
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={`end-${time}`} value={time}>{time}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  name="room"
                  label="Room"
                  fullWidth
                  variant="outlined"
                  value={currentCourse?.room || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="dense"
                  name="instructor"
                  label="Instructor"
                  fullWidth
                  variant="outlined"
                  value={currentCourse?.instructor || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" margin="dense">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={currentCourse?.status || 'Pending'}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="Registered">Registered</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Waitlisted">Waitlisted</MenuItem>
                    <MenuItem value="Dropped">Dropped</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSaveCourse} color="primary" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Success/Error Notification */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default CourseScheduleEditor; 