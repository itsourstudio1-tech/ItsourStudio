import './style.css'

// ===================================
// NAVIGATION
// ===================================

const navbar = document.getElementById('navbar') as HTMLElement;
const mobileMenuBtn = document.getElementById('mobileMenuBtn') as HTMLElement;
const navLinks = document.querySelector('.nav-links') as HTMLElement;
const navLinkItems = document.querySelectorAll('.nav-link');

// Navbar scroll effect
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu toggle
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

// Close mobile menu when clicking a link
navLinkItems.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuBtn.classList.remove('active');
    navLinks.classList.remove('active');
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');

function highlightNavLink() {
  const scrollY = window.pageYOffset;

  sections.forEach(section => {
    const sectionEl = section as HTMLElement;
    const sectionHeight = sectionEl.offsetHeight;
    const sectionTop = sectionEl.offsetTop - 100;
    const sectionId = section.getAttribute('id');

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

// Only run scroll spy on home page
if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
  window.addEventListener('scroll', highlightNavLink);
}

// ===================================
// GALLERY
// ===================================

interface GalleryItem {
  id: number;
  category: string;
  title: string;
  image: string;
}

// Sample gallery data
const galleryData: GalleryItem[] = [
  { id: 1, category: 'portrait', title: 'Classic Portrait', image: 'gallery-1.jpg' },
  { id: 2, category: 'creative', title: 'Creative Expression', image: 'gallery-2.jpg' },
  { id: 3, category: 'professional', title: 'Professional Headshot', image: 'gallery-3.jpg' },
  { id: 4, category: 'lifestyle', title: 'Lifestyle Moment', image: 'gallery-4.jpg' },
  { id: 5, category: 'portrait', title: 'Natural Light', image: 'gallery-5.jpg' },
  { id: 6, category: 'creative', title: 'Artistic Vision', image: 'gallery-6.jpg' },
  { id: 7, category: 'professional', title: 'Corporate Style', image: 'gallery-7.jpg' },
  { id: 8, category: 'lifestyle', title: 'Candid Shot', image: 'gallery-8.jpg' },
  { id: 9, category: 'portrait', title: 'Studio Portrait', image: 'gallery-9.jpg' },
  { id: 10, category: 'creative', title: 'Bold & Creative', image: 'gallery-10.jpg' },
  { id: 11, category: 'professional', title: 'Business Professional', image: 'gallery-11.jpg' },
  { id: 12, category: 'lifestyle', title: 'Everyday Beauty', image: 'gallery-12.jpg' },
];

const galleryGrid = document.getElementById('galleryGrid') as HTMLElement;
const filterBtns = document.querySelectorAll('.filter-btn');

// Render gallery items
function renderGallery(filter = 'all') {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = '';

  let filteredData = filter === 'all'
    ? galleryData
    : galleryData.filter(item => item.category === filter);

  // Check for limit (used on home page)
  const limit = galleryGrid.getAttribute('data-limit');
  if (limit) {
    filteredData = filteredData.slice(0, parseInt(limit));
  }

  filteredData.forEach((item, index) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-category', item.category);
    galleryItem.style.animationDelay = `${index * 0.1}s`;

    galleryItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="gallery-overlay">
                <div class="gallery-info">
                    <p class="gallery-category">${item.category}</p>
                    <h3 class="gallery-title">${item.title}</h3>
                </div>
            </div>
        `;

    galleryItem.addEventListener('click', () => openLightbox(index, filteredData));
    galleryGrid.appendChild(galleryItem);
  });
}

// Gallery filters
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    if (filter) renderGallery(filter);
  });
});

// ===================================
// LIGHTBOX
// ===================================

const lightbox = document.getElementById('lightbox') as HTMLElement;
const lightboxImage = document.getElementById('lightboxImage') as HTMLImageElement;
const lightboxCaption = document.getElementById('lightboxCaption') as HTMLElement;
const lightboxClose = document.getElementById('lightboxClose') as HTMLElement;
const lightboxPrev = document.getElementById('lightboxPrev') as HTMLElement;
const lightboxNext = document.getElementById('lightboxNext') as HTMLElement;

let currentImageIndex = 0;
let currentGalleryData: GalleryItem[] = [];

function openLightbox(index: number, data: GalleryItem[]) {
  currentImageIndex = index;
  currentGalleryData = data;
  updateLightboxImage();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function updateLightboxImage() {
  const item = currentGalleryData[currentImageIndex];
  lightboxImage.src = item.image;
  lightboxImage.alt = item.title;
  lightboxCaption.innerHTML = `
        <p class="gallery-category">${item.category}</p>
        <h3>${item.title}</h3>
    `;
}

function showPrevImage() {
  currentImageIndex = (currentImageIndex - 1 + currentGalleryData.length) % currentGalleryData.length;
  updateLightboxImage();
}

function showNextImage() {
  currentImageIndex = (currentImageIndex + 1) % currentGalleryData.length;
  updateLightboxImage();
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevImage);
if (lightboxNext) lightboxNext.addEventListener('click', showNextImage);

// Close lightbox on background click
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;

  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPrevImage();
  if (e.key === 'ArrowRight') showNextImage();
});

// ===================================
// BOOKING FORM
// ===================================

const bookingForm = document.getElementById('bookingForm') as HTMLFormElement;
const successModal = document.getElementById('successModal') as HTMLElement;
const closeModalBtn = document.getElementById('closeModal') as HTMLElement;
const dateInput = document.getElementById('date') as HTMLInputElement;

// Set minimum date to today
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(bookingForm);
    const bookingData = Object.fromEntries(formData);

    // Simulate form submission
    console.log('Booking submitted:', bookingData);

    // Show success modal
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset form
    bookingForm.reset();
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}

// Close modal on background click
if (successModal) {
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// ===================================
// SMOOTH SCROLL
// ===================================



// ===================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      (entry.target as HTMLElement).style.opacity = '1';
      (entry.target as HTMLElement).style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements for fade-in animation
document.querySelectorAll('.service-card, .about-feature, .info-card').forEach(el => {
  const element = el as HTMLElement;
  element.style.opacity = '0';
  element.style.transform = 'translateY(30px)';
  element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(element);
});

// ===================================
// FORM VALIDATION ENHANCEMENTS
// ===================================

const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');

formInputs.forEach(input => {
  const inputEl = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  inputEl.addEventListener('blur', () => {
    if (inputEl.value.trim() !== '') {
      inputEl.style.borderColor = '#8b5e3b';
    } else if (inputEl.hasAttribute('required')) {
      inputEl.style.borderColor = '#bf6a39';
    }
  });

  inputEl.addEventListener('focus', () => {
    inputEl.style.borderColor = '#bf6a39';
  });
});

// ===================================
// LOADING PLACEHOLDER IMAGES
// ===================================

// Generate placeholder images for gallery
function generatePlaceholderImage(width: number, height: number, category: string, index: number) {
  const colors: Record<string, string> = {
    portrait: '#8b5e3b',
    creative: '#bf6a39',
    professional: '#3b2c28',
    lifestyle: '#ada3a4'
  };

  const color = colors[category] || '#8b5e3b';
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='${width}' height='${height}' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='24' fill='%23fff4e6' opacity='0.5'%3E${category.toUpperCase()} ${index}%3C/text%3E%3C/svg%3E`;
}

// Update gallery data with placeholder images
galleryData.forEach((item, index) => {
  item.image = generatePlaceholderImage(400, 500, item.category, index + 1);
});

// Generate placeholder for about section
const aboutImage = document.getElementById('aboutImage') as HTMLImageElement;
if (aboutImage) {
  aboutImage.src = generatePlaceholderImage(600, 500, 'studio', 1);
  aboutImage.alt = 'it\'s ouR Studio Photography Studio Interior';
}

// Re-render gallery with placeholder images
renderGallery();

// ===================================
// DYNAMIC YEAR IN FOOTER
// ===================================

const currentYear = new Date().getFullYear();
const footerText = document.querySelector('.footer-bottom p');
if (footerText) {
  footerText.textContent = `© ${currentYear} it's ouR Studio. All rights reserved.`;
}

// ===================================
// PERFORMANCE OPTIMIZATIONS
// ===================================


// Debounce scroll events
function debounce(func: Function, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedHighlight = debounce(highlightNavLink, 100);
window.removeEventListener('scroll', highlightNavLink);
window.addEventListener('scroll', debouncedHighlight as any);

// ===================================
// ACCESSIBILITY ENHANCEMENTS
// ===================================

// Add keyboard navigation for gallery
if (galleryGrid) {
  galleryGrid.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('gallery-item')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        target.click();
      }
    }
  });
}

