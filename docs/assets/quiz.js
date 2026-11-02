(function () {
  "use strict";
  var C = window.CCSP;
  var app = document.getElementById("app");
  var S = { outline: null, topics: {}, order: [], questions: [], byId: {} };
  var session = null;

  function record(q, correct) {
    var d = C.loadStore();
    d.stats = d.stats || {};
    var s = d.stats[q.id] || { right: 0, wrong: 0 };
    if (correct) s.right++; else s.wrong++;
    d.stats[q.id] = s;
    d.wrong = d.wrong || [];
    var i = d.wrong.indexOf(q.id);
    if (!correct && i < 0) d.wrong.push(q.id);
    if (correct && i >= 0) d.wrong.splice(i, 1);
    C.saveStore(d);
  }

  function init() {
    return C.loadOutline().then(function (o) {
      S.outline = o.outline; S.topics = o.topics; S.order = o.order;
      return C.loadQuestions(S.outline).then(function (q) { S.questions = q.list; S.byId = q.byId; });
    });
  }

  // ---------- setup ----------
  function viewSetup(topicId) {
    var total = S.questions.length;
    var drafts = S.questions.filter(function (q) { return q.status === "draft"; }).length;
    app.innerHTML = "<h1>刷題</h1>" +
      '<p class="muted">題庫 ' + total + " 題(目標 1000 題),其中 " + drafts + " 題為草稿,尚未用權威來源逐題核對。題數不足時,會用現有題目抽題。</p>" +
      '<section class="card"><div class="row">' +
      '<label class="field">題數<input id="qn" type="number" min="1" max="' + Math.max(total, 1) + '" value="' + Math.min(100, Math.max(total, 1)) + '"></label>' +
      '<label class="field">模式<select id="qm"><option value="study">練習(作答後立刻看解析)</option><option value="exam">模擬考(交卷後看解析)</option></select></label>' +
      '<label class="field">範圍<select id="qd"><option value="all">全部 domain(依官方權重)</option>' +
      S.outline.domains.map(function (d) { return '<option value="d' + d.id + '">D' + d.id + " " + C.esc(d.zh) + "</option>"; }).join("") +
      (topicId && S.topics[topicId] ? '<option value="t' + topicId + '" selected>只練 ' + topicId + " " + C.esc(S.topics[topicId].zh) + "</option>" : "") +
      "</select></label></div>" +
      '<button class="btn" id="qgo"' + (total ? "" : " disabled") + ">開始</button></section>" +
      '<p class="muted">想先讀觀念?到 <a href="../notes/">筆記入口</a>。</p>';
    document.getElementById("qgo").addEventListener("click", function () {
      var n = parseInt(document.getElementById("qn").value, 10) || 1;
      start(pick(n, document.getElementById("qd").value), document.getElementById("qm").value);
    });
  }

  // allocate counts by official weight (largest remainder), then fill from what is left
  function pick(n, scope) {
    var pool = S.questions;
    if (scope.charAt(0) === "d") pool = pool.filter(function (q) { return "d" + q.domain === scope; });
    else if (scope.charAt(0) === "t") pool = pool.filter(function (q) { return q.topic === scope.slice(1); });
    n = Math.min(n, pool.length);
    if (scope !== "all") return C.shuffle(pool).slice(0, n);

    var domains = S.outline.domains, by = {};
    domains.forEach(function (d) { by[d.id] = C.shuffle(pool.filter(function (q) { return q.domain === d.id; })); });
    var raw = domains.map(function (d) { return { id: d.id, exact: n * d.weight / 100 }; });
    raw.forEach(function (r) { r.take = Math.floor(r.exact); r.rem = r.exact - r.take; });
    var left = n - raw.reduce(function (a, r) { return a + r.take; }, 0);
    raw.slice().sort(function (a, b) { return b.rem - a.rem; }).slice(0, left).forEach(function (r) { r.take++; });
    var chosen = [];
    raw.forEach(function (r) { chosen = chosen.concat(by[r.id].splice(0, r.take)); });
    if (chosen.length < n) {
      var rest = [];
      domains.forEach(function (d) { rest = rest.concat(by[d.id]); });
      chosen = chosen.concat(C.shuffle(rest).slice(0, n - chosen.length));
    }
    return C.shuffle(chosen);
  }

  // ---------- run ----------
  function start(list, mode) {
    if (!list.length) { app.innerHTML = "<p>沒有可用的題目。</p>"; return; }
    session = {
      mode: mode, i: 0,
      items: list.map(function (q) { return { q: q, order: C.shuffle([0, 1, 2, 3]), picked: null }; })
    };
    renderQuestion();
  }

  function renderQuestion() {
    var it = session.items[session.i], q = it.q;
    var revealed = session.mode === "study" && it.picked !== null;
    var pct = Math.round(session.i / session.items.length * 100);
    var html = '<div class="muted">第 ' + (session.i + 1) + " / " + session.items.length + " 題 · D" + q.domain + " · " + q.topic +
      ' <span class="pill' + (q.status === "draft" ? " draft" : "") + '">' + (q.status === "draft" ? "草稿,未核對" : q.status) + "</span></div>" +
      '<div class="bar"><span style="width:' + pct + '%"></span></div><h2 style="margin-top:8px">' + C.esc(q.stem) + "</h2>";
    it.order.forEach(function (oi, pos) {
      var cls = "opt";
      if (it.picked === oi) cls += " sel";
      if (revealed) { if (oi === q.answer) cls += " ok"; else if (it.picked === oi) cls += " bad"; }
      html += '<button class="' + cls + '" data-pos="' + pos + '"' + (revealed ? " disabled" : "") + ">" +
        String.fromCharCode(65 + pos) + ". " + C.esc(q.options[oi]) +
        (revealed ? '<span class="why">' + C.esc(q.why[oi]) + "</span>" : "") + "</button>";
    });
    if (revealed) html += '<div class="explain">' + C.esc(q.explain) + ' <a href="../notes/#/t/' + q.topic + '">看筆記 ' + q.topic + "</a></div>";
    var blocked = session.mode === "study" && it.picked === null;
    html += '<div class="row">' + (session.i > 0 ? '<button class="btn secondary" id="prev">上一題</button>' : "") +
      (session.i < session.items.length - 1
        ? '<button class="btn" id="next"' + (blocked ? " disabled" : "") + ">下一題</button>"
        : '<button class="btn" id="finish"' + (blocked ? " disabled" : "") + ">完成</button>") + "</div>";
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
      session.items.forEach(function (it) { record(it.q, it.picked === it.q.answer); });
    }
    var right = 0, per = {};
    session.items.forEach(function (it) {
      var ok = it.picked === it.q.answer;
      if (ok) right++;
      var p = per[it.q.domain] = per[it.q.domain] || { r: 0, n: 0 };
      p.n++; if (ok) p.r++;
    });
    var total = session.items.length;
    var html = "<h1>結果</h1><div class=\"score\">" + right + " / " + total + " (" + Math.round(right / total * 100) + '%)</div>' +
      '<p class="muted">這只是練習成績,不能換算成正式考試的 700/1000 分數(正式考試是自適應計分)。</p>' +
      "<table><tr><th>Domain</th><th>答對</th></tr>" +
      Object.keys(per).sort().map(function (k) { return "<tr><td>D" + k + "</td><td>" + per[k].r + " / " + per[k].n + "</td></tr>"; }).join("") +
      "</table><h2>逐題檢討</h2>";
    session.items.forEach(function (it, idx) {
      var q = it.q, ok = it.picked === q.answer;
      html += '<section class="card"><div class="muted">' + (idx + 1) + ". " + q.id + " · " + (ok ? "答對" : "答錯") + "</div><strong>" + C.esc(q.stem) + "</strong>";
      it.order.forEach(function (oi, pos) {
        var cls = "opt";
        if (oi === q.answer) cls += " ok"; else if (it.picked === oi) cls += " bad";
        html += '<div class="' + cls + '" style="cursor:default">' + String.fromCharCode(65 + pos) + ". " + C.esc(q.options[oi]) +
          '<span class="why">' + C.esc(q.why[oi]) + "</span></div>";
      });
      html += '<div class="explain">' + C.esc(q.explain) + ' <a href="../notes/#/t/' + q.topic + '">看筆記 ' + q.topic + "</a></div></section>";
    });
    html += '<div class="row"><a class="btn" href="#/">再來一次</a><a class="btn secondary" href="#/wrong">錯題本</a></div>';
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  // ---------- wrong list and progress ----------
  function viewWrong() {
    var ids = C.loadStore().wrong || [];
    var list = ids.map(function (id) { return S.byId[id]; }).filter(Boolean);
    var html = "<h1>錯題本</h1>";
    if (!list.length) {
      html += '<p class="muted">目前沒有錯題。答錯的題目會記在這個瀏覽器裡(換裝置或清除網站資料就會消失)。</p>';
    } else {
      html += "<p>共 " + list.length + ' 題。</p><div class="row"><button class="btn" id="wgo">練習錯題</button></div>' +
        list.map(function (q) {
          return '<div class="card"><span class="muted">' + q.id + ' · <a href="../notes/#/t/' + q.topic + '">筆記 ' + q.topic + "</a></span><br>" + C.esc(q.stem) + "</div>";
        }).join("");
    }
    app.innerHTML = html;
    var b = document.getElementById("wgo");
    if (b) b.addEventListener("click", function () { start(C.shuffle(list), "study"); });
  }

  function viewProgress() {
    var stats = C.loadStore().stats || {};
    var rows = S.outline.domains.map(function (d) {
      var qs = S.questions.filter(function (q) { return q.domain === d.id; });
      var r = 0, w = 0, ans = 0;
      qs.forEach(function (q) { var s = stats[q.id]; if (s) { ans++; r += s.right; w += s.wrong; } });
      var pct = r + w ? Math.round(r / (r + w) * 100) + "%" : "—";
      return "<tr><td>D" + d.id + " " + C.esc(d.zh) + "</td><td>" + d.weight + "%</td><td>" + ans + " / " + qs.length + "</td><td>" + pct + "</td></tr>";
    }).join("");
    app.innerHTML = "<h1>進度</h1><p class=\"muted\">記錄只存在這個瀏覽器。</p>" +
      '<div class="tablewrap"><table><thead><tr><th>Domain</th><th>權重</th><th>已作答 / 題庫</th><th>累計正確率</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }

  function route() {
    var p = location.hash.replace(/^#\/?/, "").split("/");
    window.scrollTo(0, 0);
    if (p[0] === "wrong") return viewWrong();
    if (p[0] === "progress") return viewProgress();
    viewSetup(p[0] === "topic" ? p[1] : null);
  }

  C.markActive("quiz");
  init().then(function () {
    window.addEventListener("hashchange", route);
    route();
  }).catch(function (e) {
    app.innerHTML = "<p>資料載入失敗:" + C.esc(e.message) + "</p><p class=\"muted\">請用本機伺服器開啟,不要直接用 file:// 開啟。</p>";
  });
})();
