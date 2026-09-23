# Master the JavaScript

A monochrome, example-driven JavaScript course built as a static site — with **every example
runnable in the browser**. No build step, no framework, no server to deploy.

**All five categories are complete.**

---

## What makes this different

Most tutorials show you a code block and tell you what it prints. This course lets you **run it**.

Every page ships a playground that implements a **miniature module system in vanilla
JavaScript** — plus, for Category 4, a genuine ES-module loader built on Blob URLs.

| Feature | Real? | Notes |
|---|---|---|
| `require()` with relative paths | ✅ Real | `./math.js` resolves exactly like Node |
| `module.exports` / `exports` | ✅ Real | Including the `exports` vs `module.exports` gotcha |
| Module cache | ✅ Real | Second `require` returns the same object |
| Load order | ✅ Real | The playground prints the real order modules were evaluated |
| Circular dependencies | ✅ Real | Partial exports, just like Node — try it yourself |
| `import` / `export` | ✅ Real | Genuine ES modules loaded by the browser's own module loader |
| Top-level `await` | ✅ Real | Impossible to fake — it only works because these are real modules |
| Dynamic `import()` | ✅ Real | Returns a real promise, loads a real module |
| `path` | ✅ Real | A full POSIX implementation: `join`, `resolve`, `parse`, `relative`, `normalize`, `format`, `basename`, `dirname`, `extname` |
| `events` | ✅ Real | A working `EventEmitter` with `on`, `once`, `off`, `emit` |
| `fs` | ⚠️ Stub | Explains why a browser tab has no filesystem |
| `http` | ⚠️ Stub | Explains why a browser tab can't open a socket |

Nothing is faked. The stubs tell you *why* they can't work rather than pretending.

---

## The five categories

| # | Category | Covers | Playground |
|---|---|---|---|
| 01 | **Module Fundamentals & CommonJS** | Why modules exist, `require`/`module.exports`, the module cache, circular dependencies, `node_modules`, `package.json`, `fs`/`path`/`http`/`events` | 3-file CommonJS sandbox + live `path` module |
| 02 | **Async JavaScript & the Event Loop** | Blocking vs non-blocking, callbacks, promises, combinators, `async`/`await`, microtasks vs macrotasks, timers, debounce/throttle, concurrency control, async error handling, **streams & async iteration**, **real-time (SSE / WebSocket)** | Live event-loop ordering demo |
| 03 | **Objects, Prototypes & Classes** | Primitives vs references, shallow vs deep copy, the prototype chain, `this` binding, classes, descriptors, iterables, `Map`/`Set`/`WeakMap`, closures, composition over inheritance | Prototype / `this` / copy-semantics sandbox |
| 04 | **Modern Tooling & ES Modules** | `import`/`export`, live bindings, ESM vs CommonJS, `package.json` `exports`, npm dependencies, bundlers, TypeScript, testing in depth, debugging & CI | **Real ES modules** with top-level `await` |
| 05 | **Advanced Patterns from Real Projects** | Electron IPC and preload bridges, real-time audio state machines, canvas render loops, daemon architecture with circuit breakers, defensive security, React patterns, testing real systems | Working state machine with refused transitions |

Category 1 has 5 longer sections, Category 2 has 10, Categories 3 and 4 have 8 each, and
Category 5 has 7. Each has runnable examples with their real output, pitfall callouts, a summary
and a three-question quiz. **175 code blocks** in total, every one copyable.

Category 5 is distilled from working code in real projects, and credits its sources in a short
note at the top of the page.

---

## Project structure

```
.
├── index.html                              # Landing page: hero, playground, roadmap
├── lessons/
│   ├── 01-module-fundamentals.html
│   ├── 02-async-and-the-event-loop.html
│   ├── 03-objects-prototypes-classes.html
│   ├── 04-modern-tooling-and-esm.html
│   └── 05-advanced-patterns.html
├── assets/
│   ├── css/
│   │   ├── style.css                       # Design tokens, nav, cards, glow effects
│   │   ├── landing.css                     # Hero, marquee, track cards, stats
│   │   ├── lesson.css                       # Sidebar TOC, prose, code blocks, quiz
│   │   └── playground.css                  # Editor tabs, run bar, console output
│   ├── js/
│   │   ├── theme.js                        # Spotlight, particles, reveal, nav, progress
│   │   ├── lesson.js                       # TOC scrollspy, copy buttons, quiz, back-to-top
│   │   └── playground.js                   # CommonJS + ESM runtimes and editor UI
│   └── img/
│       └── favicon.svg
├── .nojekyll                               # Stops GitHub Pages from running Jekyll
└── README.md
```

---

## Preview locally

```bash
npx serve .
# or
python -m http.server 8000
```

Then open <http://localhost:8000>.

> Use a server rather than opening the file directly — `file://` blocks clipboard access and
> can stop the web font from loading.

---

## Deploy to GitHub Pages

This repo is set up for Pages with no build step.

