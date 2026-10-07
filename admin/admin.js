/*
 * Portfolio admin dashboard.
 *
 * How it works (GitHub Pages has no server, so GitHub is the "backend"):
 *  - All site content lives in data/site-data.json.
 *  - You log in with a GitHub fine-grained token (Contents: read & write on this repo only).
 *    The token is encrypted in this browser with a passcode (PBKDF2 + AES-GCM), so day to day
 *    you only type the passcode.
 *  - "Save to website" commits the JSON (and any uploaded image / CV) to the repo through the
 *    GitHub API. GitHub Pages then republishes the site, usually within a minute.
 *
 * Anyone can open this page, but nobody can save anything without the token.
 */
(function () {
    'use strict';

    /* ================= config ================= */
    var OWNER = 'Manuella-R';
    var REPO = 'Manuella-R.github.io';
    var DATA_PATH = 'data/site-data.json';
    var VAULT_KEY = 'portfolioAdminVault';
    var BRANCH_KEY = 'portfolioAdminBranch';
    var IDLE_MS = 30 * 60 * 1000;
    var MAX_UPLOAD = 10 * 1024 * 1024;

    /* ================= editor schema ================= */
    var SECTIONS = [
        { key: 'home', label: 'Home', icon: 'fa-home', kind: 'object',
          lead: 'The first thing visitors see: your name, typing titles, intro, photo and CV.',
          fields: [
            { k: 'name', label: 'Full name', t: 'text' },
            { k: 'profession', label: 'Profession line (shown before the typing animation starts)', t: 'text' },
            { k: 'typing', label: 'Typing animation titles (one per line)', t: 'lines' },
            { k: 'tagline', label: 'Tagline', t: 'text' },
            { k: 'intro', label: 'Intro paragraph', t: 'textarea' },
            { k: 'image', label: 'Profile photo', t: 'file', folder: 'images', accept: 'image/*', preview: true },
            { k: 'cvUrl', label: 'CV (PDF)', t: 'file', folder: 'cv', accept: 'application/pdf' },
            { k: 'social', label: 'Social links', t: 'list', inline: true, itemName: 'link',
              cols: '170px 1fr', fields: [
                { k: 'icon', label: 'Icon', t: 'text', ph: 'fab fa-github', datalist: 'iconList' },
                { k: 'url', label: 'URL', t: 'text', ph: 'https://, mailto: or tel:' } ] }
          ] },
        { key: 'about', label: 'About', icon: 'fa-user', kind: 'object',
          lead: 'Your bio and the personal-info grid.',
          fields: [
            { k: 'headingPrefix', label: 'Heading text', t: 'text' },
            { k: 'headingHighlight', label: 'Highlighted word(s) in heading', t: 'text' },
            { k: 'body', label: 'Bio', t: 'textarea', rows: 10, hint: 'Leave a blank line between paragraphs.' },
            { k: 'info', label: 'Personal info', t: 'list', inline: true, itemName: 'info item',
              cols: '130px 1fr 1fr', fields: [
                { k: 'label', label: 'Label', t: 'text', ph: 'Email' },
                { k: 'value', label: 'Value', t: 'text' },
                { k: 'url', label: 'Link (optional)', t: 'text', ph: 'https://...' } ] }
          ] },
        { key: 'education', label: 'Education', icon: 'fa-graduation-cap', kind: 'list', itemName: 'school',
          lead: 'Schools and degrees.',
          summary: function (i) { return i.title; },
          fields: [
            { k: 'title', label: 'School', t: 'text' },
            { k: 'icon', label: 'Icon', t: 'icon' },
            { k: 'highlight', label: 'Bold line (dates)', t: 'text' },
            { k: 'details', label: 'Details', t: 'textarea', hint: 'One line per row. Wrap text in **double asterisks** for bold.' }
          ] },
        { key: 'skills', label: 'Skills', icon: 'fa-cogs', kind: 'list', itemName: 'skill group',
          lead: 'Each group becomes a card; clicking it on the site reveals the skill bars.',
          summary: function (i) { return i.title; },
          fields: [
            { k: 'title', label: 'Group name', t: 'text' },
            { k: 'icon', label: 'Icon', t: 'icon' },
            { k: 'items', label: 'Skills', t: 'list', inline: true, itemName: 'skill',
              cols: '1fr 110px', fields: [
                { k: 'name', label: 'Skill', t: 'text' },
                { k: 'level', label: 'Level %', t: 'number', cls: 'num', def: 80 } ] }
          ] },
        { key: 'projects', label: 'Projects', icon: 'fa-laptop-code', kind: 'list', itemName: 'project',
          lead: 'Add new projects, edit existing ones, or reorder them.',
          summary: function (i) { return i.title; },
          fields: [
            { k: 'title', label: 'Project title', t: 'text' },
            { k: 'icon', label: 'Icon', t: 'icon', def: 'fa fa-laptop-code' },
            { k: 'tech', label: 'Technologies', t: 'text', ph: 'Python, React, ...' },
            { k: 'description', label: 'Description', t: 'textarea', hint: 'Use **double asterisks** for bold.' },
            { k: 'link', label: 'Project link (optional)', t: 'text', ph: 'https://github.com/...' },
            { k: 'linkLabel', label: 'Link text (optional)', t: 'text', ph: 'View on GitHub' }
          ] },
        { key: 'leadership', label: 'Leadership', icon: 'fa-users', kind: 'list', itemName: 'role',
          lead: 'Leadership roles and community engagement.',
          summary: function (i) { return i.title; },
          fields: [
            { k: 'title', label: 'Role', t: 'text' },
            { k: 'icon', label: 'Icon', t: 'icon', def: 'fa fa-flag' },
            { k: 'period', label: 'Dates | Organisation', t: 'text', ph: '2024 - 2025 | Organisation' },
            { k: 'pointsLabel', label: 'Bullet list heading', t: 'text', def: 'Key Achievements:' },
            { k: 'points', label: 'Bullet points (one per line)', t: 'lines' }
          ] },
        { key: 'certifications', label: 'Certifications', icon: 'fa-certificate', kind: 'list', itemName: 'category',
          lead: 'Certification categories, each with its own certificates.',
          summary: function (i) { return i.title; },
          fields: [
            { k: 'title', label: 'Category name', t: 'text' },
            { k: 'icon', label: 'Icon', t: 'icon', def: 'fa fa-certificate' },
            { k: 'items', label: 'Certificates', t: 'list', itemName: 'certificate',
              summary: function (i) { return i.title; },
              fields: [
                { k: 'title', label: 'Certificate', t: 'text' },
                { k: 'issuer', label: 'Issuer | dates', t: 'text' },
                { k: 'description', label: 'Description (shown when expanded)', t: 'textarea' } ] }
          ] },
        { key: 'referees', label: 'Referees', icon: 'fa-address-book', kind: 'list', itemName: 'referee',
          lead: 'People who can vouch for you.',
          summary: function (i) { return i.name; },
          fields: [
            { k: 'name', label: 'Name', t: 'text' },
            { k: 'role', label: 'Role / organisation', t: 'text' },
            { k: 'details', label: 'Contact details', t: 'textarea', hint: 'One line per row.' }
          ] },
        { key: 'contact', label: 'Contact', icon: 'fa-envelope', kind: 'list', itemName: 'contact item',
          lead: 'The contact tiles at the bottom of the site.',
          summary: function (i) { return i.title + (i.value ? ' — ' + i.value : ''); },
          fields: [
            { k: 'title', label: 'Title', t: 'text' },
            { k: 'icon', label: 'Icon', t: 'icon' },
            { k: 'value', label: 'Text shown', t: 'text' },
            { k: 'url', label: 'Link (optional)', t: 'text', ph: 'mailto:, tel: or https://' }
          ] }
    ];

    /* ================= state ================= */
    var token = null;          // lives in memory only
    var branch = 'main';
    var data = null;           // working copy
    var savedSnapshot = '';    // JSON string of what is on GitHub
    var fileSha = null;
    var activeKey = SECTIONS[0].key;
    var idleTimer = null;

    /* ================= tiny helpers ================= */
    function $(id) { return document.getElementById(id); }
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function isDirty() { return data != null && JSON.stringify(data) !== savedSnapshot; }

    function toast(msg, type, ms) {
        var t = el('div', 'toast ' + (type || ''), msg);
        $('toasts').appendChild(t);
        setTimeout(function () { t.remove(); }, ms || 5000);
    }
    function busy(on, text) {
        $('loading').classList.toggle('hidden', !on);
        if (text) $('loadingText').textContent = text;
    }
    function showLoginError(msg) {
        var e = $('loginError');
        e.textContent = msg;
        e.classList.toggle('hidden', !msg);
    }

    /* base64 <-> text/bytes */
    function bytesToB64(bytes) {
        var s = '', chunk = 0x8000;
        for (var i = 0; i < bytes.length; i += chunk) {
            s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(s);
    }
    function b64ToBytes(b64) {
        var bin = atob(b64), out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }
    function utf8ToB64(str) { return bytesToB64(new TextEncoder().encode(str)); }
    function b64ToUtf8(b64) { return new TextDecoder().decode(b64ToBytes(b64.replace(/\s/g, ''))); }

    /* ================= vault (encrypted token) ================= */
    function deriveKey(pass, salt) {
        return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
            .then(function (base) {
                return crypto.subtle.deriveKey(
                    { name: 'PBKDF2', salt: salt, iterations: 250000, hash: 'SHA-256' },
                    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
            });
    }
    function sealToken(tok, pass) {
        var salt = crypto.getRandomValues(new Uint8Array(16));
        var iv = crypto.getRandomValues(new Uint8Array(12));
        return deriveKey(pass, salt).then(function (key) {
            return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(tok));
        }).then(function (ct) {
            localStorage.setItem(VAULT_KEY, JSON.stringify({
                v: 1, salt: bytesToB64(salt), iv: bytesToB64(iv), ct: bytesToB64(new Uint8Array(ct))
            }));
        });
    }
    function openToken(pass) {
        var v;
        try { v = JSON.parse(localStorage.getItem(VAULT_KEY)); } catch (e) { v = null; }
        if (!v) return Promise.reject(new Error('No saved token'));
        return deriveKey(pass, b64ToBytes(v.salt)).then(function (key) {
            return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(v.iv) }, key, b64ToBytes(v.ct));
        }).then(function (pt) { return new TextDecoder().decode(pt); });
    }
    function hasVault() { return !!localStorage.getItem(VAULT_KEY); }

    /* ================= GitHub API ================= */
    function gh(path, opts) {
        opts = opts || {};
        var headers = {
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + token,
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (opts.body) headers['Content-Type'] = 'application/json';
        return fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + path, {
            method: opts.method || 'GET',
            headers: headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined,
            cache: 'no-store'
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (json) {
                if (!res.ok) {
                    var err = new Error(json.message || ('GitHub error ' + res.status));
                    err.status = res.status;
                    throw err;
                }
                return json;
            });
        });
    }
    function encPath(p) { return p.split('/').map(encodeURIComponent).join('/'); }

    function verifyToken() {
        return gh('').then(function (repo) {
            if (repo.permissions && repo.permissions.push === false) {
                throw new Error('This token can only read the repository. Give it "Contents: Read and write".');
            }
            return repo;
        }).catch(function (err) {
            if (err.status === 401) throw new Error('GitHub rejected this token (invalid or expired).');
            if (err.status === 404) throw new Error('This token cannot see ' + OWNER + '/' + REPO + '. Select that repository when creating the token.');
            throw err;
        });
    }

    function loadData() {
        busy(true, 'Loading content from GitHub...');
        return gh('/contents/' + encPath(DATA_PATH) + '?ref=' + encodeURIComponent(branch))
            .then(function (file) {
                data = JSON.parse(b64ToUtf8(file.content));
                fileSha = file.sha;
                savedSnapshot = JSON.stringify(data);
            })
            .finally(function () { busy(false); });
    }

    function saveData() {
        if (!isDirty()) { toast('Nothing to save.'); return; }
        busy(true, 'Saving to GitHub...');
        var text = JSON.stringify(data, null, 2) + '\n';
        gh('/contents/' + encPath(DATA_PATH), {
            method: 'PUT',
            body: {
                message: 'Update site content via admin dashboard',
                content: utf8ToB64(text),
                sha: fileSha,
                branch: branch
            }
        }).then(function (res) {
            fileSha = res.content.sha;
            savedSnapshot = JSON.stringify(data);
            updateDirty();
            if (branch === 'main') {
                toast('Saved! The live site updates in about a minute.', 'ok', 8000);
            } else {
                toast('Saved to branch "' + branch + '". It will go live once that branch is merged into main.', 'ok', 9000);
            }
        }).catch(function (err) {
            if (err.status === 409 || err.status === 422) {
                toast('The file changed on GitHub since you loaded it. Copy anything important, then press Discard to reload.', 'err', 10000);
            } else {
                toast('Save failed: ' + err.message, 'err', 9000);
            }
        }).finally(function () { busy(false); });
    }

    function uploadFile(file, folder) {
        return new Promise(function (resolve, reject) {
            if (file.size > MAX_UPLOAD) return reject(new Error('File is larger than 10 MB.'));
            var name = file.name.replace(/[^A-Za-z0-9._-]+/g, '_');
            var path = folder + '/' + name;
            var reader = new FileReader();
            reader.onerror = function () { reject(new Error('Could not read the file.')); };
            reader.onload = function () {
                var b64 = String(reader.result).split(',')[1];
                // does it already exist? then we need its sha to overwrite
                gh('/contents/' + encPath(path) + '?ref=' + encodeURIComponent(branch))
                    .then(function (existing) {
                        if (!window.confirm('"' + path + '" already exists. Replace it?')) throw new Error('Upload cancelled.');
                        return existing.sha;
                    }, function (err) {
                        if (err.status === 404) return null;
                        throw err;
                    })
                    .then(function (sha) {
                        var body = { message: 'Upload ' + path + ' via admin dashboard', content: b64, branch: branch };
                        if (sha) body.sha = sha;
                        return gh('/contents/' + encPath(path), { method: 'PUT', body: body });
                    })
                    .then(function () { resolve({ path: path, dataUrl: reader.result }); }, reject);
            };
            reader.readAsDataURL(file);
        });
    }

    /* ================= editor rendering ================= */
    function updateDirty() {
        $('dirtyBadge').classList.toggle('hidden', !isDirty());
        $('saveBtn').disabled = !isDirty();
    }
    function changed() { updateDirty(); resetIdle(); }

    function blankItem(fields) {
        var o = {};
        fields.forEach(function (f) {
            if (f.t === 'list' || f.t === 'lines') o[f.k] = [];
            else if (f.t === 'number') o[f.k] = f.def != null ? f.def : 0;
            else o[f.k] = f.def != null ? f.def : '';
        });
        return o;
    }

    function fieldEl(def, obj) {
        var wrap = el('div', 'field');
        var label = def.label || def.k;

        if (def.t === 'list') return listEl(def, obj);

        wrap.appendChild(el('label', null, label));
        var input;

        if (def.t === 'textarea') {
            input = document.createElement('textarea');
            input.rows = def.rows || 4;
            input.value = obj[def.k] || '';
            input.addEventListener('input', function () { obj[def.k] = input.value; changed(); });
            wrap.appendChild(input);
        } else if (def.t === 'lines') {
            input = document.createElement('textarea');
            input.rows = Math.max(3, (obj[def.k] || []).length + 1);
            input.value = (obj[def.k] || []).join('\n');
            input.addEventListener('input', function () {
                obj[def.k] = input.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
                changed();
            });
            wrap.appendChild(input);
        } else if (def.t === 'icon') {
            var row = el('div', 'icon-field');
            var prev = el('div', 'icon-preview');
            var i = el('i'); prev.appendChild(i);
            input = document.createElement('input');
            input.type = 'text';
            input.setAttribute('list', 'iconList');
            input.placeholder = 'fa fa-code';
            input.value = obj[def.k] || '';
            var paint = function () { i.className = input.value.trim() || 'fa fa-question'; };
            paint();
            input.addEventListener('input', function () { obj[def.k] = input.value.trim(); paint(); changed(); });
            row.appendChild(prev); row.appendChild(input);
            wrap.appendChild(row);
            wrap.appendChild(el('p', 'hint', 'Any Font Awesome 6 free class, e.g. "fa fa-code" or "fab fa-github". Pick from the suggestions or browse fontawesome.com/icons.'));
        } else if (def.t === 'file') {
            wrap.classList.add('file-field');
            wrap.appendChild(fileEl(def, obj));
        } else {
            input = document.createElement('input');
            input.type = def.t === 'number' ? 'number' : 'text';
            if (def.t === 'number') { input.min = 0; input.max = 100; }
            if (def.ph) input.placeholder = def.ph;
            if (def.datalist) input.setAttribute('list', def.datalist);
            input.value = obj[def.k] != null ? obj[def.k] : '';
            input.addEventListener('input', function () {
                obj[def.k] = def.t === 'number' ? Math.max(0, Math.min(100, parseInt(input.value, 10) || 0)) : input.value;
                changed();
            });
            wrap.appendChild(input);
        }
        if (def.hint) wrap.appendChild(el('p', 'hint', def.hint));
        return wrap;
    }

    function fileEl(def, obj) {
        var box = el('div');
        var row = el('div', 'row');
        var path = document.createElement('input');
        path.type = 'text'; path.value = obj[def.k] || '';
        path.addEventListener('input', function () { obj[def.k] = path.value.trim(); changed(); });
        var pick = document.createElement('input');
        pick.type = 'file'; pick.accept = def.accept || '*'; pick.className = 'hidden';
        var btn = el('button', 'btn small ghost'); btn.type = 'button';
        btn.innerHTML = '<i class="fa fa-upload"></i> Upload new';
        var status = el('p', 'status');
        var img = null;
        if (def.preview) {
            img = el('img', 'preview');
            img.alt = 'preview';
            img.src = '../' + (obj[def.k] || '');
            img.onerror = function () { img.classList.add('hidden'); };
            img.onload = function () { img.classList.remove('hidden'); };
        }
        btn.addEventListener('click', function () { pick.click(); });
        pick.addEventListener('change', function () {
            var f = pick.files && pick.files[0];
            if (!f) return;
            busy(true, 'Uploading ' + f.name + '...');
            uploadFile(f, def.folder).then(function (res) {
                obj[def.k] = res.path;
                path.value = res.path;
                if (img) { img.src = res.dataUrl; img.classList.remove('hidden'); }
                status.textContent = 'Uploaded to ' + res.path + '. Press "Save to website" to use it.';
                changed();
            }).catch(function (err) {
                toast(err.message, 'err');
            }).finally(function () { busy(false); pick.value = ''; });
        });
        row.appendChild(path); row.appendChild(btn); row.appendChild(pick);
        box.appendChild(row);
        if (img) box.appendChild(img);
        box.appendChild(status);
        return box;
    }

    function moveBtn(icon, title, disabled, onClick, extra) {
        var b = el('button', 'icon-btn sm' + (extra ? ' ' + extra : ''));
        b.type = 'button'; b.title = title; b.disabled = !!disabled;
        b.innerHTML = '<i class="fa ' + icon + '"></i>';
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); onClick(); });
        return b;
    }

    // Renders an editable array of objects (cards, or compact rows when def.inline)
    function listEl(def, parentObj, topLevelArray) {
        var arr = topLevelArray || (parentObj[def.k] = parentObj[def.k] || []);
        var wrap = el('div', topLevelArray ? '' : 'nested');
        var openIdx = -1;

        function rebuild() {
            wrap.innerHTML = '';
            if (!topLevelArray) {
                var head = el('div', 'list-head');
                head.appendChild(el('label', null, def.label || def.k));
                wrap.appendChild(head);
            }
            if (!arr.length) wrap.appendChild(el('p', 'empty', 'Nothing here yet.'));

            arr.forEach(function (item, idx) {
                var move = function (to) {
                    arr.splice(to, 0, arr.splice(idx, 1)[0]);
                    openIdx = to; rebuild(); changed();
                };
                var remove = function () {
                    if (!window.confirm('Delete this ' + (def.itemName || 'item') + '?')) return;
                    arr.splice(idx, 1); openIdx = -1; rebuild(); changed();
                };

                if (def.inline) {
                    var row = el('div', 'inline-row');
                    row.style.gridTemplateColumns = (def.cols || '1fr') + ' auto';
                    def.fields.forEach(function (f) {
                        var input = document.createElement('input');
                        input.type = f.t === 'number' ? 'number' : 'text';
                        if (f.t === 'number') { input.min = 0; input.max = 100; }
                        input.placeholder = f.ph || f.label;
                        input.title = f.label;
                        if (f.cls) input.className = f.cls;
                        if (f.datalist) input.setAttribute('list', f.datalist);
                        input.value = item[f.k] != null ? item[f.k] : '';
                        input.addEventListener('input', function () {
                            item[f.k] = f.t === 'number' ? Math.max(0, Math.min(100, parseInt(input.value, 10) || 0)) : input.value;
                            changed();
                        });
                        row.appendChild(input);
                    });
                    var acts = el('div', 'inline-actions');
                    acts.appendChild(moveBtn('fa-arrow-up', 'Move up', idx === 0, function () { move(idx - 1); }));
                    acts.appendChild(moveBtn('fa-arrow-down', 'Move down', idx === arr.length - 1, function () { move(idx + 1); }));
                    acts.appendChild(moveBtn('fa-trash', 'Delete', false, remove, 'danger'));
                    row.appendChild(acts);
                    wrap.appendChild(row);
                    return;
                }

                var card = el('details', 'item-card');
                if (idx === openIdx) card.open = true;
                var sum = document.createElement('summary');
                var chev = el('i', 'fa fa-chevron-right chev');
                sum.appendChild(chev);
                if (item.icon) {
                    var ico = el('span', 'ico'); var ii = el('i'); ii.className = item.icon; ico.appendChild(ii);
                    sum.appendChild(ico);
                }
                var title = el('span', 'title', (def.summary ? def.summary(item) : '') || ('New ' + (def.itemName || 'item')));
                sum.appendChild(title);
                var actions = el('div', 'actions');
                actions.appendChild(moveBtn('fa-arrow-up', 'Move up', idx === 0, function () { move(idx - 1); }));
                actions.appendChild(moveBtn('fa-arrow-down', 'Move down', idx === arr.length - 1, function () { move(idx + 1); }));
                actions.appendChild(moveBtn('fa-trash', 'Delete', false, remove, 'danger'));
                sum.appendChild(actions);
                card.appendChild(sum);

                var body = el('div', 'item-body');
                def.fields.forEach(function (f) { body.appendChild(fieldEl(f, item)); });
                // keep the card title live as the user types
                body.addEventListener('input', function () {
                    title.textContent = (def.summary ? def.summary(item) : '') || ('New ' + (def.itemName || 'item'));
                });
                card.appendChild(body);
                wrap.appendChild(card);
            });

            var add = el('button', 'btn small add-row'); add.type = 'button';
            add.innerHTML = '<i class="fa fa-plus"></i> Add ' + (def.itemName || 'item');
            add.addEventListener('click', function () {
                arr.push(blankItem(def.fields));
                openIdx = arr.length - 1;
                rebuild(); changed();
                if (!def.inline) {
                    var cards = wrap.querySelectorAll(':scope > .item-card');
                    var last = cards[cards.length - 1];
                    if (last && last.scrollIntoView) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                }
            });
            wrap.appendChild(add);
        }
        rebuild();
        return wrap;
    }

    function renderTabs() {
        var nav = $('tabs');
        nav.innerHTML = '';
        SECTIONS.forEach(function (s) {
            var b = el('button', 'tab' + (s.key === activeKey ? ' active' : ''));
            b.type = 'button';
            b.innerHTML = '<i class="fa ' + s.icon + '"></i><span></span>';
            b.lastChild.textContent = s.label;
            b.addEventListener('click', function () { activeKey = s.key; renderTabs(); renderPanel(); });
            nav.appendChild(b);
        });
    }

    function renderPanel() {
        var s = SECTIONS.filter(function (x) { return x.key === activeKey; })[0];
        var panel = $('panel');
        panel.innerHTML = '';
        panel.appendChild(el('h1', null, s.label));
        panel.appendChild(el('p', 'lead', s.lead || ''));

        if (s.kind === 'object') {
            data[s.key] = data[s.key] || {};
            var card = el('div', 'card');
            s.fields.forEach(function (f) { card.appendChild(fieldEl(f, data[s.key])); });
            panel.appendChild(card);
        } else {
            data[s.key] = data[s.key] || [];
            panel.appendChild(listEl(s, null, data[s.key]));
        }
        window.scrollTo({ top: 0 });
    }

    /* ================= screens / session ================= */
    function showLogin() {
        token = null; data = null;
        clearTimeout(idleTimer);
        $('app').classList.add('hidden');
        $('login').classList.remove('hidden');
        var vault = hasVault();
        $('setupForm').classList.toggle('hidden', vault);
        $('unlockForm').classList.toggle('hidden', !vault);
        $('branch').value = localStorage.getItem(BRANCH_KEY) || 'main';
        ['token', 'newPass', 'newPass2', 'passcode'].forEach(function (id) { $(id).value = ''; });
        showLoginError('');
        setTimeout(function () { (vault ? $('passcode') : $('token')).focus(); }, 50);
    }

    function enterApp() {
        branch = $('branch').value.trim() || 'main';
        localStorage.setItem(BRANCH_KEY, branch);
        busy(true, 'Signing in...');
        verifyToken().then(loadData).then(function () {
            $('login').classList.add('hidden');
            $('app').classList.remove('hidden');
            $('branchLabel').textContent = branch;
            $('viewSite').href = '../';
            activeKey = SECTIONS[0].key;
            renderTabs(); renderPanel(); updateDirty(); resetIdle();
        }).catch(function (err) {
            token = null;
            if (err.status === 404 && /Not Found/i.test(err.message)) {
                showLoginError('Could not find ' + DATA_PATH + ' on branch "' + branch + '". If the claude branch has not been merged yet, set the branch above to "claude".');
            } else {
                showLoginError(err.message);
            }
        }).finally(function () { busy(false); });
    }

    function resetIdle() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function () {
            if (isDirty()) { resetIdle(); return; }
            toast('Locked after 30 minutes of inactivity.');
            showLogin();
        }, IDLE_MS);
    }

    /* ================= wire up ================= */
    function init() {
        if (!window.crypto || !crypto.subtle) {
            showLoginError('This page needs a secure (https) connection and a modern browser.');
        }

        document.querySelectorAll('[data-toggle]').forEach(function (b) {
            b.addEventListener('click', function () {
                var input = $(b.getAttribute('data-toggle'));
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });

        $('setupForm').addEventListener('submit', function (e) {
            e.preventDefault();
            showLoginError('');
            var tok = $('token').value.trim(), p1 = $('newPass').value, p2 = $('newPass2').value;
            if (p1.length < 8) return showLoginError('Passcode must be at least 8 characters.');
            if (p1 !== p2) return showLoginError('Passcodes do not match.');
            token = tok;
            busy(true, 'Checking token...');
            verifyToken().then(function () { return sealToken(tok, p1); }).then(function () {
                busy(false);
                enterApp();
            }).catch(function (err) {
                token = null; busy(false); showLoginError(err.message);
            });
        });

        var failures = 0;
        $('unlockForm').addEventListener('submit', function (e) {
            e.preventDefault();
            showLoginError('');
            var pass = $('passcode').value;
            busy(true, 'Unlocking...');
            var wait = failures ? Math.min(failures * 1000, 8000) : 0;
            new Promise(function (r) { setTimeout(r, wait); })
                .then(function () { return openToken(pass); })
                .then(function (tok) { failures = 0; token = tok; busy(false); enterApp(); })
                .catch(function () {
                    failures++; busy(false);
                    showLoginError('Wrong passcode.');
                });
        });

        $('forget').addEventListener('click', function (e) {
            e.preventDefault();
            if (window.confirm('Remove the saved token from this browser? You will need to paste a token again.')) {
                localStorage.removeItem(VAULT_KEY);
                showLogin();
            }
        });

        $('saveBtn').addEventListener('click', saveData);
        $('discardBtn').addEventListener('click', function () {
            if (isDirty() && !window.confirm('Discard unsaved changes and reload from GitHub?')) return;
            loadData().then(function () { renderPanel(); updateDirty(); toast('Reloaded from GitHub.'); })
                .catch(function (err) { toast(err.message, 'err'); });
        });
        $('logoutBtn').addEventListener('click', function () {
            if (isDirty() && !window.confirm('You have unsaved changes. Lock anyway?')) return;
            showLogin();
        });
        $('themeBtn').addEventListener('click', function () {
            var dark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', dark ? 'true' : 'false');
        });

        window.addEventListener('beforeunload', function (e) {
            if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
        });
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && !$('app').classList.contains('hidden')) {
                e.preventDefault(); saveData();
            }
        });

        showLogin();
    }

    init();
})();
