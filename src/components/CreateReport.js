import React, { useState, useEffect } from 'react';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Chip,
  Backdrop,
  Slide
} from '@mui/material';


import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';
import { openDB } from 'idb';
import { calculateFormula } from '../utils/formulaCalculator';
import PreviewIcon from '@mui/icons-material/Preview';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { getPatients, createReport, getTests, getSubTests, getReports, updateReport, getEquipment, markEquipmentUsed, markReportPrinted, saveUpdationLinks } from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import PDFPreview from './PDFPreview';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon,
  CloudQueue as CloudQueueIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Add as AddIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Event as EventIcon,
  DescriptionOutlined as DescriptionIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { Avatar, InputAdornment, OutlinedInput } from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Initialize and verify IndexedDB stores
let dbInstance = null;

const initDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    // Create new database with all required stores
    const db = await openDB('reportsDB', 2, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
        
        // Create reports store if it doesn't exist
        if (!db.objectStoreNames.contains('reports')) {
          console.log('Creating reports store');
          const reportsStore = db.createObjectStore('reports', { keyPath: 'patientId' });
          reportsStore.createIndex('version', 'version');
          reportsStore.createIndex('createdAt', 'createdAt');
        }
        
        // Create updationLinks store if it doesn't exist
        if (!db.objectStoreNames.contains('updationLinks')) {
          console.log('Creating updationLinks store');
          const linksStore = db.createObjectStore('updationLinks', { keyPath: 'patientId' });
          linksStore.createIndex('version', 'version');
          linksStore.createIndex('updatedAt', 'updatedAt');
        }
      }
    });

    // Verify stores exist
    const storeNames = Array.from(db.objectStoreNames);
    console.log('Available stores:', storeNames);
    
    if (!storeNames.includes('reports') || !storeNames.includes('updationLinks')) {
      throw new Error('Required stores not created properly');
    }

    dbInstance = db;
    return dbInstance;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Helper function to safely perform database operations
const safeDBOperation = async (operation) => {
  try {
    const db = await initDB();
    if (!db) {
      console.error('Database not initialized');
      return null;
    }
    return await operation(db);
  } catch (error) {
    console.error('Database operation failed:', error);
    return null;
  }
};

// Helper function to get stored links from IndexedDB
const getStoredLinks = async (patientId) => {
  try {
    // First try to get links from updationLinks store
    const updationData = await safeDBOperation(async (db) => {
      if (!db.objectStoreNames.contains('updationLinks')) return null;
      const tx = db.transaction('updationLinks', 'readonly');
      return await tx.store.get(patientId);
    });

    if (updationData?.viewLink && updationData?.downloadLink) {
      console.log('Found links in updationLinks store');
      return {
        viewLink: updationData.viewLink,
        downloadLink: updationData.downloadLink,
        version: updationData.version || 0
      };
    }

    // If no updation links, try reports store
    const reportData = await safeDBOperation(async (db) => {
      if (!db.objectStoreNames.contains('reports')) return null;
      const tx = db.transaction('reports', 'readonly');
      return await tx.store.get(patientId);
    });

    if (reportData?.viewLink || reportData?.downloadLink) {
      console.log('Found links in reports store');
      return {
        viewLink: reportData.viewLink || null,
        downloadLink: reportData.downloadLink || null,
        version: reportData.version || 0
      };
    }

    console.log('No links found in any store');
    return { viewLink: null, downloadLink: null, version: 0 };
  } catch (error) {
    console.error('Failed to retrieve links:', error);
    return { viewLink: null, downloadLink: null, version: 0 };
  }
};

// Google Drive Configuration
const GOOGLE_CLIENT_ID = '1051032038727-00igqktf00j88sgta3tr2ap3f2ut7qrl.apps.googleusercontent.com';

// PDF styles
const styles = StyleSheet.create({
  page: {
    position: 'relative',
    width: 595,
    height: 842,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    overflow: 'hidden',
  },

  patientInfoTable: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginTop: 15,
  },
  patientInfoCol: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  patientInfoColMain: {
    width: '58%',
  },
  patientInfoColSecondary: {
    width: '32%',
    marginLeft: 0,
  },
  patientInfoColQR: {
    width: '10%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 0,
    minHeight: 85, // Adjusted to match content
    display: 'flex',
    flexDirection: 'column',
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    display: 'flex',
  },
  patientLabel: {
    fontSize: 10,
    width: 90, // Slightly reduced for better alignment
  },
  patientSeparator: {
    fontSize: 10,
    marginRight: 3, // Slightly reduced
  },
  patientValue: {
    fontSize: 10,
    flex: 1,
  },
  qrCode: {
    width: '100%',
    height: 'auto',
    maxWidth: 80, // Adjust QR size to match header height
  },
  table: {
    marginTop: 0,
    marginBottom: 0,
    border: '1px solid #fff',
    padding: 0,
    width: '100%',
    alignSelf: 'stretch',
  },
  testNameHeader: {
    backgroundColor: '#cce6ff',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    padding: 4,
    marginBottom: 0,
    marginTop: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    width: '100%',
  },
  packNameHeader: {
    backgroundColor: '#e6f2ff',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    padding: 4,
    marginBottom: 0,
    marginTop: 2,
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 0,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableHeaderCell: {
    backgroundColor: '#e3f1ff',
    borderRight: '1px solid #fff',
    borderTop: '1px solid #fff',
    borderBottom: 'none',
    padding: 2,
    fontSize: 11,
    fontWeight: 'bold',
    flexGrow: 1,
    textAlign: 'center',
  },
  tableHeaderCellLeft: {
    backgroundColor: '#e3f1ff',
    borderRight: '1px solid #fff',
    borderTop: '1px solid #fff',
    borderBottom: 'none',
    padding: 2,
    fontSize: 10,
    fontWeight: 'bold',
    flexGrow: 1,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 'none',
    padding: 1,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 10,
    backgroundColor: 'transparent',
    minHeight: 14,
  },
  packRow: {
    flexDirection: 'row',
    padding: 0,
    margin: 0,
    fontSize: 10,
    backgroundColor: 'transparent',
    minHeight: 16,
    borderBottom: 'none'
  },
  packName: {
    fontWeight: 'bold',
    fontSize: 10,
    padding: 0,
    margin: 0
  },
  testName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4, // Reduced from 10 to 4
  },
  col1: { width: '36%', fontSize: 10, textAlign: 'left', padding: 0, margin: 0, backgroundColor: 'transparent' },
  col2: { width: '13%', fontSize: 10, textAlign: 'center', padding: 0, margin: 0, backgroundColor: 'transparent' },
  col3: { width: '13%', fontSize: 10, textAlign: 'center', padding: 0, margin: 0, backgroundColor: 'transparent' },
  col4: { width: '38%', fontSize: 10, textAlign: 'center', padding: 0, margin: 0, backgroundColor: 'transparent' },
  note: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'left'
  },
  abnormalResult: {
    fontWeight: 'bold',
    color: '#000000'
  },
});


// Helper function to check if result is abnormal based on reference range
const isAbnormalResult = (result, reference, gender) => {
  if (!result || !reference) return false;

  // For gender-specific ranges (e.g., "M:1-2,F:3-4")
  if (reference.toString().includes(',') && gender) {
    const genderPrefix = gender.toLowerCase()[0]; // 'm' or 'f'
    const ranges = reference.toString().split(',').map(r => r.trim());
    const genderRange = ranges.find(r => r.toLowerCase().startsWith(genderPrefix + ':'));
    
    if (genderRange) {
      // Extract the actual range after the gender prefix (e.g., "1-2" from "M:1-2")
      const actualRange = genderRange.split(':')[1];
      return checkRange(result, actualRange);
    }
  }
  
  // For regular ranges
  return checkRange(result, reference);
};

// Helper function to check specific range formats
const checkRange = (result, reference) => {
  if (!result || !reference) return false;
  
  const resultNum = parseFloat(result);
  if (isNaN(resultNum)) return false;
  
  // Handle different reference range formats
  const refStr = reference.toString().toLowerCase();
  
  // Check for < format (e.g., "< 5.0")
  if (refStr.includes('<')) {
    const maxVal = parseFloat(refStr.match(/<[\s]*([\d.]+)/)?.[1]);
    if (!isNaN(maxVal)) return resultNum >= maxVal;
  }
  
  // Check for > format (e.g., "> 10.0")
  if (refStr.includes('>')) {
    const minVal = parseFloat(refStr.match(/>[\s]*([\d.]+)/)?.[1]);
    if (!isNaN(minVal)) return resultNum <= minVal;
  }
  
  // Check for range format (e.g., "5.0 - 10.0" or "5.0-10.0")
  const rangeMatch = refStr.match(/([\d.]+)[\s]*[-–—][\s]*([\d.]+)/);
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1]);
    const maxVal = parseFloat(rangeMatch[2]);
    if (!isNaN(minVal) && !isNaN(maxVal)) {
      return resultNum < minVal || resultNum > maxVal;
    }
  }
  
  // Check for "upto" format (e.g., "upto 5.0")
  if (refStr.includes('upto') || refStr.includes('up to')) {
    const maxVal = parseFloat(refStr.match(/(?:upto|up to)[\s]*([\d.]+)/)?.[1]);
    if (!isNaN(maxVal)) return resultNum > maxVal;
  }
  
  return false;
};

