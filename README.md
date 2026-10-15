# Rehema Manuella Wanjiru - Portfolio

Personal portfolio: https://manuella-r.github.io/

A single-page site built with plain HTML, CSS and JavaScript. All of the content lives in one data file, so the site can be updated without touching the code.

> This README is not published on the website. `_config.yml` excludes it (and the other notes and helper files) from the GitHub Pages build.

## How it works

1. `index.html` is the page shell. It keeps a built-in copy of the content as a fallback.
2. `js/render.js` loads `data/site-data.json` and builds every section from it.
3. `js/script.js` then adds the behaviour: smooth navigation, expandable cards, project filters, scroll animations and the typing effect.

Because the data is loaded with `fetch()`, open the site through a local server when testing, not by double-clicking the file:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing content

**Option 1: the admin page** (`/admin/`). Log in with a GitHub token, edit each section in a form and press "Save to website". GitHub Pages republishes within about a minute.

**Option 2: edit `data/site-data.json` directly** and commit it.

### Sections in `site-data.json`

| Key | What it controls |
| --- | --- |
| `home` | Name, typing titles, intro, photo, CV link, social icons |
| `about` | Bio and personal-info grid |
| `education` | Schools and degrees |
| `experience` | Work experience cards (internships, jobs, volunteering) |
| `skills` | Skill groups. A skill with a `label` (for example `Hands-on`) shows a badge; otherwise it shows a `level` percentage bar |
| `projects` | Project cards (see below) |
| `leadership` | Leadership roles |
| `certifications` | Certification categories and certificates |
| `credentials` | The badge strip above the certifications (AWS learning paths, Cisco) |
| `referees` | Referees |
| `contact` | Contact tiles |

### Adding a project

Add an object to `projects`. Only `title` and `description` are required.

```json
{
  "icon": "fa fa-cloud",
  "title": "Project name",
  "categories": ["Cloud & Infrastructure", "Cybersecurity"],
  "description": "One or two sentences shown on the card.",
  "problem": "What the project set out to solve.",
  "tech": "Python, Docker, Flask",
  "actions": ["What you built or did", "Another step"],
  "results": [{ "value": "82%", "label": "accuracy" }],
  "link": "https://github.com/...",
  "linkLabel": "View on GitHub",
  "demo": "https://..."
}
```

- The card shows the icon, title, categories and description. Clicking it opens the problem, technology tags, what you did, results and links.
- The filter buttons above the projects are created automatically from the `categories` you use. A project can belong to more than one category.
- Order in the file is the order on the page.

## Features

- Expandable skill, project and certification cards, with "Expand all / Collapse all" for skills and projects
- Project filter by category
- Navigation that highlights the current section, updates the address bar (for example `/#projects`) so sections can be linked to, and closes the mobile menu after a tap
- Keyboard and screen-reader support: skip link, visible focus, labelled controls, `aria-expanded` and `aria-current`
- Dark/light mode and five colour themes, remembered between visits
- Respects the visitor's "reduce motion" setting (no typing loop, parallax or reveal animations)
- Link previews for LinkedIn, WhatsApp and similar (Open Graph tags in `index.html`)

## Project structure

```
.
├── index.html              Page shell and fallback content
├── _config.yml             Keeps notes and helper files off the website
├── data/site-data.json     All site content
├── js/
│   ├── render.js           Builds the page from the data file
│   ├── script.js           Page behaviour
│   └── style-switcher.js   Theme colours and dark/light mode
├── css/
│   ├── style.css           Main stylesheet
│   ├── style-switcher.css  Theme panel
│   └── skins/              Colour themes
├── admin/                  Content editor (needs a GitHub token to save)
├── images/  cv/  pics/     Photos, CV PDFs and graphics
```

## Notes

- Files excluded from the published site: this README, `SUMMARY.md`, `STYLE_SWITCHER_IMPROVEMENTS.md`, `VISUAL_IMPROVEMENTS.md`, `app.js`, `check-image.sh` and `test-image.html`. To publish or hide another file, edit `_config.yml`.
- `app.js` is an unused Node email script from an earlier contact form. The contact form on the site is hidden.
- For better link previews, add a 1200 x 630 image and point the `og:image` and `twitter:image` tags in `index.html` at it.

## Deployment

Push to the `main` branch. GitHub Pages publishes the site automatically.
