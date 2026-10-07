/*
 * Renders the portfolio content from data/site-data.json.
 * The static HTML in index.html stays as a fallback: if the JSON cannot be
 * loaded, the page simply keeps showing what is already in the markup.
 * After rendering, js/script.js is loaded so its behaviours (expandable
 * cards, animations, typing effect) attach to the freshly built elements.
 */
(function () {
    'use strict';

    var DATA_URL = 'data/site-data.json';

    /* ---------- helpers ---------- */
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Escaped text with **bold** and line breaks.
    function rich(value) {
        return esc(value)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\r?\n/g, '<br>');
    }

    // Only allow font-awesome style class names.
    function icon(value, fallback) {
        var v = String(value || '').trim();
        return /^[a-z0-9 -]+$/i.test(v) && v ? v : fallback;
    }

    // Only allow safe link schemes.
    function safeUrl(value) {
        var v = String(value || '').trim();
        if (!v) return '';
        if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
        if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return '';   // any other scheme (javascript:, data:, ...)
        return v;                                        // relative path
    }

    function isExternal(url) { return /^https?:/i.test(url); }

    function linkAttrs(url) {
        return 'href="' + esc(url) + '"' + (isExternal(url) ? ' target="_blank" rel="noopener"' : '');
    }

    function $(sel, root) { return (root || document).querySelector(sel); }

    function setHTML(el, html) { if (el) el.innerHTML = html; }

    /* ---------- section renderers ---------- */
    function renderHome(h) {
        if (!h) return;
        var info = $('.home-info');
        if (info) {
            var social = (h.social || []).map(function (s) {
                var url = safeUrl(s.url);
                if (!url) return '';
                return '<a ' + linkAttrs(url) + '><i class="' + esc(icon(s.icon, 'fa fa-link')) + '"></i></a>';
            }).join('');

            var cv = safeUrl(h.cvUrl);
            info.innerHTML =
                '<h3 class="hello">Hello! My name is <span class="name"> ' + esc(h.name) + ' </span></h3>' +
                '<h3 class="my-profession">I\'m a <span class="typing">' + esc(h.profession) + '</span></h3>' +
                '<h4 class="tagline">' + esc(h.tagline) + '</h4>' +
                '<p>' + esc(h.intro) + '</p>' +
                '<div class="home-buttons">' +
                    '<a href="#contact" class="btn hire-me">Hire Me</a>' +
                    (cv ? '<a href="' + esc(cv) + '" class="btn download-cv" download><i class="fa fa-download"></i> Download CV</a>' : '') +
                '</div>' +
                '<div class="social-links">' + social + '</div>';
        }
        var img = $('.home-img img');
        if (img && h.image) {
            img.src = h.image;
            img.alt = h.name || '';
        }
        if (h.name) {
            document.title = h.name + ' | Software Developer & AI Enthusiast';
        }
    }

    function renderAbout(a) {
        if (!a) return;
        var text = $('.about-text');
        if (text) {
            var paragraphs = String(a.body || '').split(/\n\s*\n/).map(function (p) {
                return esc(p.trim()).replace(/\r?\n/g, '<br>');
            }).filter(Boolean).join('<br>\n<br>');
            text.innerHTML =
                '<h3>' + esc(a.headingPrefix) + ' <span>' + esc(a.headingHighlight) + '</span>.<br></h3>' +
                '<p>' + paragraphs + '<br></p>';
        }
        var row = $('.personal-info .row');
        if (row) {
            row.innerHTML = (a.info || []).map(function (i) {
                var url = safeUrl(i.url);
                var value = url
                    ? '<a ' + linkAttrs(url) + ' style="color: var(--skin-color);">' + esc(i.value) + '</a>'
                    : ' ' + esc(i.value);
                return '<div class="info-item padd-15"><p>' + esc(i.label) + ' : <span>' + value + '</span></p></div>';
            }).join('');
        }
    }

    function renderEducation(list) {
        if (!list) return;
        var rows = document.querySelectorAll('#education .row');
        setHTML(rows[1], list.map(function (e) {
            return '<div class="service-item padd-15"><div class="service-item-inner education-card">' +
                '<div class="icon"><i class="' + esc(icon(e.icon, 'fa fa-graduation-cap')) + '"></i></div>' +
                '<h4>' + esc(e.title) + '</h4>' +
                '<p>' + (e.highlight ? '<strong>' + esc(e.highlight) + '</strong><br>' : '') + rich(e.details) + '</p>' +
                '</div></div>';
        }).join(''));
    }

    function renderSkills(list) {
        if (!list) return;
        var rows = document.querySelectorAll('#service .row');
        setHTML(rows[1], list.map(function (g) {
            var items = (g.items || []).map(function (s) {
                var lvl = Math.max(0, Math.min(100, parseInt(s.level, 10) || 0));
                return '<div class="expertise-skill"><span>' + esc(s.name) + '</span>' +
                    '<div class="expertise-progress"><div class="expertise-progress-in" data-width="' + lvl + '"></div></div>' +
                    '<span class="expertise-percent">' + lvl + '%</span></div>';
            }).join('');
            return '<div class="service-item padd-15">' +
                '<div class="service-item-inner expertise-card" role="button" tabindex="0" aria-expanded="false">' +
                '<div class="icon"><i class="' + esc(icon(g.icon, 'fa fa-code')) + '"></i></div>' +
                '<h4>' + esc(g.title) + '</h4><p>Click to view skill levels</p>' +
                '<div class="expertise-details">' + items + '</div></div></div>';
        }).join(''));
    }

    function renderProjects(list) {
        if (!list) return;
        var container = $('#portfolio .container');
        if (!container) return;
        container.querySelectorAll(':scope > .service-item').forEach(function (n) { n.remove(); });
        var html = list.map(function (p) {
            var url = safeUrl(p.link);
            var link = url
                ? '<br><br><a class="project-link" ' + linkAttrs(url) + '><i class="fa fa-external-link-alt"></i> ' +
                  esc(p.linkLabel || 'View project') + '</a>'
                : '';
            return '<div class="service-item padd-15"><div class="service-item-inner">' +
                '<div class="icon"><i class="' + esc(icon(p.icon, 'fa fa-laptop-code')) + '"></i></div>' +
                '<h4>' + esc(p.title) + '</h4>' +
                '<p>' + (p.tech ? '<strong>Technologies:</strong> ' + esc(p.tech) + '<br><br>' : '') +
                rich(p.description) + link + '</p></div></div>';
        }).join('');
        container.insertAdjacentHTML('beforeend', html);
    }

    function renderLeadership(list) {
        if (!list) return;
        setHTML($('#leadership .leadership-content'), list.map(function (l) {
            var points = (l.points || []).map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('');
            return '<div class="leadership-item padd-15"><div class="leadership-item-inner shadow-dark">' +
                '<div class="icon"><i class="' + esc(icon(l.icon, 'fa fa-flag')) + '"></i></div>' +
                '<h4>' + esc(l.title) + '</h4>' +
                '<p class="date"><i class="fa fa-calendar"></i> ' + esc(l.period) + '</p>' +
                '<div class="leadership-text">' +
                (points ? '<p><strong>' + esc(l.pointsLabel || 'Highlights:') + '</strong></p><ul>' + points + '</ul>' : '') +
                '</div></div></div>';
        }).join(''));
    }

    function renderCerts(list) {
        if (!list) return;
        var row = document.querySelectorAll('#certifications .container > .row')[1];
        setHTML(row, list.map(function (c) {
            var items = (c.items || []).map(function (i) {
                return '<div class="cert-item" role="button" tabindex="0" aria-expanded="false">' +
                    '<i class="fa fa-certificate"></i><div class="cert-info">' +
                    '<h4>' + esc(i.title) + '</h4><p>' + esc(i.issuer) + '</p>' +
                    '<div class="cert-extra"><p>' + esc(i.description) + '</p></div></div></div>';
            }).join('');
            return '<div class="cert-category padd-15">' +
                '<h3 class="cert-title"><i class="' + esc(icon(c.icon, 'fa fa-certificate')) + '"></i> ' + esc(c.title) + '</h3>' +
                '<div class="cert-list">' + items + '</div></div>';
        }).join(''));
    }

    function renderReferees(list) {
        if (!list) return;
        setHTML($('#referees .leadership-content'), list.map(function (r) {
            return '<div class="leadership-item padd-15"><div class="leadership-item-inner shadow-dark">' +
                '<h4>' + esc(r.name) + '</h4><p class="date">' + esc(r.role) + '</p>' +
                '<div class="leadership-text"><p>' + rich(r.details) + '</p></div></div></div>';
        }).join(''));
    }

    function renderContact(list) {
        if (!list) return;
        var first = $('#contact .contact-info-item');
        var row = first && first.parentElement;
        setHTML(row, list.map(function (c) {
            var url = safeUrl(c.url);
            var value = url
                ? '<a ' + linkAttrs(url) + ' style="color: var(--text-black-700);">' + esc(c.value) + '</a>'
                : esc(c.value);
            return '<div class="contact-info-item padd-15">' +
                '<div class="icon"><i class="' + esc(icon(c.icon, 'fa fa-envelope')) + '"></i></div>' +
                '<h4>' + esc(c.title) + '</h4><p>' + value + '</p></div>';
        }).join(''));
    }

    function renderAll(d) {
        // Each renderer is isolated so one bad section can't break the page.
        [
            function () { renderHome(d.home); },
            function () { renderAbout(d.about); },
            function () { renderEducation(d.education); },
            function () { renderSkills(d.skills); },
            function () { renderProjects(d.projects); },
            function () { renderLeadership(d.leadership); },
            function () { renderCerts(d.certifications); },
            function () { renderReferees(d.referees); },
            function () { renderContact(d.contact); }
        ].forEach(function (fn) {
            try { fn(); } catch (err) { console.error('Section render failed:', err); }
        });
    }

    /* ---------- boot ---------- */
    function loadScript(src) {
        var s = document.createElement('script');
        s.src = src;
        document.body.appendChild(s);
    }

    function finish() {
        document.documentElement.classList.remove('data-pending');
        loadScript('js/script.js');
    }

    function boot() {
        fetch(DATA_URL, { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                window.SITE_DATA = data;
                renderAll(data);
            })
            .catch(function (err) {
                console.warn('Could not load ' + DATA_URL + ', showing built-in content.', err);
            })
            .then(finish);
    }

    // Failsafe: never leave the page hidden if something stalls.
    setTimeout(function () { document.documentElement.classList.remove('data-pending'); }, 3000);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
