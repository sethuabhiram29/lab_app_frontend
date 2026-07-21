import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../api';

const TestSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [agents, setAgents] = useState([]);
  const [tests, setTests] = useState([]);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [testFormData, setTestFormData] = useState({
    name: '',
    code: '',
    description: '',
    image: '',
    subtests: [],
    packs: [],
    requiresSeparatePage: false,
    hasGenderSpecificRanges: false,
    maleReference: '',
    femaleReference: ''
  });

  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    specialization: '',
    contact: '',
    email: ''
  });

  const [agentFormData, setAgentFormData] = useState({
    name: '',
    contactNumber: '',
    email: '',
    address: '',
    commission: 0
  });

  const [subTests, setSubTests] = useState([]);
  const [subTestDialogOpen, setSubTestDialogOpen] = useState(false);
  const [selectedSubTest, setSelectedSubTest] = useState(null);
  const [subTestFormData, setSubTestFormData] = useState({ 
    name: '', 
    unit: '', 
    range: '', 
    maleReference: '',
    femaleReference: '',
    hasGenderSpecificRanges: false,
    result: '', 
    image: '' 
  });

  useEffect(() => {
    fetchData();
    fetchSubTests();
  }, []);

  const fetchData = async () => {
    try {
      const [doctorsData, agentsData, testsData] = await Promise.all([
        api.getDoctors(),
        api.getAgents(),
        api.getTests()
      ]);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : (doctorsData.data || []));
      setAgents(Array.isArray(agentsData) ? agentsData : (agentsData.data || []));
      setTests(Array.isArray(testsData) ? testsData : (testsData.data || []));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    }
  };

  const fetchSubTests = async () => {
    try {
      const res = await api.getSubTests();
      setSubTests(res.data || []);
    } catch (err) {
      setError('Failed to fetch subtests');
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
  };

  // Doctor handlers
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!doctorFormData.name) {
      setError('Doctor name is required');
      return;
    }
    try {
      if (selectedDoctor) {
        const response = await api.updateDoctor(selectedDoctor._id, doctorFormData);
        setDoctors(doctors.map(doc => doc._id === selectedDoctor._id ? response.data : doc));
        setSuccess('Doctor updated successfully');
      } else {
        const response = await api.createDoctor(doctorFormData);
        setDoctors([...doctors, response.data]);
        setSuccess('Doctor added successfully');
      }
      setDoctorDialogOpen(false);
      setDoctorFormData({ name: '', specialization: '', contact: '', email: '' });
      setSelectedDoctor(null);
    } catch (err) {
      console.error('Error saving doctor:', err);
      setError(err.response?.data?.message || 'Failed to save doctor');
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    try {
      await api.deleteDoctor(doctorId);
      setDoctors(doctors.filter(doc => doc._id !== doctorId));
      setSuccess('Doctor deleted successfully');
    } catch (err) {
      console.error('Error deleting doctor:', err);
      setError('Failed to delete doctor');
    }
  };

  // Agent handlers
  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    if (!agentFormData.name) {
      setError('Agent name is required');
      return;
    }
    try {
      if (selectedAgent) {
        const response = await api.updateAgent(selectedAgent._id, agentFormData);
        setAgents(agents.map(agent => agent._id === selectedAgent._id ? response.data : agent));
        setSuccess('Agent updated successfully');
      } else {
        const response = await api.createAgent(agentFormData);
        setAgents([...agents, response.data]);
        setSuccess('Agent added successfully');
      }
      setAgentDialogOpen(false);
      setAgentFormData({ name: '', contactNumber: '', email: '', address: '', commission: 0 });
      setSelectedAgent(null);
    } catch (err) {
      console.error('Error saving agent:', err);
      setError(err.response?.data?.message || 'Failed to save agent');
    }
  };

  const handleDeleteAgent = async (agentId) => {
    try {
      await api.deleteAgent(agentId);
      setAgents(agents.filter(agent => agent._id !== agentId));
      setSuccess('Agent deleted successfully');
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('Failed to delete agent');
    }
  };

  // Test handlers
  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!testFormData.name.trim()) {
        setError('Test name is required');
        return;
      }
      if (!testFormData.code.trim()) {
        setError('Test code is required');
        return;
      }
      if (testFormData.subtests.length === 0 && testFormData.packs.length === 0) {
        setError('At least one subtest or pack is required');
        return;
      }
      
      // Validate pack subtests
      for (const pack of testFormData.packs) {
        if (pack.subtests.length === 0) {
          setError('All pack subtests are required');
          return;
        }
        for (const sub of pack.subtests) {
          if (!sub.name.trim()) {
            setError('Subtest name is required');
            return;
          }
        }
      }

      // Ensure all boolean values are properly set
      const testData = {
        name: testFormData.name.trim(),
        code: testFormData.code.trim(),
        description: testFormData.description.trim(),
        image: testFormData.image,
        requiresSeparatePage: Boolean(testFormData.requiresSeparatePage),
        subtests: testFormData.subtests.map(sub => {
          const subTest = {
            name: sub.name.trim(),
            unit: sub.unit.trim() || '',
            hasGenderSpecificRanges: sub.hasGenderSpecificRanges || false,
            formula: sub.formula ? sub.formula.trim() : '',
            result: sub.result.trim() || '',
            image: sub.image || '',
            _id: sub._id || undefined
          };

          if (sub.hasGenderSpecificRanges) {
            subTest.maleReference = sub.maleReference?.trim() || '';
            subTest.femaleReference = sub.femaleReference?.trim() || '';
            subTest.reference = `M: ${sub.maleReference || 'N/A'}, F: ${sub.femaleReference || 'N/A'}`;
          } else {
            subTest.reference = sub.reference?.trim() || '';
            subTest.maleReference = '';
            subTest.femaleReference = '';
          }

          return subTest;
        }),
        packs: testFormData.packs.map(pack => ({
          _id: pack._id && !pack._id.startsWith('temp_') ? pack._id : undefined,
          name: pack.name.trim(),
          image: pack.image,
          requiresSeparatePage: Boolean(pack.requiresSeparatePage),
          subtests: pack.subtests.map(sub => {
            const subTest = {
              name: sub.name.trim(),
              unit: sub.unit.trim() || '',
              hasGenderSpecificRanges: sub.hasGenderSpecificRanges || false,
              formula: sub.formula ? sub.formula.trim() : '',
              result: sub.result.trim() || '',
              image: sub.image || '',
              _id: sub._id && !sub._id.startsWith('temp_') ? sub._id : undefined
            };

            if (sub.hasGenderSpecificRanges) {
              subTest.maleReference = sub.maleReference?.trim() || '';
              subTest.femaleReference = sub.femaleReference?.trim() || '';
              subTest.reference = `M: ${sub.maleReference || 'N/A'}, F: ${sub.femaleReference || 'N/A'}`;
            } else {
              subTest.reference = sub.reference?.trim() || '';
              subTest.maleReference = '';
              subTest.femaleReference = '';
            }

            return subTest;
          })
        }))
      };

      if (selectedTest) {
        const response = await api.updateTest(selectedTest._id, testData);
        setTests(tests.map(test => test._id === selectedTest._id ? response.data : test));
        setSuccess('Test updated successfully');
      } else {
        const response = await api.createTest(testData);
        setTests([...tests, response.data]);
        setSuccess('Test added successfully');
      }
      
      // Reset form
      setTestDialogOpen(false);
      setTestFormData({
        name: '',
        code: '',
        description: '',
        image: '',
        subtests: [],
        packs: [],
        requiresSeparatePage: false,
        hasGenderSpecificRanges: false,
        maleReference: '',
        femaleReference: ''
      });
      setSelectedTest(null);
    } catch (err) {
      console.error('Error saving test:', err);
      if (err.response) {
        console.error('Backend error response:', err.response.data);
        setError(err.response.data.message || (err.response.data.errors && err.response.data.errors[0]?.msg) || 'Failed to save test');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to save test');
      }
    }
  };

  const handleDeleteTest = async (testId) => {
    try {
      await api.deleteTest(testId);
      setTests(tests.filter(test => test._id !== testId));
      setSuccess('Test deleted successfully');
    } catch (err) {
      console.error('Error deleting test:', err);
      setError('Failed to delete test');
    }
  };

  // SubTest handlers
  const handleSubTestSubmit = async (e) => {
    e.preventDefault();
    if (!subTestFormData.name.trim()) {
      setError('Subtest name is required');
      return;
    }
    try {
      if (selectedSubTest) {
        const res = await api.updateSubTest(selectedSubTest._id, subTestFormData);
        setSubTests(subTests.map(st => st._id === selectedSubTest._id ? res.data : st));
        setSuccess('SubTest updated successfully');
      } else {
        const res = await api.createSubTest(subTestFormData);
        setSubTests([...subTests, res.data]);
        setSuccess('SubTest added successfully');
      }
      setSubTestDialogOpen(false);
      setSubTestFormData({ name: '', unit: '', range: '', result: '', image: '' });
      setSelectedSubTest(null);
    } catch (err) {
      setError('Failed to save subtest');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Doctors" />
            <Tab label="Agents" />
            <Tab label="Tests" />
          </Tabs>
        </Box>

        {/* Doctors Tab */}
        {activeTab === 0 && (
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDoctor(null);
                setDoctorFormData({ name: '', specialization: '', contact: '', email: '' });
                setDoctorDialogOpen(true);
              }}
              sx={{ mb: 2 }}
            >
              Add Doctor
            </Button>
            <List>
              {doctors.map((doctor) => (
                <ListItem
                  key={doctor._id}
                  divider
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setDoctorFormData({
                            name: doctor.name,
                            specialization: doctor.specialization,
                            contact: doctor.contact,
                            email: doctor.email
                          });
                          setDoctorDialogOpen(true);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteDoctor(doctor._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={doctor.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {doctor.specialization}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Contact: {doctor.contact}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Email: {doctor.email}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Agents Tab */}
        {activeTab === 1 && (
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedAgent(null);
                setAgentFormData({ name: '', contactNumber: '', email: '', address: '', commission: 0 });
                setAgentDialogOpen(true);
              }}
              sx={{ mb: 2 }}
            >
              Add Agent
            </Button>
            <List>
              {agents.filter(Boolean).map((agent) => (
                <ListItem
                  key={agent._id}
                  divider
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setAgentFormData({
                            name: agent.name,
                            contactNumber: agent.contactNumber,
                            email: agent.email,
                            address: agent.address,
                            commission: agent.commission
                          });
                          setAgentDialogOpen(true);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteAgent(agent._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={agent.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Contact: {agent.contactNumber}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Email: {agent.email}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Address: {agent.address}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Tests Tab */}
        {activeTab === 2 && (
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedTest(null);
                setTestFormData({
                  name: '',
                  code: '',
                  description: '',
                  image: '',
                  subtests: [],
                  packs: [],
                  requiresSeparatePage: false
                });
                setTestDialogOpen(true);
              }}
              sx={{ mb: 2 }}
            >
              Add Test
            </Button>
            <List>
              {tests.map((test) => (
                <ListItem
                  key={test._id}
                  divider
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => {
                          setSelectedTest(test);
                          setTestFormData({
                            name: test.name,
                            code: test.code,
                            description: test.description || '',
                            image: test.image || '',
                            requiresSeparatePage: test.requiresSeparatePage === true,
                            subtests: Array.isArray(test.subtests)
                              ? test.subtests.map(sub => ({
                                  name: sub.name || '',
                                  unit: sub.unit || '',
                                  reference: !sub.hasGenderSpecificRanges ? (sub.reference || '') : '',
                                  hasGenderSpecificRanges: sub.hasGenderSpecificRanges || false,
                                  maleReference: sub.maleReference || '',
                                  femaleReference: sub.femaleReference || '',
                                  formula: sub.formula || '',
                                  result: sub.result || '',
                                  image: sub.image || '',
                                  _id: sub._id
                                }))
                              : [],
                            packs: Array.isArray(test.packs)
                              ? test.packs.map(pack => ({
                                  name: pack.name || '',
                                  image: pack.image || '',
                                  requiresSeparatePage: Boolean(pack.requiresSeparatePage),
                                  _id: pack._id,
                                  subtests: Array.isArray(pack.subtests)
                                    ? pack.subtests.map(sub => ({
                                        name: sub.name || '',
                                        unit: sub.unit || '',
                                        reference: !sub.hasGenderSpecificRanges ? (sub.reference || '') : '',
                                        hasGenderSpecificRanges: sub.hasGenderSpecificRanges || false,
                                        maleReference: sub.maleReference || '',
                                        femaleReference: sub.femaleReference || '',
                                        formula: sub.formula || '',
                                        result: sub.result || '',
                                        image: sub.image || '',
                                        _id: sub._id
                                      }))
                                    : []
                                }))
                              : []
                          });
                          setTestDialogOpen(true);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteTest(test._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={test.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          Code: {test.code}
                        </Typography>
                        <br />
                        {test.description && (
                          <>
                            <Typography component="span" variant="body2">
                              {test.description}
                            </Typography>
                            <br />
                          </>
                        )}
                        <Typography component="span" variant="body2">
                          Subtests: {(test.subtests || []).map(sub => sub.name).join(', ')}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Packs: {(test.packs || []).map(pack => pack.name).join(', ')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Doctor Dialog */}
        <Dialog
          open={doctorDialogOpen}
          onClose={() => {
            setDoctorDialogOpen(false);
            setSelectedDoctor(null);
            setDoctorFormData({ name: '', specialization: '', contact: '', email: '' });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleDoctorSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={doctorFormData.name}
                    onChange={(e) => setDoctorFormData({
                      ...doctorFormData,
                      name: e.target.value
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    value={doctorFormData.specialization}
                    onChange={(e) => setDoctorFormData({
                      ...doctorFormData,
                      specialization: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact"
                    value={doctorFormData.contact}
                    onChange={(e) => setDoctorFormData({
                      ...doctorFormData,
                      contact: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={doctorFormData.email}
                    onChange={(e) => setDoctorFormData({
                      ...doctorFormData,
                      email: e.target.value
                    })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDoctorDialogOpen(false);
              setSelectedDoctor(null);
              setDoctorFormData({ name: '', specialization: '', contact: '', email: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleDoctorSubmit} variant="contained" color="primary">
              {selectedDoctor ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Agent Dialog */}
        <Dialog
          open={agentDialogOpen}
          onClose={() => {
            setAgentDialogOpen(false);
            setSelectedAgent(null);
            setAgentFormData({ name: '', contactNumber: '', email: '', address: '', commission: 0 });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedAgent ? 'Edit Agent' : 'Add New Agent'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleAgentSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={agentFormData.name}
                    onChange={(e) => setAgentFormData({
                      ...agentFormData,
                      name: e.target.value
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    value={agentFormData.contactNumber}
                    onChange={(e) => setAgentFormData({
                      ...agentFormData,
                      contactNumber: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={agentFormData.email}
                    onChange={(e) => setAgentFormData({
                      ...agentFormData,
                      email: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={agentFormData.address}
                    onChange={(e) => setAgentFormData({
                      ...agentFormData,
                      address: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Commission"
                    type="number"
                    value={agentFormData.commission}
                    onChange={(e) => setAgentFormData({
                      ...agentFormData,
                      commission: Number(e.target.value)
                    })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAgentDialogOpen(false);
              setSelectedAgent(null);
              setAgentFormData({ name: '', contactNumber: '', email: '', address: '', commission: 0 });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAgentSubmit} variant="contained" color="primary">
              {selectedAgent ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Test Dialog */}
        <Dialog
          open={testDialogOpen}
          onClose={() => {
            setTestDialogOpen(false);
            setSelectedTest(null);
            setTestFormData({
              name: '',
              code: '',
              description: '',
              image: '',
              subtests: [],
              packs: [],
              requiresSeparatePage: false,
              hasGenderSpecificRanges: false,
              maleReference: '',
              femaleReference: ''
            });
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedTest ? 'Edit Test' : 'Add New Test'}
          </DialogTitle>
          <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <Box component="form" onSubmit={handleTestSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Test Name"
                    value={testFormData.name}
                    onChange={(e) => setTestFormData({
                      ...testFormData,
                      name: e.target.value
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Test Code"
                    value={testFormData.code}
                    onChange={(e) => setTestFormData({
                      ...testFormData,
                      code: e.target.value
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={testFormData.description}
                    onChange={(e) => setTestFormData({
                      ...testFormData,
                      description: e.target.value
                    })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Requires Separate Page
                  </Typography>
                  <RadioGroup
                    row
                    value={testFormData.requiresSeparatePage ? 'yes' : 'no'}
                    onChange={(e) => {
                      setTestFormData({
                        ...testFormData,
                        requiresSeparatePage: e.target.value === 'yes'
                      });
                    }}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Test Image URL"
                    value={testFormData.image}
                    onChange={(e) => setTestFormData({
                      ...testFormData,
                      image: e.target.value
                    })}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          fileToBase64(file, (base64) => setTestFormData({ ...testFormData, image: base64 }));
                        }
                      }}
                    />
                  </Button>
                  {testFormData.image && (
                    <img src={testFormData.image} alt="Test" style={{ maxWidth: 120, display: 'block', marginTop: 8 }} />
                  )}
                </Grid>
              </Grid>

              {/* Subtests Section */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Subtests
              </Typography>
              {testFormData.subtests.map((sub, idx) => (
                <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Subtest Name"
                        value={sub.name}
                        onChange={e => {
                          const newSubs = [...testFormData.subtests];
                          newSubs[idx].name = e.target.value;
                          setTestFormData({ ...testFormData, subtests: newSubs });
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Unit"
                        value={sub.unit}
                        onChange={e => {
                          const newSubs = [...testFormData.subtests];
                          newSubs[idx].unit = e.target.value;
                          setTestFormData({ ...testFormData, subtests: newSubs });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={sub.hasGenderSpecificRanges || false}
                            onChange={e => {
                              const newSubs = [...testFormData.subtests];
                              const oldSub = newSubs[idx];
                              newSubs[idx] = {
                                ...oldSub,
                                hasGenderSpecificRanges: e.target.checked,
                                maleReference: e.target.checked && !oldSub.maleReference && oldSub.reference ? oldSub.reference : oldSub.maleReference || '',
                                femaleReference: e.target.checked && !oldSub.femaleReference && oldSub.reference ? oldSub.reference : oldSub.femaleReference || '',
                                reference: !e.target.checked ? 
                                  (oldSub.maleReference || oldSub.femaleReference ? 
                                    `M: ${oldSub.maleReference || 'N/A'}, F: ${oldSub.femaleReference || 'N/A'}` : 
                                    oldSub.reference || '') : 
                                  oldSub.reference || ''
                              };
                              setTestFormData({ ...testFormData, subtests: newSubs });
                            }}
                            size="small"
                          />
                        }
                        label="Gender Specific"
                      />
                    </Grid>
                    {!sub.hasGenderSpecificRanges && (
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Reference Range"
                          value={sub.reference || ''}
                          onChange={e => {
                            const newSubs = [...testFormData.subtests];
                            newSubs[idx] = {
                              ...newSubs[idx],
                              reference: e.target.value
                            };
                            setTestFormData({ ...testFormData, subtests: newSubs });
                          }}
                          multiline
                          rows={2}
                        />
                      </Grid>
                    )}
                    {sub.hasGenderSpecificRanges && (
                      <>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Male Reference"
                            value={sub.maleReference || ''}
                            onChange={e => {
                              const newSubs = [...testFormData.subtests];
                              newSubs[idx] = {
                                ...newSubs[idx],
                                maleReference: e.target.value
                              };
                              setTestFormData({ ...testFormData, subtests: newSubs });
                            }}
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Female Reference"
                            value={sub.femaleReference || ''}
                            onChange={e => {
                              const newSubs = [...testFormData.subtests];
                              newSubs[idx] = {
                                ...newSubs[idx],
                                femaleReference: e.target.value
                              };
                              setTestFormData({ ...testFormData, subtests: newSubs });
                            }}
                            multiline
                            rows={2}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Formula"
                        placeholder="e.g., 0.15*reading-0.1"
                        value={sub.formula || ''}
                        onChange={e => {
                          const newSubs = [...testFormData.subtests];
                          newSubs[idx].formula = e.target.value;
                          setTestFormData({ ...testFormData, subtests: newSubs });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Default Result"
                        value={sub.result || ''}
                        onChange={e => {
                          const newSubs = [...testFormData.subtests];
                          newSubs[idx].result = e.target.value;
                          setTestFormData({ ...testFormData, subtests: newSubs });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Image URL"
                        value={sub.image || ''}
                        onChange={e => {
                          const newSubs = [...testFormData.subtests];
                          newSubs[idx].image = e.target.value;
                          setTestFormData({ ...testFormData, subtests: newSubs });
                        }}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                      >
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              fileToBase64(file, (base64) => {
                                const newSubs = [...testFormData.subtests];
                                newSubs[idx].image = base64;
                                setTestFormData({ ...testFormData, subtests: newSubs });
                              });
                            }
                          }}
                        />
                      </Button>
                      {sub.image && (
                        <img src={sub.image} alt="Subtest" style={{ maxWidth: 60, display: 'block', marginTop: 4 }} />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton 
                        color="error" 
                        onClick={() => {
                          const newSubs = testFormData.subtests.filter((_, i) => i !== idx);
                          setTestFormData({ ...testFormData, subtests: newSubs });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={() => setTestFormData({
                  ...testFormData,
                  subtests: [...testFormData.subtests, { 
                    name: '', 
                    unit: '', 
                    reference: '', 
                    hasGenderSpecificRanges: false,
                    maleReference: '',
                    femaleReference: '',
                    formula: '', 
                    result: '', 
                    image: '',
                    _id: Date.now().toString()
                  }]
                })}
                sx={{ mt: 2 }}
              >
                Add Subtest
              </Button>

              {/* Packs Section */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Packs
              </Typography>
              {testFormData.packs.map((pack, pIdx) => (
                <Box key={pIdx} sx={{ mb: 3, p: 2, border: '2px solid #bbb', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Pack Name"
                        value={pack.name}
                        onChange={e => {
                          const newPacks = [...testFormData.packs];
                          newPacks[pIdx].name = e.target.value;
                          setTestFormData({ ...testFormData, packs: newPacks });
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Pack Image URL"
                        value={pack.image || ''}
                        onChange={e => {
                          const newPacks = [...testFormData.packs];
                          newPacks[pIdx].image = e.target.value;
                          setTestFormData({ ...testFormData, packs: newPacks });
                        }}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                      >
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              fileToBase64(file, (base64) => {
                                const newPacks = [...testFormData.packs];
                                newPacks[pIdx].image = base64;
                                setTestFormData({ ...testFormData, packs: newPacks });
                              });
                            }
                          }}
                        />
                      </Button>
                      {pack.image && (
                        <img src={pack.image} alt="Pack" style={{ maxWidth: 80, display: 'block', marginTop: 4 }} />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        Requires Separate Page
                      </Typography>
                      <RadioGroup
                        row
                        value={pack.requiresSeparatePage ? 'yes' : 'no'}
                        onChange={(e) => {
                          const newPacks = [...testFormData.packs];
                          newPacks[pIdx] = {
                            ...newPacks[pIdx],
                            requiresSeparatePage: e.target.value === 'yes'
                          };
                          setTestFormData({
                            ...testFormData,
                            packs: newPacks
                          });
                        }}
                      >
                        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio />} label="No" />
                      </RadioGroup>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton 
                        color="error" 
                        onClick={() => {
                          const newPacks = testFormData.packs.filter((_, i) => i !== pIdx);
                          setTestFormData({ ...testFormData, packs: newPacks });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                  
                  {/* Pack Subtests */}
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Pack Subtests
                  </Typography>
                  {pack.subtests && pack.subtests.map((sub, sIdx) => (
                    <Box key={sIdx} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1, backgroundColor: 'white' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Subtest Name"
                            value={sub.name}
                            onChange={e => {
                              const newPacks = [...testFormData.packs];
                              newPacks[pIdx].subtests[sIdx].name = e.target.value;
                              setTestFormData({ ...testFormData, packs: newPacks });
                            }}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Unit"
                            value={sub.unit}
                            onChange={e => {
                              const newPacks = [...testFormData.packs];
                              newPacks[pIdx].subtests[sIdx].unit = e.target.value;
                              setTestFormData({ ...testFormData, packs: newPacks });
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={sub.hasGenderSpecificRanges || false}
                                onChange={e => {
                                  const newPacks = [...testFormData.packs];
                                  newPacks[pIdx].subtests[sIdx].hasGenderSpecificRanges = e.target.checked;
                                  setTestFormData({ ...testFormData, packs: newPacks });
                                }}
                                size="small"
                              />
                            }
                            label="Gender Specific"
                          />
                        </Grid>
                        {!sub.hasGenderSpecificRanges && (
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              label="Reference Range"
                              value={sub.reference || ''}
                              onChange={e => {
                                const newPacks = [...testFormData.packs];
                                newPacks[pIdx].subtests[sIdx].reference = e.target.value;
                                setTestFormData({ ...testFormData, packs: newPacks });
                              }}
                            />
                          </Grid>
                        )}
                        {sub.hasGenderSpecificRanges && (
                          <>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                label="Male Reference"
                                value={sub.maleReference || ''}
                                onChange={e => {
                                  const newPacks = [...testFormData.packs];
                                  newPacks[pIdx].subtests[sIdx].maleReference = e.target.value;
                                  setTestFormData({ ...testFormData, packs: newPacks });
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                label="Female Reference"
                                value={sub.femaleReference || ''}
                                onChange={e => {
                                  const newPacks = [...testFormData.packs];
                                  newPacks[pIdx].subtests[sIdx].femaleReference = e.target.value;
                                  setTestFormData({ ...testFormData, packs: newPacks });
                                }}
                              />
                            </Grid>
                          </>
                        )}
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Formula"
                            placeholder="e.g., 0.15*reading-0.1"
                            value={sub.formula || ''}
                            onChange={e => {
                              const newPacks = [...testFormData.packs];
                              newPacks[pIdx].subtests[sIdx].formula = e.target.value;
                              setTestFormData({ ...testFormData, packs: newPacks });
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Default Result"
                            value={sub.result || ''}
                            onChange={e => {
                              const newPacks = [...testFormData.packs];
                              newPacks[pIdx].subtests[sIdx].result = e.target.value;
                              setTestFormData({ ...testFormData, packs: newPacks });
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Image URL"
                            value={sub.image || ''}
                            onChange={e => {
                              const newPacks = [...testFormData.packs];
                              newPacks[pIdx].subtests[sIdx].image = e.target.value;
                              setTestFormData({ ...testFormData, packs: newPacks });
                            }}
                            sx={{ mb: 1 }}
                          />
                          <Button
                            variant="outlined"
                            component="label"
                            size="small"
                          >
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                  fileToBase64(file, (base64) => {
                                    const newPacks = [...testFormData.packs];
                                    newPacks[pIdx].subtests[sIdx].image = base64;
                                    setTestFormData({ ...testFormData, packs: newPacks });
                                  });
                                }
                              }}
                            />
                          </Button>
                          {sub.image && (
                            <img src={sub.image} alt="Pack Subtest" style={{ maxWidth: 60, display: 'block', marginTop: 4 }} />
                          )}
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton 
                            color="error" 
                            onClick={() => {
                              const newPacks = [...testFormData.packs];
                              newPacks[pIdx].subtests = newPacks[pIdx].subtests.filter((_, i) => i !== sIdx);
                              setTestFormData({ ...testFormData, packs: newPacks });
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const newPacks = [...testFormData.packs];
                      if (!newPacks[pIdx].subtests) newPacks[pIdx].subtests = [];
                      newPacks[pIdx].subtests.push({
                        name: '', 
                        unit: '', 
                        reference: '', 
                        hasGenderSpecificRanges: false,
                        maleReference: '',
                        femaleReference: '',
                        formula: '', 
                        result: '', 
                        image: ''
                      });
                      setTestFormData({ ...testFormData, packs: newPacks });
                    }}
                    sx={{ mt: 1 }}
                  >
                    Add Pack Subtest
                  </Button>
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={() => setTestFormData({
                  ...testFormData,
                  packs: [...testFormData.packs, { 
                    name: '', 
                    image: '', 
                    requiresSeparatePage: false,
                    subtests: [],
                    _id: `temp_${Date.now()}`
                  }]
                })}
                sx={{ mt: 2 }}
              >
                Add Pack
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setTestDialogOpen(false);
              setSelectedTest(null);
              setTestFormData({
                name: '',
                code: '',
                description: '',
                image: '',
                subtests: [],
                packs: [],
                requiresSeparatePage: false,
                hasGenderSpecificRanges: false,
                maleReference: '',
                femaleReference: ''
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleTestSubmit} variant="contained" color="primary">
              {selectedTest ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* SubTest Dialog */}
        <Dialog
          open={subTestDialogOpen}
          onClose={() => {
            setSubTestDialogOpen(false);
            setSelectedSubTest(null);
            setSubTestFormData({ 
              name: '', 
              unit: '', 
              range: '', 
              maleReference: '',
              femaleReference: '',
              hasGenderSpecificRanges: false,
              result: '', 
              image: '' 
            });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedSubTest ? 'Edit SubTest' : 'Add New SubTest'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubTestSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Name" 
                    value={subTestFormData.name} 
                    onChange={e => setSubTestFormData({ ...subTestFormData, name: e.target.value })} 
                    required 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Unit" 
                    value={subTestFormData.unit} 
                    onChange={e => setSubTestFormData({ ...subTestFormData, unit: e.target.value })} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Range" 
                    value={subTestFormData.range} 
                    onChange={e => setSubTestFormData({ ...subTestFormData, range: e.target.value })} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Default Result" 
                    value={subTestFormData.result} 
                    onChange={e => setSubTestFormData({ ...subTestFormData, result: e.target.value })} 
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subtest Image URL"
                    value={subTestFormData.image}
                    onChange={e => setSubTestFormData({ ...subTestFormData, image: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                  >
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          fileToBase64(file, (base64) => setSubTestFormData({ ...subTestFormData, image: base64 }));
                        }
                      }}
                    />
                  </Button>
                  {subTestFormData.image && (
                    <img src={subTestFormData.image} alt="Subtest" style={{ maxWidth: 120, display: 'block', marginTop: 8 }} />
                  )}
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { 
              setSubTestDialogOpen(false); 
              setSelectedSubTest(null); 
              setSubTestFormData({ 
                name: '', 
                unit: '', 
                range: '', 
                maleReference: '',
                femaleReference: '',
                hasGenderSpecificRanges: false,
                result: '', 
                image: '' 
              }); 
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubTestSubmit} variant="contained" color="primary">
              {selectedSubTest ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default TestSettings;