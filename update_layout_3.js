const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.js', 'utf8');

const desktopContent = `              <List sx={{ px: isCollapsed ? 1 : 2, flex: 1, pt: 2, overflowX: 'hidden' }}>
                {!isCollapsed && (
                  <Typography sx={{
                    px: 1.5, mb: 1.5, display: 'block',
                    fontSize: '0.65rem', fontWeight: 700,
                    color: 'rgba(241,245,249,0.25)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    Navigation
                  </Typography>
                )}

                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Box key={item.text} sx={{ position: 'relative', mb: 0.5 }}>
                      {isActive && !prefersReduced && (
                        <motion.div
                          layoutId="sidebar-active-pill-desktop"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, rgba(15,110,86,0.22) 0%, rgba(11,31,58,0.32) 100%)',
                            border: '1px solid rgba(15,110,86,0.28)',
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                      <ListItem
                        button
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          borderRadius: 'var(--radius-md)',
                          py: 1,
                          px: isCollapsed ? 0 : 1.5,
                          justifyContent: isCollapsed ? 'center' : 'flex-start',
                          position: 'relative',
                          zIndex: 1,
                          color: isActive ? '#5EEAD4' : 'rgba(241,245,249,0.5)',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(241,245,249,0.85)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                        title={isCollapsed ? item.text : ''}
                      >
                        <ListItemIcon sx={{
                          color: 'inherit',
                          minWidth: isCollapsed ? 'auto' : 36,
                          '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                          transition: 'transform 0.2s var(--ease-spring)',
                          ...(isActive && { transform: 'scale(1.12)' }),
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        {!isCollapsed && (
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: isActive ? 700 : 500,
                              fontSize: '0.85rem',
                              letterSpacing: '-0.01em',
                              color: 'inherit',
                            }}
                          />
                        )}
                        {isActive && !isCollapsed && (
                          <Box sx={{
                            width: 4, height: 4, borderRadius: '50%',
                            bgcolor: '#5EEAD4',
                            boxShadow: '0 0 6px rgba(94,234,212,0.8)',
                          }} />
                        )}
                      </ListItem>
                    </Box>
                  );
                })}
              </List>

              {/* Desktop user footer */}
              <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Box
                  onClick={handleLogout}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: isCollapsed ? 0 : 1.5, py: 1.2,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--radius-md)',
                    color: 'rgba(241,245,249,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { background: 'rgba(239,68,68,0.1)', color: '#EF4444' }
                  }}
                  title={isCollapsed ? 'Logout' : ''}
                >
                  {isCollapsed ? (
                    <LogoutIcon sx={{ fontSize: '1.1rem' }} />
                  ) : (
                    <>
                      <Avatar sx={{
                        bgcolor: 'rgba(241,245,249,0.05)',
                        border: '1px solid rgba(15,110,86,0.5)',
                        width: 30, height: 30,
                        fontSize: '0.78rem', fontWeight: 700, color: '#5EEAD4',
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2 }} noWrap>
                          {user.username}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(241,245,249,0.35)', textTransform: 'capitalize' }}>
                          {user.role || 'Staff'}
                        </Typography>
                      </Box>
                      <LogoutIcon sx={{ fontSize: '0.9rem', color: 'rgba(241,245,249,0.25)' }} />
                    </>
                  )}
                </Box>
                <IconButton 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  sx={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    mt: 1, 
                    width: '100%', 
                    borderRadius: 'var(--radius-md)',
                    '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.05)' } 
                  }}
                >
                  {isCollapsed ? <MenuOpenIcon /> : <ChevronLeftIcon />}
                </IconButton>
              </Box>
            </Box>
          </Drawer>`;

// Start from the exact list inside desktop drawer
const listStartStr = '<List sx={{ px: 2, flex: 1, pt: 2 }}>';
const startIndex = content.indexOf(listStartStr);
const endIndex = content.indexOf('</Drawer>', startIndex) + '</Drawer>'.length;

content = content.substring(0, startIndex) + desktopContent + content.substring(endIndex);

fs.writeFileSync('src/components/Layout.js', content, 'utf8');
console.log('Done replacing list!');