// PDF Document Component
export const ReportDocument = ({ patient, testTables, isPrinting = false, removedImages = new Set(), tableNotes = {}, qrImage }) => {
  // --- Constants for pagination ---
  const PAGE_HEIGHT = 842;
  const PAGE_WIDTH = 595;
  const TOP_MARGIN = 185; // reduced from 200 to bring table closer to separator
  const BOTTOM_MARGIN = 80;
  const HEADER_HEIGHT = 36; // table header
  const ROW_HEIGHT = 16; // updated to match actual row height (14px) + padding (1px * 2)
  const PACK_NAME_HEIGHT = 22;
  const TEST_NAME_HEIGHT = 28;
  const IMAGE_HEIGHT = 100; // increased to handle larger images

  // Helper: flatten testTables into a renderable sequence of blocks (test header, pack header, rows, etc.)
  function buildBlocks(tables) {
    const blocks = [];
    
    // Split tables into regular and separate page tests
    const regularTests = tables.filter(tr => !tr.test.requiresSeparatePage);
    const separatePageTests = tables.filter(tr => tr.test.requiresSeparatePage);
    
    // Function to process a test and return its blocks
    function processTest(tr, testIndex, isForSeparatePage = false) {
      const testBlocks = [];
      
      // Direct subtests as their own table
      if (tr.direct && tr.direct.length > 0) {
        testBlocks.push({ 
          type: 'testHeader', 
          testName: tr.test.name,
          requiresSeparatePage: isForSeparatePage
        });
        testBlocks.push({ type: 'tableHeader' });
        tr.direct.forEach((sub) => {
          testBlocks.push({ type: 'row', sub });
        });
        // Add note if exists for this direct table
        const directNote = tableNotes[`${testIndex}-direct`];
        if (directNote && directNote.trim()) {
          testBlocks.push({ type: 'note', content: directNote });
        }
        // Use testIndex for image removal key, matching UI
        if (tr.test.image && !removedImages.has(`${testIndex}-test`)) {
          testBlocks.push({ type: 'testImage', image: tr.test.image, height: IMAGE_HEIGHT });
        }
      }

      // Each pack as its own table
      if (tr.packs && tr.packs.length > 0) {
        tr.packs.forEach((pack, packIndex) => {
          testBlocks.push({ 
            type: 'testHeader', 
            testName: pack.packName,
            requiresSeparatePage: isForSeparatePage
          });
          testBlocks.push({ type: 'tableHeader' });
          pack.subtests.forEach((sub) => {
            testBlocks.push({ type: 'row', sub });
          });
          // Add note if exists for this pack table
          const packNote = tableNotes[`${testIndex}-pack-${packIndex}`];
          if (packNote && packNote.trim()) {
            testBlocks.push({ type: 'note', content: packNote });
          }
          // Use testIndex and packIndex for image removal key, matching UI
          if (pack.image && !removedImages.has(`${testIndex}-pack-${packIndex}`)) {
            testBlocks.push({ type: 'packImage', image: pack.image, height: IMAGE_HEIGHT });
          }
        });
      }
      
      return testBlocks;
    }
    
    // Process all tests in sequence, keeping track of which are regular and which need separate pages
    let testIndex = 0;
    
    // First process all regular tests
    regularTests.forEach((tr) => {
      const testBlocks = processTest(tr, testIndex, false);
      blocks.push(...testBlocks);
      testIndex++;
    });

    // Then process all tests that require separate pages
    separatePageTests.forEach((tr) => {
      const testBlocks = processTest(tr, testIndex, true);
      blocks.push(...testBlocks);
      testIndex++;
    });

    // Remove a leading tableHeader if it is the very first block
    if (blocks.length > 0 && blocks[0].type === 'tableHeader') {
      blocks.shift();
    }

    return blocks;
  }

  // Paginate blocks with optimized table placement
  function paginateBlocks(blocks) {
    // Filter out consecutive forcePage blocks
    blocks = blocks.filter((block, index) => {
      if (block.type === 'forcePage') {
        // Skip if next block is also a forcePage
        return !(blocks[index + 1]?.type === 'forcePage');
      }
      return true;
    });

    const pages = [[]]; // Start with one empty page
    let i = 0;

    // Helper function to calculate space needed for a section
    function calculateSpaceNeeded(startIndex) {
      let height = 0;
      let j = startIndex;
      let blockCount = 0;
      
      // Calculate until we find the end of this section or reach end of blocks
      while (j < blocks.length) {
        const block = blocks[j];
        if (j > startIndex && block.type === 'testHeader') break;
        
        if (block.type === 'testHeader') height += TEST_NAME_HEIGHT;
        else if (block.type === 'tableHeader') height += HEADER_HEIGHT;
        else if (block.type === 'packHeader') height += PACK_NAME_HEIGHT;
        else if (block.type === 'row') height += ROW_HEIGHT;
        else if (block.type === 'testImage' || block.type === 'packImage') 
          height += (block.height || IMAGE_HEIGHT) + 12;
        else if (block.type === 'spacer') height += 12;
        
        blockCount++;
        j++;
      }
      
      return { height, endIndex: j - 1, blockCount };
    }

    // Helper function to calculate remaining space on a page
    function getRemainingSpace(pageIndex) {
      const page = pages[pageIndex];
      let usedSpace = TOP_MARGIN;
      
      // Check if page contains any test that requires separate page
      const hasSpecialTest = page.some(block => 
        block.type === 'testHeader' && block.requiresSeparatePage
      );
      
      // If page has special test, return 0 space (no more tables allowed)
      if (hasSpecialTest) return 0;
      
      for (const block of page) {
        if (block.type === 'testHeader') usedSpace += TEST_NAME_HEIGHT;
        else if (block.type === 'tableHeader') usedSpace += HEADER_HEIGHT;
        else if (block.type === 'packHeader') usedSpace += PACK_NAME_HEIGHT;
        else if (block.type === 'row') usedSpace += ROW_HEIGHT;
        else if (block.type === 'testImage' || block.type === 'packImage') 
          usedSpace += (block.height || IMAGE_HEIGHT) + 12;
        else if (block.type === 'spacer') usedSpace += 12;
      }
      
      return PAGE_HEIGHT - BOTTOM_MARGIN - usedSpace;
    }

    // Helper to find all blocks that belong to one test
    function findTestBlocks(startIndex) {
      const testBlocks = [];
      let j = startIndex;
      
      // Get the test header
      const testHeader = blocks[j];
      testBlocks.push(testHeader);
      j++;
      
      // Collect all blocks until we hit another test header
      while (j < blocks.length && blocks[j].type !== 'testHeader') {
        testBlocks.push(blocks[j]);
        j++;
      }
      
      return { testBlocks, endIndex: j - 1 };
    }
    
    while (i < blocks.length) {
      const block = blocks[i];
      
      // Skip any forcePage blocks
      if (block.type === 'forcePage') {
        i++;
        continue;
      }
      
      // When we find a test header
      if (block.type === 'testHeader') {
        const { testBlocks, endIndex } = findTestBlocks(i);
        
        // For separate page tests: ALWAYS start a new page
        if (block.requiresSeparatePage) {
          // If we already have some pages, add a new one
          if (pages.length > 0) {
            pages.push([]);
          }
        } else {
          // For regular tests: only start new page if current page is full
          const spaceNeeded = testBlocks.reduce((sum, b) => {
            if (b.type === 'testHeader') return sum + TEST_NAME_HEIGHT;
            if (b.type === 'tableHeader') return sum + HEADER_HEIGHT;
            if (b.type === 'row') return sum + ROW_HEIGHT;
            if (b.type === 'testImage' || b.type === 'packImage') 
              return sum + (b.height || IMAGE_HEIGHT) + 12;
            if (b.type === 'spacer') return sum + 12;
            return sum;
          }, 0);
          
          const remainingSpace = getRemainingSpace(pages.length - 1);
          
          if (remainingSpace < spaceNeeded) {
            pages.push([]);
          }
        }
        
        // Add all blocks for this test to the current page
        pages[pages.length - 1].push(...testBlocks);
        i = endIndex + 1;
        continue;
      }

      // Calculate space needed for the next section
      const { height, endIndex } = calculateSpaceNeeded(i);
      let bestFitPage = -1;
      let bestRemainingSpace = Infinity;

      // Check if this section contains a test that requires a separate page
      const needsSeparatePage = blocks[i].type === 'testHeader' && blocks[i].requiresSeparatePage;

      if (needsSeparatePage) {
        // Start a new page for this test
        bestFitPage = pages.length;
        pages.push([]);
      } else {
        // Try to find the best fitting page for regular tests
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          const remainingSpace = getRemainingSpace(pageIndex);
          if (remainingSpace >= height && remainingSpace < bestRemainingSpace) {
            bestFitPage = pageIndex;
            bestRemainingSpace = remainingSpace;
          }
        }
      }

      // If no existing page has enough space, create a new one
      if (bestFitPage === -1) {
        bestFitPage = pages.length;
        pages.push([]);
      }

      // Add the blocks to the best fitting page
      const section = blocks.slice(i, endIndex + 1);
      pages[bestFitPage].push(...section);

      // Move to the next section
      i = endIndex + 1;
    }
    return pages;
  }

  const blocks = buildBlocks(testTables);
  const pages = paginateBlocks(blocks);

  return (
    <Document>
      {pages.map((blocks, pageIdx) => (
        <Page key={pageIdx} size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
          {/* Background image shown in preview and view modes, but not in print mode */}
          {!isPrinting && (
            <Image src={'/test_report_converted.png'} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
          )}
          {/* Patient Info and Separator (now on every page) */}
          <View style={{ position: 'absolute', top: 100, left: 40, right: 40 }}>
            <View style={styles.patientInfoTable}>
              {/* Main column - 63% width */}
              <View style={[styles.patientInfoCol, styles.patientInfoColMain]}>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientLabel}>Regn.No.</Text>
                  <Text style={styles.patientSeparator}>: </Text>
                  <Text style={styles.patientValue}>{patient?.regNo}</Text>
                </View>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientLabel}>Name</Text>
                  <Text style={styles.patientSeparator}>: </Text>
                  <Text style={styles.patientValue}>{patient?.name}</Text>
                </View>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientLabel}>Age / Gender</Text>
                  <Text style={styles.patientSeparator}>: </Text>
                  <Text style={styles.patientValue}>{`${patient?.age} / ${patient?.gender}`}</Text>
                </View>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientLabel}>Ref by Dr.</Text>
                  <Text style={styles.patientSeparator}>: </Text>
                  <Text style={styles.patientValue}>{patient?.refDoctor?.name || '-'}</Text>
                </View>
              </View>
              {/* Secondary column - 30% width */}
              <View style={[styles.patientInfoCol, styles.patientInfoColSecondary]}>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientLabel}>Regn. Date</Text>
                  <Text style={styles.patientSeparator}>: </Text>
                  <Text style={styles.patientValue}>
                    {patient?.sampleCollectionDate ? 
                      (() => {
                        const d = new Date(patient.sampleCollectionDate);
                        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                      })()
                      : '-'
                    }
                  </Text>
                </View>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientLabel}>Sample Collection</Text>
                  <Text style={styles.patientSeparator}>: </Text>
                  <Text style={styles.patientValue}>
                    {patient?.sampleCollectionDate ? 
                      (() => {
                        const d = new Date(patient.sampleCollectionDate);
                        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                      })()
                      : '-'
                    }
                  </Text>
                </View>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientLabel}>Report Date</Text>
                  <Text style={styles.patientSeparator}>: </Text>
                  <Text style={styles.patientValue}>
                    {(() => {
                      const d = new Date();
                      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                    })()}
                  </Text>
                </View>
              </View>
              {/* QR Code column - 10% width */}
              <View style={[styles.patientInfoCol, styles.patientInfoColQR]}>
                {qrImage && (
                  <Image
                    src={qrImage}
                    style={{
                      width: 66,
                      height: 66,
                      marginTop: 0,
                    }}
                  />
                )}
              </View>
            </View>
          </View>
          {/* Horizontal separator line below patient info */}
          <View style={{ position: 'absolute', top: 180, left: 30, right: 30, height: 1, backgroundColor: '#000' }} />
          {/* Debug: Footer reference line is always transparent (never visible) in both preview and PDF */}
          <View style={{ position: 'absolute', top: PAGE_HEIGHT - BOTTOM_MARGIN, left: 0, right: 0, height: 2, backgroundColor: 'transparent' }} />
          {/* Table and blocks */}
          <View style={{ position: 'absolute', top: TOP_MARGIN, left: 50, right: 50 }}>
            {blocks.map((block, idx) => {
              if (block.type === 'tableHeader') {
                // Only render table header if the next block is not a note
                if (blocks[idx + 1] && blocks[idx + 1].type === 'note') {
                  return null;
                }
                return (
                  <View style={styles.tableHeader} key={idx}>
                    <Text style={[
                      styles.col1, 
                      styles.tableHeaderCellLeft,
                      isPrinting && {
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        borderRight: '1px solid #000'
                      }
                    ]}>Test Description</Text>
                    <Text style={[
                      styles.col2, 
                      styles.tableHeaderCell,
                      isPrinting && {
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        borderLeft: 'none'
                      }
                    ]}>Result</Text>
                    <Text style={[
                      styles.col3, 
                      styles.tableHeaderCell,
                      isPrinting && {
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        borderLeft: 'none'
                      }
                    ]}>Units</Text>
                    <Text style={[
                      styles.col4, 
                      styles.tableHeaderCell,
                      isPrinting && {
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        borderLeft: 'none'
                      }
                    ]}>Biological Reference Ranges</Text>
                  </View>
                );
              } else if (block.type === 'testHeader') {
                  return (
                  <View key={idx} style={{ marginBottom: 4 }}>
                    <Text style={[
                      styles.testNameHeader,
                      isPrinting && {
                        backgroundColor: '#fff',
                        border: '1px solid #000'
                      }
                    ]}>{block.testName}</Text>
                        </View>
                );
              } else if (block.type === 'packHeader') {
                return (
                  <View key={idx} style={{ marginBottom: 4 }}>
                    <Text style={styles.packNameHeader}>{block.packName}</Text>
                  </View>
                );
              } else if (block.type === 'row') {
                const getRange = () => {
                  if (!block.sub.hasGenderSpecificRanges) return block.sub.range;
                  if (patient?.gender?.toLowerCase() === 'male') return block.sub.maleReference || block.sub.range;
                  if (patient?.gender?.toLowerCase() === 'female') return block.sub.femaleReference || block.sub.range;
                  return block.sub.range;
                };
                const range = getRange();
                const isAbnormal = isAbnormalResult(block.sub.result, range, patient?.gender);
                return (
                  <View key={idx} style={[
                    styles.tableRow,
                    { flexDirection: 'row', alignItems: 'center' }
                  ]}>
                    <Text style={[
                      styles.col1,
                      { padding: 1 }
                    ]}>{block.sub.name}</Text>
                    <Text style={[
                      styles.col2,
                      { padding: 1 },
                      isAbnormal && styles.abnormalResult
                    ]}>{block.sub.result}</Text>
                    <Text style={styles.col3}>{block.sub.unit}</Text>
                    <Text style={styles.col4}>{range}</Text>
                  </View>
                );
              } else if (block.type === 'note') {
                return (
                  <Text key={idx} style={{ textAlign: 'left', padding: 2 }}>{block.content}</Text>
                );
              } else if (block.type === 'testImage' || block.type === 'packImage') {
                return (
                  <View style={{ width: '100%', marginTop: 8, marginBottom: 12 }} key={idx}>
                    <Image src={block.image} style={{ width: '100%', height: block.height || IMAGE_HEIGHT, objectFit: 'contain' }} />
                  </View>
                );
              } else if (block.type === 'spacer') {
                return <View key={idx} style={{ height: 12 }} />;
              }
              return null;
            })}
          </View>
        </Page>
      ))}
    </Document>
  );
};

