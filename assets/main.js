/* Paul Larson, site behavior. Reads everything editable from site-config.js. */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    }
    if (text) node.textContent = text;
    return node;
  }

  function trimSlash(url) { return (url || "").replace(/\/+$/, ""); }

  /* ---------- Series name and profile links ---------- */
  function applyConfig() {
    qsa("[data-series-name]").forEach(function (n) { n.textContent = cfg.seriesName || ""; });
    qsa("[data-youtube-link]").forEach(function (a) { a.href = cfg.youtubeUrl || "#"; });
    qsa("[data-substack-link]").forEach(function (a) { a.href = trimSlash(cfg.substackUrl) || "#"; });
    qsa("[data-substack-subscribe]").forEach(function (a) { a.href = trimSlash(cfg.substackUrl) + "/subscribe"; });
    qsa("[data-linkedin-link]").forEach(function (a) { a.href = cfg.linkedinUrl || "#"; });
    qsa("[data-year]").forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

    if (cfg.reimagineUrl) {
      qsa("[data-reimagine]").forEach(function (span) {
        var a = el("a", { href: cfg.reimagineUrl, target: "_blank", rel: "noopener", "class": "text-link" }, span.textContent);
        span.replaceWith(a);
      });
    }
  }

  /* ---------- Briefings ---------- */
  function thumb(id) {
    var img = el("img", {
      src: "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg",
      alt: "",
      loading: "lazy",
      decoding: "async"
    });
    img.addEventListener("error", function onErr() {
      img.removeEventListener("error", onErr);
      img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    });
    return img;
  }

  function playInline(media, b) {
    media.innerHTML = "";
    var iframe = el("iframe", {
      src: "https://www.youtube-nocookie.com/embed/" + b.youtubeId + "?autoplay=1&rel=0",
      title: b.title,
      allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
      allowfullscreen: "",
      referrerpolicy: "strict-origin-when-cross-origin"
    });
    media.appendChild(iframe);
    iframe.focus();
  }

  function briefingNode(b) {
    var art = el("article", { "class": "briefing" });

    var media = el("div", { "class": "briefing-media" });
    if (b.youtubeId) {
      media.appendChild(thumb(b.youtubeId));
      var play = el("button", { type: "button", "class": "play-btn", "aria-label": "Play video: " + b.title });
      play.addEventListener("click", function () { playInline(media, b); });
      media.appendChild(play);
    }
    art.appendChild(media);

    var body = el("div", { "class": "briefing-body" });
    if (b.date) body.appendChild(el("p", { "class": "briefing-date" }, b.date));
    body.appendChild(el("h3", null, b.title));
    if (b.summary) body.appendChild(el("p", { "class": "briefing-summary" }, b.summary));

    var links = el("p", { "class": "briefing-links" });
    if (b.youtubeId) {
      links.appendChild(el("a", {
        "class": "text-link",
        href: "https://www.youtube.com/watch?v=" + b.youtubeId,
        target: "_blank",
        rel: "noopener"
      }, "Watch on YouTube"));
    }
    if (b.substackUrl) {
      links.appendChild(el("a", {
        "class": "text-link",
        href: b.substackUrl,
        target: "_blank",
        rel: "noopener"
      }, "Read the companion dossier on Substack"));
    }
    body.appendChild(links);
    art.appendChild(body);
    return art;
  }

  function renderBriefings() {
    var list = Array.isArray(cfg.briefings) ? cfg.briefings : [];
    qsa("[data-briefings]").forEach(function (box) {
      var mode = box.getAttribute("data-briefings");
      var items = mode === "featured" ? list.slice(0, 2) : list;
      box.innerHTML = "";
      items.forEach(function (b) { box.appendChild(briefingNode(b)); });
    });
  }

  /* ---------- Email (assembled only on request) ---------- */
  function emailAddress() {
    if (!cfg.emailUser || !cfg.emailDomain) return "";
    return cfg.emailUser + "@" + cfg.emailDomain;
  }

  function setupEmail() {
    qsa("[data-email-reveal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var out = document.getElementById(btn.getAttribute("aria-controls"));
        if (!out) return;
        var addr = emailAddress();
        out.innerHTML = "";
        out.appendChild(el("a", { href: "mailto:" + addr, "class": "text-link" }, addr));
        out.hidden = false;
        btn.hidden = true;
      });
    });
  }

  /* ---------- Inquiry form ---------- */
  var TOPICS = {
    speaking: "Speaking & Workshops",
    methodology: "Methodology & AI Workflow Exchange",
    conflict: "Geopolitical & Conflict Analysis",
    leadership: "Executive Leadership & Networking"
  };

  function setupInquiry() {
    var form = document.getElementById("inquiry-form");
    if (!form) return;
    var submitBtn = form.querySelector("[type=submit]");
    var status = document.getElementById("form-status");
    var useFormspree = Boolean(cfg.formspreeEndpoint);
    if (useFormspree) submitBtn.textContent = "Send inquiry";

    var params = new URLSearchParams(window.location.search);
    var preset = params.get("topic");
    if (preset && TOPICS[preset]) {
      var radio = form.querySelector('input[name="topic"][value="' + preset + '"]');
      if (radio) radio.checked = true;
    }

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.className = "form-status" + (kind ? " is-" + kind : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var topicKey = data.get("topic");
      if (!topicKey) {
        setStatus("Choose an inquiry topic first.", "error");
        form.querySelector('input[name="topic"]').focus();
        return;
      }
      var topic = TOPICS[topicKey] || topicKey;
      var name = String(data.get("name") || "").trim();
      var org = String(data.get("organization") || "").trim();
      var reply = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();
      var subject = "[" + topic + "] Inquiry from " + name + (org ? ", " + org : "");

      if (useFormspree) {
        submitBtn.disabled = true;
        setStatus("Sending the inquiry...", "");
        fetch(cfg.formspreeEndpoint, {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic, name: name, organization: org, email: reply,
            message: message, _subject: subject
          })
        }).then(function (res) {
          if (!res.ok) throw new Error("bad status");
          form.reset();
          setStatus("Inquiry sent. Paul Larson will reply to " + reply + ".", "ok");
        }).catch(function () {
          setStatus("The inquiry did not send. Check your connection and select Send inquiry again, or use Show email address to write directly.", "error");
        }).then(function () { submitBtn.disabled = false; });
        return;
      }

      var body = message + "\n\n" +
        "Name: " + name + "\n" +
        (org ? "Organization: " + org + "\n" : "") +
        "Reply to: " + reply + "\n" +
        "Topic: " + topic;
      window.location.href = "mailto:" + emailAddress() +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      setStatus("Your email app should open with the inquiry filled in. If it does not open, use Show email address to write directly.", "ok");
    });
  }

  /* ---------- Field map tooltips ---------- */
  function setupMap() {
    var canvas = document.querySelector(".field-map-canvas");
    if (!canvas) return;
    var tip = el("div", { "class": "map-tip", role: "status", "aria-live": "polite" });
    canvas.appendChild(tip);
    var active = null;

    function show(pin) {
      var box = canvas.getBoundingClientRect();
      var dot = pin.querySelector(".pin-dot").getBoundingClientRect();
      tip.innerHTML = "";
      tip.appendChild(el("strong", null, pin.getAttribute("data-name")));
      tip.appendChild(document.createTextNode(pin.getAttribute("data-detail")));
      var x = dot.left + dot.width / 2 - box.left;
      var y = dot.top - box.top;
      var half = Math.min(128, box.width / 2);
      x = Math.max(half, Math.min(box.width - half, x));
      tip.style.left = x + "px";
      tip.style.top = y + "px";
      tip.classList.add("is-visible");
      if (active) active.classList.remove("is-active");
      active = pin;
      pin.classList.add("is-active");
    }
    function hide() {
      tip.classList.remove("is-visible");
      if (active) active.classList.remove("is-active");
      active = null;
    }

    qsa(".pin", canvas).forEach(function (pin) {
      pin.addEventListener("mouseenter", function () { show(pin); });
      pin.addEventListener("mouseleave", hide);
      pin.addEventListener("click", function (e) {
        e.stopPropagation();
        if (active === pin) hide(); else show(pin);
      });
    });
    document.addEventListener("click", hide);
  }

  /* ---------- Navigation and print ---------- */
  function setupNav() {
    var btn = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupPrint() {
    qsa("[data-print]").forEach(function (b) {
      b.addEventListener("click", function () { window.print(); });
    });
  }

  applyConfig();
  renderBriefings();
  setupEmail();
  setupInquiry();
  setupMap();
  setupNav();
  setupPrint();
})();
