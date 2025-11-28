// ===================================
// NAVIGATION
// ===================================

const navbar = document.getElementById('navbar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.querySelector('.nav-links');
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
mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
});

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
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
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

window.addEventListener('scroll', highlightNavLink);

// ===================================
// GALLERY
// ===================================

// Sample gallery data
const galleryData = [
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

const galleryGrid = document.getElementById('galleryGrid');
const filterBtns = document.querySelectorAll('.filter-btn');

// Render gallery items
function renderGallery(filter = 'all') {
    galleryGrid.innerHTML = '';

    const filteredData = filter === 'all'
        ? galleryData
        : galleryData.filter(item => item.category === filter);

    filteredData.forEach((item, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.setAttribute('data-category', item.category);
        galleryItem.style.animationDelay = `${index * 0.1}s`;

        galleryItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}" loading="lazy">
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
        renderGallery(filter);
    });
});

// Initialize gallery
renderGallery();

// ===================================
// LIGHTBOX
// ===================================

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let currentImageIndex = 0;
let currentGalleryData = [];

function openLightbox(index, data) {
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

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrevImage);
lightboxNext.addEventListener('click', showNextImage);

// Close lightbox on background click
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

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

const bookingForm = document.getElementById('bookingForm');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModal');
const dateInput = document.getElementById('date');

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

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

    // In a real application, you would send this data to a server
    // Example:
    // fetch('/api/bookings', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(bookingData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     successModal.classList.add('active');
    //     bookingForm.reset();
    // })
    // .catch(error => console.error('Error:', error));
});

closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
});

// Close modal on background click
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ===================================
// SMOOTH SCROLL
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

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
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
document.querySelectorAll('.service-card, .about-feature, .info-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===================================
// FORM VALIDATION ENHANCEMENTS
// ===================================

const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');

formInputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value.trim() !== '') {
            input.style.borderColor = '#8b5e3b';
        } else if (input.hasAttribute('required')) {
            input.style.borderColor = '#bf6a39';
        }
    });

    input.addEventListener('focus', () => {
        input.style.borderColor = '#bf6a39';
    });
});

// ===================================
// LOADING PLACEHOLDER IMAGES
// ===================================

// Generate placeholder images for gallery
function generatePlaceholderImage(width, height, category, index) {
    const colors = {
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
const aboutImage = document.getElementById('aboutImage');
if (aboutImage) {
    aboutImage.src = generatePlaceholderImage(600, 500, 'studio', 1);
    aboutImage.alt = 'Studio Lens Photography Studio Interior';
}

// Re-render gallery with placeholder images
renderGallery();

// ===================================
// DYNAMIC YEAR IN FOOTER
// ===================================

const currentYear = new Date().getFullYear();
const footerText = document.querySelector('.footer-bottom p');
if (footerText) {
    footerText.textContent = `© ${currentYear} Studio Lens. All rights reserved.`;
}

// ===================================
// PERFORMANCE OPTIMIZATIONS
// ===================================

// Lazy loading images
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
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
window.addEventListener('scroll', debouncedHighlight);

// ===================================
// ACCESSIBILITY ENHANCEMENTS
// ===================================

// Add keyboard navigation for gallery
galleryGrid.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('gallery-item')) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.target.click();
        }
    }
});

// Make gallery items focusable
document.querySelectorAll('.gallery-item').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
});

// ===================================
// CONSOLE WELCOME MESSAGE
// ===================================

console.log('%c🎨 Welcome to Studio Lens! 📸', 'font-size: 20px; font-weight: bold; color: #bf6a39;');
console.log('%cWebsite built with ❤️ using vanilla JavaScript', 'font-size: 12px; color: #8b5e3b;');
