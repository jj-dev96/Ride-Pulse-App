# RidePulse UI - Complete Application

## Project Structure

```
Ride-Pulse UI/
├── HTML/              # All HTML pages
│   ├── loginPage.html
│   ├── maps.html
│   ├── settings.html
│   ├── stats.html
│   ├── dashbroard.html
│   ├── createJoin.html
│   └── rideProgress.html
├── CSS/               # All CSS stylesheets
│   ├── theme.css      # Shared theme styles
│   └── login.css      # Login page specific styles
├── JS/                # All JavaScript files
│   ├── shared.js      # Shared utilities and navigation
│   ├── login.js       # Login page logic
│   └── navigation.js  # Navigation components
├── Images/           # Image assets
│   ├── RidePulse-Logo.jpg
│   ├── googleLogo.png
│   └── appleLogo.png
└── README.md         # This file
```

## Features

### ✅ Completed
- **Organized File Structure**: HTML, CSS, and JS files separated into folders
- **Shared Theme System**: Consistent theming using RidePulse logo colors
- **Navigation System**: Connected all pages with proper navigation
- **Authentication**: Login/Signup functionality with localStorage
- **Theme Toggle**: Dark/Light mode support
- **Animations**: Smooth transitions and animations throughout
- **Responsive Design**: Mobile-first approach

### 🎨 Theme Colors
- **Primary**: #FFD700 (Gold/Yellow from logo)
- **Secondary**: #FF0000 (Red from logo)
- **Accent**: #00E5FF (Neon Cyan)

## Pages

1. **loginPage.html** - Login/Signup page
2. **maps.html** - Main map view (landing page after login)
3. **settings.html** - User settings
4. **stats.html** - Ride statistics
5. **dashbroard.html** - Premium dashboard
6. **createJoin.html** - Create/Join ride
7. **rideProgress.html** - Active ride tracking

## Usage

1. Start with `HTML/loginPage.html`
2. Login with:
   - User ID: `test` or `test@gmail.com`
   - Password: `123456`
3. Or create a new account via Sign Up
4. Navigate between pages using bottom navigation

## Navigation Flow

```
loginPage.html → maps.html → [stats, premium, settings]
                              ↓
                    createJoin.html → rideProgress.html
```

## JavaScript Modules

- **shared.js**: Theme management, navigation, notifications, form validation
- **login.js**: Login/Signup form handling
- **navigation.js**: Navigation component generators

## CSS Architecture

- **theme.css**: Base styles, animations, shared components
- **login.css**: Login page specific styles
- Additional page-specific CSS files can be added as needed

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Dark mode support

## Notes

- All pages use the RidePulse logo from `Images/RidePulse-Logo.jpg`
- Theme persists across pages using localStorage
- User session managed via localStorage
- All navigation links properly connected

