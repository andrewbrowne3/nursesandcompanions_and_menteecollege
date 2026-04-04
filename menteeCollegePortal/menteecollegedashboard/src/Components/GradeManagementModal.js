import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  School,
  Edit,
  Save,
  Close,
  Lock,
  LockOpen,
  CheckCircle,
  Add
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const GradeManagementModal = ({ student, open, onClose, onUpdate }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [enrollments, setEnrollments] = useState([]);
  const [academicProgress, setAcademicProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newGradeData, setNewGradeData] = useState({
    course_id: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    grade: 'A',
    grade_released: true
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'W', 'IP', 'I'];
  const SEMESTER_OPTIONS = ['Fall', 'Spring', 'Summer'];

  useEffect(() => {
    if (open && student) {
      fetchGrades();
      fetchAvailableCourses();
    }
  }, [open, student]);

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(
        `${API_BASE}/api/admin/students/${student.username}/grades/`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setEnrollments(response.data.enrollments || []);
      setAcademicProgress(response.data.academic_progress);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(
        `${API_BASE}/api/admin/resources/`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setAvailableCourses(response.data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleEdit = (enrollment) => {
    setEditingId(enrollment.id);
    setEditData({
      enrollment_id: enrollment.id,
      grade: enrollment.grade,
      semester: enrollment.semester,
      year: enrollment.year,
      grade_released: enrollment.grade_released
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleStartAddNew = () => {
    setIsAddingNew(true);
    setNewGradeData({
      course_id: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      grade: 'A',
      grade_released: true
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewGradeData({
      course_id: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      grade: 'A',
      grade_released: true
    });
  };

  const handleSaveGrade = async () => {
    setSaving(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      await axios.post(
        `${API_BASE}/api/admin/students/${student.username}/update-grade/`,
        editData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Refresh grades
      await fetchGrades();
      setEditingId(null);
      setEditData({});

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving grade:', err);
      setError(err.response?.data?.error || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNewGrade = async () => {
    if (!newGradeData.course_id) {
      setError('Please select a course');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      await axios.post(
        `${API_BASE}/api/admin/students/${student.username}/update-grade/`,
        newGradeData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Refresh grades
      await fetchGrades();
      setIsAddingNew(false);
      setNewGradeData({
        course_id: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        grade: 'A',
        grade_released: true
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving new grade:', err);
      setError(err.response?.data?.error || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade || grade === 'IP') return 'default';
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'info';
    if (grade.startsWith('C')) return 'warning';
    return 'error';
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" />
            <Typography variant="h6">
              Grade Management - {student.first_name} {student.last_name}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Academic Progress Summary */}
        {academicProgress && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Academic Progress
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Cumulative GPA
                </Typography>
                <Typography variant="h6">
                  {academicProgress.gpa.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Credits Earned
                </Typography>
                <Typography variant="h6">
                  {academicProgress.credits_earned}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Credits Attempted
                </Typography>
                <Typography variant="h6">
                  {academicProgress.credits_attempted}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Academic Standing
                </Typography>
                <Chip
                  label={academicProgress.academic_standing}
                  size="small"
                  color={academicProgress.academic_standing === 'Good Standing' ? 'success' : 'warning'}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Add New Grade Button */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Course Grades</Typography>
          {!isAddingNew && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleStartAddNew}
              disabled={loading}
            >
              Add New Grade
            </Button>
          )}
        </Box>

        {/* Grades Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Grade Points</TableCell>
                  <TableCell align="center">Released</TableCell>
                  <TableCell align="center">Survey</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Add New Grade Row */}
                {isAddingNew && (
                  <TableRow sx={{ bgcolor: 'primary.50' }}>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={newGradeData.course_id}
                        onChange={(e) => setNewGradeData({ ...newGradeData, course_id: e.target.value })}
                        placeholder="Select course"
                      >
                        <MenuItem value="">
                          <em>Select a course</em>
                        </MenuItem>
                        {availableCourses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={newGradeData.semester}
                        onChange={(e) => setNewGradeData({ ...newGradeData, semester: e.target.value })}
                        sx={{ minWidth: 100 }}
                      >
                        {SEMESTER_OPTIONS.map((sem) => (
                          <MenuItem key={sem} value={sem}>
                            {sem}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={newGradeData.year}
                        onChange={(e) => setNewGradeData({ ...newGradeData, year: parseInt(e.target.value) })}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={newGradeData.grade}
                        onChange={(e) => setNewGradeData({ ...newGradeData, grade: e.target.value })}
                        sx={{ minWidth: 80 }}
                      >
                        {GRADE_OPTIONS.map((grade) => (
                          <MenuItem key={grade} value={grade}>
                            {grade}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={newGradeData.grade_released}
                            onChange={(e) => setNewGradeData({ ...newGradeData, grade_released: e.target.checked })}
                            size="small"
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={handleSaveNewGrade}
                          disabled={saving}
                        >
                          <Save fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleCancelAddNew}
                          disabled={saving}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {enrollments.length === 0 && !isAddingNew ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No grade records found. Click "Add New Grade" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((enrollment) => {
                    const isEditing = editingId === enrollment.id;

                    return (
                      <TableRow key={enrollment.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {enrollment.course_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              select
                              size="small"
                              value={editData.semester || ''}
                              onChange={(e) => setEditData({ ...editData, semester: e.target.value })}
                              sx={{ minWidth: 100 }}
                            >
                              {SEMESTER_OPTIONS.map((sem) => (
                                <MenuItem key={sem} value={sem}>
                                  {sem}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            enrollment.semester
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              type="number"
                              size="small"
                              value={editData.year || ''}
                              onChange={(e) => setEditData({ ...editData, year: parseInt(e.target.value) })}
                              sx={{ width: 80 }}
                            />
                          ) : (
                            enrollment.year
                          )}
                        </TableCell>
                        <TableCell>{enrollment.credit_hours}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              select
                              size="small"
                              value={editData.grade || ''}
                              onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                              sx={{ minWidth: 80 }}
                            >
                              {GRADE_OPTIONS.map((grade) => (
                                <MenuItem key={grade} value={grade}>
                                  {grade}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <Chip
                              label={enrollment.grade || 'N/A'}
                              size="small"
                              color={getGradeColor(enrollment.grade)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {enrollment.grade_points !== null ? enrollment.grade_points.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          {isEditing ? (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={editData.grade_released}
                                  onChange={(e) => setEditData({ ...editData, grade_released: e.target.checked })}
                                  size="small"
                                />
                              }
                              label=""
                            />
                          ) : (
                            <Tooltip title={enrollment.grade_released ? 'Grade visible to student' : 'Grade locked (requires survey)'}>
                              {enrollment.grade_released ? (
                                <LockOpen color="success" fontSize="small" />
                              ) : (
                                <Lock color="warning" fontSize="small" />
                              )}
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {enrollment.survey_completed ? (
                            <Tooltip title="Survey completed">
                              <CheckCircle color="success" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {isEditing ? (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={handleSaveGrade}
                                disabled={saving}
                              >
                                <Save fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={handleCancelEdit}
                                disabled={saving}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(enrollment)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Help Text */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            <strong>Grade Release:</strong> Toggle the lock icon to require students to complete a survey before viewing their final grade.
            When locked (🔒), students must complete an end-of-semester survey to unlock their grade.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeManagementModal;
