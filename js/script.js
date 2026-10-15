/*
 * Page behaviours. Loaded by js/render.js after the content has been built,
 * so everything below can attach to the freshly rendered elements.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Typing Animation (titles come from data/site-data.json, with a built-in fallback)
const typingTitles = (window.SITE_DATA && window.SITE_DATA.home && Array.isArray(window.SITE_DATA.home.typing) && window.SITE_DATA.home.typing.length)
    ? window.SITE_DATA.home.typing
    : ["Software Developer", "AI/ML Enthusiast", "Full-Stack Developer", "Future Innovator", "Cultural Bridge Builder"];

// Visitors who ask for reduced motion keep the static profession line instead of the typing loop.
var typed = null;
if (!prefersReducedMotion && typeof Typed !== 'undefined' && document.querySelector('.typing')) {
    typed = new Typed(".typing", {
        strings: [" "].concat(typingTitles),
        typeSpeed: 60,
        backSpeed: 40,
        backDelay: 1500,
        loop: true
    });
}

// ---------- Navigation ----------
const navLinks = document.querySelectorAll('.nav a');
const navToggler = document.querySelector('.nav-toggler');
const aside = document.querySelector('.aside');

function setActiveLink(id) {
    navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'location');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function closeMobileNav() {
    aside.classList.remove('open');
    navToggler.classList.remove('open');
    navToggler.setAttribute('aria-expanded', 'false');
}

// Smooth scrolling; the address bar updates so every section can be linked to directly
navLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const target = href && href.length > 1 ? document.querySelector(href) : null;
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });
        if (window.history && history.replaceState) {
            history.replaceState(null, '', href);
        }
        setActiveLink(href.slice(1));

        // Close mobile menu if open
        if (window.innerWidth < 1200) {
            closeMobileNav();
        }
    });
});

// Navigation Toggle for Mobile (also works with keyboard and Escape)
navToggler.addEventListener('click', () => {
    aside.classList.toggle('open');
    navToggler.classList.toggle('open');
    navToggler.setAttribute('aria-expanded', aside.classList.contains('open') ? 'true' : 'false');
});

navToggler.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navToggler.click();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && aside.classList.contains('open')) {
        closeMobileNav();
        navToggler.focus();
    }
});

// Active Section Highlighting on Scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('.section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    if (current) {
        setActiveLink(current);
    }
});

// On load: jump to the section in the address (#projects, #contact, ...), otherwise start at the top.
// This runs immediately if the page has already finished loading, because the script is added after the data loads.
function startAtRightPlace() {
    const id = window.location.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (target) {
        target.scrollIntoView();
        setActiveLink(id);
    } else {
        window.scrollTo(0, 0);
    }
}
if (document.readyState === 'complete') {
    startAtRightPlace();
} else {
    window.addEventListener('load', startAtRightPlace);
}

// Add animation on scroll for elements (skipped for visitors who prefer reduced motion)
if (!prefersReducedMotion) {
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

    // Observe all service items, timeline items, etc. (excluding home section)
    document.querySelectorAll('.service-item, .timeline-item, .leadership-item, .cert-category').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

// Ensure home image is always visible
const homeImg = document.querySelector('.home-img img');
if (homeImg) {
    homeImg.style.opacity = '1';
    homeImg.style.visibility = 'visible';
    homeImg.style.display = 'block';

    // Add error handler
    homeImg.onerror = function() {
        console.error('Error loading image:', this.src);
        this.style.border = '3px solid red';
        this.alt = 'Image failed to load: ' + this.src;
    };

    // Add load handler
    homeImg.onload = function() {
        this.style.opacity = '1';
    };
}

// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scrollToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
});

// ---------- Expand all / Collapse all ----------
function visibleCards(selector) {
    return Array.from(document.querySelectorAll(selector)).filter(card => !card.closest('.hidden'));
}

function syncExpandButtons() {
    document.querySelectorAll('.pf-expand').forEach(btn => {
        const cards = visibleCards(btn.dataset.cards);
        const allOpen = cards.length > 0 && cards.every(card => card.classList.contains('expanded'));
        btn.textContent = allOpen ? 'Collapse all' : 'Expand all';
        btn.disabled = cards.length === 0;
    });
}

document.querySelectorAll('.pf-expand').forEach(btn => {
    btn.addEventListener('click', () => {
        const cards = visibleCards(btn.dataset.cards);
        const open = !cards.every(card => card.classList.contains('expanded'));
        cards.forEach(card => {
            if (card.classList.contains('expanded') !== open) card.click();
        });
        syncExpandButtons();
    });
});

// Expandable expertise cards with animated progress bars
document.querySelectorAll('.expertise-card').forEach(card => {
    const bars = card.querySelectorAll('.expertise-progress-in');

    const animateBars = () => {
        bars.forEach((bar) => {
            const width = bar.getAttribute('data-width') || '0';
            bar.style.width = width + '%';
        });
    };

    const resetBars = () => {
        bars.forEach((bar) => {
            bar.style.width = '0%';
        });
    };

    const toggleCard = () => {
        const isExpanded = card.classList.toggle('expanded');
        card.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        if (isExpanded) {
            animateBars();
        } else {
            resetBars();
        }
        syncExpandButtons();
    };

    card.addEventListener('click', toggleCard);
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleCard();
        }
    });
});

// Expandable project cards: the button is the keyboard control, a click on the card also works
document.querySelectorAll('.project-card').forEach(card => {
    const btn = card.querySelector('.project-toggle');
    if (!btn) return;
    const label = btn.querySelector('.pt-label');

    const toggleProject = () => {
        const isExpanded = card.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        if (label) label.textContent = isExpanded ? 'Hide details' : 'View details';
        syncExpandButtons();
    };

    btn.addEventListener('click', toggleProject);
    card.addEventListener('click', (event) => {
        if (event.target.closest('a, button, .project-details')) return;
        toggleProject();
    });
});

// Project category filter
document.querySelectorAll('.pf-chips').forEach(group => {
    const items = document.querySelectorAll('#portfolio .pf-grid > .service-item');
    const status = document.querySelector('#portfolio .pf-status');

    group.addEventListener('click', (event) => {
        const chip = event.target.closest('.pf-chip');
        if (!chip) return;
        const filter = chip.dataset.filter;

        group.querySelectorAll('.pf-chip').forEach(c => {
            c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });

        let shown = 0;
        items.forEach(item => {
            const match = filter === 'all' || (item.dataset.cats || '').split(' ').includes(filter);
            item.classList.toggle('hidden', !match);
            if (match) shown++;
        });

        if (status) {
            status.textContent = filter === 'all'
                ? ''
                : `Showing ${shown} of ${items.length} projects`;
        }
        syncExpandButtons();
    });
});

syncExpandButtons();

// Expandable certification cards
document.querySelectorAll('.cert-item').forEach(card => {
    const toggleCard = () => {
        card.classList.toggle('expanded');
        card.setAttribute('aria-expanded', card.classList.contains('expanded') ? 'true' : 'false');
    };

    card.addEventListener('click', toggleCard);
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleCard();
        }
    });
});

// Keyboard support for the theme settings (icons and colour swatches)
document.querySelectorAll('.style-switcher .s-icon, .style-switcher .colors span').forEach(control => {
    control.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            control.click();
        }
    });
});

// Typing effect for tagline (skipped when reduced motion is requested)
const tagline = document.querySelector('.tagline');
if (tagline && !prefersReducedMotion) {
    const text = tagline.textContent;
    tagline.textContent = '';
    let i = 0;

    setTimeout(() => {
        const typeWriter = setInterval(() => {
            if (i < text.length) {
                tagline.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeWriter);
            }
        }, 50);
    }, 2000);
}

// Add number counter animation for stats
function animateCounter(element, target, duration) {
    let current = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Parallax effect for home image (skipped when reduced motion is requested)
if (!prefersReducedMotion) {
    window.addEventListener('scroll', () => {
        const parallaxImg = document.querySelector('.home-img img');
        if (parallaxImg) {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.3;
            parallaxImg.style.transform = `translateY(${parallax}px)`;
        }
    });
}

// Add ripple effect to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        if (prefersReducedMotion) return;
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});
