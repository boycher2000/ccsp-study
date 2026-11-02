(function () {
  "use strict";

  var script = document.currentScript;
  var BASE = (script && script.getAttribute("data-base")) || "";

  // ---------- storage (per-viewer only; may be unavailable) ----------
  var STORE = "ccsp.v1";
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function saveStore(d) {
    try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) { /* storage unavailable */ }
  }

  // ---------- text helpers ----------
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/==(.+?)==/g, "<mark>$1</mark>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((https?:\/\/[^)\s]+|#[^)\s]*|\.\.?\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
  }

  // ---------- markdown subset ----------
  // headings (##-####), paragraphs, nested lists, tables, > callouts, ---, :::details blocks
  function md(src) {
    return blocks(src.replace(/<!--[\s\S]*?-->/g, "").replace(/\r/g, "").split("\n"));
  }
  function blocks(lines) {
    var out = [], i = 0, m;
    function special(l) {
      return /^(#{2,4}\s|>|\|\s|---+\s*$|:::|\s*([-*]|\d+\.)\s)/.test(l);
    }
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }

      if ((m = /^:::details\s*(.*)$/.exec(line))) {
        var inner = [], depth = 1;
        i++;
        while (i < lines.length) {
          if (/^:::details/.test(lines[i])) depth++;
          else if (/^:::\s*$/.test(lines[i])) { depth--; if (depth === 0) break; }
          inner.push(lines[i]);
          i++;
        }
        i++;
        out.push("<details><summary>" + inline(m[1] || "展開") + "</summary>" + blocks(inner) + "</details>");
        continue;
      }
      if ((m = /^(#{2,4})\s+(.*)$/.exec(line))) {
        var n = m[1].length;
        out.push("<h" + n + ">" + inline(m[2]) + "</h" + n + ">");
        i++; continue;
      }
      if (/^---+\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

      if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
        var cells = function (l) { return l.replace(/^\|/, "").replace(/\|\s*$/, "").split("|"); };
        var head = cells(line), rows = [];
        i += 2;
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        out.push('<div class="tablewrap"><table><thead><tr>' +
          head.map(function (c) { return "<th>" + inline(c.trim()) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          rows.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + inline(c.trim()) + "</td>"; }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>");
        continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
        var stack = [], html = "";
        while (i < lines.length && (m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]))) {
          var lvl = Math.floor(m[1].length / 2), tag = /\d/.test(m[2]) ? "ol" : "ul";
          while (stack.length > lvl + 1) html += "</li></" + stack.pop() + ">";
          if (stack.length === lvl + 1) html += "</li>";
          else while (stack.length < lvl + 1) { html += "<" + tag + ">"; stack.push(tag); }
          html += "<li>" + inline(m[3]);
          i++;
        }
        while (stack.length) html += "</li></" + stack.pop() + ">";
        out.push(html);
        continue;
      }
      if (/^>/.test(line)) {
        var q = [];
        while (i < lines.length && /^>/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
        var cls = "note", first = q[0] || "";
        if (/^(Tip|考點)/.test(first)) cls = "tip";
        else if (/^待核對/.test(first)) cls = "warn";
        else if (/^口訣|^記憶/.test(first)) cls = "mnemo";
        else if (/^陷阱|^易錯/.test(first)) cls = "trap";
        else if (/^一句話|^重點/.test(first)) cls = "sum";
        out.push('<div class="callout ' + cls + '">' + q.map(inline).join("<br>") + "</div>");
        continue;
      }
      var p = [];
      while (i < lines.length && lines[i].trim() && !special(lines[i])) { p.push(lines[i]); i++; }
      if (!p.length) { p.push(line); i++; }
      out.push("<p>" + p.map(inline).join("<br>") + "</p>");
    }
    return out.join("\n");
  }

  // strip markdown to plain text (for search)
  function plain(src) {
    return src.replace(/<!--[\s\S]*?-->/g, "").replace(/^:::.*$/gm, "").replace(/[*=`|>#]/g, "").replace(/\s+/g, " ");
  }

  // ---------- data ----------
  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + " " + r.status); return r.json(); });
  }
  function getText(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + " " + r.status); return r.text(); });
  }
  function loadOutline() {
    return getJSON(BASE + "data/outline.json").then(function (outline) {
      var topics = {}, order = [];
      outline.domains.forEach(function (d) {
        d.topics.forEach(function (t) { t.domain = d.id; topics[t.id] = t; order.push(t.id); });
      });
      return { outline: outline, topics: topics, order: order };
    });
  }
  function loadQuestions(outline) {
    var list = [], byId = {};
    return Promise.all(outline.domains.map(function (d) {
      return getJSON(BASE + "data/questions/d" + d.id + ".json").then(function (qs) {
        qs.forEach(function (q) { list.push(q); byId[q.id] = q; });
      }).catch(function () { /* no questions yet for this domain */ });
    })).then(function () { return { list: list, byId: byId }; });
  }
  function loadNotes(outline) {
    var notes = {};
    return Promise.all(outline.domains.map(function (d) {
      return getText(BASE + "data/notes/d" + d.id + ".md").then(function (text) {
        text.split(/^## (?=\d\.\d\s)/m).slice(1).forEach(function (sec) { notes[sec.slice(0, 3)] = "## " + sec; });
      }).catch(function () { /* notes missing for this domain */ });
    })).then(function () { return notes; });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function markActive(page) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      a.className = a.getAttribute("data-nav") === page ? "on" : "";
    });
  }

  window.CCSP = {
    base: BASE, esc: esc, inline: inline, md: md, plain: plain, shuffle: shuffle,
    loadStore: loadStore, saveStore: saveStore, loadOutline: loadOutline,
    loadQuestions: loadQuestions, loadNotes: loadNotes, getText: getText, markActive: markActive
  };
})();
