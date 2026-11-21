(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Mobile menu ---------- */
  var toggle = $("navToggle"), nav = $("mainNav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "মেনু বন্ধ করুন" : "মেনু খুলুন");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 760) setMenu(false); });

  /* ---------- Hero slider ---------- */
  var slider = $("slider");
  var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
  var dotsBox = slider.querySelector(".dots");
  var cur = 0, timer = null, DELAY = 5500;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var dots = slides.map(function (_, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", "স্লাইড " + (i + 1));
    b.addEventListener("click", function () { go(i); restart(); });
    dotsBox.appendChild(b);
    return b;
  });

  function go(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === cur;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      var img = s.querySelector("img");
      if (on && img) img.loading = "eager";
    });
    dots.forEach(function (d, k) { d.setAttribute("aria-selected", k === cur ? "true" : "false"); });
  }
  function start() { if (!reduce && !timer) timer = setInterval(function () { go(cur + 1); }, DELAY); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  slider.querySelector(".s-prev").addEventListener("click", function () { go(cur - 1); restart(); });
  slider.querySelector(".s-next").addEventListener("click", function () { go(cur + 1); restart(); });
  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

  // swipe on touch screens
  var x0 = null, y0 = null;
  slider.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; stop(); }, { passive: true });
  slider.addEventListener("touchend", function (e) {
    if (x0 !== null) {
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    }
    x0 = y0 = null; start();
  }, { passive: true });

  go(0); start();

  /* ---------- Prayer times ---------- */
  var digits = "০১২৩৪৫৬৭৮৯";
  function bn(s) { return String(s).replace(/[0-9]/g, function (d) { return digits[d]; }); }
  function fmt(h, m) { var h12 = h % 12 === 0 ? 12 : h % 12; return bn(h12 + ":" + (m < 10 ? "0" + m : m)); }

  // 24-hour sample times: [name, start h, start m, jamaat h, jamaat m]
  var P = [
    ["ফজর", 4, 40, 5, 15],
    ["যোহর", 11, 45, 13, 30],
    ["আসর", 15, 10, 16, 0],
    ["মাগরিব", 17, 15, 17, 30],
    ["এশা", 18, 35, 19, 30]
  ];

  var now = new Date();
  var mins = now.getHours() * 60 + now.getMinutes();
  var idx = -1;
  for (var i = 0; i < P.length; i++) { if (P[i][3] * 60 + P[i][4] > mins) { idx = i; break; } }
  var tomorrow = idx === -1;
  if (tomorrow) idx = 0;

  var rows = $("rows");
  P.forEach(function (p, i) {
    var tr = document.createElement("tr");
    if (i === idx) tr.className = "is-next";
    tr.innerHTML = '<td class="pname">' + p[0] + (i === idx ? '<span class="badge">পরবর্তী</span>' : "") +
      "</td><td>" + fmt(p[1], p[2]) + "</td><td>" + fmt(p[3], p[4]) + "</td>";
    rows.appendChild(tr);
  });

  var n = P[idx];
  $("nextName").textContent = n[0] + (tomorrow ? " (আগামীকাল)" : "");
  $("nextTime").textContent = fmt(n[3], n[4]);
  var diff = n[3] * 60 + n[4] - mins + (tomorrow ? 1440 : 0);
  var h = Math.floor(diff / 60), m = diff % 60;
  $("nextCount").textContent = "আর " + (h ? bn(h) + " ঘণ্টা " : "") + bn(m) + " মিনিট বাকি";
  try {
    $("todayDate").textContent = now.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch (e) { $("todayDate").textContent = ""; }

  /* ---------- Copy payment number ---------- */
  var btn = $("copyBtn"), no = $("payNo");
  btn.addEventListener("click", function () {
    var done = function () { btn.textContent = "কপি হয়েছে"; setTimeout(function () { btn.textContent = "নম্বর কপি করুন"; }, 1800); };
    var sel = function () { var r = document.createRange(); r.selectNodeContents(no); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(no.textContent).then(done, sel); } catch (e) { sel(); }
  });
})();
