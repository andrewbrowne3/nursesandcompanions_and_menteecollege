import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  MenuItem
} from '@mui/material';
import {
  Search,
  School,
  Close,
  Save,
  CheckCircle
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const CourseAssignmentModal = ({ student, open, onClose, onUpdate }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // State management
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Fetch all available courses and student's current courses
  useEffect(() => {
    if (open && student) {
      fetchCourses();
    }
  }, [open, student]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;

      // Fetch all available courses
      const coursesResponse = await axios.get(`${API_BASE}/api/courses/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setAllCourses(coursesResponse.data || []);

      // Get student's currently assigned courses
      const studentResponse = await axios.get(`${API_BASE}/api/students/${student.username}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const enrolledCourseNames = studentResponse.data.course_enrollment_names || [];

      // Find IDs of currently enrolled courses
      const enrolledIds = (coursesResponse.data || [])
        .filter(course => enrolledCourseNames.includes(course.name))
        .map(course => course.id);

      setSelectedCourseIds(enrolledIds);

    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = (courseId) => {
    setSelectedCourseIds(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredIds = getFilteredCourses().map(c => c.id);
    setSelectedCourseIds(filteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedCourseIds([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;

      await axios.post(
        `${API_BASE}/api/admin/students/${student.username}/assign-courses/`,
        { course_ids: selectedCourseIds },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Call onUpdate callback to refresh student data
      if (onUpdate) {
        onUpdate();
      }

      onClose();
    } catch (err) {
      console.error('Error saving courses:', err);
      setError(err.response?.data?.error || 'Failed to save course assignments');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredCourses = () => {
    let filtered = allCourses;

    // Filter by type
    if (filter === 'certificate') {
      filtered = filtered.filter(c => c.is_certificate_course);
    } else if (filter === 'program') {
      filtered = filtered.filter(c => !c.is_certificate_course);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getTotalCredits = () => {
    return allCourses
      .filter(course => selectedCourseIds.includes(course.id))
      .reduce((sum, course) => sum + (course.credit_hours || 0), 0);
  };

  const filteredCourses = getFilteredCourses();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" />
            <Typography variant="h6">
              Manage Courses - {student.first_name} {student.last_name}
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            size="small"
            startIcon={<Close />}
          >
            Cancel
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search and Filter */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <TextField
            select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="all">All Courses</MenuItem>
            <MenuItem value="certificate">Certificate Only</MenuItem>
            <MenuItem value="program">Program Only</MenuItem>
          </TextField>
        </Box>

        {/* Bulk Actions */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              disabled={loading}
            >
              Select All ({filteredCourses.length})
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
              disabled={loading}
            >
              Deselect All
            </Button>
          </Box>
          <Chip
            icon={<CheckCircle />}
            label={`${selectedCourseIds.length} courses selected`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Course List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredCourses.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                No courses found
              </Typography>
            ) : (
              filteredCourses.map((course) => (
                <ListItem key={course.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleToggleCourse(course.id)}
                    dense
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedCourseIds.includes(course.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {course.name}
                          </Typography>
                          {course.is_certificate_course && (
                            <Chip label="Certificate" size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={`${course.credit_hours || 0} credit${course.credit_hours !== 1 ? 's' : ''}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Total Credits */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total Credits:
          </Typography>
          <Chip
            label={`${getTotalCredits()} credits`}
            color="primary"
            size="small"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseAssignmentModal;
