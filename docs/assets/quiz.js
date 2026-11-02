(function () {
  "use strict";
  var C = window.CCSP;
  var app = document.getElementById("app");
  var S = { outline: null, topics: {}, order: [], questions: [], byId: {} };
  var session = null;
  var PASS_RATIO = 0.7; // open-ended: share of key points covered that counts as "got it"
  var COUNTS = [5, 10, 20, 30, 50]; // choices for the number of questions per round

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
  function saveAnswer(q, text, ratio) {
    var d = C.loadStore();
    d.answers = d.answers || {};
    d.answers[q.id] = { text: String(text || "").slice(0, 4000), ratio: ratio };
    C.saveStore(d);
  }
  function lastAnswer(q) {
    var a = (C.loadStore().answers || {})[q.id];
    return a ? a.text : "";
  }

  function init() {
    return C.loadOutline().then(function (o) {
      S.outline = o.outline; S.topics = o.topics; S.order = o.order;
      return C.loadQuestions(S.outline).then(function (q) { S.questions = q.list; S.byId = q.byId; });
    });
  }

  function count(kind) {
    return S.questions.filter(function (q) { return q.type === kind; }).length;
  }

  // ---------- setup ----------
  function viewSetup(topicId) {
    var total = S.questions.length, nOpen = count("open"), nMcq = count("mcq");
    var drafts = S.questions.filter(function (q) { return q.status === "draft"; }).length;
    if (!total) {
      app.innerHTML = "<h1>刷題</h1>" +
        '<div class="callout warn">這個網站上沒有題目。題庫是<strong>私人</strong>的,只存在本機的 <code>docs/data/private/questions/</code>,不會發布到網路上。<br>' +
        "在自己的電腦用 <code>python -m http.server -d docs 8000</code> 開啟網站,就會載入你的題庫。</div>" +
        '<p class="muted">想先讀觀念?到 <a href="../notes/">筆記入口</a>。</p>';
      return;
    }
    app.innerHTML = "<h1>刷題</h1>" +
      '<p class="muted">題庫 ' + total + " 題:開放式情境題 " + nOpen + " 題、選擇題 " + nMcq + " 題(目標 1000 題);其中 " + drafts +
      " 題為草稿,尚未用權威來源逐題核對。題數不足時,會用現有題目抽題。</p>" +
      '<section class="card"><div class="row">' +
      '<label class="field">題型<select id="qk"><option value="open">開放式情境題(自己寫答案,對照要點)</option><option value="mcq">選擇題</option><option value="all">全部混合</option></select></label>' +
      '<label class="field">題數<select id="qn">' +
      COUNTS.map(function (n) { return '<option value="' + n + '"' + (n === 10 ? " selected" : "") + ">" + n + " 題</option>"; }).join("") +
      "</select></label>" +
      '<label class="field">選擇題模式<select id="qm"><option value="study">練習(作答後立刻看解析)</option><option value="exam">模擬考(交卷後看解析)</option></select></label>' +
      '<label class="field">範圍<select id="qd"><option value="all">全部 domain(依官方權重)</option>' +
      S.outline.domains.map(function (d) { return '<option value="d' + d.id + '">D' + d.id + " " + C.esc(d.zh) + "</option>"; }).join("") +
      (topicId && S.topics[topicId] ? '<option value="t' + topicId + '" selected>只練 ' + topicId + " " + C.esc(S.topics[topicId].zh) + "</option>" : "") +
      "</select></label></div>" +
      '<button class="btn" id="qgo"' + (total ? "" : " disabled") + ">開始</button></section>" +
      '<div class="callout note"><strong>開放式情境題怎麼用?</strong><br>' +
      "先自己寫下答案(想清楚「為什麼」),再看參考答案,逐項勾選你有涵蓋的要點。不確定時,可以按「複製給 AI 批改」把題目與你的答案交給 AI,請它挑錯並追問。你的答案只存在這個瀏覽器。</div>" +
      '<p class="muted">想先讀觀念?到 <a href="../notes/">筆記入口</a>。</p>';
    document.getElementById("qgo").addEventListener("click", function () {
      var n = parseInt(document.getElementById("qn").value, 10) || 1;
      var list = pick(n, document.getElementById("qd").value, document.getElementById("qk").value);
      start(list, document.getElementById("qm").value);
    });
  }

  // allocate counts by official weight (largest remainder), then fill from what is left
  function pick(n, scope, kind) {
    var pool = S.questions.filter(function (q) { return kind === "all" || q.type === kind; });
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
      items: list.map(function (q) {
        return q.type === "open"
          ? { q: q, answer: lastAnswer(q), revealed: false, checked: q.key_points.map(function () { return false; }) }
          : { q: q, order: C.shuffle([0, 1, 2, 3]), picked: null };
      })
    };
    renderQuestion();
  }

  function header(q) {
    var pct = Math.round(session.i / session.items.length * 100);
    return '<div class="muted">第 ' + (session.i + 1) + " / " + session.items.length + " 題 · D" + q.domain + " · " + q.topic +
      ' · <span class="pill">' + (q.type === "open" ? "開放式" : "選擇題") + "</span>" +
      ' <span class="pill' + (q.status === "draft" ? " draft" : "") + '">' + (q.status === "draft" ? "草稿,未核對" : q.status) + "</span></div>" +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>';
  }

  function navButtons(blocked) {
    return '<div class="row">' + (session.i > 0 ? '<button class="btn secondary" id="prev">上一題</button>' : "") +
      (session.i < session.items.length - 1
        ? '<button class="btn" id="next"' + (blocked ? " disabled" : "") + ">下一題</button>"
        : '<button class="btn" id="finish"' + (blocked ? " disabled" : "") + ">完成</button>") + "</div>";
  }

  function wireNav() {
    var p = document.getElementById("prev"), n = document.getElementById("next"), f = document.getElementById("finish");
    if (p) p.addEventListener("click", function () { keepAnswer(); session.i--; renderQuestion(); });
    if (n) n.addEventListener("click", function () { keepAnswer(); session.i++; renderQuestion(); });
    if (f) f.addEventListener("click", function () { keepAnswer(); finish(); });
  }

  function keepAnswer() {
    var ta = document.getElementById("ans");
    if (ta) session.items[session.i].answer = ta.value;
  }

  function renderQuestion() {
    var it = session.items[session.i];
    if (it.q.type === "open") renderOpen(it); else renderMcq(it);
  }

  // ----- multiple choice -----
  function renderMcq(it) {
    var q = it.q, revealed = session.mode === "study" && it.picked !== null;
    var html = header(q) + '<h2 style="margin-top:8px">' + C.esc(q.stem) + "</h2>";
    it.order.forEach(function (oi, pos) {
      var cls = "opt";
      if (it.picked === oi) cls += " sel";
      if (revealed) { if (oi === q.answer) cls += " ok"; else if (it.picked === oi) cls += " bad"; }
      html += '<button class="' + cls + '" data-pos="' + pos + '"' + (revealed ? " disabled" : "") + ">" +
        String.fromCharCode(65 + pos) + ". " + C.esc(q.options[oi]) +
        (revealed ? '<span class="why">' + C.esc(q.why[oi]) + "</span>" : "") + "</button>";
    });
    if (revealed) html += '<div class="explain">' + C.esc(q.explain) + ' <a href="../notes/#/t/' + q.topic + '">看筆記 ' + q.topic + "</a></div>";
    html += navButtons(session.mode === "study" && it.picked === null);
    app.innerHTML = html;
    Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (b) {
      b.addEventListener("click", function () {
        if (session.mode === "study" && it.picked !== null) return;
        it.picked = it.order[parseInt(b.getAttribute("data-pos"), 10)];
        if (session.mode === "study") record(q, it.picked === q.answer);
        renderQuestion();
      });
    });
    wireNav();
  }

  // ----- open-ended -----
  function ratioOf(it) {
    var n = it.checked.filter(Boolean).length;
    return it.checked.length ? n / it.checked.length : 0;
  }

  function aiPrompt(it) {
    var q = it.q;
    return "你是 CCSP 備考教練。請根據下面的情境與我的作答,指出我的錯誤、遺漏與可以更精準的地方,並對照「參考要點」檢查我是否涵蓋;" +
      "不要直接給完整答案,先指出我漏了哪幾點,最後再追問我一個延伸問題。\n\n" +
      "【情境】\n" + q.scenario + "\n\n【問題】\n" + q.prompts.map(function (p, i) { return (i + 1) + ". " + p; }).join("\n") +
      "\n\n【我的答案】\n" + (it.answer || "(尚未作答)") +
      "\n\n【參考要點】\n" + q.key_points.map(function (p, i) { return (i + 1) + ". " + p; }).join("\n");
  }

  function renderOpen(it) {
    var q = it.q;
    var html = header(q) + "<h2 style=\"margin-top:8px\">情境</h2>" +
      '<div class="callout note">' + C.esc(q.scenario) + "</div>" +
      "<h3>問題</h3><ol>" + q.prompts.map(function (p) { return "<li>" + C.esc(p) + "</li>"; }).join("") + "</ol>" +
      '<label class="field" style="margin:12px 0">你的答案(先自己寫,想清楚「為什麼」)' +
      '<textarea id="ans" rows="8" placeholder="用自己的話回答,不用寫得很完美">' + C.esc(it.answer) + "</textarea></label>";
    if (!it.revealed) {
      html += '<div class="row"><button class="btn" id="reveal">看參考答案</button>' +
        '<button class="btn secondary" id="copyai">複製給 AI 批改</button><span id="copymsg" class="muted"></span></div>';
    } else {
      var r = Math.round(ratioOf(it) * 100);
      html += "<h3>參考要點(勾選你有涵蓋的)</h3><div class=\"keypoints\">" +
        q.key_points.map(function (k, i) {
          return '<label class="kp"><input type="checkbox" data-i="' + i + '"' + (it.checked[i] ? " checked" : "") + "> " + C.esc(k) + "</label>";
        }).join("") + "</div>" +
        '<div class="muted" id="cov">涵蓋 ' + it.checked.filter(Boolean).length + " / " + q.key_points.length + "(" + r + "%)" +
        (ratioOf(it) >= PASS_RATIO ? " · 達標" : " · 還可以再補") + "</div>" +
        "<h3>參考答案</h3><div class=\"explain\">" + C.esc(q.model_answer) + "</div>" +
        (q.pitfalls && q.pitfalls.length ? '<div class="callout trap">易錯:' + q.pitfalls.map(C.esc).join(";") + "</div>" : "") +
        (q.followups && q.followups.length ? '<div class="callout tip">延伸追問:' + q.followups.map(C.esc).join(";") + "</div>" : "") +
        '<div class="row"><a href="../notes/#/t/' + q.topic + '">看筆記 ' + q.topic + '</a><button class="btn secondary" id="copyai">複製給 AI 批改</button><span id="copymsg" class="muted"></span></div>';
    }
    html += navButtons(false);
    app.innerHTML = html;

    var rv = document.getElementById("reveal");
    if (rv) rv.addEventListener("click", function () { keepAnswer(); it.revealed = true; renderQuestion(); });
    Array.prototype.forEach.call(app.querySelectorAll(".kp input"), function (cb) {
      cb.addEventListener("change", function () {
        it.checked[parseInt(cb.getAttribute("data-i"), 10)] = cb.checked;
        var n = it.checked.filter(Boolean).length;
        document.getElementById("cov").textContent = "涵蓋 " + n + " / " + q.key_points.length + "(" + Math.round(ratioOf(it) * 100) + "%)" +
          (ratioOf(it) >= PASS_RATIO ? " · 達標" : " · 還可以再補");
      });
    });
    var cp = document.getElementById("copyai");
    if (cp) cp.addEventListener("click", function () {
      keepAnswer();
      var text = aiPrompt(it), msg = document.getElementById("copymsg");
      var done = function (ok) { if (msg) msg.textContent = ok ? "已複製,貼到你的 AI 工具" : "複製失敗,請在下方文字框手動複製"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text); done(false); });
      } else { fallbackCopy(text); done(false); }
    });
    wireNav();
  }

  function fallbackCopy(text) {
    var box = document.getElementById("fallback");
    if (!box) {
      box = document.createElement("textarea");
      box.id = "fallback"; box.rows = 8; box.style.width = "100%";
      app.appendChild(box);
    }
    box.value = text; box.focus(); box.select();
  }

  // ---------- results ----------
  function finish() {
    var mcq = { r: 0, n: 0 }, open = { sum: 0, n: 0 }, per = {};
    session.items.forEach(function (it) {
      var q = it.q, p = per[q.domain] = per[q.domain] || { mr: 0, mn: 0, os: 0, on: 0 };
      if (q.type === "open") {
        if (!it.revealed) return;
        var ratio = ratioOf(it);
        record(q, ratio >= PASS_RATIO); saveAnswer(q, it.answer, ratio);
        open.sum += ratio; open.n++; p.os += ratio; p.on++;
      } else {
        if (session.mode === "exam") record(q, it.picked === q.answer);
        var ok = it.picked === q.answer;
        mcq.n++; p.mn++; if (ok) { mcq.r++; p.mr++; }
      }
    });
    var html = "<h1>結果</h1>";
    if (mcq.n) html += '<div class="score">選擇題 ' + mcq.r + " / " + mcq.n + " (" + Math.round(mcq.r / mcq.n * 100) + "%)</div>";
    if (open.n) html += '<div class="score">開放式 平均涵蓋 ' + Math.round(open.sum / open.n * 100) + "%(" + open.n + " 題)</div>";
    if (!mcq.n && !open.n) html += "<p>這次沒有完成任何題目(開放式題目要先看過參考答案才會計分)。</p>";
    html += '<p class="muted">這只是練習成績,不能換算成正式考試的 700/1000 分數(正式考試是自適應計分)。開放式題目的涵蓋率是你自己勾選的,誠實對待它。</p>' +
      '<div class="tablewrap"><table><thead><tr><th>Domain</th><th>選擇題</th><th>開放式涵蓋率</th></tr></thead><tbody>' +
      Object.keys(per).sort().map(function (k) {
        var p = per[k];
        return "<tr><td>D" + k + "</td><td>" + (p.mn ? p.mr + " / " + p.mn : "—") + "</td><td>" + (p.on ? Math.round(p.os / p.on * 100) + "%" : "—") + "</td></tr>";
      }).join("") + "</tbody></table></div><h2>逐題檢討</h2>";
    session.items.forEach(function (it, idx) {
      var q = it.q;
      if (q.type === "open") {
        html += '<section class="card"><div class="muted">' + (idx + 1) + ". " + q.id + " · 開放式" + (it.revealed ? " · 涵蓋 " + Math.round(ratioOf(it) * 100) + "%" : " · 未看答案") + "</div>" +
          "<strong>" + C.esc(q.scenario) + "</strong>" +
          (it.answer ? '<div class="callout note">你的答案:' + C.esc(it.answer) + "</div>" : "") +
          '<div class="explain">' + C.esc(q.model_answer) + ' <a href="../notes/#/t/' + q.topic + '">看筆記 ' + q.topic + "</a></div></section>";
        return;
      }
      var ok = it.picked === q.answer;
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
      html += '<p class="muted">目前沒有錯題。答錯的選擇題、涵蓋率不到 70% 的開放式題目會記在這個瀏覽器裡(換裝置或清除網站資料就會消失)。</p>';
    } else {
      html += "<p>共 " + list.length + ' 題。</p><div class="row"><button class="btn" id="wgo">練習錯題</button></div>' +
        list.map(function (q) {
          return '<div class="card"><span class="muted">' + q.id + ' · <a href="../notes/#/t/' + q.topic + '">筆記 ' + q.topic + "</a></span><br>" +
            C.esc(q.type === "open" ? q.scenario : q.stem) + "</div>";
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
    app.innerHTML = "<h1>進度</h1><p class=\"muted\">記錄只存在這個瀏覽器。開放式題目以「涵蓋率 ≥ 70%」算達標。</p>" +
      '<div class="tablewrap"><table><thead><tr><th>Domain</th><th>權重</th><th>已作答 / 題庫</th><th>累計達標率</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
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
