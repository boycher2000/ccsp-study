(function () {
  "use strict";
  var C = window.CCSP;
  var app = document.getElementById("app");
  var S = { outline: null, topics: {}, order: [], notes: {}, overview: "", qcount: {} };

  function init() {
    return C.loadOutline().then(function (o) {
      S.outline = o.outline; S.topics = o.topics; S.order = o.order;
      return Promise.all([
        C.loadNotes(S.outline).then(function (n) { S.notes = n; }),
        C.getText(C.base + "data/notes/overview.md").then(function (t) { S.overview = t; }).catch(function () { S.overview = ""; }),
        C.loadQuestions(S.outline).then(function (q) {
          q.list.forEach(function (x) { S.qcount[x.topic] = (S.qcount[x.topic] || 0) + 1; });
        })
      ]);
    });
  }

  function layout(inner, current) {
    var toc = S.outline.domains.map(function (d) {
      var open = current && S.topics[current] && S.topics[current].domain === d.id ? " open" : "";
      return "<details" + open + "><summary>D" + d.id + " " + C.esc(d.zh) + ' <span class="pill">' + d.weight + "%</span></summary><ul>" +
        d.topics.map(function (t) {
          return '<li><a href="#/t/' + t.id + '"' + (t.id === current ? ' class="on"' : "") + ">" + t.id + " " + C.esc(t.zh) + "</a></li>";
        }).join("") + "</ul></details>";
    }).join("");
    app.innerHTML = '<div class="layout"><aside class="toc"><details class="tocwrap" open><summary>目錄</summary>' +
      '<form id="sf" class="search"><input id="sq" type="search" placeholder="搜尋筆記(例:tokenization)" aria-label="搜尋筆記"></form>' +
      '<a href="#/" class="tochome">總覽與總訣</a>' + toc + "</details></aside>" +
      '<section class="content" id="content">' + inner + "</section></div>";
    var form = document.getElementById("sf");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = document.getElementById("sq").value.trim();
      if (q) location.hash = "#/s/" + encodeURIComponent(q);
    });
    if (window.matchMedia && window.matchMedia("(max-width: 800px)").matches) {
      var w = app.querySelector(".tocwrap"); if (w) w.removeAttribute("open");
    }
  }

  function viewHome() {
    var cards = S.outline.domains.map(function (d) {
      var have = d.topics.filter(function (t) { return S.notes[t.id]; }).length;
      return '<a class="dcard" href="#/t/' + d.topics[0].id + '"><strong>D' + d.id + "</strong> " + C.esc(d.zh) +
        '<span class="muted">' + C.esc(d.title) + "</span><span class=\"pill\">權重 " + d.weight + "% · " + have + "/" + d.topics.length + " 篇</span></a>";
    }).join("");
    layout("<h1>CCSP 筆記</h1>" +
      '<div class="callout sum">依 ISC2 CCSP 2026-08-01 生效大綱整理,6 個 domain、38 個子項。刷題請走 <a href="../quiz/">刷題入口</a>。</div>' +
      '<div class="dgrid">' + cards + "</div>" +
      '<article class="note-body">' + C.md(S.overview) + "</article>", null);
  }

  function viewTopic(id) {
    var t = S.topics[id];
    if (!t) { layout("<p>找不到這個子項。</p>", null); return; }
    var d = S.outline.domains[t.domain - 1];
    var i = S.order.indexOf(id), prev = S.order[i - 1], next = S.order[i + 1];
    var body = S.notes[id] ? C.md(S.notes[id].replace(/^## .*\n/, "")) : '<p class="muted">這個子項的筆記還沒寫。</p>';
    var n = S.qcount[id] || 0;
    var html = '<p class="muted"><a href="#/">總覽</a> / D' + d.id + " " + C.esc(d.zh) + "</p>" +
      "<h1>" + t.id + " " + C.esc(t.zh) + '</h1><div class="muted">' + C.esc(t.title) + "</div>" +
      '<details class="card official"><summary>官方大綱要點(' + t.bullets.length + " 項,用來檢查筆記有沒有漏)</summary><ol class=\"checklist\">" +
      t.bullets.map(function (b) { return "<li>" + C.esc(b) + "</li>"; }).join("") + "</ol></details>" +
      '<article class="note-body">' + body + "</article>" +
      '<div class="row"><a class="btn' + (n ? "" : " secondary") + '" href="../quiz/#/topic/' + id + '">練習這個子項(' + n + " 題)</a></div>" +
      '<div class="row">' +
      (prev ? '<a class="btn secondary" href="#/t/' + prev + '">← ' + prev + " " + C.esc(S.topics[prev].zh) + "</a>" : "") +
      (next ? '<a class="btn secondary" href="#/t/' + next + '">' + next + " " + C.esc(S.topics[next].zh) + " →</a>" : "") + "</div>";
    layout(html, id);
  }

  function viewSearch(q) {
    var needle = q.toLowerCase(), hits = [];
    S.order.forEach(function (id) {
      var t = S.topics[id], text = C.plain(S.notes[id] || ""), low = text.toLowerCase();
      var title = (t.id + " " + t.zh + " " + t.title).toLowerCase();
      var at = low.indexOf(needle);
      if (at >= 0 || title.indexOf(needle) >= 0) {
        var s = Math.max(0, at - 30), snip = at >= 0 ? text.slice(s, at + needle.length + 60) : "";
        var count = at >= 0 ? low.split(needle).length - 1 : 0;
        hits.push({ id: id, snip: snip, count: count });
      }
    });
    var html = "<h1>搜尋:" + C.esc(q) + "</h1><p class=\"muted\">共 " + hits.length + " 個子項符合。</p>" +
      hits.map(function (h) {
        var t = S.topics[h.id];
        return '<div class="card"><a href="#/t/' + h.id + '"><strong>' + h.id + " " + C.esc(t.zh) + "</strong></a> " +
          '<span class="pill">出現 ' + h.count + " 次</span><div class=\"muted\">…" + C.esc(h.snip) + "…</div></div>";
      }).join("");
    layout(html, null);
    document.getElementById("sq").value = q;
  }

  function route() {
    var h = location.hash.replace(/^#\/?/, ""), p = h.split("/");
    window.scrollTo(0, 0);
    if (p[0] === "t" && p[1]) return viewTopic(p[1]);
    if (p[0] === "s" && p[1]) return viewSearch(decodeURIComponent(p.slice(1).join("/")));
    viewHome();
  }

  C.markActive("notes");
  init().then(function () {
    window.addEventListener("hashchange", route);
    route();
  }).catch(function (e) {
    app.innerHTML = "<p>資料載入失敗:" + C.esc(e.message) + "</p><p class=\"muted\">請用本機伺服器開啟(例如 <code>python -m http.server -d docs</code>),不要直接用 file:// 開啟。</p>";
  });
})();
