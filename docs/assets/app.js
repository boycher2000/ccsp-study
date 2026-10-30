(function () {
  "use strict";

  var app = document.getElementById("app");
  var STORE = "ccsp.v1";
  var state = { outline: null, notes: {}, questions: [], byId: {}, topics: {} };
  var session = null;

  // ---------- storage (per-viewer only; may be unavailable) ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save(data) {
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  }
  function record(q, correct) {
    var d = load();
    d.stats = d.stats || {};
    var s = d.stats[q.id] || { right: 0, wrong: 0 };
    if (correct) s.right++; else s.wrong++;
    d.stats[q.id] = s;
    d.wrong = d.wrong || [];
    var i = d.wrong.indexOf(q.id);
    if (!correct && i < 0) d.wrong.push(q.id);
    if (correct && i >= 0) d.wrong.splice(i, 1);
    save(d);
  }

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  }
  function md(src) {
    var out = [], lines = src.split("\n"), list = [], depth = 0;
    function flush() {
      while (depth > 0) { out.push("</ul>"); depth--; }
    }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, "");
      var m;
      if ((m = /^(\s*)- (.*)$/.exec(line))) {
        var want = m[1].length >= 2 ? 2 : 1;
        while (depth < want) { out.push("<ul>"); depth++; }
        while (depth > want) { out.push("</ul>"); depth--; }
        out.push("<li>" + inline(m[2]) + "</li>");
        return;
      }
      flush();
      if (!line) return;
      if ((m = /^### (.*)$/.exec(line))) out.push("<h3>" + inline(m[1]) + "</h3>");
      else if ((m = /^## (.*)$/.exec(line))) out.push("<h2>" + inline(m[1]) + "</h2>");
      else if ((m = /^> (.*)$/.exec(line))) out.push("<blockquote>" + inline(m[1]) + "</blockquote>");
      else out.push("<p>" + inline(line) + "</p>");
    });
    flush();
    return out.join("\n");
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }
  function getText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.text();
    });
  }

  // ---------- data ----------
  function init() {
    return getJSON("data/outline.json").then(function (outline) {
      state.outline = outline;
      outline.domains.forEach(function (d) {
        d.topics.forEach(function (t) { t.domain = d.id; state.topics[t.id] = t; });
      });
      var jobs = outline.domains.map(function (d) {
        var notes = getText("data/notes/d" + d.id + ".md").then(function (text) {
          text.split(/^## /m).slice(1).forEach(function (sec) {
            var id = sec.slice(0, 3);
            state.notes[id] = "## " + sec;
          });
        }).catch(function () { /* notes missing for this domain */ });
        var qs = getJSON("data/questions/d" + d.id + ".json").then(function (list) {
          list.forEach(function (q) { state.questions.push(q); state.byId[q.id] = q; });
        }).catch(function () { /* no questions yet */ });
        return Promise.all([notes, qs]);
      });
      return Promise.all(jobs);
    });
  }

  // ---------- views ----------
  function countFor(topicId) {
    return state.questions.filter(function (q) { return q.topic === topicId; }).length;
  }

  function viewHome() {
    var stats = (load().stats) || {};
    var html = "<h1>CCSP 備考</h1>" +
      '<p class="muted">依 ISC2 CCSP 2026-08-01 生效大綱整理:6 個 domain、38 個子項。考試為 CAT,100–150 題,3 小時,通過分數 700/1000。</p>' +
      '<div class="row"><a class="btn" href="#/quiz">開始刷題</a><a class="btn secondary" href="#/about">資料說明與限制</a></div>';
    state.outline.domains.forEach(function (d) {
      var domainQs = state.questions.filter(function (q) { return q.domain === d.id; });
      var answered = domainQs.filter(function (q) { return stats[q.id]; }).length;
      html += '<section class="card"><div class="domain-head"><h2 style="margin:0">D' + d.id + " " + esc(d.zh) +
        '</h2><span class="pill">權重 ' + d.weight + '%</span></div><div class="muted">' + esc(d.title) +
        "</div>" +
        '<div class="muted" style="font-size:14px">題庫 ' + domainQs.length + " 題,已作答 " + answered + " 題</div>" +
        '<ul class="topics">';
      d.topics.forEach(function (t) {
        var n = countFor(t.id);
        html += '<li><a href="#/notes/' + t.id + '">' + t.id + " " + esc(t.zh) + '</a><span class="muted">' + n + " 題</span></li>";
      });
      html += "</ul></section>";
    });
    app.innerHTML = html;
  }

  function viewNotes(id) {
    var t = state.topics[id];
    if (!t) { app.innerHTML = "<p>找不到這個子項。</p>"; return; }
    var ids = Object.keys(state.topics);
    var i = ids.indexOf(id);
    var prev = ids[i - 1], next = ids[i + 1];
    var d = state.outline.domains[t.domain - 1];
    var html = '<p class="muted"><a href="#/">大綱</a> / D' + d.id + " " + esc(d.zh) + "</p>" +
      "<h1>" + t.id + " " + esc(t.zh) + "</h1><div class=\"muted\">" + esc(t.title) + "</div>" +
      '<section class="card"><strong>官方大綱要點(用來檢查筆記有沒有漏)</strong><ul class="checklist">' +
      t.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></section>";
    if (state.notes[id]) {
      html += '<article class="note-body">' + md(state.notes[id].replace(/^## .*\n/, "")) + "</article>";
    } else {
      html += '<p class="muted">這個子項的筆記還沒寫。</p>';
    }
    var n = countFor(id);
    html += '<div class="row"><a class="btn' + (n ? "" : " secondary") + '" href="#/quiz/topic/' + id + '">練習這個子項(' + n + " 題)</a></div>";
    html += '<div class="row">' +
      (prev ? '<a class="btn secondary" href="#/notes/' + prev + '">← ' + prev + "</a>" : "") +
      (next ? '<a class="btn secondary" href="#/notes/' + next + '">' + next + " →</a>" : "") + "</div>";
    app.innerHTML = html;
  }

  function viewQuizSetup(topicId) {
    var total = state.questions.length;
    var html = "<h1>刷題</h1>" +
      '<p class="muted">目前題庫 ' + total + " 題(目標 1000 題)。題數不足時,會用現有題目抽題。</p>" +
      '<section class="card"><div class="row">' +
      '<label class="field">題數<input id="qn" type="number" min="1" max="' + Math.max(total, 1) + '" value="' + Math.min(100, Math.max(total, 1)) + '"></label>' +
      '<label class="field">模式<select id="qm"><option value="study">練習(作答後立刻看解析)</option><option value="exam">模擬考(交卷後看解析)</option></select></label>' +
      '<label class="field">範圍<select id="qd"><option value="all">全部 domain(依官方權重)</option>' +
      state.outline.domains.map(function (d) { return '<option value="d' + d.id + '">D' + d.id + " " + esc(d.zh) + "</option>"; }).join("") +
      (topicId ? '<option value="t' + topicId + '" selected>只練 ' + topicId + "</option>" : "") +
      "</select></label></div>" +
      '<button class="btn" id="qgo"' + (total ? "" : " disabled") + ">開始</button></section>";
    app.innerHTML = html;
    document.getElementById("qgo").addEventListener("click", function () {
      var n = parseInt(document.getElementById("qn").value, 10) || 1;
      var mode = document.getElementById("qm").value;
      var scope = document.getElementById("qd").value;
      startQuiz(pick(n, scope), mode);
    });
  }

  // allocate counts by official weight (largest remainder), then fill from what is left
  function pick(n, scope) {
    var pool = state.questions;
    if (scope.charAt(0) === "d") pool = pool.filter(function (q) { return "d" + q.domain === scope; });
    else if (scope.charAt(0) === "t") pool = pool.filter(function (q) { return q.topic === scope.slice(1); });
    n = Math.min(n, pool.length);
    if (scope !== "all") return shuffle(pool).slice(0, n);

    var domains = state.outline.domains;
    var by = {};
    domains.forEach(function (d) { by[d.id] = shuffle(pool.filter(function (q) { return q.domain === d.id; })); });
    var raw = domains.map(function (d) { return { id: d.id, exact: n * d.weight / 100 }; });
    raw.forEach(function (r) { r.take = Math.floor(r.exact); r.rem = r.exact - r.take; });
    var left = n - raw.reduce(function (a, r) { return a + r.take; }, 0);
    raw.slice().sort(function (a, b) { return b.rem - a.rem; }).slice(0, left).forEach(function (r) { r.take++; });
    var chosen = [];
    raw.forEach(function (r) {
      var got = by[r.id].splice(0, r.take);
      chosen = chosen.concat(got);
    });
    if (chosen.length < n) {
      var rest = [];
      domains.forEach(function (d) { rest = rest.concat(by[d.id]); });
      chosen = chosen.concat(shuffle(rest).slice(0, n - chosen.length));
    }
    return shuffle(chosen);
  }

  function startQuiz(list, mode) {
    if (!list.length) { app.innerHTML = "<p>沒有可用的題目。</p>"; return; }
    session = {
      mode: mode,
      items: list.map(function (q) {
        return { q: q, order: shuffle([0, 1, 2, 3]), picked: null };
      }),
      i: 0, done: false
    };
    renderQuestion();
  }

  function renderQuestion() {
    var it = session.items[session.i], q = it.q;
    var revealed = session.mode === "study" && it.picked !== null;
    var pct = Math.round(session.i / session.items.length * 100);
    var html = '<div class="muted">第 ' + (session.i + 1) + " / " + session.items.length + " 題 · D" + q.domain + " · " + q.topic +
      ' <span class="pill' + (q.status === "draft" ? " draft" : "") + '">' + (q.status === "draft" ? "草稿,未核對" : q.status) + "</span></div>" +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
      "<h2 style=\"margin-top:8px\">" + esc(q.stem) + "</h2>";
    it.order.forEach(function (oi, pos) {
      var cls = "opt";
      if (it.picked === oi) cls += " sel";
      if (revealed) { if (oi === q.answer) cls += " ok"; else if (it.picked === oi) cls += " bad"; }
      html += '<button class="' + cls + '" data-pos="' + pos + '"' + (revealed ? " disabled" : "") + ">" +
        String.fromCharCode(65 + pos) + ". " + esc(q.options[oi]) +
        (revealed ? '<span class="why">' + esc(q.why[oi]) + "</span>" : "") + "</button>";
    });
    if (revealed) html += '<div class="explain">' + esc(q.explain) + "</div>";
    html += '<div class="row">';
    if (session.i > 0) html += '<button class="btn secondary" id="prev">上一題</button>';
    if (session.i < session.items.length - 1) html += '<button class="btn" id="next"' + (session.mode === "study" && it.picked === null ? " disabled" : "") + ">下一題</button>";
    else html += '<button class="btn" id="finish"' + (session.mode === "study" && it.picked === null ? " disabled" : "") + ">完成</button>";
    html += "</div>";
    app.innerHTML = html;

    Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (b) {
      b.addEventListener("click", function () {
        if (session.mode === "study" && it.picked !== null) return;
        it.picked = it.order[parseInt(b.getAttribute("data-pos"), 10)];
        if (session.mode === "study") record(q, it.picked === q.answer);
        renderQuestion();
      });
    });
    var p = document.getElementById("prev"), n = document.getElementById("next"), f = document.getElementById("finish");
    if (p) p.addEventListener("click", function () { session.i--; renderQuestion(); });
    if (n) n.addEventListener("click", function () { session.i++; renderQuestion(); });
    if (f) f.addEventListener("click", finish);
  }

  function finish() {
    if (session.mode === "exam") {
      session.items.forEach(function (it) {
        if (it.picked !== null) record(it.q, it.picked === it.q.answer);
        else record(it.q, false);
      });
    }
    var right = 0, per = {};
    session.items.forEach(function (it) {
      var ok = it.picked === it.q.answer;
      if (ok) right++;
      var p = per[it.q.domain] = per[it.q.domain] || { r: 0, n: 0 };
      p.n++; if (ok) p.r++;
    });
    var total = session.items.length;
    var html = "<h1>結果</h1>" +
      '<div class="score">' + right + " / " + total + " (" + Math.round(right / total * 100) + '%)</div>' +
      '<p class="muted">這只是練習成績,不能換算成正式考試的 700/1000 分數(正式考試是自適應計分)。</p>' +
      "<table><tr><th>Domain</th><th>答對</th></tr>";
    Object.keys(per).sort().forEach(function (k) {
      html += "<tr><td>D" + k + "</td><td>" + per[k].r + " / " + per[k].n + "</td></tr>";
    });
    html += "</table><h2>逐題檢討</h2>";
    session.items.forEach(function (it, idx) {
      var q = it.q, ok = it.picked === q.answer;
      html += '<section class="card"><div class="muted">' + (idx + 1) + ". " + q.id + " · " + (ok ? "答對" : "答錯") + "</div>" +
        "<strong>" + esc(q.stem) + "</strong>";
      it.order.forEach(function (oi, pos) {
        var cls = "opt";
        if (oi === q.answer) cls += " ok"; else if (it.picked === oi) cls += " bad";
        html += '<div class="' + cls + '" style="cursor:default">' + String.fromCharCode(65 + pos) + ". " + esc(q.options[oi]) +
          '<span class="why">' + esc(q.why[oi]) + "</span></div>";
      });
      html += '<div class="explain">' + esc(q.explain) + ' <a href="#/notes/' + q.topic + '">看筆記 ' + q.topic + "</a></div></section>";
    });
    html += '<div class="row"><a class="btn" href="#/quiz">再來一次</a><a class="btn secondary" href="#/wrong">錯題本</a></div>';
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function viewWrong() {
    var ids = (load().wrong) || [];
    var list = ids.map(function (id) { return state.byId[id]; }).filter(Boolean);
    var html = "<h1>錯題本</h1>";
    if (!list.length) {
      html += '<p class="muted">目前沒有錯題。答錯的題目會記在這個瀏覽器裡(換裝置或清除網站資料就會消失)。</p>';
    } else {
      html += "<p>共 " + list.length + ' 題。</p><div class="row"><button class="btn" id="wgo">練習錯題</button></div>' +
        list.map(function (q) { return '<div class="card"><span class="muted">' + q.id + "</span><br>" + esc(q.stem) + "</div>"; }).join("");
    }
    app.innerHTML = html;
    var b = document.getElementById("wgo");
    if (b) b.addEventListener("click", function () { startQuiz(shuffle(list), "study"); });
  }

  function viewAbout() {
    var by = {};
    state.questions.forEach(function (q) { by[q.status] = (by[q.status] || 0) + 1; });
    app.innerHTML = "<h1>資料說明與限制</h1>" +
      "<ul>" +
      "<li>範圍依 <a href=\"https://www.isc2.org/Certifications/CCSP\" rel=\"noopener\">ISC2 官方 CCSP 考試大綱</a>(2026-08-01 生效)。大綱要點為簡化後的條目,正式內容以官方 PDF 為準。</li>" +
      "<li>筆記與題目是原創整理,<strong>不是考古題</strong>,也不是任何出版社或第三方網站內容的複製。</li>" +
      "<li>題目狀態:" + Object.keys(by).map(function (k) { return k + " " + by[k]; }).join("、") + "。「草稿」代表尚未用權威來源逐題核對。</li>" +
      "<li>筆記中標示「待核對」的地方,是我無法用官方來源確認的事實。</li>" +
      "<li>進度與錯題只存在你的瀏覽器,不會上傳。</li>" +
      "<li>這不是 ISC2 官方資源,與 ISC2 無關。</li>" +
      "</ul>";
  }

  // ---------- router ----------
  function route() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/");
    Array.prototype.forEach.call(document.querySelectorAll(".top nav a"), function (a) {
      var target = a.getAttribute("href").replace(/^#\/?/, "");
      a.className = (target === parts[0] || (!target && !parts[0]) || (target === "" && parts[0] === "notes")) ? "on" : "";
    });
    window.scrollTo(0, 0);
    if (!parts[0] || parts[0] === "notes" && !parts[1]) return viewHome();
    if (parts[0] === "notes") return viewNotes(parts[1]);
    if (parts[0] === "quiz") return viewQuizSetup(parts[1] === "topic" ? parts[2] : null);
    if (parts[0] === "wrong") return viewWrong();
    if (parts[0] === "about") return viewAbout();
    viewHome();
  }

  init().then(function () {
    window.addEventListener("hashchange", route);
    route();
  }).catch(function (e) {
    app.innerHTML = "<p>資料載入失敗:" + esc(e.message) + "</p><p class=\"muted\">請用本機伺服器開啟(例如 <code>python -m http.server -d docs</code>),不要直接用 file:// 開啟。</p>";
  });
})();
