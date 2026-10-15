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

    function slug(value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Accepts an array or a comma/newline separated string and returns a clean array.
    function toList(value) {
        if (Array.isArray(value)) return value.map(function (v) { return String(v).trim(); }).filter(Boolean);
        return String(value || '').split(/[\n,]/).map(function (v) { return v.trim(); }).filter(Boolean);
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
                // Items with a text label (e.g. "Hands-on") show a badge instead of a percentage bar.
                if (s.label) {
                    return '<div class="expertise-skill expertise-skill--label"><span>' + esc(s.name) + '</span>' +
                        '<span class="skill-level">' + esc(s.label) + '</span></div>';
                }
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

        // "Expand all" control above the cards (wired up in js/script.js).
        var old = $('#service .pf-toolbar');
        if (old) old.remove();
        if (rows[1]) {
            rows[1].insertAdjacentHTML('beforebegin',
                '<div class="pf-toolbar"><span class="pf-toolbar-spacer"></span>' +
                '<button type="button" class="pf-expand" data-cards="#service .expertise-card">Expand all</button></div>');
        }
    }

    function renderProjects(list) {
        if (!list) return;
        var container = $('#portfolio .container');
        if (!container) return;
        container.querySelectorAll(':scope > .service-item, :scope > .pf-toolbar, :scope > .pf-status, :scope > .pf-grid').forEach(function (n) { n.remove(); });

        // Category filter chips are built from the categories used by the projects, in order of first use.
        var cats = [];
        list.forEach(function (p) {
            toList(p.categories).forEach(function (c) {
                if (!cats.some(function (x) { return x.id === slug(c); })) cats.push({ id: slug(c), label: c });
            });
        });
        cats.forEach(function (c) {
            c.count = list.filter(function (p) {
                return toList(p.categories).some(function (x) { return slug(x) === c.id; });
            }).length;
        });

        var chips = cats.length > 1
            ? '<div class="pf-chips" role="group" aria-label="Filter projects by category">' +
              '<button type="button" class="pf-chip" data-filter="all" aria-pressed="true">All <span>' + list.length + '</span></button>' +
              cats.map(function (c) {
                  return '<button type="button" class="pf-chip" data-filter="' + esc(c.id) + '" aria-pressed="false">' +
                      esc(c.label) + ' <span>' + c.count + '</span></button>';
              }).join('') + '</div>'
            : '<span class="pf-toolbar-spacer"></span>';

        var toolbar = '<div class="pf-toolbar">' + chips +
            '<button type="button" class="pf-expand" data-cards="#portfolio .project-card">Expand all</button></div>' +
            '<p class="pf-status" role="status" aria-live="polite" data-total="' + list.length + '"></p>';

        var cards = list.map(function (p, i) {
            var id = 'project-details-' + i;
            var pCats = toList(p.categories);
            var tags = toList(p.tech);
            var actions = toList(p.actions);
            var results = (p.results || []).filter(function (r) { return r && (r.value || r.label); });
            var link = safeUrl(p.link);
            var demo = safeUrl(p.demo);

            var details = '';
            if (p.problem) details += '<h5>The problem</h5><p>' + rich(p.problem) + '</p>';
            if (tags.length) {
                details += '<h5>Built with</h5><ul class="project-tags">' +
                    tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
            }
            if (actions.length) {
                details += '<h5>What I did</h5><ul class="project-actions">' +
                    actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>';
            }
            if (results.length) {
                details += '<h5>Results</h5><ul class="project-results">' + results.map(function (r) {
                    return '<li><strong>' + esc(r.value) + '</strong><span>' + esc(r.label) + '</span></li>';
                }).join('') + '</ul>';
            }
            if (link || demo) {
                details += '<div class="project-links">' +
                    (link ? '<a class="project-link" ' + linkAttrs(link) + '><i class="fa fa-external-link-alt"></i> ' + esc(p.linkLabel || 'View project') + '</a>' : '') +
                    (demo ? '<a class="project-link" ' + linkAttrs(demo) + '><i class="fa fa-play-circle"></i> Live demo</a>' : '') +
                    '</div>';
            }

            return '<div class="service-item padd-15" data-cats="' + esc(pCats.map(slug).join(' ')) + '">' +
                '<div class="service-item-inner project-card">' +
                '<div class="icon"><i class="' + esc(icon(p.icon, 'fa fa-laptop-code')) + '"></i></div>' +
                '<h4>' + esc(p.title) + '</h4>' +
                (pCats.length ? '<ul class="project-cats">' + pCats.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' : '') +
                '<p class="project-summary">' + rich(p.description) + '</p>' +
                (details
                    ? '<button type="button" class="project-toggle" aria-expanded="false" aria-controls="' + id + '">' +
                      '<span class="pt-label">View details</span><i class="fa fa-chevron-down" aria-hidden="true"></i></button>' +
                      '<div class="project-details" id="' + id + '"><div class="project-details-inner">' + details + '</div></div>'
                    : '') +
                '</div></div>';
        }).join('');

        container.insertAdjacentHTML('beforeend', toolbar + '<div class="row pf-grid">' + cards + '</div>');
    }

    // Shared by Leadership and Work Experience: they use the same card layout.
    function renderRoles(selector, list, defaultIcon) {
        if (!list) return;
        setHTML($(selector), list.map(function (l) {
            var points = toList(l.points).map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('');
            return '<div class="leadership-item padd-15"><div class="leadership-item-inner shadow-dark">' +
                '<div class="icon"><i class="' + esc(icon(l.icon, defaultIcon)) + '"></i></div>' +
                '<h4>' + esc(l.title) + '</h4>' +
                '<p class="date"><i class="fa fa-calendar"></i> ' + esc(l.period) + '</p>' +
                '<div class="leadership-text">' +
                (points ? '<p><strong>' + esc(l.pointsLabel || 'Highlights:') + '</strong></p><ul>' + points + '</ul>' : '') +
                '</div></div></div>';
        }).join(''));
    }

    function renderLeadership(list) { renderRoles('#leadership .leadership-content', list, 'fa fa-flag'); }

    function renderExperience(list) { renderRoles('#experience .leadership-content', list, 'fa fa-briefcase'); }

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

    // Compact badge strip (AWS learning paths, Cisco) shown above the certification cards.
    function renderCredentials(list) {
        if (!list) return;
        var container = $('#certifications .container');
        if (!container) return;
        var old = container.querySelector(':scope > .cred-strip');
        if (old) old.remove();
        var anchor = container.querySelectorAll(':scope > .row')[1];
        if (!anchor || !list.length) return;
        anchor.insertAdjacentHTML('beforebegin', '<div class="cred-strip">' + list.map(function (g) {
            return '<div class="cred-group"><h3 class="cred-title"><i class="' + esc(icon(g.icon, 'fa fa-certificate')) + '"></i> ' + esc(g.title) + '</h3>' +
                '<ul class="cred-badges">' + toList(g.items).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
        }).join('') + '</div>');
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
            function () { renderExperience(d.experience); },
            function () { renderSkills(d.skills); },
            function () { renderProjects(d.projects); },
            function () { renderLeadership(d.leadership); },
            function () { renderCerts(d.certifications); },
            function () { renderCredentials(d.credentials); },
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
