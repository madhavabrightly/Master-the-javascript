/* ==========================================================================
   playground.js — run CommonJS in the browser

   There is no server here. This file implements a miniature version of the
   Node.js module system: relative resolution, a module cache, the five-argument
   wrapper function, and circular-dependency handling. `path` and `events` are
   real implementations; `fs` and `http` are honest stubs that explain why they
   cannot work in a browser tab.
   ========================================================================== */

(function () {
  "use strict";

  /* ======================================================================
     1. A real, POSIX-style `path` implementation
     ====================================================================== */

  function pathNormalize(p) {
    p = String(p);
    var isAbs = p.charAt(0) === "/";
    var trailing = p.length > 1 && p.charAt(p.length - 1) === "/";
    var out = [];

    p.split("/").forEach(function (seg) {
      if (!seg || seg === ".") return;
      if (seg === "..") {
        if (out.length && out[out.length - 1] !== "..") out.pop();
        else if (!isAbs) out.push("..");
        return;
      }
      out.push(seg);
    });

    var res = out.join("/");
    if (isAbs) res = "/" + res;
    if (trailing && res.charAt(res.length - 1) !== "/") res += "/";
    return res || (isAbs ? "/" : ".");
  }

  function pathJoin() {
    var parts = Array.prototype.filter.call(arguments, function (s) {
      return s !== undefined && s !== null && s !== "";
    });
    if (!parts.length) return ".";
    return pathNormalize(parts.join("/"));
  }

  function pathResolve() {
    var parts = Array.prototype.filter.call(arguments, function (s) {
      return s !== undefined && s !== null && s !== "";
    });
    var abs = "";
    for (var i = parts.length - 1; i >= 0; i--) {
      abs = parts[i] + "/" + abs;
      if (String(parts[i]).charAt(0) === "/") break;
    }
    if (abs.charAt(0) !== "/") abs = "/" + abs;
    return pathNormalize(abs);
  }

  function pathBasename(p, ext) {
    p = String(p);
    while (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.slice(0, -1);
    var i = p.lastIndexOf("/");
    var base = i === -1 ? p : p.slice(i + 1);
    if (ext && base.length > ext.length && base.slice(-ext.length) === ext) {
      base = base.slice(0, -ext.length);
    }
    return base;
  }

  function pathDirname(p) {
    p = String(p);
    while (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.slice(0, -1);
    var i = p.lastIndexOf("/");
    if (i === -1) return ".";
    if (i === 0) return "/";
    return p.slice(0, i);
  }

  function pathExtname(p) {
    var base = pathBasename(p);
    var i = base.lastIndexOf(".");
    if (i <= 0) return "";
    return base.slice(i);
  }

  function pathParse(p) {
    p = String(p);
    var root = p.charAt(0) === "/" ? "/" : "";
    var base = pathBasename(p);
    var ext = pathExtname(p);
    var dir = pathDirname(p);
    if (root && dir === ".") dir = "/";
    return {
      root: root,
      dir: dir,
      base: base,
      ext: ext,
      name: ext ? base.slice(0, -ext.length) : base
    };
  }

  function pathFormat(o) {
    var dir = o.dir || o.root || "";
    var base = o.base || ((o.name || "") + (o.ext || ""));
    return dir ? pathJoin(dir, base) : base;
  }

  function pathRelative(from, to) {
    from = pathResolve(from).split("/").filter(Boolean);
    to = pathResolve(to).split("/").filter(Boolean);

    var i = 0;
    while (i < from.length && i < to.length && from[i] === to[i]) i++;

    var out = [];
    for (var j = 0; j < from.length - i; j++) out.push("..");
    return out.concat(to.slice(i)).join("/");
  }

  function createPath() {
    return {
      sep: "/",
      delimiter: ":",
      join: pathJoin,
      resolve: pathResolve,
      normalize: pathNormalize,
      basename: pathBasename,
      dirname: pathDirname,
      extname: pathExtname,
      parse: pathParse,
      format: pathFormat,
      relative: pathRelative,
      isAbsolute: function (p) { return String(p).charAt(0) === "/"; }
    };
  }

  /* ======================================================================
     2. A real EventEmitter
     ====================================================================== */

  function EventEmitter() {
    this._events = Object.create(null);
  }
  EventEmitter.prototype.on = function (name, fn) {
    (this._events[name] = this._events[name] || []).push(fn);
    return this;
  };
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;
    function wrapped() {
      self.removeListener(name, wrapped);
      fn.apply(self, arguments);
    }
    wrapped.listener = fn;
    return this.on(name, wrapped);
  };

  EventEmitter.prototype.removeListener = function (name, fn) {
    var list = this._events[name];
    if (!list) return this;
    this._events[name] = list.filter(function (f) {
      return f !== fn && f.listener !== fn;
    });
    return this;
  };
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

  EventEmitter.prototype.emit = function (name) {
    var list = this._events[name];
    if (!list || !list.length) return false;
    var args = Array.prototype.slice.call(arguments, 1);
    list.slice().forEach(function (fn) { fn.apply(this, args); }, this);
    return true;
  };

  EventEmitter.prototype.listeners = function (name) {
    return (this._events[name] || []).slice();
  };

  /* ======================================================================
     3. Console capture
     ====================================================================== */

  function formatValue(v) {
    if (typeof v === "string") return v;
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "bigint") return String(v) + "n";
    if (typeof v === "symbol") return v.toString();
    if (typeof v === "function") return "[Function: " + (v.name || "anonymous") + "]";
    if (v instanceof Error) return v.name + ": " + v.message;
    if (Array.isArray(v)) {
      return "[" + v.map(formatValue).join(", ") + "]";
    }
    try {
      var json = JSON.stringify(v, null, 0);
      if (json === undefined) return String(v);
      return json.length > 400 ? json.slice(0, 400) + "\u2026" : json;
    } catch (e) {
      return String(v);
    }
  }

  function createConsole(write) {
    function make(kind) {
      return function () {
        write(kind, Array.prototype.map.call(arguments, formatValue).join(" "));
      };
    }
    return {
      log: make("log"),
      info: make("log"),
      debug: make("log"),
      warn: make("warn"),
      error: make("error")
    };
  }

  /* ES modules cannot receive `console` as an argument — they run in global
     scope — so for ESM runs we route the real console into the active panel. */

  var nativeConsole = window.console;
  var consoleSink = null;

  var routedConsole = createConsole(function (kind, text) {
    if (consoleSink) consoleSink(kind, text);
    else if (nativeConsole && nativeConsole.log) nativeConsole.log(text);
  });

  function setConsoleSink(fn) {
    consoleSink = fn;
    if (window.console !== routedConsole) window.console = routedConsole;
  }

  /* ======================================================================
     5b. A real ES-module runtime, backed by Blob URLs

     Each file becomes a genuine ES module. Relative specifiers are rewritten
     to the blob URL of the module they point at, so the browser's own module
     loader does the work — live bindings, top-level await and all.
     ====================================================================== */

  var SPECIFIER_RE = /(from\s*|import\s*|import\(\s*)(['"])([^'"]+)\2/g;

  function collectRelativeSpecifiers(source) {
    var out = [];
    var re = new RegExp(SPECIFIER_RE.source, "g");
    var m;
    while ((m = re.exec(source))) {
      if (m[3].charAt(0) === ".") out.push(m[3]);
    }
    return out;
  }

  function createEsmRuntime(files) {
    var built = {};
    var visiting = {};
    var urls = [];

    function build(id) {
      if (built[id]) return built[id];

      if (visiting[id]) {
        throw new Error(
          "Circular ES module imports aren't supported in this playground.\n" +
          "  cycle detected at: '" + id + "'\n" +
          "  (real ESM handles cycles with live bindings — try this one in Node.)"
        );
      }

      if (!Object.prototype.hasOwnProperty.call(files, id)) {
        throw new Error(
          "Cannot find module '" + id + "'\n" +
          "  files in this playground: " + Object.keys(files).join(", ")
        );
      }

      visiting[id] = true;

      // Depth-first: every dependency must exist as a blob before this one.
      collectRelativeSpecifiers(files[id]).forEach(function (spec) {
        build(resolveId(id, spec));
      });

      var rewritten = files[id].replace(SPECIFIER_RE, function (match, prefix, quote, spec) {
        if (spec.charAt(0) !== ".") return match;
        var target = resolveId(id, spec);
        if (!built[target]) return match;
        return prefix + quote + built[target] + quote;
      });

      var url = URL.createObjectURL(new Blob([rewritten], { type: "text/javascript" }));
      urls.push(url);
      built[id] = url;
      visiting[id] = false;
      return url;
    }

    return {
      run: function (entryId) {
        var url = build(entryId);
        return import(url).then(function () {
          urls.forEach(function (u) { URL.revokeObjectURL(u); });
          urls.length = 0;
          built = {};
        });
      }
    };
  }

  /* ======================================================================
     4. Built-in modules (real where possible, honest stubs where not)
     ====================================================================== */

  function createBuiltins(write) {
    var EventEmitterBound = EventEmitter;

    function stubModule(name, methods, why) {
      var mod = {};
      methods.forEach(function (m) {
        mod[m] = function () {
          write("info", name + "." + m + "() needs the real Node.js \u2014 " + why);
          return undefined;
        };
      });
      return mod;
    }

    var fileWhy = "a browser tab has no filesystem to read from.";
    var netWhy = "a browser tab cannot open a listening socket.";

    return {
      path: createPath(),
      events: EventEmitterBound,
      EventEmitter: EventEmitterBound,
      fs: stubModule("fs",
        ["readFile", "readFileSync", "writeFile", "writeFileSync", "appendFile",
         "appendFileSync", "readdir", "readdirSync", "stat", "statSync"],
        fileWhy),
      http: {
        createServer: function () {
          write("info", "http.createServer() needs the real Node.js \u2014 " + netWhy);
          return { listen: function () { return this; }, on: function () { return this; }, close: function () {} };
        }
      },
      os: stubModule("os", ["platform", "cpus", "hostname"], "browsers do not expose OS details."),
      child_process: stubModule("child_process", ["exec", "spawn"], netWhy)
    };
  }

  /* ======================================================================
     5. The miniature CommonJS runtime
     ====================================================================== */

  function resolveId(fromId, request) {
    if (request.charAt(0) !== ".") return request;

    var dir = fromId.split("/").slice(0, -1);
    var segments = dir.concat(request.split("/"));
    var stack = [];

    segments.forEach(function (seg) {
      if (!seg || seg === ".") return;
      if (seg === "..") stack.pop();
      else stack.push(seg);
    });

    return stack.join("/");
  }

  function createRuntime(files, write) {
    var cache = {};
    var builtins = createBuiltins(write);
    var order = [];

    function makeRequire(fromId) {
      return function require(request) {
        var id = resolveId(fromId, request);

        if (Object.prototype.hasOwnProperty.call(builtins, id)) {
          return builtins[id];
        }

        if (!Object.prototype.hasOwnProperty.call(files, id)) {
          var available = Object.keys(files).join(", ");
          throw new Error(
            "Cannot find module '" + request + "'\n" +
            "  resolved to: '" + id + "'\n" +
            "  files in this playground: " + available
          );
        }

        if (cache[id]) return cache[id].exports;

        var module = { exports: {}, id: id, filename: id, loaded: false };

        // Registered before execution so circular requires get the partial exports.
        cache[id] = module;
        order.push(id);

        var dir = id.split("/").slice(0, -1).join("/") || ".";
        var sandboxConsole = createConsole(write);

        var wrapper = new Function(
          "exports", "require", "module", "__filename", "__dirname",
          "console", "process", "setImmediate",
          files[id] + "\n//# sourceURL=playground:///" + id
        );

        wrapper(
          module.exports,
          makeRequire(id),
          module,
          id,
          dir,
          sandboxConsole,
          {
            env: { NODE_ENV: "playground" },
            platform: "browser",
            version: "v-playground",
            nextTick: function (fn) { setTimeout(fn, 0); }
          },
          function (fn) { setTimeout(fn, 0); }
        );

        module.loaded = true;
        return module.exports;
      };
    }

    return {
      run: function (entry) { return makeRequire("")(entry); },
      loadOrder: function () { return order.slice(); },
      reset: function () { cache = {}; order.length = 0; }
    };
  }

  /* ======================================================================
     6. DOM wiring
     ====================================================================== */

  function collectFiles(root) {
    var files = {};
    var editors = root.querySelectorAll(".pg-editor");
    Array.prototype.forEach.call(editors, function (ed) {
      var name = ed.getAttribute("data-name");
      var area = ed.querySelector("textarea");
      if (name && area) files[name] = area.value;
    });
    return files;
  }

  function outputApi(out) {
    function write(kind, text) {
      var line = document.createElement("div");
      line.className = "pg-line " +
        (kind === "error" ? "is-err" : kind === "info" ? "is-info" : kind === "echo" ? "is-echo" : "");
      line.textContent = text;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    }

    return {
      write: write,
      clear: function () {
        out.innerHTML = "";
      },
      empty: function () {
        var p = document.createElement("span");
        p.className = "pg-placeholder";
        p.textContent = "Press Run \u2014 output appears here.";
        out.appendChild(p);
      }
    };
  }

  function setupPlayground(root) {
    var out = root.querySelector(".pg-out");
    var runBtn = root.querySelector(".pg-run");
    var resetBtn = root.querySelector(".pg-reset");
    var clearBtn = root.querySelector(".pg-clear");
    var tabs = root.querySelectorAll(".pg-tab");
    var editors = root.querySelectorAll(".pg-editor");
    var entry = root.getAttribute("data-entry");

    if (!out) return;

    var api = outputApi(out);
    var originals = {};
    Array.prototype.forEach.call(editors, function (ed) {
      var name = ed.getAttribute("data-name");
      var area = ed.querySelector("textarea");
      if (name && area) originals[name] = area.value;
    });

    if (!entry) {
      var first = root.querySelector(".pg-editor");
      entry = first ? first.getAttribute("data-name") : null;
    }

    function showTab(name) {
      Array.prototype.forEach.call(tabs, function (t) {
        t.classList.toggle("is-active", t.getAttribute("data-file") === name);
      });
      Array.prototype.forEach.call(editors, function (ed) {
        ed.classList.toggle("is-active", ed.getAttribute("data-name") === name);
      });
    }

    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener("click", function () {
        showTab(t.getAttribute("data-file"));
      });
    });

    var mode = root.getAttribute("data-mode") === "esm" ? "esm" : "cjs";

    function reportError(err) {
      api.write("error", err && err.message ? err.message : String(err));
      if (err && err.stack) {
        String(err.stack).split("\n").slice(1, 3)
          .map(function (f) { return f.trim(); })
          .filter(function (f) { return f.indexOf("playground:///") !== -1; })
          .forEach(function (f) { api.write("echo", f); });
      }
    }

    function runCjs(files, started) {
      var runtime = createRuntime(files, api.write);
      var result = runtime.run(entry);

      // The entry module's own exports are rarely interesting — skip the
      // empty-object noise a bare `module.exports = {}` would produce.
      var isBareExport = result !== null && typeof result === "object" &&
        !Array.isArray(result) && Object.keys(result).length === 0;

      if (result !== undefined && !isBareExport) {
        api.write("echo", "returned " + formatValue(result));
      }

      var ms = Math.max(0, performance.now() - started);
      api.write("info", "finished in " + ms.toFixed(1) + " ms \u2014 " +
        runtime.loadOrder().join(" \u2192 "));
    }

    function runEsm(files, started) {
      setConsoleSink(api.write);
      return createEsmRuntime(files).run(entry).then(function () {
        var ms = Math.max(0, performance.now() - started);
        api.write("info", "finished in " + ms.toFixed(1) + " ms \u2014 ES modules evaluated");
      });
    }

    function run() {
      api.clear();

      var files = collectFiles(root);
      var started = performance.now();

      try {
        if (mode === "esm") runEsm(files, started).catch(reportError);
        else runCjs(files, started);
      } catch (err) {
        reportError(err);
      }
    }

    if (runBtn) runBtn.addEventListener("click", run);

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        Array.prototype.forEach.call(editors, function (ed) {
          var name = ed.getAttribute("data-name");
          var area = ed.querySelector("textarea");
          if (area && originals[name] !== undefined) area.value = originals[name];
        });
        api.clear();
        api.empty();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        api.clear();
        api.empty();
      });
    }

    Array.prototype.forEach.call(editors, function (ed) {
      var area = ed.querySelector("textarea");
      if (!area) return;
      area.setAttribute("spellcheck", "false");
      area.setAttribute("autocapitalize", "off");
      area.setAttribute("autocomplete", "off");
      area.addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          run();
        }
        if (e.key === "Tab") {
          e.preventDefault();
          var s = area.selectionStart;
          var end = area.selectionEnd;
          area.value = area.value.slice(0, s) + "  " + area.value.slice(end);
          area.selectionStart = area.selectionEnd = s + 2;
        }
      });
    });

    showTab(entry);
    api.empty();
  }

  function boot() {
    var all = document.querySelectorAll("[data-playground]");
    Array.prototype.forEach.call(all, setupPlayground);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
