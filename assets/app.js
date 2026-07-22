(function () {
  var dayMs = 24 * 60 * 60 * 1000;
  var now = new Date();

  /* ===== 工具函数 ===== */

  function pad(n) { return String(n).padStart(2, "0"); }

  function formatDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

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

  function getStore(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }

  function setStore(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  /* ===== 默认数据 ===== */

  var DEFAULT_START = "2024-05-20";

  var DEFAULT_ANNIVERSARIES = [
    { id: "a1", date: "2026-08-14", title: "第一次见面的日子" },
    { id: "a2", date: "2026-09-09", title: "正式在一起纪念日" },
    { id: "a3", date: "2026-12-24", title: "一起过圣诞" }
  ];

  var DEFAULT_MEMORIES = [
    { id: "m1", title: "一起吃过的饭", text: "热腾腾的火锅、楼下的小面、深夜的便利店关东煮，都是「我们」的味道。", image: "" },
    { id: "m2", title: "一起看过的电影", text: "片尾灯亮起来的时候，最想讨论剧情的人，刚好就坐在旁边。", image: "" },
    { id: "m3", title: "想去的远方", text: "把城市、海边、山顶和小巷都写进清单，然后一站一站慢慢实现。", image: "" },
    { id: "m4", title: "一起玩的游戏", text: "无论是联机打怪还是桌游对决，每次开黑都像是在并肩作战。", image: "" }
  ];

  var DEFAULT_TIMELINE = [
    { id: "t1", date: "2024-05-20", title: "故事开始", text: "从一句「你好」开始，生活多了一个很重要的人。" },
    { id: "t2", date: "2024-09-09", title: "正式在一起", text: "决定认真牵手，也决定把未来的很多日子都留给彼此。" },
    { id: "t3", date: "2025-02-14", title: "第一个情人节", text: "礼物、花、拥抱和笨拙的仪式感，都被认真收藏。" },
    { id: "t4", date: "2025-10-01", title: "第一次长途旅行", text: "一起看陌生城市的日落，也一起确认身边这个人很适合同行。" }
  ];

  var DEFAULT_WISHES = [
    { id: "w1", title: "一起看海", note: "找一个天气很好的周末。", done: false },
    { id: "w2", title: "拍一组写真", note: "记录现在的我们。", done: false },
    { id: "w3", title: "学会一道菜", note: "以后变成家的味道。", done: false },
    { id: "w4", title: "跨年", note: "倒数的时候，身边是你。", done: true }
  ];

  /* ===== 数据读取 ===== */

  function getStartDate() { return localStorage.getItem("couple-start") || DEFAULT_START; }
  function getAnniversaries() { return getStore("couple-ann", DEFAULT_ANNIVERSARIES); }
  function getMemories() { return getStore("couple-mem", DEFAULT_MEMORIES); }
  function getTimeline() { return getStore("couple-tl", DEFAULT_TIMELINE); }
  function getWishes() { return getStore("couple-wish", DEFAULT_WISHES); }

  /* ===== 渲染：在一起天数 ===== */

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

  /* ===== 渲染：纪念日页面 ===== */

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
        '<div class="days-label">天后到来</div>';
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
      if (labelEl) labelEl.textContent = diff === 0 ? "就是今天" : "天后到来";
    });
  }

  /* ===== 渲染：日常点滴页面 ===== */

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
        visualHtml += '<svg viewBox="0 0 260 180"><rect width="260" height="180" fill="var(--soft)"/><text x="130" y="100" text-anchor="middle" fill="var(--muted)" font-size="14">暂无图片</text></svg>';
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

  /* ===== 渲染：时间线页面 ===== */

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

  /* ===== 渲染：愿望清单页面 ===== */

  function renderWishlistPage() {
    var grid = document.querySelector("#wishlist .wish-grid");
    if (!grid) return;
    var items = getWishes();
    grid.innerHTML = "";
    items.forEach(function (item) {
      var el = document.createElement("article");
      el.className = "wish";
      var strongClass = item.done ? ' class="done"' : "";
      var prefix = item.done ? "完成：" : "";
      el.innerHTML =
        '<strong' + strongClass + '>' + prefix + escHtml(item.title) + '</strong>' +
        '<span>' + escHtml(item.note) + '</span>';
      grid.appendChild(el);
    });
  }

  /* ===== HTML 转义 ===== */

  function escHtml(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  /* ===== 管理模式：Tab 切换 ===== */

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

  /* ===== 管理模式：在一起日期 ===== */

  function initStartDateAdmin() {
    var input = document.getElementById("adminStartDate");
    var btn = document.getElementById("saveStartDate");
    if (!input || !btn) return;
    input.value = getStartDate();
    btn.addEventListener("click", function () {
      if (!input.value) return;
      localStorage.setItem("couple-start", input.value);
      updateTogether();
      btn.textContent = "已保存";
      setTimeout(function () { btn.textContent = "保存并刷新"; }, 1200);
    });
  }

  /* ===== 管理模式：纪念日 ===== */

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
          '<div class="admin-item-info">' +
          '<h4>' + escHtml(item.title) + '</h4>' +
          '<p>' + fmtDisplay(item.date) + '</p>' +
          '</div>' +
          '<div class="admin-item-actions">' +
          '<button class="btn-edit" data-id="' + item.id + '">编辑</button>' +
          '<button class="btn-delete" data-id="' + item.id + '">删除</button>' +
          '</div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", function () {
      if (!dateInput.value || !titleInput.value.trim()) return;
      var items = getAnniversaries();
      items.push({ id: uid(), date: dateInput.value, title: titleInput.value.trim() });
      setStore("couple-ann", items);
      dateInput.value = "";
      titleInput.value = "";
      renderList();
      renderAnniversaryPage();
    });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var items = getAnniversaries();
      if (btn.classList.contains("btn-delete")) {
        setStore("couple-ann", items.filter(function (i) { return i.id !== id; }));
        renderList();
        renderAnniversaryPage();
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
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">保存</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">取消</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", function () {
          var newDate = row.querySelector(".edit-date").value;
          var newTitle = row.querySelector(".edit-title").value.trim();
          if (!newDate || !newTitle) return;
          item.date = newDate;
          item.title = newTitle;
          setStore("couple-ann", items);
          renderList();
          renderAnniversaryPage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () {
          row.remove();
        });
      }
    });

    renderList();
  }

  /* ===== 管理模式：日常点滴 ===== */

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
          '<div class="admin-item-info">' +
          '<h4>' + escHtml(item.title) + '</h4>' +
          '<p>' + escHtml(item.text) + '</p>' +
          imgHtml +
          '</div>' +
          '<div class="admin-item-actions">' +
          '<button class="btn-edit" data-id="' + item.id + '">编辑</button>' +
          '<button class="btn-delete" data-id="' + item.id + '">删除</button>' +
          '</div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", async function () {
      if (!titleInput.value.trim() || !textInput.value.trim()) return;
      var file = imageInput.files ? imageInput.files[0] : null;
      var imageData = "";
      try { imageData = await readImageAsDataUrl(file); } catch (e) { /* ignore */ }
      var items = getMemories();
      items.push({
        id: uid(),
        title: titleInput.value.trim(),
        text: textInput.value.trim(),
        image: imageData
      });
      setStore("couple-mem", items);
      titleInput.value = "";
      textInput.value = "";
      imageInput.value = "";
      renderList();
      renderMemoriesPage();
    });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var items = getMemories();
      if (btn.classList.contains("btn-delete")) {
        setStore("couple-mem", items.filter(function (i) { return i.id !== id; }));
        renderList();
        renderMemoriesPage();
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
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">保存</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">取消</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", async function () {
          var newTitle = row.querySelector(".edit-title").value.trim();
          var newText = row.querySelector(".edit-text").value.trim();
          var newFile = row.querySelector(".edit-image").files ? row.querySelector(".edit-image").files[0] : null;
          if (!newTitle || !newText) return;
          item.title = newTitle;
          item.text = newText;
          if (newFile) {
            try { item.image = await readImageAsDataUrl(newFile); } catch (e) { /* keep old */ }
          }
          setStore("couple-mem", items);
          renderList();
          renderMemoriesPage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () { row.remove(); });
      }
    });

    renderList();
  }

  /* ===== 管理模式：时间线 ===== */

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
          '<div class="admin-item-info">' +
          '<h4>' + escHtml(item.title) + '</h4>' +
          '<p>' + fmtDisplay(item.date) + ' — ' + escHtml(item.text) + '</p>' +
          '</div>' +
          '<div class="admin-item-actions">' +
          '<button class="btn-edit" data-id="' + item.id + '">编辑</button>' +
          '<button class="btn-delete" data-id="' + item.id + '">删除</button>' +
          '</div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", function () {
      if (!dateInput.value || !titleInput.value.trim() || !textInput.value.trim()) return;
      var items = getTimeline();
      items.push({ id: uid(), date: dateInput.value, title: titleInput.value.trim(), text: textInput.value.trim() });
      setStore("couple-tl", items);
      dateInput.value = "";
      titleInput.value = "";
      textInput.value = "";
      renderList();
      renderTimelinePage();
    });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var items = getTimeline();
      if (btn.classList.contains("btn-delete")) {
        setStore("couple-tl", items.filter(function (i) { return i.id !== id; }));
        renderList();
        renderTimelinePage();
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
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">保存</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">取消</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", function () {
          var newDate = row.querySelector(".edit-date").value;
          var newTitle = row.querySelector(".edit-title").value.trim();
          var newText = row.querySelector(".edit-text").value.trim();
          if (!newDate || !newTitle || !newText) return;
          item.date = newDate;
          item.title = newTitle;
          item.text = newText;
          setStore("couple-tl", items);
          renderList();
          renderTimelinePage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () { row.remove(); });
      }
    });

    renderList();
  }

  /* ===== 管理模式：愿望清单 ===== */

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
        var doneLabel = item.done ? "未完成" : "已完成";
        var doneClass = item.done ? "btn-done" : "";
        el.innerHTML =
          '<div class="admin-item-info">' +
          '<h4>' + (item.done ? '<span style="text-decoration:line-through;opacity:0.6">' + escHtml(item.title) + '</span>' : escHtml(item.title)) + '</h4>' +
          '<p>' + escHtml(item.note) + (item.done ? ' (已完成)' : '') + '</p>' +
          '</div>' +
          '<div class="admin-item-actions">' +
          '<button class="' + doneClass + '" data-action="toggle" data-id="' + item.id + '">' + doneLabel + '</button>' +
          '<button class="btn-edit" data-id="' + item.id + '">编辑</button>' +
          '<button class="btn-delete" data-id="' + item.id + '">删除</button>' +
          '</div>';
        list.appendChild(el);
      });
    }

    addBtn.addEventListener("click", function () {
      if (!titleInput.value.trim()) return;
      var items = getWishes();
      items.push({ id: uid(), title: titleInput.value.trim(), note: noteInput.value.trim(), done: false });
      setStore("couple-wish", items);
      titleInput.value = "";
      noteInput.value = "";
      renderList();
      renderWishlistPage();
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
        renderList();
        renderWishlistPage();
        return;
      }

      if (btn.classList.contains("btn-delete")) {
        setStore("couple-wish", items.filter(function (i) { return i.id !== id; }));
        renderList();
        renderWishlistPage();
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
          '<div style="display:flex;gap:0.5rem"><button class="btn-save-edit">保存</button><button class="btn-cancel-edit" style="padding:0.35rem 0.8rem;border-radius:6px;border:1px solid var(--rule);background:var(--bg);color:var(--muted);font-size:0.8rem;cursor:pointer">取消</button></div>';
        info.appendChild(row);
        row.querySelector(".btn-save-edit").addEventListener("click", function () {
          var newTitle = row.querySelector(".edit-title").value.trim();
          var newNote = row.querySelector(".edit-note").value.trim();
          if (!newTitle) return;
          item.title = newTitle;
          item.note = newNote;
          setStore("couple-wish", items);
          renderList();
          renderWishlistPage();
        });
        row.querySelector(".btn-cancel-edit").addEventListener("click", function () { row.remove(); });
      }
    });

    renderList();
  }

  /* ===== 视图切换 ===== */

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
    renderAnnList();
    renderMemList();
    renderTlList();
    renderWishList();
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
        '<div class="admin-item-actions"><button class="btn-delete" data-section="ann" data-id="' + item.id + '">删除</button></div>';
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
        '<div class="admin-item-actions"><button class="btn-delete" data-section="mem" data-id="' + item.id + '">删除</button></div>';
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
        '<div class="admin-item-info"><h4>' + escHtml(item.title) + '</h4><p>' + fmtDisplay(item.date) + ' — ' + escHtml(item.text) + '</p></div>' +
        '<div class="admin-item-actions"><button class="btn-delete" data-section="tl" data-id="' + item.id + '">删除</button></div>';
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
        '<div class="admin-item-info"><h4>' + escHtml(item.title) + (item.done ? ' (已完成)' : '') + '</h4><p>' + escHtml(item.note) + '</p></div>' +
        '<div class="admin-item-actions"><button class="btn-delete" data-section="wish" data-id="' + item.id + '">删除</button></div>';
      list.appendChild(el);
    });
  }

  /* ===== 主题 ===== */

  function initTheme() {
    var button = document.getElementById("themeToggle");
    var saved = localStorage.getItem("couple-theme");
    if (saved === "night") {
      document.body.classList.add("night");
      if (button) button.textContent = "日间模式";
    }
    if (button) {
      button.addEventListener("click", function () {
        document.body.classList.toggle("night");
        var isNight = document.body.classList.contains("night");
        localStorage.setItem("couple-theme", isNight ? "night" : "day");
        button.textContent = isNight ? "日间模式" : "夜间模式";
      });
    }
  }

  /* ===== 初始化 ===== */

  updateTogether();
  renderAnniversaryPage();
  renderMemoriesPage();
  renderTimelinePage();
  renderWishlistPage();
  initViews();
  initTheme();
  initAdminTabs();
  initStartDateAdmin();
  initAnniversaryAdmin();
  initMemoryAdmin();
  initTimelineAdmin();
  initWishAdmin();
})();
