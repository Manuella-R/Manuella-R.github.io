// Style Switcher Toggler
const styleSwitcherToggler = document.querySelector(".style-switcher-toggler");
const styleSwitcher = document.querySelector(".style-switcher");

styleSwitcherToggler.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    styleSwitcher.classList.toggle("open");
});

// Close style switcher on scroll
let scrollTimeout;
window.addEventListener("scroll", () => {
    if(styleSwitcher.classList.contains("open")) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            styleSwitcher.classList.remove("open");
        }, 100);
    }
});

// Close style switcher when clicking outside
document.addEventListener("click", (e) => {
    if(!styleSwitcher.contains(e.target) && !styleSwitcherToggler.contains(e.target)) {
        styleSwitcher.classList.remove("open");
    }
});

// Prevent closing when clicking inside style switcher
styleSwitcher.addEventListener("click", (e) => {
    e.stopPropagation();
});

// Color Theme Switcher
const alternateStyle = document.querySelectorAll(".alternate-style");

function setActiveStyle(color) {
    localStorage.setItem("selectedTheme", color);
    
    // Update stylesheets
    alternateStyle.forEach((style) => {
        if(color === style.getAttribute("title")) {
            style.removeAttribute("disabled");
        } else {
            style.setAttribute("disabled", "true");
        }
    });
    
    // Update active visual indicator
    updateActiveColorIndicator(color);
}

function updateActiveColorIndicator(activeColor) {
    document.querySelectorAll(".style-switcher .colors span").forEach(span => {
        span.classList.remove("active");
        const colorClass = span.className.split(" ").find(cls => cls.startsWith("color-"));
        if(colorClass === activeColor) {
            span.classList.add("active");
        }
    });
}

// Add click events to color swatches
document.querySelectorAll(".style-switcher .colors span").forEach(colorSpan => {
    colorSpan.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const colorClass = this.className.split(" ").find(cls => cls.startsWith("color-"));
        if(colorClass) {
            setActiveStyle(colorClass);
            
            // Visual feedback animation
            this.style.animation = "none";
            setTimeout(() => {
                this.style.animation = "colorPulse 0.5s ease";
            }, 10);
        }
    });
});

// Load saved theme on page load
window.addEventListener("load", () => {
    const savedTheme = localStorage.getItem("selectedTheme");
    if(savedTheme) {
        setActiveStyle(savedTheme);
    } else {
        // Set color-1 as default active
        updateActiveColorIndicator("color-1");
    }
});

// Day/Night Mode Toggle
const dayNight = document.querySelector(".day-night");
const body = document.body;

// Initialize the icon based on current mode
window.addEventListener("load", () => {
    // Check if dark mode is saved in localStorage
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    
    if(isDarkMode) {
        body.classList.add("dark");
        dayNight.querySelector("i").classList.add("fa-sun");
        dayNight.querySelector("i").classList.remove("fa-moon");
    } else {
        body.classList.remove("dark");
        dayNight.querySelector("i").classList.add("fa-moon");
        dayNight.querySelector("i").classList.remove("fa-sun");
    }
});

// Toggle dark mode on click
dayNight.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const icon = dayNight.querySelector("i");
    
    // Toggle classes
    body.classList.toggle("dark");
    icon.classList.toggle("fa-sun");
    icon.classList.toggle("fa-moon");
    
    // Save preference
    localStorage.setItem("darkMode", body.classList.contains("dark"));
    
    // Add animation effect
    dayNight.style.transform = "rotate(360deg)";
    setTimeout(() => {
        dayNight.style.transform = "rotate(0deg)";
    }, 300);
});

// Add smooth transition to day/night icon
dayNight.style.transition = "all 0.3s ease";

// Touch-friendly enhancements for mobile
if('ontouchstart' in window) {
    // Add touch feedback for color swatches
    document.querySelectorAll(".style-switcher .colors span").forEach(span => {
        span.addEventListener("touchstart", function() {
            this.style.transform = "scale(1.2)";
        });
        
        span.addEventListener("touchend", function() {
            setTimeout(() => {
                this.style.transform = "scale(1)";
            }, 200);
        });
    });
    
    // Add touch feedback for icons
    [styleSwitcherToggler, dayNight].forEach(element => {
        element.addEventListener("touchstart", function() {
            this.style.transform = "scale(0.9)";
        });
        
        element.addEventListener("touchend", function() {
            this.style.transform = "scale(1)";
        });
    });
}