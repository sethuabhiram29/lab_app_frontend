const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.js', 'utf8');

// 1. Add Icons
content = content.replace(
  '  LogoutOutlined as LogoutIcon,\n} from \'@mui/icons-material\';',
  '  LogoutOutlined as LogoutIcon,\n  ChevronLeft as ChevronLeftIcon,\n  MenuOpen as MenuOpenIcon,\n} from \'@mui/icons-material\';'
);

// 2. Add State
content = content.replace(
  '  const [mobileOpen, setMobileOpen] = useState(false);',
  '  const [mobileOpen, setMobileOpen] = useState(false);\n  const [isCollapsed, setIsCollapsed] = useState(false);\n  const currentDrawerWidth = isCollapsed ? 80 : drawerWidth;'
);

// 3. Update main box width
content = content.replace(
  "width: isHome ? '100%' : { sm: `calc(100% - ${drawerWidth}px)` },",
  "width: isHome ? '100%' : { sm: `calc(100% - ${currentDrawerWidth}px)` },\n          transition: 'width 0.3s ease',"
);

// 4. Update desktop drawer paper width
content = content.replace(
  "'& .MuiDrawer-paper': { width: drawerWidth, border: 'none' },",
  "'& .MuiDrawer-paper': { width: currentDrawerWidth, border: 'none', transition: 'width 0.3s ease', overflowX: 'hidden' },"
);

// 5. Update desktop drawer wrapper
content = content.replace(
  "<Box component=\"nav\" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>",
  "<Box component=\"nav\" sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 }, transition: 'width 0.3s ease' }}>"
);

// 6. Update Desktop Drawer List Items
// The first List in drawerContent is for mobile. We only care about desktop for collapse?
// User said "when those navigation side bars come keep a button to make it collapse or open too".
// Since desktop has the permanent sidebar, that's what they mean.
// I will modify the rendering logic inside Desktop Drawer (around line 398)

const desktopListRegex = /<List sx=\{\{ px: 2, flex: 1, pt: 2 \}\}>([\s\S]*?)<\/List>/;
const desktopFooterRegex = /{[\s\S]*?\/\* Desktop user footer \*\/[\s\S]*?<Box sx=\{\{ p: 2, borderTop: '1px solid rgba\(255,255,255,0\.06\)' \}\}>([\s\S]*?)<\/Box>\s*<\/Box>/;

content = content.replace(desktopListRegex, (match, p1) => {
  return `<List sx={{ px: isCollapsed ? 1 : 2, flex: 1, pt: 2, overflowX: 'hidden' }}>
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
` + p1
    .replace(/<ListItem([\s\S]*?)>/g, '<ListItem$1 title={isCollapsed ? item.text : ""} sx={{ ...$1.sx, px: isCollapsed ? 0 : 1.5, justifyContent: isCollapsed ? "center" : "flex-start" }}>')
    .replace(/<ListItemIcon sx=\{\{([\s\S]*?)minWidth: 36,([\s\S]*?)\}\}>/g, '<ListItemIcon sx={{$1minWidth: isCollapsed ? "auto" : 36,$2}}>')
    .replace(/<ListItemText([\s\S]*?)\/>/g, '{!isCollapsed && <ListItemText$1/>}')
    .replace(/\{isActive && \(\s*<Box([\s\S]*?)>\s*<\/Box>\s*\)\}/g, '{isActive && !isCollapsed && (<Box$1></Box>)}') + 
    `\n              </List>`;
});

content = content.replace(desktopFooterRegex, (match) => {
  return `
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
                <Button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  sx={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    mt: 1, 
                    width: '100%', 
                    minWidth: 0,
                    '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.05)' } 
                  }}
                >
                  {isCollapsed ? <MenuOpenIcon /> : <ChevronLeftIcon />}
                </Button>
              </Box>
            </Box>`;
});

fs.writeFileSync('src/components/Layout.js', content, 'utf8');
console.log('Done!');
