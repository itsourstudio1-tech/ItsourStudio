# it's ouR Studio — Website Feature Showcase
### A Modern Rebuild of Your Studio's Online Presence

---

## 📌 Overview

This document provides a walkthrough of the new **it's ouR Studio** website — a complete rebuild designed to elevate your studio's online presence with modern design, smoother user experience, and powerful admin tools.

---

## 🎨 1. Modern, Premium Design

**Before (Old Website):**
- Static HTML/CSS layout
- Basic styling with limited visual appeal
- Minimal animations

**Now:**
- ✨ **Warm, cohesive color palette** — terracotta, cream, and earthy tones that match the studio's cozy vibe
- ✨ **Smooth animations** — subtle fade-ins, hover effects, and micro-interactions throughout
- ✨ **Glassmorphism & gradient accents** — modern design trends that make the site feel premium
- ✨ **Professional typography** — using Google Fonts (League Spartan + Quicksand) for a polished look

---

## 📱 2. Fully Responsive Design

The website now adapts beautifully to **all screen sizes**:

| Device | Experience |
|--------|------------|
| 🖥️ Desktop (1200px+) | Full-featured layout with side-by-side sections |
| 💻 Tablet (768px - 1199px) | Adjusted grids and navigation |
| 📱 Mobile (320px - 767px) | Compact cards, touch-friendly buttons, auto-scrolling carousels |

**Key Mobile Improvements:**
- Navigation collapses into a clean mobile menu
- Service packages display as swipeable cards
- Images auto-scroll in a carousel format
- Buttons are full-width for easy tapping

---

## 🏠 3. Homepage Features

### Hero Section
- Immersive full-screen hero with parallax background
- Camera-inspired UI overlay (focus brackets, ISO/aperture display)
- Clear call-to-action buttons: "View Gallery" and "Book Session"

### Gallery Preview
- Infinite auto-scrolling carousel of studio photos
- Drag-to-scroll interaction
- Links to full gallery page

### Packages Preview
- Highlights 3 key packages (Solo, Basic, Barkada)
- "Best Selling" badge on featured package
- Quick "Book Now" buttons

### Testimonials
- Displays real customer feedback from the database
- Star ratings and customer names
- "Leave a Review" button for new submissions

### About Section
- Editable content from admin panel
- Film-strip styled feature highlights

### Contact Section
- Contact form
- Studio location, phone, email, hours
- Social media links

---

## 📦 4. Services Page

Each package is displayed as a **full-screen immersive section**:

- Large package title with gradient text
- Price and duration prominently displayed
- Feature list with checkmarks
- **Auto-scrolling image carousel** showcasing 3 photos per package
- "Book This Package" button

**Packages Available:**
1. Solo Package — ₱299
2. Basic Package — ₱399 ⭐ Best Selling
3. Just Transfer — ₱549
4. Standard Package — ₱699
5. Birthday Package — ₱599
6. Family Package — ₱1,249
7. Barkada Package — ₱1,949

---

## 🖼️ 5. Gallery Page

- **Filterable gallery** — filter by All, Solo, Duo, or Group
- **Masonry-style grid** layout
- **Lightbox viewer** — click any image to view full-size with navigation arrows
- Images can be managed from the admin panel

---

## 📅 6. Booking System

### Customer Flow:
1. **Select Package** — choose from dropdown or click "Book Now" on any package
2. **Pick Date & Time** — calendar shows available slots; booked times are disabled
3. **Enter Details** — name, email, phone number, optional notes
4. **Payment** — GCash payment with proof upload
5. **Confirmation** — booking saved, customer receives confirmation

### Features:
- Real-time availability checking
- Downpayment calculation (50% of package price)
- Image upload for payment proof
- Form validation

---

## 🛠️ 7. Admin Dashboard

Accessible via `/admin/login` with secure authentication.

### Dashboard Overview
- Total bookings count
- Pending bookings count
- Approved bookings count
- Quick stats at a glance

### Bookings Management
- View all bookings in a table (desktop) or cards (mobile)
- Filter by status: Pending, Approved, Completed, Cancelled
- View payment proof images
- Approve or delete bookings

### Calendar View
- Visual calendar showing all booked sessions
- Color-coded by status
- Click any date to see bookings for that day

### Gallery Management
- Upload new images
- Categorize as Solo, Duo, or Group
- Delete images
- Images appear on the public gallery page

### Feedback Management
- View all customer reviews
- Toggle which reviews appear in the Testimonials section
- Delete inappropriate feedback

### Content Management
- Edit "About" section text and image
- Update homepage content
- Manage active promotions

### User Management (if applicable)
- Add/remove admin users
- Role-based access

---

## ⚡ 8. Technical Improvements

| Aspect | Old Website | New Website |
|--------|-------------|-------------|
| **Tech Stack** | HTML, CSS, JS, PHP | React + TypeScript, Vite, Firebase |
| **Database** | MySQL (manual queries) | Firebase Firestore (real-time sync) |
| **Hosting** | Shared hosting | Vercel (fast, global CDN) |
| **Admin Panel** | None / basic PHP forms | Full dashboard with real-time updates |
| **Mobile Support** | Limited | Fully responsive down to 320px |
| **Animations** | None | Smooth transitions & micro-animations |
| **SEO** | Basic | Meta tags, Open Graph, structured data |

---

## 🔗 9. Live Demo

You can explore the website yourself here:

🌐 **[https://itsour-studio.vercel.app/](https://itsour-studio.vercel.app/)**

Feel free to click around! The booking system is fully functional.

---

## 💬 Closing Notes

This project was built with care, using your studio as inspiration. I hope it captures the warmth and creativity of **it's ouR Studio** and can serve as a useful tool for your business.

If you have any questions or would like to discuss anything, feel free to reach out!

---

*Document prepared by: [Your Name]*
*Date: December 2024*