function CreateReport() {
  // Google Drive states
  const { driveAuthorized, tokenClient, driveAuthError, handleSignOut, initializeTokenClient } = useGoogleDrive();
  const [driveAuthChecked, setDriveAuthChecked] = useState(false);
  const [gisLoading, setGisLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);



  // Function to generate QR code with patient info
  const generatePatientInfoQR = (patient) => {
    const patientInfo = {
      name: patient.name,
      id: patient._id,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      referredBy: patient.referredBy
    };
    return JSON.stringify(patientInfo);
  };

  // Function to upload PDF to Google Drive and get shareable links
  const uploadToDriveAndGetLinks = async (pdfBlob, fileName) => {
    try {
      const token = localStorage.getItem('googleDriveAccessToken');
      if (!token) throw new Error('No access token available');

      // Upload file to Drive
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({
        name: fileName,
        mimeType: 'application/pdf'
      })], { type: 'application/json' }));
      form.append('file', pdfBlob);

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');
      const file = await uploadResponse.json();

      // Update file permissions (make it accessible via link)
      await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      // Get shareable links
      const viewLink = `https://drive.google.com/file/d/${file.id}/view`;
      const downloadLink = `https://drive.google.com/uc?export=download&id=${file.id}`;

      return { viewLink, downloadLink, fileId: file.id };
    } catch (error) {
      console.error('Error uploading to Drive:', error);
      throw error;
    }
  };

  // Function to handle creating report
  const [uploadedLinks, setUploadedLinks] = useState({ viewLink: null, downloadLink: null });
  const [serverLinkStatus, setServerLinkStatus] = useState('');
  const [updationLinks, setUpdationLinks] = useState({ viewLink: null, downloadLink: null });

  const handleCreateReport = async (patient) => {
    try {
      // Clear any previous messages
      setError(null);
      setSuccess(null);
      
      let qrData;
      let qrImage;
      let viewLink = null;
      let downloadLink = null;

      if (driveAuthorized) {
        setUploadingToDrive(true);
        setSuccess('Uploading to Google Drive...');
        setUploadedLinks({ viewLink: null, downloadLink: null }); // reset before upload
        let serverLinkSaveStatus = '';
        const patientDoc = (
          <Document>
            <Page size="A4" style={styles.page}>
              <View style={styles.patientInfoTable}>
                <View style={styles.patientInfoCol}>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientLabel}>Name:</Text>
                    <Text style={styles.patientSeparator}>:</Text>
                    <Text style={styles.patientValue}>{patient.name}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientLabel}>Age:</Text>
                    <Text style={styles.patientSeparator}>:</Text>
                    <Text style={styles.patientValue}>{patient.age}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientLabel}>Gender:</Text>
                    <Text style={styles.patientSeparator}>:</Text>
                    <Text style={styles.patientValue}>{patient.gender}</Text>
                  </View>
                </View>
              </View>
            </Page>
          </Document>
        );

        // Convert to PDF blob
        const pdfBlob = await pdf(patientDoc).toBlob();
        
        // Upload to Drive and get links
        const { viewLink: vLink, downloadLink: dLink } = await uploadToDriveAndGetLinks(
          pdfBlob,
          `Patient_Info_${patient.name}_${patient._id}.pdf`
        );
        viewLink = vLink;
        downloadLink = dLink;
        setUploadedLinks({ viewLink, downloadLink });
        // Save updation links to server for this patient (like commission)
        try {
          await saveUpdationLinks(patient._id, {
            viewLink,
            downloadLink,
            updatedAt: new Date(),
            patientId: patient._id,
            patientName: patient.name
          });
          setServerLinkStatus('Updation links saved to server for this patient.');
        } catch (err) {
          setServerLinkStatus('Failed to save updation links to server: ' + (err.message || 'Unknown error'));
        }
        // Try to save links to server (update or create report)
        try {
          const existingReport = getReportForPatient(patient._id);
          if (existingReport) {
            await updateReport(existingReport._id, {
              driveLinks: {
                viewLink,
                downloadLink
              },
              updationLinks: {
                viewLink,
                downloadLink,
                updatedAt: new Date()
              }
            });
          } else {
            // Create a new report with the required fields
            // Create report with all required fields
            await createReport({ 
              patientId: patient._id,
              testResults: patient.testResults || [],  // Include test results
              status: 'pending',  // Add a status
              createdAt: new Date(),
              driveLinks: { 
                viewLink, 
                downloadLink 
              }, 
              updationLinks: { 
                viewLink, 
                downloadLink, 
                updatedAt: new Date() 
              } 
            });
          }
          serverLinkSaveStatus = 'Links saved to server database successfully';
        } catch (err) {
          serverLinkSaveStatus = 'Failed to save links to server database';
        }
        // Store as updation links in IndexedDB
        try {
          // First get existing data if any
          const db = await openDB('reportsDB', 2, {
            upgrade(db, oldVersion, newVersion) {
              if (oldVersion < 1) {
                if (!db.objectStoreNames.contains('updationLinks')) {
                  db.createObjectStore('updationLinks', { keyPath: 'patientId' });
                }
              }
              if (oldVersion < 2) {
                // Add any new fields or indexes if needed in version 2
                const store = db.objectStoreNames.contains('updationLinks') 
                  ? db.transaction('updationLinks', 'readwrite').objectStore('updationLinks')
                  : db.createObjectStore('updationLinks', { keyPath: 'patientId' });
                
                // Add new indexes if needed
                if (!store.indexNames.contains('updatedAt')) {
                  store.createIndex('updatedAt', 'updatedAt');
                }
              }
            },
          });

          // Get existing data first
          const existingData = await db.get('updationLinks', patient._id);
          
          // Merge new data with existing data or create new
          const updatedData = {
            patientId: patient._id,
            viewLink,
            downloadLink,
            updatedAt: new Date(),
            version: (existingData?.version || 0) + 1, // Increment version
            ...existingData, // Keep other existing data
          };

          // Save the merged data
          await db.put('updationLinks', updatedData);
          setUpdationLinks({ viewLink, downloadLink });
          // Only show server status message
          setSuccess(serverLinkSaveStatus || 'Links saved successfully');
        } catch (err) {
          setSuccess(prev => {
            let msg = prev ? `${prev}. Failed to store updation links in local db` : 'Failed to store updation links in local db';
            if (serverLinkSaveStatus) msg += `. ${serverLinkSaveStatus}`;
            return msg;
          });
        }
        qrData = viewLink;
      } else {
        // If not connected to Drive, create QR with patient info
        qrData = generatePatientInfoQR(patient);
      }

          // Generate QR code
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrData, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      qrImage = canvas.toDataURL();
      setQrImage(qrImage); // Make sure to set the QR image in state

      // Store in local DB
      const reportData = {
        patientId: patient._id,
        qrImage,
        viewLink,
        downloadLink,
        createdAt: new Date()
      };

      // Save to local DB using indexedDB
      const db = await openDB('reportsDB', 2, {
        upgrade(db, oldVersion, newVersion) {
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('reports')) {
              db.createObjectStore('reports', { keyPath: 'patientId' });
            }
          }
          if (oldVersion < 2) {
            // Add any new fields or indexes if needed in version 2
            const store = db.objectStoreNames.contains('reports') 
              ? db.transaction('reports', 'readwrite').objectStore('reports')
              : db.createObjectStore('reports', { keyPath: 'patientId' });
            
            // Add version tracking
            if (!store.indexNames.contains('version')) {
              store.createIndex('version', 'version');
            }
          }
        },
      });

      // Get existing data first
      const existingReportData = await db.get('reports', patient._id);
      
      // Merge new data with existing data or create new
      const updatedReportData = {
        ...reportData,
        version: (existingReportData?.version || 0) + 1, // Increment version
        lastUpdated: new Date(),
        ...existingReportData, // Keep other existing data
        ...reportData // But override with new data
      };

      // Save the merged data
      await db.put('reports', updatedReportData);
      
      // Show success message for storing links
      if (viewLink && downloadLink) {
        setSuccess(prev => 
          prev ? `${prev}. Links stored in local database` : 'Links stored in local database'
        );
      }


  // Only update the server with links as part of full report creation/update elsewhere
  // (No minimal createReport call here)

      return { qrImage, viewLink, downloadLink };
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  };

  // Initialize Google Drive integration
  useEffect(() => {
    const init = async () => {
      try {
        setGisLoading(true);
        
        // Load the Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => {
          if (!window.google) return;
          
          // Initialize token client using the context
          initializeTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            ux_mode: 'popup'
          });
          
          setDriveAuthChecked(true);
        };
        
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error initializing Google Drive:', error);
        handleSignOut(); // This will clean up auth state and show error
      } finally {
        setGisLoading(false);
      }
    };

    init();
  }, [initializeTokenClient, handleSignOut]);

  // Regular component states
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [subTests, setSubTests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printing] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [pendingReports, setPendingReports] = useState([]);
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });
  const [showPatientList, setShowPatientList] = useState(true);
  const [tableNotes, setTableNotes] = useState({}); // Store notes for each table
  const [removedImages, setRemovedImages] = useState(new Set()); // Track removed images

  // Helper function to add/update note for a specific table
  const handleNoteChange = (testIndex, tableType, packIndex, note) => {
    const tableKey = tableType === 'pack' ? `${testIndex}-pack-${packIndex}` : `${testIndex}-direct`;
    setTableNotes(prev => ({
      ...prev,
      [tableKey]: note
    }));
  };

  // Helper function to toggle image removal
  const toggleImageRemoval = (testIndex, imageType, packIndex = null) => {
    const imageKey = packIndex !== null ? `${testIndex}-${imageType}-${packIndex}` : `${testIndex}-${imageType}`;
    setRemovedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageKey)) {
        newSet.delete(imageKey);
      } else {
        newSet.add(imageKey);
      }
      return newSet;
    });
  };

  // Helper function to check if image is removed
  const isImageRemoved = (testIndex, imageType, packIndex = null) => {
    const imageKey = packIndex !== null ? `${testIndex}-${imageType}-${packIndex}` : `${testIndex}-${imageType}`;
    return removedImages.has(imageKey);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadPendingPatientsAndReports();
        const [testsRes, subTestsRes] = await Promise.all([
          getTests(),
          getSubTests()
        ]);
        setAllTests(testsRes.data || []);
        setSubTests(subTestsRes.data || []);
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize properly');
      }
    };
    init();
  }, []);

  const loadPendingPatientsAndReports = async () => {
    try {
      const patientsList = await getPatients();
      const reports = await getReports();
      setPatients(patientsList);
      setPendingReports(reports);
    } catch (err) {
      setError('Failed to load patients or reports');
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setShowPatientList(false);

    try {
      // Check if this is an edit of an existing report
      const existingReport = getReportForPatient(patient._id);
      
      if (existingReport) {
        // If editing, use the existing QR code
        setQrImage(existingReport.reportDisplayData.qrImage);
        // For existing report, set the stored links
        const storedLinks = await getStoredLinks(patient._id);
        if (storedLinks.viewLink) {
          setUploadedLinks(storedLinks);
        }
      } else {
        // Only for new reports: generate QR and handle Drive upload
        setUploadingToDrive(true);
        const { qrImage: newQrImage, viewLink, downloadLink } = await handleCreateReport(patient);
        setQrImage(newQrImage);
        
        // If successful upload to Drive, show success message and links
        if (driveAuthorized && viewLink) {
          setUploadedLinks({ viewLink, downloadLink });
          setSuccess('Report PDF uploaded to Google Drive successfully');
        }
      }

    } catch (error) {
      console.error('Error in report creation:', error);
      setError(error.message || 'Failed to create report and QR code');
    } finally {
      setUploadingToDrive(false);
    }

    const report = getReportForPatient(patient._id);
    if (report) {
      setTestResults(
        (report.testResults || []).map(tr => {
          // Find the test definition from allTests
          const testObj = allTests.find(t => t._id.toString() === (tr.test._id?.toString() || tr.test?.toString() || tr.test)) || {};
          // Helper to resolve subtest metadata
          const resolveSub = (sub) => {
            let subId = sub.subTest?._id || sub.subTest || sub._id || sub;
            let subDef = (testObj.subtests || []).find(s =>
              (s._id?.toString() === subId?.toString()) ||
              (s.name && sub.name && s.name.trim().toLowerCase() === sub.name.trim().toLowerCase())
            );
            if (!subDef && testObj.packs) {
              for (const pack of testObj.packs) {
                subDef = (pack.subtests || []).find(s =>
                  (s._id?.toString() === subId?.toString()) ||
                  (s.name && sub.name && s.name.trim().toLowerCase() === sub.name.trim().toLowerCase())
                );
                if (subDef) break;
              }
            }
            return {
              _id: subId,
              name: subDef?.name || sub.name || '(Unknown Subtest)',
              unit: subDef?.unit || sub.unit || '',
              range: subDef?.reference || sub.range || '',
              result: sub.result || subDef?.result || '',
              image: subDef?.image || '',
              description: testObj.description || '',
              formula: subDef?.formula || ''
            };
          };
          return {
            test: testObj,
            packs: (tr.packs || []).map(pack => {
              // Find pack definition
              const packDef = (testObj.packs || []).find(p => p.name === pack.packName);
              return {
                packName: pack.packName,
                image: packDef?.image || '',
                subtests: (pack.subtests || []).map(resolveSub)
              };
            }),
            direct: (tr.direct || []).map(resolveSub)
          };
        })
      );
      return;
    }
    // No report exists, load blank form
    const results = (patient.selectedTests || []).map(selTest => {
      const testId = (selTest.test?._id || selTest.test).toString();
      const testSetting = allTests.find(t => t._id.toString() === testId);
      if (!testSetting) return null;
      // Map selected subtests (by name) from selTest.subtests
      const selectedDirect = (selTest.subtests || []).map(selSub => {
        // Find by name in testSetting.subtests
        const subDef = (testSetting.subtests || []).find(s => s.name === selSub.name);
        return {
          _id: subDef?._id || undefined,
          name: selSub.name,
          unit: selSub.unit || subDef?.unit || '',
          range: selSub.reference || subDef?.reference || '',
          result: subDef?.result || '',
          image: subDef?.image || '',
          formula: subDef?.formula || ''
        };
      }).filter(Boolean);
      // Map selected packs (by name) from selTest.packs
      const selectedPacks = (selTest.packs || []).map(selPack => {
        const packDef = (testSetting.packs || []).find(p => p.name === selPack.name || p.name === selPack.packName);
        if (!packDef) return null;
        // Map selected subtests in this pack (by name)
        const selectedPackSubtests = (selPack.subtests || []).map(selSub => {
          const subDef = (packDef.subtests || []).find(s => s.name === selSub.name);
          return {
            _id: subDef?._id || undefined,
            name: selSub.name,
            unit: selSub.unit || subDef?.unit || '',
            range: selSub.reference || subDef?.reference || '',
            result: subDef?.result || '',
            image: subDef?.image || '',
            formula: subDef?.formula || ''
          };
        }).filter(Boolean);
        return {
          packName: packDef.name,
          image: packDef.image || '',
          subtests: selectedPackSubtests
        };
      }).filter(Boolean);
      return {
        test: testSetting,
        packs: selectedPacks,
        direct: selectedDirect
      };
    }).filter(Boolean);
    setTestResults(results);
  };

  const handleResultChange = (testIndex, paramType, paramIndex, field, value) => {
    setTestResults(prev => {
      const newResults = [...prev];
      if (paramType === 'pack') {
        const [packIndex, subIndex] = paramIndex;
        newResults[testIndex].packs[packIndex].subtests[subIndex][field] = value;
      } else {
        newResults[testIndex].direct[paramIndex][field] = value;
      }
      return newResults;
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(testResults);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTestResults(reordered);
  };

  const handlePreviewOpen = () => setPreviewOpen(true);
  const handlePreviewClose = () => setPreviewOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    // If connected to Drive, prepare for Drive update
    let driveUpdateSuccess = false;
    if (driveAuthorized) {
      try {
        setUploadingToDrive(true);
        // Extract file ID from patient's updation links
        if (selectedPatient.updationLinks?.viewLink) {
          const fileId = selectedPatient.updationLinks.viewLink.match(/\/file\/d\/(.*?)(\/|$)/)?.[1];
          if (fileId) {
            // Generate current PDF document
            const pdfDoc = (
              <ReportDocument 
                patient={selectedPatient} 
                testTables={testResults.map(table => ({
                  test: allTests.find(t => t._id.toString() === (table.test._id?.toString() || table.test?.toString())) || table.test,
                  packs: table.packs.map(pack => ({
                    ...pack,
                    subtests: pack.subtests.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
                  })).filter(pack => pack.subtests.length > 0),
                  direct: table.direct.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
                })).filter(tr => tr.packs.length > 0 || tr.direct.length > 0)}
                isPrinting={false}
                removedImages={removedImages} 
                tableNotes={tableNotes}
                qrImage={qrImage}
              />
            );
            
            // Convert to blob
            const pdfBlob = await pdf(pdfDoc).toBlob();
            
            // Update in Drive
            const token = localStorage.getItem('googleDriveAccessToken');
            if (token) {
              const updateResponse = await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
                {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/pdf',
                  },
                  body: pdfBlob
                }
              );
              
              if (updateResponse.ok) {
                driveUpdateSuccess = true;
                setSuccess(prev => prev ? `${prev}. Updated in Google Drive` : 'Updated in Google Drive');
              }
            }
          }
        }
      } catch (err) {
        console.error('Error updating Drive:', err);
        setError('Failed to update Drive file. Will save report locally.');
      } finally {
        setUploadingToDrive(false);
      }
    }

    // Filter out subtests/rows with empty result values before saving
    const filteredTestResults = testResults.map(tr => ({
      ...tr,
      packs: tr.packs.map(pack => ({
        ...pack,
  subtests: pack.subtests.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
      })).filter(pack => pack.subtests.length > 0),
  direct: tr.direct.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
    })).filter(tr => (tr.packs.length > 0 || tr.direct.length > 0));

    if (filteredTestResults.length === 0) {
      setError('Please fill in at least one test result');
      return;
    }

    try {
      const report = getReportForPatient(selectedPatient._id);
      if (report) {
        // Editing existing report: keep existing QR and metadata, only update test results
        await updateReport(report._id, {
          patient: selectedPatient._id,
          uploadStatus: 'needs_update',
          qrCode: report.qrCode, // Keep existing QR code
          testResults: filteredTestResults.map(tr => ({
            test: tr.test._id || tr.test,
            packs: tr.packs.map(pack => ({
              packName: pack.packName,
              subtests: pack.subtests.map(sub => ({
                subTest: sub._id || sub,
                result: sub.result,
                unit: sub.unit,
                range: sub.range
              }))
            })),
            direct: tr.direct.map(sub => ({
              subTest: sub._id || sub,
              result: sub.result,
              unit: sub.unit,
              range: sub.range
            }))
          })),
          // Save the exact state as shown in preview
          reportDisplayData: {
            patient: selectedPatient,
            testTables: buildDisplayData(selectedPatient, filteredTestResults, allTests, subTests, report.reportDisplayData.qrImage).testTables,
            removedImages: Array.from(removedImages),
            tableNotes,
            qrImage: report.reportDisplayData.qrImage // Keep existing QR from the report
          },
          printed: false
        });
        setSuccess('Report updated successfully');
      } else {
        // Creating new report
        // Get the links from local storage if available
        const existingLinks = await getStoredLinks(selectedPatient._id);
        
        // If we have drive links and the update was not successful (hasn't been tried above), try updating drive
        if (existingLinks?.viewLink && driveAuthorized && !driveUpdateSuccess) {
          try {
            setUploadingToDrive(true);
            const fileId = existingLinks.viewLink.match(/\/file\/d\/(.*?)(\/|$)/)?.[1];
            if (fileId) {
              // Generate current PDF document
              const pdfDoc = (
                <ReportDocument 
                  patient={selectedPatient} 
                  testTables={testResults.map(table => ({
                    test: allTests.find(t => t._id.toString() === (table.test._id?.toString() || table.test?.toString())) || table.test,
                    packs: table.packs.map(pack => ({
                      ...pack,
                      subtests: pack.subtests.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
                    })).filter(pack => pack.subtests.length > 0),
                    direct: table.direct.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
                  })).filter(tr => tr.packs.length > 0 || tr.direct.length > 0)}
                  isPrinting={false}
                  removedImages={removedImages} 
                  tableNotes={tableNotes}
                  qrImage={qrImage}
                />
              );
              
              // Convert to blob
              const pdfBlob = await pdf(pdfDoc).toBlob();
              
              // Update in Drive
              const token = localStorage.getItem('googleDriveAccessToken');
              if (token) {
                const updateResponse = await fetch(
                  `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
                  {
                    method: 'PATCH',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/pdf',
                    },
                    body: pdfBlob
                  }
                );
                
                if (updateResponse.ok) {
                  driveUpdateSuccess = true;
                  setSuccess('Updated in Google Drive');
                }
              }
            }
          } catch (err) {
            console.error('Error updating Drive:', err);
            setError('Failed to update Drive file. Will save report locally.');
          } finally {
            setUploadingToDrive(false);
          }
        }
        
        await createReport({
          patientId: selectedPatient._id,
          driveLinks: {
            viewLink: existingLinks?.viewLink || null,
            downloadLink: existingLinks?.downloadLink || null
          },
          testResults: filteredTestResults.map(tr => ({
            test: tr.test._id || tr.test,
            packs: tr.packs.map(pack => ({
              packName: pack.packName,
              subtests: pack.subtests.map(sub => ({
                subTest: sub._id || sub,
                result: sub.result,
                unit: sub.unit,
                range: sub.range
              }))
            })),
            direct: tr.direct.map(sub => ({
              subTest: sub._id || sub,
              result: sub.result,
              unit: sub.unit,
              range: sub.range
            }))
          })),
          reportDisplayData: {
            ...buildDisplayData(selectedPatient, filteredTestResults, allTests, subTests, qrImage),
            qrImage, // Save the QR code in display data
            removedImages: Array.from(removedImages),
            tableNotes
          }
        });
        setSuccess('Report created successfully');
      }

      // Track equipment usage for each test in the report
      // 1. Get all equipment
      const equipmentRes = await getEquipment();
      const equipmentList = equipmentRes.data || [];
      // 2. For each test in the report, decrement stock for all equipment that has that test in testCodes
      const usedTestCodes = testResults.map(tr => {
        // Try both _id and code
        const testObj = allTests.find(t => t._id === tr.test || t._id?.toString() === tr.test?.toString() || t.code === tr.test || t.code === tr.test?.code);
        return testObj?.code;
      }).filter(Boolean);
      for (const code of usedTestCodes) {
        const matchingEquipment = equipmentList.filter(eq => (eq.testCodes || []).includes(code));
        for (const eq of matchingEquipment) {
          await markEquipmentUsed({ equipmentId: eq._id, quantity: 1 });
        }
      }

      // Refresh the table to update status/buttons
      await loadPendingPatientsAndReports();

      // Trigger report list refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('reportUpdated'));

      // Reset patient selection and show the patient list
      setSelectedPatient(null);
      setShowPatientList(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save report');
    }
  };

  // Helper to get report for a patient
  const getReportForPatient = (patientId) => {
    return pendingReports.find(r => r.patient && (r.patient._id === patientId || r.patient === patientId));
  };

  const handlePrintReport = async (report) => {
    if (!report || !report.reportDisplayData) {
      setError('Cannot print this report');
      return;
    }

    setPrintLoading(true);
    try {
      await markReportPrinted(report._id);
      // Update local state so UI reflects printed status immediately
      setPendingReports(prev => prev.map(r =>
        r._id === report._id ? { ...r, printed: true } : r
      ));
      const { pdf } = await import('@react-pdf/renderer');
      // Create document with isPrinting set to true
      const printDoc = (
        <ReportDocument
          patient={report.reportDisplayData.patient}
          testTables={report.reportDisplayData.testTables}
          isPrinting={true}
          removedImages={new Set(report.reportDisplayData.removedImages || [])}
          tableNotes={report.reportDisplayData.tableNotes || {}}
          qrImage={report.reportDisplayData.qrImage} // Use the saved QR image
        />
      );
      const blob = await pdf(printDoc).toBlob();

      const url = URL.createObjectURL(blob);
      const printWindow = window.open();
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>Print Report</title></head><body style='margin:0'>` +
          `<iframe src='${url}' style='width:100vw;height:100vh;border:none;' id='pdfFrame'></iframe>` +
          `<script>
            const iframe = document.getElementById('pdfFrame');
            iframe.onload = function() {
              setTimeout(function() { iframe.contentWindow.print(); }, 300);
            };
          </script>` +
          `</body></html>`
        );
      }

      setSuccess('Print dialog opened. Please print from the new tab.');
    } catch (err) {
      console.error('Error printing report:', err);
      setError('Failed to print report');
    } finally {
      setPrintLoading(false);
    }
  };

  // Replace the old buildDisplayData function with the improved version
  function buildDisplayData(patient, testResults, allTests, subTests, savedData = null) {
    const displayPatient = {
      name: patient?.name || '-',
      age: patient?.age || '-',
      gender: patient?.gender || '-',
      regNo: patient?.regNo || '-',
      sampleCollectionDate: patient?.sampleCollectionDate || '-',
      refDoctor: patient?.refDoctor?.name ? { name: patient.refDoctor.name } : { name: '-' },
      refAgent: patient?.refAgent?.name ? { name: patient.refAgent.name } : { name: '-' },
      mobileNumber: patient?.mobileNumber || '-',
    };

    // Keep existing removed images and table notes if updating existing report
    const removedImagesSet = savedData?.removedImages ? 
      new Set(savedData.removedImages) : 
      new Set(Array.from(removedImages || []));

    // Helper to resolve subtest details from master list
      const resolveSub = (sub) => {
      let subId = sub.subTest?._id || sub.subTest || sub._id || sub;
      let subDef = subTests.find(s => s._id?.toString() === subId?.toString());
        return {
        _id: subId,
        name: subDef?.name || sub.name || '',
        unit: subDef?.unit || sub.unit || '',
        range: subDef?.reference || sub.range || '',
        result: sub.result || '',
        image: subDef?.image || sub.image || ''
      };
    };

    const displayTestTables = (testResults || []).map((tr, testIndex) => {
      // Always resolve test from allTests
      const testObj = allTests.find(t => t._id.toString() === (tr.test._id?.toString() || tr.test?.toString() || tr.test)) || {};
      
      // Filter out empty result rows
  const filteredDirect = (tr?.direct || []).filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result);
      const filteredPacks = (tr?.packs || []).map(pack => {
        const packDef = (testObj.packs || []).find(p => p.name === pack.packName);
        return {
          packName: pack.packName,
          image: packDef?.image || pack.image || '',
          subtests: (pack?.subtests || []).filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result).map(resolveSub)
        };
      }).filter(pack => pack.subtests.length > 0); // Remove packs with no valid subtests
      
    return {
      test: { ...testObj, image: testObj?.image || '' },
      packs: filteredPacks,
      direct: filteredDirect.map(resolveSub)
    };
  });

  return {
    patient: displayPatient,
    testTables: displayTestTables,
    removedImages: Array.from(removedImagesSet),
    tableNotes: savedData?.tableNotes || tableNotes || {}
  };
  }

  // Filter patients by sampleCollectionDate (date only)
  const filteredPatients = patients.filter(p => {
    if (!p.sampleCollectionDate) return false;
    const d1 = new Date(p.sampleCollectionDate); d1.setHours(0,0,0,0);
    const d2 = new Date(filterDate); d2.setHours(0,0,0,0);
    return d1.getTime() === d2.getTime();
  });

  // Calculate stats for the summary cards
  const totalToday = filteredPatients.length;
  const reportsCreated = filteredPatients.filter(p => getReportForPatient(p._id)).length;
  const printedCount = filteredPatients.filter(p => {
    const r = getReportForPatient(p._id);
    return r && r.printed;
  }).length;
  const pendingCount = reportsCreated - printedCount;

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };
  const scaleUp = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <Box sx={{
      minHeight: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      bgcolor: '#F8FAFC',
    }}>
      {/* ── Background Image ─────────────────────────────────── */}
      <Box sx={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url(/report_bg_light.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 1,
        zIndex: 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.2)',
        }
      }} />

      <Box sx={{ position: 'relative', zIndex: 1, pt: 3, pb: 6, px: { xs: 2, md: 4, lg: 6 }, width: '100%', maxWidth: '1600px', mx: 'auto' }}>
        <AnimatePresence mode="wait">
          {!selectedPatient ? (
            <motion.div key="table-view" variants={staggerContainer} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}>
              
              {/* Header Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 6, gap: 3 }}>
              <motion.div variants={fadeUp}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.1em', mb: 1, textTransform: 'uppercase' }}>
                  REPORTS
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Create Report
                </Typography>
                <Typography sx={{ color: 'var(--text-secondary)', maxWidth: 500, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Build, review and dispatch patient diagnostic reports. Actions stay in sync across your team in real time.
                </Typography>
              </motion.div>

              <motion.div variants={scaleUp}>
                {driveAuthChecked && (
                  driveAuthorized ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<CheckCircleOutlineIcon sx={{ color: '#10B981 !important' }} />}
                        label="Google Drive Connected"
                        sx={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700, borderRadius: '100px', border: '1px solid rgba(16,185,129,0.2)' }}
                      />
                      <Button
                        onClick={handleSignOut}
                        sx={{ minWidth: 'auto', p: 1, color: '#EF4444', '&:hover': { background: 'rgba(239,68,68,0.1)' }, borderRadius: '100px' }}
                      >
                        <LogoutIcon />
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<CloudQueueIcon />}
                      onClick={() => tokenClient?.requestAccessToken()}
                      disabled={gisLoading}
                      sx={{
                        background: '#0F6E56',
                        color: '#fff',
                        fontWeight: 700,
                        px: 4, py: 1.5,
                        borderRadius: '100px',
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        boxShadow: '0 8px 24px rgba(15,110,86,0.3)',
                        '&:hover': { background: '#0B5240', boxShadow: '0 12px 32px rgba(15,110,86,0.4)' },
                      }}
                    >
                      {gisLoading ? 'Connecting...' : 'Connect Google Drive'}
                    </Button>
                  )
                )}
              </motion.div>
            </Box>

            {/* Stats Cards Section */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
              {[
                { title: 'TOTAL TODAY', value: totalToday, delay: 0 },
                { title: 'REPORTS CREATED', value: reportsCreated, delay: 0.1 },
                { title: 'PRINTED', value: printedCount, delay: 0.2 },
                { title: 'PENDING', value: pendingCount, delay: 0.3 }
              ].map((stat, idx) => (
                <motion.div key={idx} variants={scaleUp} custom={stat.delay}>
                  <Box sx={{
                    p: 3,
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute', top: 0, right: 0, bottom: 0, left: '50%',
                      background: 'radial-gradient(circle at center right, rgba(16,185,129,0.1) 0%, transparent 70%)',
                      zIndex: 0
                    }} />
                    <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>

            {/* Main Table Container */}
            <motion.div variants={fadeUp}>
              <Box sx={{
                borderRadius: '32px',
                background: '#fff',
                boxShadow: '0 24px 64px rgba(0,0,0,0.06)',
                border: '1px solid rgba(30,41,59,0.05)',
                overflow: 'hidden',
                mb: 4
              }}>
                {/* Table Toolbar */}
                <Box sx={{ p: 3, px: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(30,41,59,0.05)', gap: 3 }}>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={filterDate}
                        onChange={date => { if(date) setFilterDate(date); }}
                        format="dd-MM-yyyy"
                        slotProps={{
                          textField: {
                            size: "small",
                            sx: {
                              width: 160,
                              '& .MuiOutlinedInput-root': { borderRadius: '100px', background: '#F8FAFC', fontWeight: 600 }
                            }
                          }
                        }}
                      />
                    </LocalizationProvider>
                    <Button 
                      onClick={() => setFilterDate(new Date())}
                      sx={{ borderRadius: '100px', px: 3, color: '#0F6E56', border: '1px solid rgba(15,110,86,0.3)', fontWeight: 600, '&:hover': { background: 'rgba(15,110,86,0.05)' } }}
                    >
                      Today
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <OutlinedInput
                      size="small"
                      placeholder="Search patient or ID"
                      startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>}
                      sx={{ borderRadius: '100px', width: { xs: '100%', md: 240 }, background: '#F8FAFC' }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        background: '#0F6E56', color: '#fff', borderRadius: '100px', px: 3, py: 1, fontWeight: 700, textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(15,110,86,0.2)', '&:hover': { background: '#0B5240' }
                      }}
                    >
                      New
                    </Button>
                  </Box>

                </Box>

                {/* Table Content */}
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow sx={{ '& th': { borderBottom: 'none', py: 3 } }}>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', pl: 5 }}>ID</TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>PATIENT</TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', align: 'center' }}>REPORT</TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', align: 'center' }}>SAVE</TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', align: 'center' }}>PRINT</TableCell>
                        <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', align: 'right', pr: 5 }}>ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <AnimatePresence>
                        {filteredPatients.map((patient, idx) => {
                          const report = getReportForPatient(patient._id);
                          const isSaved = !!report;
                          const isPrinted = report && report.printed;
                          
                          // Parse simple ID number from regNo if it's like 00005
                          const simpleId = (patient.regNo || '').toString().replace(/^0+/, '');

                          return (
                            <motion.tr
                              key={patient._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                              whileHover={{ 
                                scale: 1.005,
                                backgroundColor: 'rgba(16,185,129,0.03)',
                                boxShadow: 'inset 4px 0 0 #0F6E56'
                              }}
                              style={{ 
                                borderBottom: '1px solid rgba(30,41,59,0.03)',
                                transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
                              }}
                            >
                              <TableCell sx={{ pl: 5, borderBottom: 'none' }}>
                                <Typography sx={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}># {simpleId || idx+1}</Typography>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#0F6E56', fontWeight: 800, fontSize: '0.9rem', width: 40, height: 40 }}>
                                    {patient.name.substring(0,2).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{patient.name}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patient ID • {patient.regNo}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center" sx={{ borderBottom: 'none' }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<EditIcon sx={{ fontSize: '1rem' }} />}
                                  onClick={() => handlePatientSelect(patient)}
                                  sx={{
                                    borderRadius: '100px',
                                    color: 'var(--text-secondary)',
                                    borderColor: 'var(--border-light)',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    px: 2,
                                    '&:hover': { background: '#F8FAFC', borderColor: 'var(--text-secondary)' }
                                  }}
                                >
                                  {isSaved ? 'Edit' : 'Create'}
                                </Button>
                              </TableCell>
                              <TableCell align="center" sx={{ borderBottom: 'none' }}>
                                {isSaved ? (
                                  <Chip
                                    icon={<CheckCircleOutlineIcon sx={{ color: '#10B981 !important' }} />}
                                    label="Saved"
                                    sx={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', fontWeight: 700, borderRadius: '100px', border: '1px solid rgba(16,185,129,0.2)' }}
                                  />
                                ) : (
                                  <Chip
                                    icon={<RadioButtonUncheckedIcon sx={{ color: 'var(--text-muted) !important' }} />}
                                    label="Not saved"
                                    sx={{ background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, borderRadius: '100px', border: '1px solid var(--border-light)' }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center" sx={{ borderBottom: 'none' }}>
                                {isPrinted ? (
                                  <Chip
                                    label="Printed"
                                    sx={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', fontWeight: 700, borderRadius: '100px', border: '1px solid rgba(16,185,129,0.2)' }}
                                  />
                                ) : (
                                  <Chip
                                    label="Not printed"
                                    sx={{ background: 'rgba(249,115,22,0.08)', color: '#EA580C', fontWeight: 700, borderRadius: '100px', border: '1px solid rgba(249,115,22,0.2)' }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="right" sx={{ pr: 5, borderBottom: 'none' }}>
                                {isSaved && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<PreviewIcon sx={{ fontSize: '1rem' }} />}
                                      onClick={() => {
                                        const reportDisplayData = report.reportDisplayData;
                                        setSelectedPatient(reportDisplayData.patient);
                                        setQrImage(reportDisplayData.qrImage);
                                        const savedTestTables = reportDisplayData.testTables;
                                        setTestResults(savedTestTables.map(table => ({
                                          test: table.test,
                                          packs: table.packs.map(pack => ({
                                            packName: pack.packName,
                                            subtests: pack.subtests.map(sub => ({
                                              name: sub.name,
                                              result: sub.result,
                                              unit: sub.unit,
                                              range: sub.range
                                            }))
                                          })),
                                          direct: table.direct.map(sub => ({
                                            name: sub.name,
                                            result: sub.result,
                                            unit: sub.unit,
                                            range: sub.range
                                          }))
                                        })));
                                        setRemovedImages(new Set(reportDisplayData.removedImages || []));
                                        setTableNotes(reportDisplayData.tableNotes || {});
                                        setPreviewOpen(true);
                                      }}
                                      sx={{ borderRadius: '100px', color: 'var(--text-secondary)', borderColor: 'var(--border-light)', fontWeight: 700, textTransform: 'none', '&:hover': { background: '#F8FAFC' } }}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<PrintIcon sx={{ fontSize: '1rem' }} />}
                                      onClick={() => handlePrintReport(report)}
                                      disabled={printLoading}
                                      sx={{ borderRadius: '100px', background: '#0F6E56', color: '#fff', fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#0B5240', boxShadow: '0 4px 12px rgba(15,110,86,0.3)' } }}
                                    >
                                      Print
                                    </Button>
                                  </Box>
                                )}
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </motion.div>
            </motion.div>
          ) : (
            <motion.div key="edit-view" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>
                    Edit Report
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.02em' }}>
                    {selectedPatient?.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button onClick={() => setSelectedPatient(null)} sx={{ color: 'var(--text-secondary)', fontWeight: 700, borderRadius: '100px', px: 4, background: '#fff', border: '1px solid var(--border-light)', '&:hover': { background: '#F8FAFC' } }}>
                    Cancel
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<PreviewIcon />}
                    onClick={() => setPreviewOpen(true)}
                    sx={{ borderRadius: '100px', color: '#0F6E56', borderColor: 'rgba(15,110,86,0.3)', fontWeight: 700, px: 3, background: '#fff', '&:hover': { background: 'rgba(15,110,86,0.05)' } }}
                  >
                    Preview PDF
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    variant="contained" 
                    disabled={printing}
                    sx={{ background: '#0F6E56', color: '#fff', fontWeight: 700, borderRadius: '100px', px: 6, boxShadow: '0 8px 24px rgba(15,110,86,0.3)', '&:hover': { background: '#0B5240' } }}
                  >
                    {printing ? 'Saving...' : 'Save Report'}
                  </Button>
                </Box>
              </Box>

              <Box sx={glassCardSx}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, color: '#334155' }}>Enter Test Results</Typography>
                
                <Box component="form" onSubmit={handleSubmit}>
                  {testResults.map((table, tableIndex) => (
                    <Box key={tableIndex} sx={{ 
                      mb: 4, 
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.3) 100%)',
                      backdropFilter: 'blur(24px)',
                      p: { xs: 3, md: 4 }, 
                      borderRadius: 'var(--radius-xl)', 
                      border: '1px solid rgba(16,185,129,0.3)', 
                      boxShadow: '0 12px 36px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' 
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography sx={{ fontWeight: 800, color: '#0F6E56', fontSize: '1.25rem' }}>
                          {table.test.name}
                        </Typography>
                        {table.test.image && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color={removedImages.has(`${tableIndex}-test`) ? "primary" : "error"}
                            onClick={() => toggleImageRemoval(tableIndex, 'test')}
                            sx={{ borderRadius: '100px', fontWeight: 700, textTransform: 'none' }}
                          >
                            {removedImages.has(`${tableIndex}-test`) ? 'Add Image' : 'Remove Image'}
                          </Button>
                        )}
                      </Box>

                      {/* Direct Subtests Header */}
                      {table.direct.length > 0 && (
                        <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '2fr 3fr 2fr 1fr', gap: 3, mb: 1, px: 1 }}>
                          <Typography sx={fieldLabelSx}>TEST NAME</Typography>
                          <Typography sx={fieldLabelSx}>RESULT</Typography>
                          <Typography sx={fieldLabelSx}>REFERENCE</Typography>
                          <Typography sx={fieldLabelSx}>UNIT</Typography>
                        </Box>
                      )}

                      {/* Direct Subtests */}
                      {table.direct.map((sub, subIndex) => (
                        <Box key={subIndex} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 3fr 2fr 1fr' }, gap: 3, mb: 2, alignItems: 'center' }}>
                          <Typography sx={fieldLabelSx}>{sub.name}</Typography>
                          <TextField
                            fullWidth
                            variant="filled"
                            InputProps={{ disableUnderline: true }}
                            value={sub.result}
                            onChange={(e) => handleResultChange(tableIndex, 'direct', subIndex, 'result', e.target.value)}
                            placeholder="Enter result..."
                            sx={glassFieldSx}
                          />
                          <TextField
                            fullWidth
                            variant="filled"
                            InputProps={{ disableUnderline: true }}
                            value={sub.range}
                            onChange={(e) => handleResultChange(tableIndex, 'direct', subIndex, 'range', e.target.value)}
                            placeholder="Reference..."
                            sx={glassFieldSx}
                          />
                          <TextField
                            fullWidth
                            variant="filled"
                            InputProps={{ disableUnderline: true }}
                            value={sub.unit}
                            onChange={(e) => handleResultChange(tableIndex, 'direct', subIndex, 'unit', e.target.value)}
                            placeholder="Unit..."
                            sx={glassFieldSx}
                          />
                        </Box>
                      ))}

                      {table.direct.length > 0 && (
                        <TextField
                          fullWidth
                          variant="filled"
                          InputProps={{ disableUnderline: true }}
                          label="Add Note (Optional)"
                          value={tableNotes[`${tableIndex}-direct`] || ''}
                          onChange={(e) => handleNoteChange(tableIndex, 'direct', null, e.target.value)}
                          sx={{ mt: 2, ...glassFieldSx }}
                        />
                      )}

                      {/* Pack Subtests */}
                      {table.packs.map((pack, packIndex) => (
                        <Box key={packIndex} sx={{ mt: 5, pt: 4, borderTop: '1px dashed var(--border-light)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography sx={{ fontWeight: 800, color: '#334155', fontSize: '1.1rem' }}>
                              {pack.packName}
                            </Typography>
                            {pack.image && (
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color={removedImages.has(`${tableIndex}-pack-${packIndex}`) ? "primary" : "error"}
                                onClick={() => toggleImageRemoval(tableIndex, 'pack', packIndex)}
                                sx={{ borderRadius: '100px', fontWeight: 700, textTransform: 'none' }}
                              >
                                {removedImages.has(`${tableIndex}-pack-${packIndex}`) ? 'Add Image' : 'Remove Image'}
                              </Button>
                            )}
                          </Box>

                          {/* Pack Subtests Header */}
                          {pack.subtests.length > 0 && (
                            <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '2fr 3fr 2fr 1fr', gap: 3, mb: 1, px: 1 }}>
                              <Typography sx={fieldLabelSx}>TEST NAME</Typography>
                              <Typography sx={fieldLabelSx}>RESULT</Typography>
                              <Typography sx={fieldLabelSx}>REFERENCE</Typography>
                              <Typography sx={fieldLabelSx}>UNIT</Typography>
                            </Box>
                          )}

                          {pack.subtests.map((sub, subIndex) => (
                            <Box key={subIndex} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 3fr 2fr 1fr' }, gap: 3, mb: 2, alignItems: 'center' }}>
                              <Typography sx={fieldLabelSx}>{sub.name}</Typography>
                              <TextField
                                fullWidth
                                variant="filled"
                                InputProps={{ disableUnderline: true }}
                                value={sub.result}
                                onChange={(e) => handleResultChange(tableIndex, 'pack', [packIndex, subIndex], 'result', e.target.value)}
                                placeholder="Enter result..."
                                sx={glassFieldSx}
                              />
                              <TextField
                                fullWidth
                                variant="filled"
                                InputProps={{ disableUnderline: true }}
                                value={sub.range}
                                onChange={(e) => handleResultChange(tableIndex, 'pack', [packIndex, subIndex], 'range', e.target.value)}
                                placeholder="Reference..."
                                sx={glassFieldSx}
                              />
                              <TextField
                                fullWidth
                                variant="filled"
                                InputProps={{ disableUnderline: true }}
                                value={sub.unit}
                                onChange={(e) => handleResultChange(tableIndex, 'pack', [packIndex, subIndex], 'unit', e.target.value)}
                                placeholder="Unit..."
                                sx={glassFieldSx}
                              />
                            </Box>
                          ))}
                          <TextField
                            fullWidth
                            variant="filled"
                            InputProps={{ disableUnderline: true }}
                            label="Add Note for Pack (Optional)"
                            value={tableNotes[`${tableIndex}-pack-${packIndex}`] || ''}
                            onChange={(e) => handleNoteChange(tableIndex, 'pack', packIndex, e.target.value)}
                            sx={{ mt: 2, ...glassFieldSx }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Preview Dialog (Now activated by button) */}
        <Dialog
          open={previewOpen}
          onClose={handlePreviewClose}
          maxWidth="lg"
          fullWidth
          TransitionComponent={Transition}
          PaperProps={{ sx: { borderRadius: 'var(--radius-2xl)', overflow: 'hidden', minHeight: '85vh' } }}
          sx={{ backdropFilter: 'blur(8px)' }}
        >
          <DialogTitle sx={{ px: 4, py: 3, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-light)', fontWeight: 800, color: 'var(--text-primary)' }}>
            Report Preview
            <IconButton onClick={handlePreviewClose} sx={{ color: 'var(--text-secondary)' }}>
              ×
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, bgcolor: '#e2e8f0' }}>
            <PDFPreview 
              document={
                <ReportDocument 
                  patient={selectedPatient} 
                  testTables={testResults.map(table => ({
                    test: allTests.find(t => t._id.toString() === (table.test._id?.toString() || table.test?.toString())) || table.test,
                    packs: table.packs.map(pack => ({
                      ...pack,
                      subtests: pack.subtests.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
                    })).filter(pack => pack.subtests.length > 0),
                    direct: table.direct.filter(sub => typeof sub.result === 'string' ? sub.result.trim() !== '' : !!sub.result)
                  })).filter(tr => tr.packs.length > 0 || tr.direct.length > 0)}
                  isPrinting={false} // Keep false for preview to show background
                  removedImages={removedImages} 
                  tableNotes={tableNotes}
                  qrImage={qrImage}
                />
              } 
            />
          </DialogContent>
        </Dialog>

        {/* Loading backdrop while uploading to Drive */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={uploadingToDrive}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" />
            <Typography>
              {driveAuthorized ? 'Uploading to Google Drive...' : 'Creating Report QR Code...'}
            </Typography>
          </Box>
        </Backdrop>

        {error && (
          <Snackbar open autoHideDuration={6000} onClose={() => setError('')}>
            <Alert severity="error" variant="filled">{error}</Alert>
          </Snackbar>
        )}
        {success && (
          <Snackbar open autoHideDuration={6000} onClose={() => setSuccess('')}>
            <Alert severity="success" variant="filled">{success}</Alert>
          </Snackbar>
        )}
      </Box>
    </Box>
  );
}

// ── Reusable Styles ──────────────────────────────────────────────────────────

const glassCardSx = {
  p: { xs: 3, md: 5 },
  borderRadius: 'var(--radius-2xl)',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
};

const glassFieldSx = {
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(255,255,255,0.7)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: '2.5rem',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.65)',
      borderColor: 'rgba(16,185,129,0.5)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255,255,255,1)',
      borderColor: '#10B981',
      boxShadow: '0 0 0 3px rgba(16,185,129,0.15)',
    },
  },
  '& .MuiFilledInput-input': {
    color: '#0F172A',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: '12px 14px',
    '&::placeholder': { color: '#64748B', opacity: 1 },
  },
  '& .MuiInputLabel-root': {
    color: '#475569',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#10B981',
    fontWeight: 700,
  }
};

const fieldLabelSx = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#475569',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  mb: 0.4,
};

export default CreateReport;
