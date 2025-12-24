# RidePulse UI - Quick Start Guide

## 🚀 Getting Started

### Step 1: Open the Application
Open `HTML/loginPage.html` in your web browser to start the application.

### Step 2: Login or Sign Up

**Test Credentials:**
- User ID: `test` or `test@gmail.com`
- Password: `123456`

**Or create a new account:**
1. Click "Sign Up" tab
2. Fill in: Full Name, Email, Phone Number, Password, Confirm Password
3. Click "SIGN UP"
4. After successful signup, switch to "Log In" and use your credentials

### Step 3: Navigate the App

After login, you'll be redirected to the **Maps** page. Use the bottom navigation to access:
- **Map** - Main map view (current page)
- **Stats** - View your ride statistics
- **Premium** - Premium dashboard with analytics
- **Settings** - App settings and account management

## 📁 File Structure

```
Ride-Pulse UI/
├── HTML/              ← Start here! Open loginPage.html
│   ├── loginPage.html
│   ├── maps.html
│   ├── settings.html
│   └── ...
├── CSS/
│   ├── theme.css      ← Shared theme styles
│   └── login.css      ← Login page styles
├── JS/
│   ├── shared.js      ← Shared utilities
│   └── login.js       ← Login logic
└── Images/
    └── RidePulse-Logo.jpg
```

## 🎨 Features

✅ **Organized Structure** - All files properly separated  
✅ **Consistent Theming** - Uses RidePulse logo colors throughout  
✅ **Dark Mode** - Toggle in top-right corner  
✅ **Smooth Animations** - Transitions and effects  
✅ **Navigation** - All pages connected  
✅ **Authentication** - Login/Signup with localStorage  

## 🔗 Page Navigation

- **Login** → Maps (after successful login)
- **Maps** → Create/Join Ride → Ride Progress
- **Bottom Nav** → Stats, Premium, Settings

## 💡 Tips

1. **Theme Persistence**: Your dark/light mode preference is saved
2. **User Session**: Login state persists across pages
3. **Responsive**: Works on mobile and desktop
4. **Animations**: Smooth transitions throughout

## 🐛 Troubleshooting

**Can't see pages?**
- Make sure you're opening `HTML/loginPage.html` from the HTML folder
- Check browser console for any errors

**Navigation not working?**
- Ensure all files are in the correct folders
- Check that image paths are correct (`../Images/`)

**Styles not loading?**
- Verify CSS files are in the `CSS/` folder
- Check browser console for 404 errors

## 📝 Notes

- All user data is stored in browser localStorage (demo purposes)
- Logo path: `../Images/RidePulse-Logo.jpg`
- Theme colors match the RidePulse logo