// Make gallery items focusable
document.querySelectorAll('.gallery-item').forEach(item => {
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
});

// ===================================
// CONSOLE WELCOME MESSAGE
// ===================================

console.log('%c🎨 Welcome to it\'s ouR Studio! 📸', 'font-size: 20px; font-weight: bold; color: #bf6a39;');
console.log('%cWebsite built with ❤️ using vanilla JavaScript', 'font-size: 12px; color: #8b5e3b;');

// ===================================
// SERVICES PAGE SIDE NAV
// ===================================

const sideNavDots = document.querySelectorAll('.side-nav-dot');
const serviceSections = document.querySelectorAll('.service-fullscreen');

function highlightSideNav() {
  const scrollY = window.pageYOffset;

  serviceSections.forEach(section => {
    const sectionEl = section as HTMLElement;
    const sectionHeight = sectionEl.offsetHeight;
    const sectionTop = sectionEl.offsetTop - 300; // Offset for better triggering
    const sectionId = section.getAttribute('id');

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      sideNavDots.forEach(dot => {
        dot.classList.remove('active');
        if (dot.getAttribute('href') === `#${sectionId}`) {
          dot.classList.add('active');
        }
      });
    }
  });
}

if (sideNavDots.length > 0) {
  window.addEventListener('scroll', highlightSideNav);
  highlightSideNav(); // Initial check
}
