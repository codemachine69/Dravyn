# UI Branding Rules

**Pattern:** `packages/ui/**`

## Logo and Branding Assets

### Asset Locations
- **Primary logos**: `packages/ui/src/assets/images/flowise_white.svg` (light mode)
- **Dark logos**: `packages/ui/src/assets/images/flowise_dark.svg` (dark mode)
- **Root assets**: `/images/` directory for README and documentation
- **UI assets**: `packages/ui/src/assets/images/**` for all UI icons and images

### Logo Component
The main logo component is located at:
```
packages/ui/src/ui-component/extended/Logo.jsx
```

**Key implementation details:**
- Imports light/dark variants from `@/assets/images/`
- Uses Redux state (`customization.isDarkMode`) to switch themes
- Fixed width of 150px with `objectFit: 'contain'`

## Branding Change Rules

### Do:
- **Update both variants** when changing logos (light + dark)
- **Maintain aspect ratio** and visual consistency
- **Test across themes** to ensure proper switching
- **Use SVG format** for crisp rendering at all sizes
- **Update favicon** in `packages/ui/public/` if changing logo

### Do Not:
- **Break theme switching** functionality
- **Modify Logo.jsx** without understanding Redux state
- **Change asset paths** without updating imports
- **Use raster images** for primary logos

## Asset Management

### File Naming Convention
- `flowise_white.svg` → Light mode logo
- `flowise_dark.svg` → Dark mode logo
- `flowise_logo.png` → PNG fallback (if needed)
- `flowise_logo_dark.png` → Dark PNG fallback

### Import Pattern
```javascript
import logo from '@/assets/images/flowise_white.svg'
import logoDark from '@/assets/images/flowise_dark.svg'
```

### Theme Integration
The logo automatically switches based on:
```javascript
src={customization.isDarkMode ? logoDark : logo}
```

## Related Files
- `packages/ui/src/assets/images/` → All UI assets
- `packages/ui/public/favicon.ico` → Browser favicon
- `packages/ui/public/logo192.png` → PWA icon
- `packages/ui/public/logo512.png` → PWA icon
- `packages/ui/public/manifest.json` → PWA manifest

## Testing Checklist
- [ ] Logo displays correctly in light mode
- [ ] Logo displays correctly in dark mode
- [ ] Theme switching works smoothly
- [ ] Logo scales properly at different sizes
- [ ] Favicon updates reflect logo changes