1. Push to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Add Master the JavaScript course site"
   git branch -M main
   git remote add origin https://github.com/madhavabrightly/Master-the-javascript.git
   git push -u origin main
   ```

2. Go to **Settings → Pages**.
3. Set **Source** to `Deploy from a branch`.
4. Choose branch **`main`**, folder **`/ (root)`**, then **Save**.
5. Your site will be live at:

   ```
   https://madhavabrightly.github.io/Master-the-javascript/
   ```

All internal links are relative, so the site works from a repository subpath without changes.

---

## How the design works

The palette is strictly monochrome. Colour never carries meaning — contrast and weight do.
The "white effect" comes from ambient layers that sit behind the content:

- **Film grain** — an inline SVG noise layer, barely visible, slowly drifting.
- **Cursor spotlight** — a soft white glow that follows the pointer.
- **Particle field** — a lightweight canvas of drifting white dots.
- **Glow tokens** — `--glow-soft`, `--glow-hard`, `--glow-text`, reused on cards, buttons,
  active TOC entries, code blocks and the Run button.
- **Blueprint grid** — a faint grid that fades out down the page.

Everything animates with `transform` and `opacity` only, and all of it is disabled when the
visitor has **`prefers-reduced-motion`** enabled. The particle canvas also pauses when the tab
is hidden.

### Syntax highlighting

`highlight.js` loads from a CDN and is themed entirely in greys by `lesson.css` — the default
colourful theme is never loaded. If the CDN is unreachable, code blocks still render as plain
monospace text and nothing breaks.

---

## Adding the playground to a page

1. Link the stylesheet and script:

   ```html
   <link rel="stylesheet" href="../assets/css/playground.css">
   ...
   <script src="../assets/js/playground.js"></script>
   ```

2. Drop in the markup. Each `.pg-editor` is one file; `data-entry` names the file to run first:

   ```html
   <div class="playground" data-playground data-entry="main.js">
     <div class="pg-bar">
       <span class="pg-badge"><i></i> CommonJS sandbox</span>
       <div class="pg-tabs">
         <button class="pg-tab" type="button" data-file="main.js">main.js</button>
         <button class="pg-tab" type="button" data-file="math.js">math.js</button>
       </div>
       <div class="pg-actions">
         <button class="pg-btn pg-clear" type="button">Clear</button>
         <button class="pg-btn pg-reset" type="button">Reset</button>
         <button class="pg-btn pg-btn-run pg-run" type="button">Run &#9654;</button>
       </div>
     </div>

     <div class="pg-editors">
       <div class="pg-editor is-active" data-name="main.js">
         <textarea rows="9">const math = require('./math.js');
   console.log(math.add(2, 3));</textarea>
       </div>
       <div class="pg-editor" data-name="math.js">
         <textarea rows="9">module.exports = { add: (a, b) => a + b };</textarea>
       </div>
     </div>

     <div class="pg-out-wrap">
       <div class="pg-out-label">console output</div>
       <div class="pg-out"></div>
     </div>
   </div>
   ```

### Switching a playground to ES modules

Add `data-mode="esm"`. The files are then loaded as **real ES modules** via Blob URLs, so
`import`/`export`, live bindings, top-level `await` and dynamic `import()` all behave exactly as
they do in Node or a browser:

```html
<div class="playground" data-playground data-mode="esm" data-entry="main.js">
```

Tabs, running, reset, clearing and `Ctrl`+`Enter` are wired automatically either way.
No other JavaScript is needed.

> **Escaping:** inside a `<textarea>`, write `&lt;` for `<` and `&amp;` for `&`.

---

## Adding a new category

1. **Duplicate a lesson file**

   ```bash
   cp lessons/04-modern-tooling-and-esm.html lessons/05-something-new.html
   ```

2. **Update it** — the `<title>`, breadcrumbs, `<h1>`, the sidebar `<ul class="toc">`, and the
   `<article class="prose">` sections. Relative paths (`../assets/...`) stay the same.

3. **Update the landing page** — in `index.html`, add a track card following the existing
   `is-live` pattern, or change a placeholder from `is-soon`.

4. **Update the footers** — every lesson footer carries the course index; add the new link there.

5. **Chain the pager** — update the "Next" link at the bottom of the previous lesson.

Copy buttons, the quiz and any playground wire themselves up automatically.

---

## Accessibility notes

- A skip link is the first focusable element on every page.
- Anchor targets clear the sticky header via `scroll-padding-top`.
- The mobile menu closes on `Escape` and restores focus to the toggle.
- All animation respects `prefers-reduced-motion`.
- The quiz uses real `<button>` elements and exposes the result via `aria-pressed`.
- Playground editors are plain `<textarea>` elements — fully keyboard accessible, with
  `Tab` inserting spaces and `Ctrl`/`Cmd`+`Enter` running the code.

---

## Known limitations

- **ESM playground cycles:** circular `import` graphs aren't supported (the loader builds
  dependencies depth-first). It reports a clear message rather than failing silently. Real ESM
  handles cycles with live bindings — the CommonJS playground *does* support them.
- **Global console routing:** ESM modules can't receive an injected `console`, so the ESM
  playground routes the real `console` into the active panel. Running two ESM playgrounds
  simultaneously on one page can interleave their output. Running one at a time is fine.
- **`fs` and `http`** are intentionally stubs — a browser tab genuinely cannot do file I/O or
  open a listening socket.

---

## License

MIT — free to use, adapt, and teach with.
