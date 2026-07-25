const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/CreateReport.js');
let code = fs.readFileSync(filePath, 'utf8');

const returnStart = code.lastIndexOf('  return (\n    <Container maxWidth="lg">');
const returnStartWin = code.lastIndexOf('  return (\r\n    <Container maxWidth="lg">');
const startIndex = returnStart !== -1 ? returnStart : returnStartWin;

if (startIndex === -1) {
  console.log('Could not find start index');
  process.exit(1);
}

const endString = 'export default CreateReport;';
const endIndex = code.lastIndexOf(endString);

if (endIndex === -1) {
  console.log('Could not find end index');
  process.exit(1);
}

const prefix = code.substring(0, startIndex);
const suffix = '\n\n' + endString + '\n';

const newUI = `  // Calculate stats for the summary cards
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
    <Box sx={{ minHeight: '100vh', background: 'var(--surface-light)', pb: 8 }}>
      {/* Top Header Background Gradient (Subtle Green Mesh) */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '40vh',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(15,110,86,0.1) 100%)',
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
                          const simpleId = patient.regNo.replace(/^0+/, '');

                          return (
                            <motion.tr
                              key={patient._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              style={{ borderBottom: '1px solid rgba(30,41,59,0.03)' }}
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
        </AnimatePresence>

        {/* Edit Report Dialog - Shows when a patient is selected for editing */}
        <Dialog
          open={!!selectedPatient && !previewOpen}
          onClose={() => setSelectedPatient(null)}
          maxWidth="xl"
          fullWidth
          TransitionComponent={Transition}
          PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', minHeight: '90vh' } }}
          sx={{ backdropFilter: 'blur(8px)' }}
        >
          <DialogTitle sx={{ px: 4, py: 3, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-light)', fontWeight: 800 }}>
            {selectedPatient?.name} - Edit Report
            <IconButton onClick={() => setSelectedPatient(null)} sx={{ color: 'var(--text-secondary)' }}>
              ×
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, bgcolor: 'var(--surface-light)' }}>
            <Grid container sx={{ minHeight: '100%' }}>
              {/* Left Column: Form (60%) */}
              <Grid item xs={12} md={7} sx={{ p: 4, borderRight: '1px solid var(--border-light)', overflowY: 'auto' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Enter Test Results</Typography>
                
                <Box component="form" onSubmit={handleSubmit}>
                  {testResults.map((table, tableIndex) => (
                    <Box key={tableIndex} sx={{ mb: 4, background: '#fff', p: 3, borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, color: '#0F6E56', fontSize: '1.1rem' }}>
                          {table.test.name}
                        </Typography>
                        {table.test.image && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color={removedImages.has(\`\${tableIndex}-test\`) ? "primary" : "error"}
                            onClick={() => handleToggleImage(tableIndex, 'test')}
                            sx={{ borderRadius: '100px', fontWeight: 700, textTransform: 'none' }}
                          >
                            {removedImages.has(\`\${tableIndex}-test\`) ? 'Add Image' : 'Remove Image'}
                          </Button>
                        )}
                      </Box>

                      {/* Direct Subtests */}
                      {table.direct.map((sub, subIndex) => (
                        <Box key={subIndex} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2, alignItems: 'center', p: 2, bgcolor: '#F8FAFC', borderRadius: '12px' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{sub.name}</Typography>
                          <TextField
                            size="small"
                            value={sub.result}
                            onChange={(e) => handleResultChange(tableIndex, 'direct', null, subIndex, e.target.value)}
                            placeholder="Enter result..."
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: '8px' } }}
                          />
                          <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sub.range} {sub.unit}</Typography>
                        </Box>
                      ))}

                      {table.direct.length > 0 && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Add Note (Optional)"
                          value={tableNotes[\`\${tableIndex}-direct\`] || ''}
                          onChange={(e) => handleNoteChange(tableIndex, 'direct', null, e.target.value)}
                          sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      )}

                      {/* Pack Subtests */}
                      {table.packs.map((pack, packIndex) => (
                        <Box key={packIndex} sx={{ mt: 4, pt: 3, borderTop: '1px dashed var(--border-light)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography sx={{ fontWeight: 800, color: '#334155' }}>
                              {pack.packName}
                            </Typography>
                            {pack.image && (
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color={removedImages.has(\`\${tableIndex}-pack-\${packIndex}\`) ? "primary" : "error"}
                                onClick={() => handleToggleImage(tableIndex, 'pack', packIndex)}
                                sx={{ borderRadius: '100px', fontWeight: 700, textTransform: 'none' }}
                              >
                                {removedImages.has(\`\${tableIndex}-pack-\${packIndex}\`) ? 'Add Image' : 'Remove Image'}
                              </Button>
                            )}
                          </Box>

                          {pack.subtests.map((sub, subIndex) => (
                            <Box key={subIndex} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2, alignItems: 'center', p: 2, bgcolor: '#F8FAFC', borderRadius: '12px' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{sub.name}</Typography>
                              <TextField
                                size="small"
                                value={sub.result}
                                onChange={(e) => handleResultChange(tableIndex, 'pack', packIndex, subIndex, e.target.value)}
                                placeholder="Enter result..."
                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: '8px' } }}
                              />
                              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sub.range} {sub.unit}</Typography>
                            </Box>
                          ))}
                          <TextField
                            fullWidth
                            size="small"
                            label="Add Note for Pack (Optional)"
                            value={tableNotes[\`\${tableIndex}-pack-\${packIndex}\`] || ''}
                            onChange={(e) => handleNoteChange(tableIndex, 'pack', packIndex, e.target.value)}
                            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Right Column: PDF Live Preview (40%) */}
              <Grid item xs={12} md={5} sx={{ p: 4, bgcolor: '#F1F5F9', borderLeft: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Live Preview</Typography>
                <Box sx={{ flex: 1, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', bgcolor: '#fff' }}>
                  <PDFPreview 
                    document={
                      <ReportDocument 
                        patient={selectedPatient} 
                        testTables={testResults.map(table => ({
                          test: allTests.find(t => t._id.toString() === (table.test._id?.toString() || table.test?.toString())) || table.test,
                          packs: table.packs,
                          direct: table.direct
                        }))}
                        isPrinting={false}
                        removedImages={removedImages} 
                        tableNotes={tableNotes}
                        qrImage={qrImage}
                      />
                    } 
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid var(--border-light)', bgcolor: 'var(--surface-light)', gap: 2 }}>
            <Button onClick={() => setSelectedPatient(null)} sx={{ color: 'var(--text-secondary)', fontWeight: 700, borderRadius: '100px', px: 4 }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained" 
              disabled={printing}
              sx={{ background: '#0F6E56', color: '#fff', fontWeight: 700, borderRadius: '100px', px: 6, py: 1.5, boxShadow: '0 8px 24px rgba(15,110,86,0.3)', '&:hover': { background: '#0B5240' } }}
            >
              {printing ? 'Saving...' : 'Save Report'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* PDF Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={handlePreviewClose}
          maxWidth="lg"
          fullWidth
          TransitionComponent={Transition}
          PaperProps={{ sx: { borderRadius: 'var(--radius-2xl)', overflow: 'hidden', minHeight: '80vh' } }}
          sx={{ backdropFilter: 'blur(8px)' }}
        >
          <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-light)', fontWeight: 800, color: 'var(--text-primary)' }}>
            Report Preview
            <IconButton onClick={handlePreviewClose} sx={{ color: 'var(--text-secondary)' }}>
              ×
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <PDFPreview 
              document={
                <ReportDocument 
                  patient={selectedPatient} 
                  testTables={testResults.map(table => ({
                    test: allTests.find(t => t._id.toString() === (table.test._id?.toString() || table.test?.toString())) || table.test,
                    packs: table.packs,
                    direct: table.direct
                  }))}
                  isPrinting={false} // Keep false for preview to show background
                  removedImages={removedImages} 
                  tableNotes={tableNotes}
                  qrImage={qrImage}
                />
              } 
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePreviewClose}>Close</Button>
          </DialogActions>
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
      </Container>
    </Box>
  );
`;

fs.writeFileSync('src/components/CreateReport.js', code.substring(0, startIndex) + newUI + suffix);
console.log('Done!');
