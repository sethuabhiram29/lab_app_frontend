const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/Login.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fix the Login Section width and alignment
code = code.replace(
  `<Grid container sx={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>`,
  `<Grid container sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', maxWidth: '1440px', margin: '0 auto' }}>`
);

// Replace the right card's maxWidth to make it a bit wider to match the mockup
code = code.replace(
  `style={{ width: '100%', maxWidth: '480px' }}>`,
  `style={{ width: '100%', maxWidth: '520px' }}>`
);

// 2. Rewrite the Process Section for alternating timeline
const oldProcessStart = `{/* ── 4. PROCESS SECTION ───────────────────────────────────────────────── */}`;
const oldProcessEnd = `{/* ── 5. BOTTOM CTA SECTION ────────────────────────────────────────────── */}`;
const startIndex = code.indexOf(oldProcessStart);
const endIndex = code.indexOf(oldProcessEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log('Error: Could not find process section bounds.');
  process.exit(1);
}

const newProcessSection = `{/* ── 4. PROCESS SECTION (Alternating Timeline) ────────────────────────── */}
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', px: { xs: 2, md: 4 }, mb: 20, position: 'relative' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 2 }}>
              01 — PROCESS
            </Typography>
            <Typography sx={{ 
              fontFamily: '"Playfair Display", "Times New Roman", serif', 
              fontSize: { xs: '2.5rem', md: '3.5rem' }, 
              fontWeight: 700, color: '#30201D', lineHeight: 1.2, margin: '0 auto', maxWidth: '600px'
            }}>
              From vein <span style={{ color: '#D31C3D' }}>to verified</span> rep<span style={{ color: '#0F6E56' }}>ort</span> — in hours.
            </Typography>
          </Box>
        </motion.div>

        <Box sx={{ position: 'relative' }}>
          {/* Central Vertical Line (hidden on very small screens, visible on md+) */}
          <Box sx={{ 
            position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', 
            background: 'linear-gradient(to bottom, rgba(211,28,61,0.2), transparent)', 
            zIndex: 0, transform: 'translateX(-50%)',
            display: { xs: 'none', md: 'block' }
          }} />

          {/* Left-aligned Vertical Line for mobile */}
          <Box sx={{ 
            position: 'absolute', top: 0, bottom: 0, left: '28px', width: '2px', 
            background: 'linear-gradient(to bottom, rgba(211,28,61,0.2), transparent)', 
            zIndex: 0,
            display: { xs: 'block', md: 'none' }
          }} />

          {[
            { step: '01', title: 'Sample Collection', desc: 'Painless collection at home or at the centre by trained phlebotomists.', icon: <WaterDropIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> },
            { step: '02', title: 'Precision Analysis', desc: 'Automated analyzers with dual-verification pipelines.', icon: <BiotechIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> },
            { step: '03', title: 'Clinical Review', desc: 'Every abnormal marker reviewed by senior pathologists.', icon: <TimelineIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> },
            { step: '04', title: 'Secure Delivery', desc: 'Encrypted reports available instantly inside your portal.', icon: <SecurityIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> }
          ].map((item, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'row', md: 'row' },
                  alignItems: 'center', 
                  mb: { xs: 6, md: 8 }, 
                  position: 'relative', zIndex: 1,
                  justifyContent: { xs: 'flex-start', md: 'center' }
                }}>
                  
                  {/* Left Spacer (Desktop) */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: isLeft ? 'flex' : 'none' }, justifyContent: 'flex-end', pr: 6 }}>
                    {/* Step Content Card */}
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(211,28,61,0.15)', borderRadius: '16px',
                      p: 4, width: '100%', maxWidth: '400px',
                      boxShadow: '0 12px 32px rgba(211,28,61,0.05)',
                      textAlign: 'right'
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 1 }}>
                        STEP {item.step}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', fontWeight: 700, color: '#30201D', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#887A77', lineHeight: 1.6 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Spacer for Right items on left side */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: !isLeft ? 'block' : 'none' } }} />

                  {/* Central Icon */}
                  <Box sx={{ 
                    width: 56, height: 56, borderRadius: '50%', background: '#fff',
                    border: '2px solid rgba(211,28,61,0.1)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(211,28,61,0.1)',
                    position: { xs: 'absolute', md: 'absolute' }, 
                    left: { xs: '0px', md: '50%' },
                    transform: { xs: 'none', md: 'translateX(-50%)' },
                    zIndex: 2
                  }}>
                    {item.icon}
                  </Box>

                  {/* Right Spacer (Desktop) */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: !isLeft ? 'flex' : 'none' }, justifyContent: 'flex-start', pl: 6 }}>
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(211,28,61,0.15)', borderRadius: '16px',
                      p: 4, width: '100%', maxWidth: '400px',
                      boxShadow: '0 12px 32px rgba(211,28,61,0.05)',
                      textAlign: 'left'
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 1 }}>
                        STEP {item.step}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', fontWeight: 700, color: '#30201D', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#887A77', lineHeight: 1.6 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Spacer for Left items on right side */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: isLeft ? 'block' : 'none' } }} />

                  {/* Mobile Layout (All cards on the right) */}
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, pl: '80px', width: '100%' }}>
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(211,28,61,0.15)', borderRadius: '16px',
                      p: 3, width: '100%',
                      boxShadow: '0 12px 32px rgba(211,28,61,0.05)',
                      textAlign: 'left'
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 1 }}>
                        STEP {item.step}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', fontWeight: 700, color: '#30201D', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#887A77', lineHeight: 1.6 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>

                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Box>

      `;

code = code.substring(0, startIndex) + newProcessSection + code.substring(endIndex);

fs.writeFileSync(filePath, code);
console.log('Done Login.js patch 2!');
