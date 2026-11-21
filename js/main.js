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

  /* ---------- Dates & clock (Hijri first, then Bangla) ---------- */
  var WEEK = ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
  var GMON = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  var HMON = ["মুহাররম","সফর","রবিউল আউয়াল","রবিউস সানি","জমাদিউল আউয়াল","জমাদিউস সানি","রজব","শা'বান","রমজান","শাওয়াল","জিলকদ","জিলহজ"];
  var BMON = ["বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ","ভাদ্র","আশ্বিন","কার্তিক","অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন","চৈত্র"];
  // Hijri offset in days (use -1 / +1 if the local moon sighting differs, e.g. Bangladesh)
  var HIJRI_ADJUST = 0;

  function hijri(d) {
    try {
      var x = new Date(d.getTime() + HIJRI_ADJUST * 864e5);
      var parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(x);
      var o = {};
      parts.forEach(function (p) { o[p.type] = parseInt(p.value, 10); });
      if (!o.day || !o.month || !o.year) return "";
      return bn(o.day) + " " + HMON[o.month - 1] + " " + bn(o.year) + " হিজরি";
    } catch (e) { return ""; }
  }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function bangla(d) {
    var y = d.getFullYear();
    var start = new Date(y, 3, 14);
    if (d < start) { y -= 1; start = new Date(y, 3, 14); }
    var a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    var b = Date.UTC(start.getFullYear(), 3, 14);
    var off = Math.floor((a - b) / 864e5);
    var len = [31,31,31,31,31,30,30,30,30,30, isLeap(y + 1) ? 31 : 30, 30];
    var mi = 0;
    while (mi < 11 && off >= len[mi]) { off -= len[mi]; mi++; }
    return bn(off + 1) + " " + BMON[mi] + " " + bn(y - 593) + " বঙ্গাব্দ";
  }
  function period(h) { return h < 4 ? "রাত" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 17 ? "বিকাল" : h < 19 ? "সন্ধ্যা" : "রাত"; }
  function two(n) { return n < 10 ? "0" + n : n; }

  function paintDates() {
    var d = new Date();
    $("hijriDate").textContent = hijri(d);
    $("todayDate").textContent = WEEK[d.getDay()] + ", " + bn(d.getDate()) + " " + GMON[d.getMonth()] + " " + bn(d.getFullYear());
    $("banglaDate").textContent = bangla(d);
  }
  function paintClock() {
    var d = new Date(), h = d.getHours(), h12 = h % 12 === 0 ? 12 : h % 12;
    $("clock").textContent = period(h) + " " + bn(h12 + ":" + two(d.getMinutes()) + ":" + two(d.getSeconds()));
  }
  paintDates(); paintClock();
  setInterval(paintClock, 1000);
  setInterval(paintDates, 60000);

  /* ---------- Copy payment number ---------- */
  var btn = $("copyBtn"), no = $("payNo");
  btn.addEventListener("click", function () {
    var done = function () { btn.textContent = "কপি হয়েছে"; setTimeout(function () { btn.textContent = "নম্বর কপি করুন"; }, 1800); };
    var sel = function () { var r = document.createRange(); r.selectNodeContents(no); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(no.textContent).then(done, sel); } catch (e) { sel(); }
  });
})();
