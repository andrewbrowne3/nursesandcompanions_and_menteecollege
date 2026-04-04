import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  School,
  Close,
  Save,
  ExpandMore,
  CheckCircle,
  CardMembership,
  EmojiEvents,
  WorkspacePremium
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const ProgramEnrollmentModal = ({ student, open, onClose, onUpdate }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // State management
  const [programs, setPrograms] = useState({
    certificate_programs: [],
    diploma_programs: [],
    associates_programs: []
  });
  const [selectedPrograms, setSelectedPrograms] = useState({
    certificate_programs: [],
    diploma_programs: [],
    associates_programs: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  // Fetch available programs and student's current enrollments
  useEffect(() => {
    if (open && student) {
      fetchPrograms();
    }
  }, [open, student]);

  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;

      // Fetch all available programs
      const resourcesResponse = await axios.get(`${API_BASE}/api/admin/resources/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setPrograms(resourcesResponse.data.programs || {
        certificate_programs: [],
        diploma_programs: [],
        associates_programs: []
      });

      // Get student's current program enrollments
      const studentResponse = await axios.get(`${API_BASE}/api/students/${student.username}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const paymentDetails = studentResponse.data.payment_details || {};

      // Extract enrolled program IDs from payment details
      const enrolledCert = (paymentDetails.certificate_courses || []).map(p => p.program_id);
      const enrolledDip = (paymentDetails.diploma_programs || []).map(p => p.program_id);
      const enrolledAssoc = (paymentDetails.associate_programs || []).map(p => p.program_id);

      setSelectedPrograms({
        certificate_programs: enrolledCert,
        diploma_programs: enrolledDip,
        associates_programs: enrolledAssoc
      });

    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProgram = (programType, programId) => {
    setSelectedPrograms(prev => {
      const currentList = prev[programType] || [];
      const newList = currentList.includes(programId)
        ? currentList.filter(id => id !== programId)
        : [...currentList, programId];

      return {
        ...prev,
        [programType]: newList
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;

      await axios.post(
        `${API_BASE}/api/admin/students/${student.username}/manage-programs/`,
        selectedPrograms,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Call onUpdate callback to refresh student data
      if (onUpdate) {
        onUpdate();
      }

      onClose();
    } catch (err) {
      console.error('Error saving programs:', err);
      setError(err.response?.data?.error || 'Failed to save program enrollments');
    } finally {
      setSaving(false);
    }
  };

  const getTotalEnrolled = () => {
    return (
      (selectedPrograms.certificate_programs?.length || 0) +
      (selectedPrograms.diploma_programs?.length || 0) +
      (selectedPrograms.associates_programs?.length || 0)
    );
  };

  const renderProgramSection = (title, programType, icon, color) => {
    const programList = programs[programType] || [];
    const selectedList = selectedPrograms[programType] || [];

    return (
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              {icon}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            </Box>
            <Chip
              label={`${selectedList.length} selected`}
              size="small"
              color={selectedList.length > 0 ? color : 'default'}
              variant="outlined"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {programList.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
              No {title.toLowerCase()} available
            </Typography>
          ) : (
            <List dense>
              {programList.map((program) => (
                <ListItem key={program.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleToggleProgram(programType, program.id)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedList.includes(program.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={program.name}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

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
              Manage Program Enrollments - {student.first_name} {student.last_name}
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

        {/* Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="primary" />
            <Typography variant="subtitle2" color="primary">
              {getTotalEnrolled()} program{getTotalEnrolled() !== 1 ? 's' : ''} enrolled
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Certificate Programs */}
            {renderProgramSection(
              'Certificate Programs',
              'certificate_programs',
              <CardMembership color="primary" />,
              'primary'
            )}

            {/* Diploma Programs */}
            {renderProgramSection(
              'Diploma Programs',
              'diploma_programs',
              <EmojiEvents color="secondary" />,
              'secondary'
            )}

            {/* Associates Programs */}
            {renderProgramSection(
              'Associates Programs',
              'associates_programs',
              <WorkspacePremium color="info" />,
              'info'
            )}
          </Box>
        )}

        {getTotalEnrolled() > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Alert severity="info" icon={<School />}>
              <Typography variant="body2">
                Changes will update the student's program enrollments and may affect payment schedules.
              </Typography>
            </Alert>
          </>
        )}
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

export default ProgramEnrollmentModal;
