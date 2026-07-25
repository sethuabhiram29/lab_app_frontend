const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/ShareReport.js');
let code = fs.readFileSync(filePath, 'utf8');

const returnStart = code.lastIndexOf('  return (\n    <Box p={3}>');
const returnStartWin = code.lastIndexOf('  return (\r\n    <Box p={3}>');
const startIndex = returnStart !== -1 ? returnStart : returnStartWin;

if (startIndex === -1) {
  console.log('Could not find start index in ShareReport.js');
  process.exit(1);
}

const endString = 'export default ShareReport;';
const endIndex = code.lastIndexOf(endString);

if (endIndex === -1) {
  console.log('Could not find end index in ShareReport.js');
  process.exit(1);
}

// Check imports
if (!code.includes('CheckCircleOutlineIcon')) {
  code = code.replace('import CloudUploadIcon from', `import {
  Search as SearchIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Event as EventIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CloudQueue as CloudQueueIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon
} from '@mui/icons-material';\nimport { Avatar, InputAdornment, OutlinedInput, Chip } from '@mui/material';\nimport CloudUploadIcon from`);
}

const prefix = code.substring(0, startIndex);
const suffix = '\n\n' + endString + '\n';

const newUI = `  // Calculate stats for the summary cards
  const totalReports = filteredReports.length;
  const withLinks = filteredReports.filter(r => r.patient?.updationLinks?.viewLink || r.patient?.updationLinks?.downloadLink).length;
  const pendingLinks = totalReports - withLinks;

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
    <Box sx={{ minHeight: '100vh', background: 'var(--surface-light)', pb: 8 }}>
      {/* Top Header Background Gradient */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '40vh',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(124,58,237,0.1) 100%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 4, md: 8 } }}>
        <AnimatePresence>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            
            {/* Header Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 6, gap: 3 }}>
              <motion.div variants={fadeUp}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.1em', mb: 1, textTransform: 'uppercase' }}>
                  DISPATCH
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Share Report
                </Typography>
                <Typography sx={{ color: 'var(--text-secondary)', maxWidth: 500, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Distribute patient reports securely via WhatsApp, Email, or direct links. Connect Google Drive to enable cloud sharing.
                </Typography>
              </motion.div>

              <motion.div variants={scaleUp}>
                {driveAuthChecked && (
                  driveAuthorized ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<CheckCircleOutlineIcon sx={{ color: '#8B5CF6 !important' }} />}
                        label="Google Drive Connected"
                        sx={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 700, borderRadius: '100px', border: '1px solid rgba(139,92,246,0.2)' }}
                      />
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<CloudQueueIcon />}
                      onClick={handleDriveAuth}
                      disabled={!tokenClient}
                      sx={{
                        background: '#8B5CF6', color: '#fff', fontWeight: 700, px: 4, py: 1.5,
                        borderRadius: '100px', textTransform: 'none', fontSize: '0.95rem',
                        boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
                        '&:hover': { background: '#7C3AED', boxShadow: '0 12px 32px rgba(139,92,246,0.4)' },
                      }}
                    >
                      Connect Google Drive
                    </Button>
                  )
                )}
              </motion.div>
            </Box>

            {/* Stats Cards Section */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
              {[
                { title: 'TOTAL REPORTS', value: totalReports, delay: 0 },
                { title: 'WITH LINKS', value: withLinks, delay: 0.1 },
                { title: 'PENDING UPLOAD', value: pendingLinks, delay: 0.2 },
                { title: 'SHARED TODAY', value: '-', delay: 0.3 }
              ].map((stat, idx) => (
                <motion.div key={idx} variants={scaleUp} custom={stat.delay}>
                  <Box sx={{
                    p: 3, borderRadius: '24px', background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute', top: 0, right: 0, bottom: 0, left: '50%',
                      background: 'radial-gradient(circle at center right, rgba(139,92,246,0.1) 0%, transparent 70%)', zIndex: 0
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
                borderRadius: '32px', background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.06)',
                border: '1px solid rgba(30,41,59,0.05)', overflow: 'hidden', mb: 4
              }}>
                {/* Table Toolbar */}
                <Box sx={{ p: 3, px: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(30,41,59,0.05)', gap: 3 }}>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                      type="date"
                      size="small"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '100px', background: '#F8FAFC', fontWeight: 600, width: 160 } }}
                    />
                    <Button 
                      onClick={() => setSelectedDate(getLocalTodayString())}
                      sx={{ borderRadius: '100px', px: 3, color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', fontWeight: 600, '&:hover': { background: 'rgba(139,92,246,0.05)' } }}
                    >
                      Today
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <OutlinedInput
                      size="small"
                      placeholder="Search patient..."
                      startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>}
                      sx={{ borderRadius: '100px', width: { xs: '100%', md: 240 }, background: '#F8FAFC' }}
                    />
                  </Box>

                </Box>

                {/* Table Content */}
                {filteredReports.length === 0 ? (
                  <Box p={6} textAlign="center">
                    <Typography color="textSecondary">No reports found for this date.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { borderBottom: 'none', py: 3 } }}>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', pl: 5 }}>ID</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>PATIENT</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>DATE</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>DRIVE LINKS</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', align: 'right', pr: 5 }}>ACTIONS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {filteredReports.filter(report => {
                            const hasDisplay = !!report.reportDisplayData && Object.keys(report.reportDisplayData).length > 0;
                            return hasDisplay;
                          }).map((report, idx) => {
                            const patient = report.patient;
                            const patientName = patient?.name || 'Unknown Patient';
                            const patientId = patient?.regNo || '-';
                            const simpleId = (patientId || '').toString().replace(/^0+/, '');
                            const reportDate = patient?.sampleCollectionDate || report.createdAt
                              ? new Date(report.reportDisplayData.patient?.sampleCollectionDate || report.createdAt).toLocaleDateString()
                              : '-';
                            
                            const hasLinks = !!(patient?.updationLinks?.viewLink || patient?.updationLinks?.downloadLink);

                            return (
                              <motion.tr
                                key={report._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ 
                                  scale: 1.005,
                                  backgroundColor: 'rgba(139,92,246,0.03)',
                                  boxShadow: 'inset 4px 0 0 #8B5CF6'
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
                                    <Avatar sx={{ bgcolor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontWeight: 800, fontSize: '0.9rem', width: 40, height: 40 }}>
                                      {patientName.substring(0,2).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{patientName}</Typography>
                                      <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patient ID • {patientId}</Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  <Typography sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{reportDate}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  {hasLinks ? (
                                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                      {patient.updationLinks.viewLink && (
                                        <Link 
                                          href={patient.updationLinks.viewLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          sx={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', fontWeight: 800, textDecoration: 'none', background: 'rgba(16,185,129,0.1)', px: 1.5, py: 0.5, borderRadius: '100px' }}
                                        >
                                          <LinkIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} /> View
                                        </Link>
                                      )}
                                      {patient.updationLinks.downloadLink && (
                                        <Link 
                                          href={patient.updationLinks.downloadLink}
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          sx={{ fontSize: '0.75rem', color: '#3B82F6', display: 'flex', alignItems: 'center', fontWeight: 800, textDecoration: 'none', background: 'rgba(59,130,246,0.1)', px: 1.5, py: 0.5, borderRadius: '100px' }}
                                        >
                                          <DownloadIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} /> Download
                                        </Link>
                                      )}
                                    </Box>
                                  ) : (
                                    <Chip
                                      icon={<RadioButtonUncheckedIcon sx={{ color: 'var(--text-muted) !important' }} />}
                                      label="No links"
                                      size="small"
                                      sx={{ background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, borderRadius: '100px', border: '1px solid var(--border-light)' }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 5, borderBottom: 'none' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<PreviewIcon sx={{ fontSize: '1rem' }} />}
                                      onClick={() => handleViewPdf(report)}
                                      sx={{ borderRadius: '100px', color: 'var(--text-secondary)', borderColor: 'var(--border-light)', fontWeight: 700, textTransform: 'none', '&:hover': { background: '#F8FAFC' } }}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      onClick={() => handleShareWhatsApp(report)} 
                                      startIcon={<WhatsAppIcon sx={{ fontSize: '1rem' }} />}
                                      sx={{ borderRadius: '100px', background: '#22C55E', color: '#fff', fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#16A34A', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' } }}
                                    >
                                      WhatsApp
                                    </Button>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => handleEmailShare(report)}
                                      startIcon={<EmailIcon sx={{ fontSize: '1rem' }} />}
                                      sx={{ borderRadius: '100px', background: '#8B5CF6', color: '#fff', fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#7C3AED', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' } }}
                                    >
                                      Email
                                    </Button>
                                  </Box>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Dialogs */}
        <Dialog open={whatsAppDialogOpen} onClose={() => setWhatsAppDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Share via WhatsApp</DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>Select Recipient</FormLabel>
              <RadioGroup value={whatsAppRecipient} onChange={(e) => { setWhatsAppRecipient(e.target.value); setCustomPhone(''); }}>
                <FormControlLabel value="patient" control={<Radio color="primary" />} label={\`Patient (\${whatsAppReport?.reportDisplayData.patient?.mobileNumber || 'N/A'})\`} />
                <FormControlLabel value="doctor" control={<Radio color="primary" />} label={\`Doctor (\${whatsAppReport?.reportDisplayData.patient?.refDoctor?.contact || 'N/A'})\`} />
                <FormControlLabel value="custom" control={<Radio color="primary" />} label="Custom Number" />
              </RadioGroup>
            </FormControl>
            {whatsAppRecipient === 'custom' && (
              <TextField fullWidth margin="normal" label="Custom Phone Number (10 digits)" value={customPhone} onChange={(e) => setCustomPhone(e.target.value)} placeholder="Enter 10 digit mobile number" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setWhatsAppDialogOpen(false)} sx={{ borderRadius: '100px', fontWeight: 700 }}>Cancel</Button>
            <Button onClick={handleWhatsAppSend} variant="contained" disabled={sharingLoading} sx={{ background: '#22C55E', color: '#fff', borderRadius: '100px', fontWeight: 700, '&:hover': { background: '#16A34A' } }}>
              {sharingLoading ? 'Preparing...' : 'Open WhatsApp'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Share via Email</DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>Select Recipient</FormLabel>
              <RadioGroup value={emailRecipient} onChange={(e) => { setEmailRecipient(e.target.value); setCustomEmail(''); }}>
                <FormControlLabel value="patient" control={<Radio color="primary" />} label={\`Patient (\${emailReport?.reportDisplayData.patient?.email || 'N/A'})\`} />
                <FormControlLabel value="doctor" control={<Radio color="primary" />} label={\`Doctor (\${emailReport?.reportDisplayData.patient?.refDoctor?.email || 'N/A'})\`} />
                <FormControlLabel value="custom" control={<Radio color="primary" />} label="Custom Email" />
              </RadioGroup>
            </FormControl>
            {emailRecipient === 'custom' && (
              <TextField fullWidth margin="normal" label="Custom Email Address" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} placeholder="Enter email address" size="small" type="email" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setEmailDialogOpen(false)} sx={{ borderRadius: '100px', fontWeight: 700 }}>Cancel</Button>
            <Button onClick={handleEmailSend} variant="contained" disabled={sharingLoading} sx={{ background: '#8B5CF6', color: '#fff', borderRadius: '100px', fontWeight: 700, '&:hover': { background: '#7C3AED' } }}>
              {sharingLoading ? 'Preparing...' : 'Open Email Client'}
            </Button>
          </DialogActions>
        </Dialog>

        {previewOpen && (
          <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Report Preview <IconButton onClick={() => setPreviewOpen(false)} sx={{ float: 'right' }}><CloseIcon /></IconButton></DialogTitle>
            <DialogContent>
              {selectedReport && getReportDocumentFor(selectedReport, false) && (
                <PDFPreview document={getReportDocumentFor(selectedReport, false)} />
              )}
            </DialogContent>
          </Dialog>
        )}

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}

export default ShareReport;
`;

fs.writeFileSync('src/components/ShareReport.js', code.substring(0, startIndex) + newUI);
console.log('Done ShareReport.js!');
