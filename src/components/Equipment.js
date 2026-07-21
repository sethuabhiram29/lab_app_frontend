/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon
} from '@mui/icons-material';
import * as api from '../api';

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    testCodes: [],
    description: '',
    currentStock: 0,
    unit: 'kits'
  });
  const [tests, setTests] = useState([]);
  const [stockData, setStockData] = useState({
    quantity: '',
    notes: ''
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleStockOperation = async (equipmentId, operation) => {
    try {
      setLoading(true);
      clearMessages();

      if (!stockData.quantity || isNaN(stockData.quantity) || Number(stockData.quantity) <= 0) {
        throw new Error('Please enter a valid quantity greater than 0');
      }

      const data = {
        quantity: Number(stockData.quantity),
        notes: stockData.notes
      };

      const response = await (operation === 'add' 
        ? api.addStock(equipmentId, data)
        : api.useStock(equipmentId, data)
      );

      // Update the equipment in the list
      setEquipment(prev => prev.map(item => 
        item._id === equipmentId ? response.data : item
      ));

      // Reset stock dialog
      setStockData({ quantity: '', notes: '' });
      setStockDialogOpen(false);
      
      handleSuccess(`Successfully ${operation === 'add' ? 'added' : 'used'} stock`);
      
    } catch (err) {
      handleError(err, `Failed to ${operation} stock`);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err, defaultMessage) => {
    console.error('Error:', err);
    const errorMessage = err.response?.data?.message || defaultMessage;
    setError(errorMessage);
    setLoading(false);
    // Show error in Snackbar
    setSnackbar({ open: true, message: errorMessage, severity: 'error' });
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    setSnackbar({ open: true, message, severity: 'success' });
    // Refresh data
    loadInitialData();
  };

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();
      const [equipmentRes, testsRes, analyticsRes] = await Promise.all([
        api.getEquipment(),
        api.getTests(),
        api.getEquipmentAnalytics()
      ]);
      
      const testList = Array.isArray(testsRes.data) ? testsRes.data : [];
      const equipmentList = Array.isArray(equipmentRes.data) ? equipmentRes.data : [];
      
      console.log('Loaded tests:', testList);
      console.log('Loaded equipment:', equipmentList);
      
      setTests(testList);
      setEquipment(equipmentList);
      setAnalytics(analyticsRes.data || {});
    } catch (err) {
      handleError(err, 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const refreshData = async () => {
    try {
      setLoading(true);
      clearMessages();
      
      const [equipmentRes, testsRes, analyticsRes] = await Promise.all([
        api.getEquipment(),
        api.getTests(),
        api.getEquipmentAnalytics()
      ]);

      const tests = Array.isArray(testsRes.data) ? testsRes.data : (testsRes || []);
      const equipmentData = Array.isArray(equipmentRes.data) ? equipmentRes.data : (equipmentRes || []);
      const analyticsData = analyticsRes.data || analyticsRes || {};

      console.log('Loaded data:', { tests, equipment: equipmentData, analytics: analyticsData });

      setTests(tests);
      setEquipment(equipmentData);
      setAnalytics(analyticsData);
    } catch (err) {
      handleError(err, 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.getEquipmentAnalytics();
      setAnalytics(response.data || {});
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleAddEquipment = () => {
    setSelectedEquipment(null);
    setFormData({
      name: '',
      tests: [],
      description: '',
      currentStock: 0,
      unit: 'kits'
    });
    setDialogOpen(true);
  };

  const handleEditEquipment = (equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      tests: equipment.tests || [],
      description: equipment.description,
      currentStock: equipment.currentStock,
      unit: equipment.unit
    });
    setDialogOpen(true);
  };

  const handleAddStock = (equipment) => {
    setSelectedEquipment(equipment);
    setStockData({ quantity: '', notes: '' });
    setStockDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    try {
      // Basic validation
      if (!formData.name?.trim()) {
        throw new Error('Equipment name is required');
      }
      if (!formData.tests || formData.tests.length === 0) {
        throw new Error('Please select at least one test');
      }
      if (formData.currentStock < 0) {
        throw new Error('Stock cannot be negative');
      }

      setLoading(true);
      
      // Create equipment data object
      const equipmentData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        currentStock: parseInt(formData.currentStock) || 0,
        minimumStock: parseInt(formData.minimumStock) || 5,
        unit: formData.unit || 'kits',
        tests: (formData.tests || []).map(test => ({
          test: (test.test || test._id || test).toString(),
          testName: test.testName || test.name || '',
          testCode: test.testCode || test.code || ''
        }))
      };
      
      console.log('Submitting equipment data:', equipmentData);

      let response;
      if (selectedEquipment) {
        console.log('Updating equipment:', selectedEquipment._id, equipmentData);
        response = await api.updateEquipment(selectedEquipment._id, equipmentData);
        handleSuccess('Equipment updated successfully');
      } else {
        console.log('Creating new equipment:', equipmentData);
        response = await api.createEquipment(equipmentData);
        handleSuccess('Equipment added successfully');
      }

      console.log('Equipment saved successfully:', response.data);
      setDialogOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Error saving equipment:', err);
      handleError(err, 'Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    try {
      if (!stockData.quantity) {
        throw new Error('Please enter a quantity');
      }
      
      const quantity = typeof stockData.quantity === 'string' ? 
        parseInt(stockData.quantity) : stockData.quantity;
        
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Please enter a valid quantity greater than 0');
      }

      setLoading(true);
      console.log('Submitting stock data:', {
        equipmentId: selectedEquipment._id,
        quantity: quantity,
        notes: stockData.notes
      });
      
      const response = await api.addStock(selectedEquipment._id, {
        quantity: quantity,
        notes: stockData.notes?.trim() || ''
      });
      
      console.log('Stock addition response:', response.data);
      
      // Update the UI
      setSuccess('Stock added successfully');
      setStockDialogOpen(false);
      setStockData({ quantity: '', notes: '' });
      
      // Refresh data to show updated stock
      const [equipmentRes, analyticsRes] = await Promise.all([
        api.getEquipment(),
        api.getEquipmentAnalytics()
      ]);
      setEquipment(equipmentRes.data || []);
      setAnalytics(analyticsRes.data || {});
    } catch (err) {
      handleError(err, 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (id) => {
    try {
      const equipmentToDelete = equipment.find(e => e._id === id);
      if (!equipmentToDelete) {
        throw new Error('Equipment not found');
      }

      if (!window.confirm(`Are you sure you want to delete ${equipmentToDelete.name}? This action cannot be undone.`)) {
        return;
      }

      setLoading(true);
      clearMessages();
      
      await api.deleteEquipment(id);
      
      // Update the UI immediately
      setEquipment(prev => prev.filter(e => e._id !== id));
      setSuccess('Equipment deleted successfully');
      
      // Refresh analytics
      const analyticsRes = await api.getEquipmentAnalytics();
      setAnalytics(analyticsRes.data || {});
    } catch (err) {
      handleError(err, 'Failed to delete equipment');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (equipment) => {
    if (equipment.currentStock === 0) {
      return { color: 'error', label: 'Out of Stock' };
    } else if (equipment.currentStock <= equipment.minimumStock) {
      return { color: 'warning', label: 'Low Stock' };
    } else {
      return { color: 'success', label: 'In Stock' };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading equipment...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Equipment & Kits Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddEquipment}
        >
          Add Equipment
        </Button>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Equipment
              </Typography>
              <Typography variant="h4">
                {analytics.totalEquipment || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" color="warning.main">
                {analytics.lowStockItems || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Out of Stock
              </Typography>
              <Typography variant="h4" color="error.main">
                {analytics.outOfStockItems || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Stock Value
              </Typography>
              <Typography variant="h4">
                {analytics.totalStockValue || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Equipment Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Tests</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Last Stock Added</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {(item.tests || [])
                      .map(test => test.testName)
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </TableCell>
                  <TableCell>{item.currentStock} {item.unit}</TableCell>
                  <TableCell>
                    {item.stockHistory && item.stockHistory.length > 0 ? (
                      <>
                        +{item.stockHistory[item.stockHistory.length - 1].quantity} on {(() => {
                          const d = new Date(item.stockHistory[item.stockHistory.length - 1].dateAdded);
                          return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                        })()}
                      </>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleAddStock(item)} color="primary">
                      <AddCircleIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEditEquipment(item)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteEquipment(item._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Equipment Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Tests</InputLabel>
              <Select
                multiple
                value={(formData.tests || []).map(t => t.test?.toString())}
                onChange={e => {
                  const selectedTests = e.target.value.map(testId => {
                    const test = tests.find(t => t._id?.toString() === testId?.toString());
                    return test ? {
                      test: test._id,
                      testName: test.name,
                      testCode: test.code
                    } : null;
                  }).filter(Boolean);
                  console.log('Selected tests:', selectedTests);
                  setFormData({ ...formData, tests: selectedTests });
                }}
                renderValue={selected => (
                  selected.map(testId => {
                    const test = tests.find(t => t._id?.toString() === testId?.toString());
                    return test ? test.name : testId;
                  }).join(', ')
                )}
                label="Tests"
              >
                {tests.map(test => (
                  <MenuItem key={test._id} value={test._id.toString()}>{test.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Current Stock"
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Unit</InputLabel>
              <Select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                label="Unit"
              >
                <MenuItem value="kits">Kits</MenuItem>
                <MenuItem value="pieces">Pieces</MenuItem>
                <MenuItem value="boxes">Boxes</MenuItem>
                <MenuItem value="units">Units</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedEquipment ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Stock - {selectedEquipment?.name}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddStockSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Quantity to Add"
              type="number"
              value={stockData.quantity}
              onChange={(e) => setStockData({ ...stockData, quantity: parseInt(e.target.value) || 0 })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={stockData.notes}
              onChange={(e) => setStockData({ ...stockData, notes: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddStockSubmit} variant="contained">
            Add Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => { setError(''); setSuccess(''); }}
      >
        <Alert
          onClose={() => { setError(''); setSuccess(''); }}
          severity={error ? 'error' : 'success'}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Equipment;
