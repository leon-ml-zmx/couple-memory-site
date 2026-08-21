(function () {
  var dayMs = 24 * 60 * 60 * 1000;
  var now = new Date();

  /* ===== å·¥å·å½æ° ===== */

  function pad(n) { return String(n).padStart(2, "0"); }

  function fmtDisplay(dateStr) {
    var p = dateStr.split("-");
    return p[0] + "." + pad(p[1]) + "." + pad(p[2]);
  }

  function uid() { return String(Date.now()) + String(Math.random()).slice(2, 8); }

  function readImageAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { resolve(""); return; }
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  function escHtml(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  /* ===== é»è®¤æ°æ® ===== */

  var DEFAULT_START = "2024-05-20";

  var DEFAULT_ANNIVERSARIES = [
    { id: "a1", date: "2026-08-14", title: "ç¬¬ä¸æ¬¡è§é¢çæ¥å­" },
    { id: "a2", date: "2026-09-09", title: "æ­£å¼å¨ä¸èµ·çºªå¿µæ¥" },
    { id: "a3", date: "2026-12-24", title: "ä¸èµ·è¿å£è¯" }
  ];

  var DEFAULT_MEMORIES = [
    { id: "m1", title: "ä¸èµ·åè¿çé¥­", text: "ç­è¾è¾çç«éãæ¥¼ä¸çå°é¢ãæ·±å¤çä¾¿å©åºå³ä¸ç®ï¼é½æ¯ãæä»¬ãçå³éã", image: "" },
    { id: "m2", title: "ä¸èµ·çè¿ççµå½±", text: "çå°¾ç¯äº®èµ·æ¥çæ¶åï¼ææ³è®¨è®ºå§æçäººï¼åå¥½å°±åå¨æè¾¹ã", image: "" },
    { id: "m3", title: "æ³å»çè¿æ¹", text: "æåå¸ãæµ·è¾¹ãå±±é¡¶åå°å··é½åè¿æ¸åï¼ç¶åä¸ç«ä¸ç«æ¢æ¢å®ç°ã", image: "" },
    { id: "m4", title: "ä¸èµ·ç©çæ¸¸æ", text: "æ è®ºæ¯èæºææªè¿æ¯æ¡æ¸¸å¯¹å³ï¼æ¯æ¬¡å¼é»é½åæ¯å¨å¹¶è©ä½æã", image: "" }
  ];

  var DEFAULT_TIMELINE = [
    { id: "t1", date: "2024-05-20", title: "æäºå¼å§", text: "ä»ä¸å¥ãä½ å¥½ãå¼å§ï¼çæ´»å¤äºä¸ä¸ªå¾éè¦çäººã" },
    { id: "t2", date: "2024-09-09", title: "æ­£å¼å¨ä¸èµ·", text: "å³å®è®¤ççµæï¼ä¹å³å®ææªæ¥çå¾å¤æ¥å­é½çç»å½¼æ­¤ã" },
    { id: "t3", date: "2025-02-14", title: "ç¬¬ä¸ä¸ªæäººè", text: "ç¤¼ç©ãè±ãæ¥æ±åç¬¨æçä»ªå¼æï¼é½è¢«è®¤çæ¶èã" },
    { id: "t4", date: "2025-10-01", title: "ç¬¬ä¸æ¬¡é¿éæè¡", text: "ä¸èµ·çéçåå¸çæ¥è½ï¼ä¹ä¸èµ·ç¡®è®¤èº«è¾¹è¿ä¸ªäººå¾éååè¡ã" }
  ];

  var DEFAULT_WISHES = [
    { id: "w1", title: "ä¸èµ·çæµ·", note: "æ¾ä¸ä¸ªå¤©æ°å¾å¥½çå¨æ«ã", done: false },
    { id: "w2", title: "æä¸ç»åç", note: "è®°å½ç°å¨çæä»¬ã", done: false },
    { id: "w3", title: "å­¦ä¼ä¸éè", note: "ä»¥ååæå®¶çå³éã", done: false },
    { id: "w4", title: "è·¨å¹´", note: "åæ°çæ¶åï¼èº«è¾¹æ¯ä½ ã", done: true }
  ];

  /* ===== Cloud Sync (Firebase REST API) ===== */

  var CloudSync = {
    getConfig: function () {
      try {
        return JSON.parse(localStorage.getItem("couple-cloud-config")) || {};
      } catch (e) { return {}; }
    },
    setConfig: function (cfg) {
      localStorage.setItem("couple-cloud-config", JSON.stringify(cfg));
    },
    isReady: function () {
      var c = this.getConfig();
      return !!(c.url && c.url.trim() && c.key && c.key.trim());
    },
    getUrl: function (path) {
      var c = this.getConfig();
      var base = c.url.replace(/\/$/, "");
      return base + "/couples/" + encodeURIComponent(c.key) + "/" + path + ".json";
    },
    fetchJson: function (url, opts) {
      return fetch(url, opts).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    },
    pull: function () {
      if (!this.isReady()) return Promise.resolve(null);
      var self = this;
      return this.fetchJson(this.getUrl("")).then(function (data) {
        if (!data) return null;
        if (data.startDate !== undefined) localStorage.setItem("couple-start", data.startDate);
        if (data.anniversaries !== undefined) localStorage.setItem("couple-ann", JSON.stringify(data.anniversaries));
        if (data.memories !== undefined) localStorage.setItem("couple-mem", JSON.stringify(data.memories));
        if (data.timeline !== undefined) localStorage.setItem("couple-tl", JSON.stringify(data.timeline));
        if (data.wishes !== undefined) localStorage.setItem("couple-wish", JSON.stringify(data.wishes));
        return data;
      }).catch(function (err) {
        console.warn("Cloud pull failed:", err);
        return null;
      });
    },
    push: function () {
      if (!this.isReady()) return Promise.resolve(false);
      var payload = {
        startDate: localStorage.getItem("couple-start") || DEFAULT_START,
        anniversaries: getStore("couple-ann", DEFAULT_ANNIVERSARIES),
        memories: getStore("couple-mem", DEFAULT_MEMORIES),
        timeline: getStore("couple-tl", DEFAULT_TIMELINE),
        wishes: getStore("couple-wish", DEFAULT_WISHES)
      };
      return this.fetchJson(this.getUrl(""), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function () { return true; }).catch(function (err) {
        console.warn("Cloud push failed:", err);
        return false;
      });
    }
  };

  /* ===== Cloud Sync (Supabase REST API) ===== */

  var SupabaseSync = {
    getConfig: function () {
      try {
        return JSON.parse(localStorage.getItem("couple-supabase-config")) || {};
      } catch (e) { return {}; }
    },
    setConfig: function (cfg) {
      localStorage.setItem("couple-supabase-config", JSON.stringify(cfg));
    },
    isReady: function () {
      var c = this.getConfig();
      return !!(c.url && c.url.trim() && c.key && c.key.trim() && c.pairKey && c.pairKey.trim());
    },
    getHeaders: function () {
      var c = this.getConfig();
      return {
        "apikey": c.key,
        "Authorization": "Bearer " + c.key,
        "Content-Type": "application/json"
      };
    },
    pull: function () {
      if (!this.isReady()) return Promise.resolve(null);
      var c = this.getConfig();
      var url = c.url.replace(/\/$/, "") + "/rest/v1/couple_data?key=eq." + encodeURIComponent(c.pairKey) + "&select=data";
      return fetch(url, { method: "GET", headers: this.getHeaders() }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }).then(function (rows) {
        if (!rows || !rows.length || !rows[0].data) return null;
        var data = rows[0].data;
        if (data.startDate !== undefined) localStorage.setItem("couple-start", data.startDate);
        if (data.anniversaries !== undefined) localStorage.setItem("couple-ann", JSON.stringify(data.anniversaries));
        if (data.memories !== undefined) localStorage.setItem("couple-mem", JSON.stringify(data.memories));
        if (data.timeline !== undefined) localStorage.setItem("couple-tl", JSON.stringify(data.timeline));
        if (data.wishes !== undefined) localStorage.setItem("couple-wish", JSON.stringify(data.wishes));
        return data;
      }).catch(function (err) {
        console.warn("Supabase pull failed:", err);
        return null;
      });
    },
    push: function () {
      if (!this.isReady()) return Promise.resolve(false);
      var c = this.getConfig();
      var payload = {
        key: c.pairKey,
        data: {
          startDate: localStorage.getItem("couple-start") || DEFAULT_START,
          anniversaries: getStore("couple-ann", DEFAULT_ANNIVERSARIES),
          memories: getStore("couple-mem", DEFAULT_MEMORIES),
          timeline: getStore("couple-tl", DEFAULT_TIMELINE),
          wishes: getStore("couple-wish", DEFAULT_WISHES)
        },
        updated_at: new Date().toISOString()
      };
      var url = c.url.replace(/\/$/, "") + "/rest/v1/couple_data?on_conflict=key";
      return fetch(url, {
        method: "POST",
        headers: Object.assign({}, this.getHeaders(), { "Prefer": "resolution=merge-duplicates" }),
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return true;
      }).catch(function (err) {
        console.warn("Supabase push failed:", err);
        return false;
      });
    }
  };

  /* ===== æ¬å°å­å¨ ===== */

  function getStore(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }

  function setStore(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    if (CloudSync.isReady()) {
      CloudSync.push().catch(function () {});
    }
    if (SupabaseSync.isReady()) {
      SupabaseSync.push().catch(function () {});
    }
  }

  function getStartDate() { return localStorage.getItem("couple-start") || DEFAULT_START; }
  function getAnniversaries() { return getStore("couple-ann", DEFAULT_ANNIVERSARIES); }
  function getMemories() { return getStore("couple-mem", DEFAULT_MEMORIES); }
  function getTimeline() { return getStore("couple-tl", DEFAULT_TIMELINE); }
  function getWishes() { return getStore("couple-wish", DEFAULT_WISHES); }

  /* ===== æ¸²æï¼å¨ä¸èµ·å¤©æ° ===== */

  function updateTogether() {
    var start = new Date(getStartDate() + "T00:00:00");
    var diff = Math.max(0, now.getTime() - start.getTime());
    var days = Math.floor(diff / dayMs);
    var hours = Math.floor(diff / (3600 * 1000));
    var daysEl = document.getElementById("daysTogether");
    var hoursEl = document.getElementById("hoursTogether");
    if (daysEl) daysEl.textContent = days.toLocaleString("zh-CN");
    if (hoursEl) hoursEl.textContent = hours.toLocaleString("zh-CN");
  }

  /* ===== æ¸²æï¼çºªå¿µæ¥é¡µé¢ ===== */

  function renderAnniversaryPage() {
    var grid = document.querySelector("#anniversary .countdown-grid");
    if (!grid) return;
    var items = getAnniversaries();
    grid.innerHTML = "";
    items.forEach(function (item) {
      var p = item.date.split("-");
      var monthDay = pad(p[1]) + "." + pad(p[2]);
      var card = document.createElement("article");
      card.className = "card";
      card.setAttribute("data-countdown", item.date);
      card.innerHTML =
        '<span class="date-pill">' + monthDay + '</span>' +
        '<h3>' + escHtml(item.title) + '</h3>' +
        '<div class="days">0</div>' +
        '<div class="days-label">å¤©åå°æ¥</div>';
      grid.appendChild(card);
    });
    updateCountdowns();
  }

  function updateCountdowns() {
    document.querySelectorAll("[data-countdown]").forEach(function (card) {
      var dp = card.getAttribute("data-countdown").split("-");
      var m = Number(dp[1]), d = Number(dp[2]);
      var target = new Date(now.getFullYear(), m - 1, d);
      target.setHours(0, 0, 0, 0);
      var today = new Date(now); today.setHours(0, 0, 0, 0);
      if (target < today) target = new Date(now.getFullYear() + 1, m - 1, d);
      var diff = Math.ceil((target.getTime() - today.getTime()) / dayMs);
      var daysEl = card.querySelector(".days");
      var labelEl = card.querySelector(".days-label");
      if (daysEl) daysEl.textContent = diff;
      if (labelEl) labelEl.textContent = diff === 0 ? "å°±æ¯ä»å¤©" : "å¤©åå°æ¥";
    });
  }

  /* ===== æ¸²æï¼æ¥å¸¸ç¹æ»´é¡µé¢ ===== */

  function renderMemoriesPage() {
    var grid = document.querySelector("#memories .memory-grid");
    if (!grid) return;
    var items = getMemories();
    grid.innerHTML = "";
    items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "memory-card";
      var visualHtml = '<div class="memory-visual">';
      if (item.image) {
        visualHtml += '<img src="' + item.image + '" alt="' + escHtml(item.title) + '">';
      } else {
        visualHtml += '<svg viewBox="0 0 260 180"><rect width="260" height="180" fill="var(--soft)"/><text x="130" y="100" text-anchor="middle" fill="var(--muted)" font-size="14">ææ å¾ç</text></svg>';
      }
      visualHtml += '</div>';
      card.innerHTML = visualHtml +
        '<div class="memory-body">' +
        '<h3>' + escHtml(item.title) + '</h3>' +
        '<p>' + escHtml(item.text) + '</p>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  /* ===== æ¸²æï¼æ¶é´çº¿é¡µé¢ ===== */

  function renderTimelinePage() {
    var container = document.querySelector("#timeline .timeline");
    if (!container) return;
    var items = getTimeline();
    container.innerHTML = "";
    items.sort(function (a, b) { return a.date.localeCompare(b.date); });
    items.forEach(function (item) {
      var el = document.createElement("article");
      el.className = "event";
      el.innerHTML =
        '<span class="dot" aria-hidden="true"></span>' +
        '<div class="event-content">' +
        '<time>' + fmtDisplay(item.date) + '</time>' +
        '<h3>' + escHtml(item.title) + '</h3>' +
        '<p>' + escHtml(item.text) + '</p>' +
        '</div>';
      container.appendChild(el);
    });
  }

  /* ===== æ¸²æï¼æ¿ææ¸åé¡µé¢ ===== */

  function renderWishlistPage() {
    var grid = document.querySelector("#wishlist .wish-grid");
    if (!grid) return;
    var items = getWishes();
    grid.innerHTML = "";
    items.forEach(function (item) {
      var el = document.createElement("article");
      el.className = "wish";
      var strongClass = item.done ? ' class="done"' : "";
      var prefix = item.done ? "å®æï¼" : "";
      el.innerHTML =
        '<strong' + strongClass + '>' + prefix + escHtml(item.title) + '</strong>' +
        '<span>' + escHtml(item.note) + '</span>';
      grid.appendChild(el);
    });
  }

  /* ===== ç®¡çæ¨¡å¼ï¼Tab åæ¢ ===== */

  function initAdminTabs() {
    var tabs = document.querySelectorAll(".admin-tab");
    var panels = document.querySelectorAll(".admin-panel");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-admin-tab");
        tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
        panels.forEach(function (p) { p.classList.toggle("active", p.id === "panel-" + target); });
      });
    });
  }

  /* ===== ç®¡çæ¨¡å¼ï¼å¨ä¸èµ·æ¥æ ===== */

  function initStartDateAdmin() {
    var input = document.getElementById("adminStartDate");
    var btn = document.getElementById("saveStartDate");
    if (!input || !btn) return;
    input.value = getStartDate();
    btn.addEventListener("click", function () {
      if (!input.value) return;
      localStorage.setItem("couple-start", input.value);
      updateTogether();
      CloudSync.push().catch(function () {});
      SupabaseSync.push().catch(function () {});
      btn.textContent = "å·²ä¿å­";
      setTimeout(function () { btn.textContent = "ä¿å­å¹¶å·æ°"; }, 1200);
    });
  }

  /* ===== ç®¡çæ¨¡å¼ï¼çºªå¿µæ¥ ===== */

  function initAnniversaryAdmin() {
    var dateInput = document.getElementById("annDate");
    var titleInput = document.getElementById("annTitle");
    var addBtn = document.getElementById("addAnniversary");
    var list = document.getElementById("adminAnnList");
    if (!addBtn || !list) return;

    function renderList() {
      var items = getAnniversaries();
      list.innerHTML = "";
      items.forEach(function (item) {
        var el = document.createElement("div");
        el.className = "admin-item";
        el.innerHTML =
          '<div class="admin-item-info"><h4>' + escHtml(item.title) + '</h4><p>' + fmtDisplay(item.date) + '</p></div>' +
          '<div class="admin-item-actions"><button class="btn-edit" data-id="' + item.id + '">ç¼è¾</button><button class="btn-delete" data-id="' + item.id + '">å é¤</button></div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", function () {
      if (!dateInput.value || !titleInput.value.trim()) return;
      var items = getAnniversaries();
      items.push({ id: uid(), date: dateInput.value, title: titleInput.value.trim() });
      setStore("couple-ann", items);
      dateInput.value = ""; titleInput.value = "";
      renderList(); renderAnniversaryPage();
    });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var items = getAnniversaries();
      if (btn.classList.contains("btn-delete")) {
        setStore("couple-ann", items.filter(function (i) { return i.id !== id; }));
        renderList(); renderAnniversaryPage();
      }
      if (btn.classList.contains("btn-edit")) {
        var item = items.find(function (i) { return i.id === id; });
        if (!item) return;
        var info = btn.closest(".admin-item").querySelector(".admin-item-info");
        if (info.querySelector(".admin-edit-row")) return;
        var row = document.createElement("div");
        row.className = "admin-edit-row";
        row.style.flexDirection = "column";
        row.innerHTML =
          '<input type="date" value="' + item.date + '" class="edit-date">' +
          '<input type="text" value="' + escHtml(item.title) + '" class="edit-title">' +
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">ä¿å­</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">åæ¶</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", function () {
          var newDate = row.querySelector(".edit-date").value;
          var newTitle = row.querySelector(".edit-title").value.trim();
          if (!newDate || !newTitle) return;
          item.date = newDate; item.title = newTitle;
          setStore("couple-ann", items);
          renderList(); renderAnniversaryPage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () { row.remove(); });
      }
    });

    renderList();
  }

  /* ===== ç®¡çæ¨¡å¼ï¼æ¥å¸¸ç¹æ»´ ===== */

  function initMemoryAdmin() {
    var titleInput = document.getElementById("memTitle");
    var textInput = document.getElementById("memText");
    var imageInput = document.getElementById("memImage");
    var addBtn = document.getElementById("addMemory");
    var list = document.getElementById("adminMemList");
    if (!addBtn || !list) return;

    function renderList() {
      var items = getMemories();
      list.innerHTML = "";
      items.forEach(function (item) {
        var el = document.createElement("div");
        el.className = "admin-item";
        var imgHtml = item.image ? '<img src="' + item.image + '" alt="">' : '';
        el.innerHTML =
          '<div class="admin-item-info"><h4>' + escHtml(item.title) + '</h4><p>' + escHtml(item.text) + '</p>' + imgHtml + '</div>' +
          '<div class="admin-item-actions"><button class="btn-edit" data-id="' + item.id + '">ç¼è¾</button><button class="btn-delete" data-id="' + item.id + '">å é¤</button></div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", async function () {
      if (!titleInput.value.trim() || !textInput.value.trim()) return;
      var file = imageInput.files ? imageInput.files[0] : null;
      var imageData = "";
      try { imageData = await readImageAsDataUrl(file); } catch (e) { }
      var items = getMemories();
      items.push({ id: uid(), title: titleInput.value.trim(), text: textInput.value.trim(), image: imageData });
      setStore("couple-mem", items);
      titleInput.value = ""; textInput.value = ""; imageInput.value = "";
      renderList(); renderMemoriesPage();
    });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var items = getMemories();
      if (btn.classList.contains("btn-delete")) {
        setStore("couple-mem", items.filter(function (i) { return i.id !== id; }));
        renderList(); renderMemoriesPage();
      }
      if (btn.classList.contains("btn-edit")) {
        var item = items.find(function (i) { return i.id === id; });
        if (!item) return;
        var info = btn.closest(".admin-item").querySelector(".admin-item-info");
        if (info.querySelector(".admin-edit-row")) return;
        var row = document.createElement("div");
        row.className = "admin-edit-row";
        row.style.flexDirection = "column";
        row.innerHTML =
          '<input type="text" value="' + escHtml(item.title) + '" class="edit-title">' +
          '<textarea class="edit-text">' + escHtml(item.text) + '</textarea>' +
          '<input type="file" accept="image/*" class="edit-image">' +
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">ä¿å­</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">åæ¶</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", async function () {
          var newTitle = row.querySelector(".edit-title").value.trim();
          var newText = row.querySelector(".edit-text").value.trim();
          var newFile = row.querySelector(".edit-image").files ? row.querySelector(".edit-image").files[0] : null;
          if (!newTitle || !newText) return;
          item.title = newTitle; item.text = newText;
          if (newFile) {
            try { item.image = await readImageAsDataUrl(newFile); } catch (e) { }
          }
          setStore("couple-mem", items);
          renderList(); renderMemoriesPage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () { row.remove(); });
      }
    });

    renderList();
  }

  /* ===== ç®¡çæ¨¡å¼ï¼æ¶é´çº¿ ===== */

  function initTimelineAdmin() {
    var dateInput = document.getElementById("tlDate");
    var titleInput = document.getElementById("tlTitle");
    var textInput = document.getElementById("tlText");
    var addBtn = document.getElementById("addTimeline");
    var list = document.getElementById("adminTlList");
    if (!addBtn || !list) return;

    function renderList() {
      var items = getTimeline();
      list.innerHTML = "";
      items.sort(function (a, b) { return b.date.localeCompare(a.date); });
      items.forEach(function (item) {
        var el = document.createElement("div");
        el.className = "admin-item";
        el.innerHTML =
          '<div class="admin-item-info"><h4>' + escHtml(item.title) + '</h4><p>' + fmtDisplay(item.date) + ' â ' + escHtml(item.text) + '</p></div>' +
          '<div class="admin-item-actions"><button class="btn-edit" data-id="' + item.id + '">ç¼è¾</button><button class="btn-delete" data-id="' + item.id + '">å é¤</button></div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", function () {
      if (!dateInput.value || !titleInput.value.trim() || !textInput.value.trim()) return;
      var items = getTimeline();
      items.push({ id: uid(), date: dateInput.value, title: titleInput.value.trim(), text: textInput.value.trim() });
      setStore("couple-tl", items);
      dateInput.value = ""; titleInput.value = ""; textInput.value = "";
      renderList(); renderTimelinePage();
    });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var items = getTimeline();
      if (btn.classList.contains("btn-delete")) {
        setStore("couple-tl", items.filter(function (i) { return i.id !== id; }));
        renderList(); renderTimelinePage();
      }
      if (btn.classList.contains("btn-edit")) {
        var item = items.find(function (i) { return i.id === id; });
        if (!item) return;
        var info = btn.closest(".admin-item").querySelector(".admin-item-info");
        if (info.querySelector(".admin-edit-row")) return;
        var row = document.createElement("div");
        row.className = "admin-edit-row";
        row.style.flexDirection = "column";
        row.innerHTML =
          '<input type="date" value="' + item.date + '" class="edit-date">' +
          '<input type="text" value="' + escHtml(item.title) + '" class="edit-title">' +
          '<textarea class="edit-text">' + escHtml(item.text) + '</textarea>' +
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">ä¿å­</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">åæ¶</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", function () {
          var newDate = row.querySelector(".edit-date").value;
          var newTitle = row.querySelector(".edit-title").value.trim();
          var newText = row.querySelector(".edit-text").value.trim();
          if (!newDate || !newTitle || !newText) return;
          item.date = newDate; item.title = newTitle; item.text = newText;
          setStore("couple-tl", items);
          renderList(); renderTimelinePage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () { row.remove(); });
      }
    });

    renderList();
  }

  /* ===== ç®¡çæ¨¡å¼ï¼æ¿ææ¸å ===== */

  function initWishAdmin() {
    var titleInput = document.getElementById("wishTitle");
    var noteInput = document.getElementById("wishNote");
    var addBtn = document.getElementById("addWish");
    var list = document.getElementById("adminWishList");
    if (!addBtn || !list) return;

    function renderList() {
      var items = getWishes();
      list.innerHTML = "";
      items.forEach(function (item) {
        var el = document.createElement("div");
        el.className = "admin-item";
        var doneLabel = item.done ? "æªå®æ" : "å·²å®æ";
        var doneClass = item.done ? "btn-done" : "";
        el.innerHTML =
          '<div class="admin-item-info"><h4>' + (item.done ? '<span style="text-decoration:line-through;opacity:0.6">' + escHtml(item.title) + '</span>' : escHtml(item.title)) + '</h4><p>' + escHtml(item.note) + (item.done ? ' (å·²å®æ)' : '') + '</p></div>' +
          '<div class="admin-item-actions"><button class="' + doneClass + '" data-action="toggle" data-id="' + item.id + '">' + doneLabel + '</button><button class="btn-edit" data-id="' + item.id + '">ç¼è¾</button><button class="btn-delete" data-id="' + item.id + '">å é¤</button></div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", function () {
      if (!titleInput.value.trim()) return;
      var items = getWishes();
      items.push({ id: uid(), title: titleInput.value.trim(), note: noteInput.value.trim(), done: false });
      setStore("couple-wish", items);
      titleInput.value = ""; noteInput.value = "";
      renderList(); renderWishlistPage();
    });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var action = btn.getAttribute("data-action");
      var items = getWishes();

      if (action === "toggle") {
        var item = items.find(function (i) { return i.id === id; });
        if (item) item.done = !item.done;
        setStore("couple-wish", items);
        renderList(); renderWishlistPage();
        return;
      }

      if (btn.classList.contains("btn-delete")) {
        setStore("couple-wish", items.filter(function (i) { return i.id !== id; }));
        renderList(); renderWishlistPage();
      }

      if (btn.classList.contains("btn-edit")) {
        var item = items.find(function (i) { return i.id === id; });
        if (!item) return;
        var info = btn.closest(".admin-item").querySelector(".admin-item-info");
        if (info.querySelector(".admin-edit-row")) return;
        var row = document.createElement("div");
        row.className = "admin-edit-row";
        row.style.flexDirection = "column";
        row.innerHTML =
          '<input type="text" value="' + escHtml(item.title) + '" class="edit-title">' +
          '<input type="text" value="' + escHtml(item.note) + '" class="edit-note">' +
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">ä¿å­</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">åæ¶</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", function () {
          var newTitle = row.querySelector(".edit-title").value.trim();
          var newNote = row.querySelector(".edit-note").value.trim();
          if (!newTitle) return;
          item.title = newTitle; item.note = newNote;
          setStore("couple-wish", items);
          renderList(); renderWishlistPage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () { row.remove(); });
      }
    });

    renderList();
  }

  /* ===== ç®¡çæ¨¡å¼ï¼äºåæ­¥ ===== */

  function initCloudSyncAdmin() {
    /* --- åç«¯éæ©åæ¢ --- */
    var backendSel = document.getElementById("cloudBackend");
    var fbWrap = document.getElementById("fbConfigWrap");
    var sbWrap = document.getElementById("sbConfigWrap");
    var statusEl = document.getElementById("cloudStatus");
    var exportBtn = document.getElementById("exportData");
    var importInput = document.getElementById("importData");

    function showStatus(msg, ok) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.style.color = ok ? "var(--ok)" : "#e05555";
    }

    function switchBackendUI(val) {
      if (fbWrap) fbWrap.style.display = val === "firebase" ? "block" : "none";
      if (sbWrap) sbWrap.style.display = val === "supabase" ? "block" : "none";
    }

    if (backendSel) {
      backendSel.addEventListener("change", function () {
        switchBackendUI(backendSel.value);
      });
      switchBackendUI(backendSel.value);
    }

    /* --- Firebase --- */
    var fbUrlInput = document.getElementById("cloudUrl");
    var fbKeyInput = document.getElementById("cloudKey");
    var fbSaveBtn = document.getElementById("saveCloudConfig");
    var fbTestBtn = document.getElementById("testCloudConfig");

    function loadFbConfig() {
      var c = CloudSync.getConfig();
      if (fbUrlInput) fbUrlInput.value = c.url || "";
      if (fbKeyInput) fbKeyInput.value = c.key || "";
    }

    if (fbSaveBtn) {
      fbSaveBtn.addEventListener("click", function () {
        CloudSync.setConfig({ url: (fbUrlInput.value || "").trim(), key: (fbKeyInput.value || "").trim() });
        showStatus("Firebase éç½®å·²ä¿å­", true);
      });
    }
    if (fbTestBtn) {
      fbTestBtn.addEventListener("click", function () {
        if (!CloudSync.isReady()) { showStatus("è¯·åå¡«å Firebase æ°æ®åºå°ååéå¯¹å¯é¥", false); return; }
        showStatus("æ­£å¨æµè¯ Firebase è¿æ¥...", true);
        CloudSync.fetchJson(CloudSync.getUrl(""), { method: "GET" })
          .then(function () { showStatus("Firebase è¿æ¥æåï¼", true); })
          .catch(function () { showStatus("Firebase è¿æ¥å¤±è´¥ï¼è¯·æ£æ¥å°ååå¯é¥", false); });
      });
    }

    /* --- Supabase --- */
    var sbUrlInput = document.getElementById("sbUrl");
    var sbKeyInput = document.getElementById("sbKey");
    var sbPairInput = document.getElementById("sbPairKey");
    var sbSaveBtn = document.getElementById("saveSbConfig");
    var sbTestBtn = document.getElementById("testSbConfig");

    function loadSbConfig() {
      var c = SupabaseSync.getConfig();
      if (sbUrlInput) sbUrlInput.value = c.url || "";
      if (sbKeyInput) sbKeyInput.value = c.key || "";
      if (sbPairInput) sbPairInput.value = c.pairKey || "";
    }

    if (sbSaveBtn) {
      sbSaveBtn.addEventListener("click", function () {
        SupabaseSync.setConfig({
          url: (sbUrlInput.value || "").trim(),
          key: (sbKeyInput.value || "").trim(),
          pairKey: (sbPairInput.value || "").trim()
        });
        showStatus("Supabase éç½®å·²ä¿å­", true);
      });
    }
    if (sbTestBtn) {
      sbTestBtn.addEventListener("click", function () {
        if (!SupabaseSync.isReady()) { showStatus("è¯·åå¡«å Supabase é¡¹ç®å°åãanon key åéå¯¹å¯é¥", false); return; }
        showStatus("æ­£å¨æµè¯ Supabase è¿æ¥...", true);
        SupabaseSync.pull()
          .then(function (data) { showStatus("Supabase è¿æ¥æåï¼" + (data ? " å·²è¯»åäºç«¯æ°æ®" : " äºç«¯ææ æ°æ®"), true); })
          .catch(function () { showStatus("Supabase è¿æ¥å¤±è´¥ï¼è¯·æ£æ¥éç½®", false); });
      });
    }

    /* --- æå¨åæ­¥ --- */
    var pullBtn = document.getElementById("pullCloudData");
    var pushBtn = document.getElementById("pushCloudData");

    if (pullBtn) {
      pullBtn.addEventListener("click", function () {
        var ready = CloudSync.isReady() || SupabaseSync.isReady();
        if (!ready) { showStatus("è¯·åéç½®äºåæ­¥", false); return; }
        showStatus("æ­£å¨ä»äºç«¯æåæ°æ®...", true);
        var promises = [];
        if (CloudSync.isReady()) promises.push(CloudSync.pull());
        if (SupabaseSync.isReady()) promises.push(SupabaseSync.pull());
        Promise.all(promises).then(function (results) {
          var hasData = results.some(function (r) { return !!r; });
          if (hasData) {
            showStatus("æåæåï¼é¡µé¢å·²æ´æ°", true);
            updateTogether();
            renderAnniversaryPage(); renderMemoriesPage(); renderTimelinePage(); renderWishlistPage();
          } else {
            showStatus("äºç«¯ææ æ°æ®ææåå¤±è´¥", false);
          }
        });
      });
    }

    if (pushBtn) {
      pushBtn.addEventListener("click", function () {
        var ready = CloudSync.isReady() || SupabaseSync.isReady();
        if (!ready) { showStatus("è¯·åéç½®äºåæ­¥", false); return; }
        showStatus("æ­£å¨æ¨éå°äºç«¯...", true);
        var promises = [];
        if (CloudSync.isReady()) promises.push(CloudSync.push());
        if (SupabaseSync.isReady()) promises.push(SupabaseSync.push());
        Promise.all(promises).then(function (results) {
          var allOk = results.every(function (r) { return r; });
          showStatus(allOk ? "æ¨éæå" : "é¨åæ¨éå¤±è´¥", allOk);
        });
      });
    }

    /* --- å¯¼åºå¯¼å¥ --- */
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        var data = {
          startDate: getStartDate(),
          anniversaries: getAnniversaries(),
          memories: getMemories(),
          timeline: getTimeline(),
          wishes: getWishes(),
          exportedAt: new Date().toISOString()
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "couple-data-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        showStatus("æ°æ®å·²å¯¼åºå°ä¸è½½æä»¶å¤¹", true);
      });
    }

    if (importInput) {
      importInput.addEventListener("change", function () {
        var file = importInput.files ? importInput.files[0] : null;
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var data = JSON.parse(String(reader.result));
            if (data.startDate !== undefined) localStorage.setItem("couple-start", data.startDate);
            if (data.anniversaries !== undefined) localStorage.setItem("couple-ann", JSON.stringify(data.anniversaries));
            if (data.memories !== undefined) localStorage.setItem("couple-mem", JSON.stringify(data.memories));
            if (data.timeline !== undefined) localStorage.setItem("couple-tl", JSON.stringify(data.timeline));
            if (data.wishes !== undefined) localStorage.setItem("couple-wish", JSON.stringify(data.wishes));
            updateTogether();
            renderAnniversaryPage(); renderMemoriesPage(); renderTimelinePage(); renderWishlistPage();
            CloudSync.push().catch(function () {});
            SupabaseSync.push().catch(function () {});
            showStatus("æ°æ®å¯¼å¥æå", true);
          } catch (e) {
            showStatus("å¯¼å¥å¤±è´¥ï¼æä»¶æ ¼å¼ä¸æ­£ç¡®", false);
          }
        };
        reader.readAsText(file);
        importInput.value = "";
      });
    }

    loadFbConfig();
    loadSbConfig();
    if (CloudSync.isReady() || SupabaseSync.isReady()) {
      showStatus("å·²éç½®äºåæ­¥ï¼æ°æ®ä¼èªå¨ä¿å­å°äºç«¯", true);
    } else {
      showStatus("å°æªéç½®äºåæ­¥", false);
    }
  }

  /* ===== è§å¾åæ¢ ===== */

  function initViews() {
    var validViews = Array.prototype.map.call(document.querySelectorAll(".view"), function (v) { return v.id; });
    var navLinks = document.querySelectorAll('.links a[href^="#"], .brand[href^="#"], .hero-actions a[href^="#"]');

    function showView(id) {
      var viewId = validViews.indexOf(id) >= 0 ? id : "home";
      document.querySelectorAll(".view").forEach(function (v) { v.classList.toggle("active", v.id === viewId); });
      document.querySelectorAll('.links a[href^="#"]').forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + viewId); });
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (viewId === "journal") {
        renderAdminLists();
      }
    }

    navLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href") || "";
        var id = href.replace("#", "");
        if (validViews.indexOf(id) < 0) return;
        e.preventDefault();
        if (window.location.hash !== href) { window.location.hash = id; }
        else { showView(id); }
      });
    });

    window.addEventListener("hashchange", function () { showView(window.location.hash.replace("#", "")); });
    showView(window.location.hash.replace("#", "") || "home");
  }

  function renderAdminLists() {
    renderAnnList(); renderMemList(); renderTlList(); renderWishList();
  }

  function renderAnnList() {
    var list = document.getElementById("adminAnnList");
    if (!list) return;
    var items = getAnniversaries();
    list.innerHTML = "";
    items.forEach(function (item) {
      var el = document.createElement("div");
      el.className = "admin-item";
      el.innerHTML =
        '<div class="admin-item-info"><h4>' + escHtml(item.title) + '</h4><p>' + fmtDisplay(item.date) + '</p></div>' +
        '<div class="admin-item-actions"><button class="btn-delete" data-section="ann" data-id="' + item.id + '">å é¤</button></div>';
      list.appendChild(el);
    });
  }

  function renderMemList() {
    var list = document.getElementById("adminMemList");
    if (!list) return;
    var items = getMemories();
    list.innerHTML = "";
    items.forEach(function (item) {
      var el = document.createElement("div");
      el.className = "admin-item";
      el.innerHTML =
        '<div class="admin-item-info"><h4>' + escHtml(item.title) + '</h4><p>' + escHtml(item.text) + '</p></div>' +
        '<div class="admin-item-actions"><button class="btn-delete" data-section="mem" data-id="' + item.id + '">å é¤</button></div>';
      list.appendChild(el);
    });
  }

  function renderTlList() {
    var list = document.getElementById("adminTlList");
    if (!list) return;
    var items = getTimeline();
    list.innerHTML = "";
    items.forEach(function (item) {
      var el = document.createElement("div");
      el.className = "admin-item";
      el.innerHTML =
        '<div class="admin-item-info"><h4>' + escHtml(item.title) + '</h4><p>' + fmtDisplay(item.date) + ' â ' + escHtml(item.text) + '</p></div>' +
        '<div class="admin-item-actions"><button class="btn-delete" data-section="tl" data-id="' + item.id + '">å é¤</button></div>';
      list.appendChild(el);
    });
  }

  function renderWishList() {
    var list = document.getElementById("adminWishList");
    if (!list) return;
    var items = getWishes();
    list.innerHTML = "";
    items.forEach(function (item) {
      var el = document.createElement("div");
      el.className = "admin-item";
      el.innerHTML =
        '<div class="admin-item-info"><h4>' + escHtml(item.title) + (item.done ? ' (å·²å®æ)' : '') + '</h4><p>' + escHtml(item.note) + '</p></div>' +
        '<div class="admin-item-actions"><button class="btn-delete" data-section="wish" data-id="' + item.id + '">å é¤</button></div>';
      list.appendChild(el);
    });
  }

  /* ===== ä¸»é¢ ===== */

  function initTheme() {
    var button = document.getElementById("themeToggle");
    var saved = localStorage.getItem("couple-theme");
    if (saved === "night") {
      document.body.classList.add("night");
      if (button) button.textContent = "æ¥é´æ¨¡å¼";
    }
    if (button) {
      button.addEventListener("click", function () {
        document.body.classList.toggle("night");
        var isNight = document.body.classList.contains("night");
        localStorage.setItem("couple-theme", isNight ? "night" : "day");
        button.textContent = isNight ? "æ¥é´æ¨¡å¼" : "å¤é´æ¨¡å¼";
      });
    }
  }

  /* ===== åå§å ===== */

  Promise.all([CloudSync.pull(), SupabaseSync.pull()]).then(function () {
    updateTogether();
    renderAnniversaryPage();
    renderMemoriesPage();
    renderTimelinePage();
    renderWishlistPage();
  });

  initViews();
  initTheme();
  initAdminTabs();
  initStartDateAdmin();
  initAnniversaryAdmin();
  initMemoryAdmin();
  initTimelineAdmin();
  initWishAdmin();
  initCloudSyncAdmin();
})();
