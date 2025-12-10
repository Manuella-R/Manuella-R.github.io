// Typing Animation
var typed = new Typed(".typing", {
    strings:[" ", "Software Developer", "AI/ML Enthusiast", "Full-Stack Developer", "Future Innovator", "Cultural Bridge Builder"],
    typeSpeed: 60,
    backSpeed: 40,
    backDelay: 1500,
    loop: true  
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('.nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update active class
            document.querySelectorAll('.nav a').forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu if open
            if (window.innerWidth < 1200) {
                document.querySelector('.aside').classList.remove('open');
            }
        }
    });
});

// Navigation Toggle for Mobile
const navToggler = document.querySelector('.nav-toggler');
const aside = document.querySelector('.aside');

navToggler.addEventListener('click', () => {
    aside.classList.toggle('open');
    navToggler.classList.toggle('open');
});

// Active Section Highlighting on Scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Scroll to Top on Page Load
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});

// Add animation on scroll for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all service items, timeline items, etc.
document.querySelectorAll('.service-item, .timeline-item, .leadership-item, .cert-category').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});
