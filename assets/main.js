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
  function displayUrl(url) { return trimSlash(url).replace(/^https?:\/\/(www\.)?/, ""); }

  function emailAddress() {
    if (!cfg.emailUser || !cfg.emailDomain) return "";
    return cfg.emailUser + "@" + cfg.emailDomain;
  }

  function siteOrigin() {
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && ogImg.content) {
      try { return new URL(ogImg.content).origin; } catch (e) {}
    }
    if (window.location && /^https?:/.test(window.location.protocol)) {
      return window.location.origin;
    }
    return "";
  }

  /* ---------- Canonical URLs, Open Graph URL, and Person Schema ---------- */
  function setupSeoAndSchema() {
    var noindex = document.querySelector('meta[name="robots"][content*="noindex"]');
    if (noindex) return;

    var origin = siteOrigin();
    if (!origin) return;

    var path = (window.location && window.location.pathname) ? window.location.pathname : "/";
    var fileMatch = path.match(/\/([^\/]+\.html)$/);
    var pageFile = fileMatch ? fileMatch[1] : "index.html";
    var canonicalHref = pageFile === "index.html" ? (origin + "/") : (origin + "/" + pageFile);

    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = el("link", { rel: "canonical", href: canonicalHref });
      document.head.appendChild(canon);
    } else {
      canon.setAttribute("href", canonicalHref);
    }

    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = el("meta", { property: "og:url", content: canonicalHref });
      document.head.appendChild(ogUrl);
    } else {
      ogUrl.setAttribute("content", canonicalHref);
    }

    if (!document.querySelector('script[type="application/ld+json"]')) {
      var ogImg = document.querySelector('meta[property="og:image"]');
      var sameAs = [];
      if (cfg.linkedinUrl) sameAs.push(cfg.linkedinUrl);
      if (cfg.substackUrl) sameAs.push(trimSlash(cfg.substackUrl));

      var person = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Paul Larson",
        "url": origin + "/",
        "image": ogImg ? ogImg.content : "",
        "jobTitle": "Senior Program Manager",
        "description": "Institutional strategy, geopolitical and operational risk prioritization, public-sector innovation, and AI-enabled decision support.",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "San Francisco",
          "addressRegion": "CA",
          "addressCountry": "US"
        },
        "worksFor": {
          "@type": "Organization",
          "name": "Amazon Web Services (AWS)"
        },
        "alumniOf": [
          { "@type": "CollegeOrUniversity", "name": "George Mason University" },
          { "@type": "CollegeOrUniversity", "name": "Drake University" }
        ],
        "knowsAbout": [
          "Geopolitical Risk",
          "Conflict Analysis",
          "Public-Sector Innovation",
          "Institutional Strategy",
          "Enterprise Risk Management",
          "Decision Support Systems",
          "Lean Six Sigma"
        ],
        "sameAs": sameAs
      };

      var ldData = pageFile === "about.html"
        ? { "@context": "https://schema.org", "@type": "ProfilePage", "url": canonicalHref, "mainEntity": person }
        : person;

      var ldScript = el("script", { type: "application/ld+json" });
      ldScript.textContent = JSON.stringify(ldData);
      document.head.appendChild(ldScript);
    }
  }

  function copyToClipboard(text, onDone) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        onDone(true);
      }).catch(function () {
        fallbackCopy(text, onDone);
      });
      return;
    }
    fallbackCopy(text, onDone);
  }

  function fallbackCopy(text, onDone) {
    try {
      var ta = el("textarea", { "class": "visually-hidden", "aria-hidden": "true" });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      onDone(Boolean(ok));
    } catch (err) {
      onDone(false);
    }
  }

  /* ---------- Series name, profile links, and print contact ---------- */
  function applyConfig() {
    qsa("[data-series-name]").forEach(function (n) { n.textContent = cfg.seriesName || ""; });
    qsa("[data-substack-link]").forEach(function (a) { a.href = trimSlash(cfg.substackUrl) || "#"; });
    qsa("[data-substack-subscribe]").forEach(function (a) { a.href = trimSlash(cfg.substackUrl) + "/subscribe"; });
    qsa("[data-linkedin-link]").forEach(function (a) { a.href = cfg.linkedinUrl || "#"; });
    qsa("[data-linkedin-display]").forEach(function (n) { n.textContent = displayUrl(cfg.linkedinUrl); });
    qsa("[data-substack-display]").forEach(function (n) { n.textContent = displayUrl(cfg.substackUrl); });
    qsa("[data-year]").forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

    var addr = emailAddress();
    var siteHost = displayUrl(siteOrigin());
    qsa("[data-print-contact]").forEach(function (n) {
      var parts = ["San Francisco, CA"];
      if (addr) parts.push(addr);
      if (cfg.linkedinUrl) parts.push(displayUrl(cfg.linkedinUrl));
      if (siteHost) parts.push(siteHost);
      n.textContent = parts.join("  |  ");
    });

    if (cfg.reimagineUrl) {
      qsa("[data-reimagine]").forEach(function (span) {
        var a = el("a", { href: cfg.reimagineUrl, target: "_blank", rel: "noopener", "class": "text-link" }, span.textContent);
        span.replaceWith(a);
      });
    }
  }

  /* ---------- Written Analytical Briefings ---------- */
  function briefingNode(b) {
    var art = el("article", { "class": "briefing-card" });
    var metaParts = [];
    if (b.category) metaParts.push(b.category);
    if (b.date) metaParts.push(b.date);
    if (metaParts.length) {
      art.appendChild(el("p", { "class": "briefing-meta" }, metaParts.join("  ·  ")));
    }

    var targetUrl = b.substackUrl || cfg.substackUrl || "";
    var h3 = el("h3", null);
    if (targetUrl) {
      h3.appendChild(el("a", {
        href: targetUrl,
        target: "_blank",
        rel: "noopener",
        "class": "briefing-title-link"
      }, b.title));
    } else {
      h3.textContent = b.title;
    }
    art.appendChild(h3);

    if (b.summary) {
      art.appendChild(el("p", { "class": "briefing-summary" }, b.summary));
    }

    if (targetUrl) {
      var links = el("p", { "class": "briefing-links" });
      var isDirectPost = b.substackUrl && b.substackUrl.indexOf("/p/") !== -1;
      links.appendChild(el("a", {
        "class": "text-link",
        href: targetUrl,
        target: "_blank",
        rel: "noopener"
      }, isDirectPost ? "Read the Briefing on Substack" : "Read on Substack"));
      art.appendChild(links);
    }
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
  function revealEmailElement(out) {
    var addr = emailAddress();
    if (!out || !addr) return addr;
    out.innerHTML = "";
    out.appendChild(el("a", { href: "mailto:" + addr, "class": "text-link" }, addr));
    out.hidden = false;
    qsa("[data-email-reveal]").forEach(function (b) { b.hidden = true; });
    return addr;
  }

  function setupEmail() {
    var out = document.getElementById("email-out");
    var copyStatus = document.getElementById("email-copy-status");

    qsa("[data-email-reveal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        revealEmailElement(out);
      });
    });

    qsa("[data-email-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var addr = revealEmailElement(out);
        if (!addr) return;
        copyToClipboard(addr, function (ok) {
          if (copyStatus) {
            copyStatus.textContent = ok
              ? "Copied " + addr + " to clipboard."
              : "Email shown above. Select and copy it directly.";
            copyStatus.className = "form-status " + (ok ? "is-ok" : "is-error");
          }
          var orig = btn.textContent;
          if (ok) {
            btn.textContent = "Copied";
            setTimeout(function () { btn.textContent = orig; }, 2200);
          }
        });
      });
    });
  }

  /* ---------- Inquiry form ---------- */
  var TOPICS = {
    leadership: "Advisory, Strategy & Institutional Roles",
    speaking: "Speaking & Workshops",
    conflict: "Geopolitical & Conflict Analysis",
    methodology: "Methodology & AI Workflow Exchange"
  };

  function setupInquiry() {
    var form = document.getElementById("inquiry-form");
    if (!form) return;
    var submitBtn = form.querySelector("[type=submit]");
    var status = document.getElementById("form-status");
    var useFormspree = Boolean(cfg.formspreeEndpoint);
    if (useFormspree) submitBtn.textContent = "Send Inquiry";

    var params = new URLSearchParams(window.location.search);
    var preset = params.get("topic");
    if (preset && TOPICS[preset]) {
      var radio = form.querySelector('input[name="topic"][value="' + preset + '"]');
      if (radio) radio.checked = true;
    }

    function setStatus(msg, kind) {
      status.innerHTML = "";
      status.appendChild(document.createTextNode(msg));
      status.className = "form-status" + (kind ? " is-" + kind : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      if (data.get("_gotcha")) return;
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
          setStatus("The inquiry did not send. Check your connection and select Send Inquiry again, or use Copy Email Address to write directly.", "error");
        }).then(function () { submitBtn.disabled = false; });
        return;
      }

      var addr = emailAddress();
      var body = message + "\n\n" +
        "Name: " + name + "\n" +
        (org ? "Organization: " + org + "\n" : "") +
        "Reply to: " + reply + "\n" +
        "Topic: " + topic;
      window.location.href = "mailto:" + addr +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      status.innerHTML = "";
      status.className = "form-status is-ok";
      status.appendChild(document.createTextNode("Opening your email app. Using webmail instead? "));
      var copyFallback = el("button", { type: "button", "class": "inline-copy-btn" }, "Copy formatted message & email address");
      copyFallback.addEventListener("click", function () {
        var fullClip = "To: " + addr + "\nSubject: " + subject + "\n\n" + body;
        copyToClipboard(fullClip, function (ok) {
          copyFallback.textContent = ok
            ? "Copied message and " + addr + " to clipboard"
            : "Use Copy Email Address on the right";
        });
      });
      status.appendChild(copyFallback);
    });
  }

  /* ---------- Accessible field map tooltips ---------- */
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
      if (active && active !== pin) active.classList.remove("is-active");
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
      pin.addEventListener("focus", function () { show(pin); });
      pin.addEventListener("blur", hide);
      pin.addEventListener("click", function (e) {
        e.stopPropagation();
        if (active === pin) hide(); else show(pin);
      });
      pin.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          show(pin);
        } else if (e.key === "Escape") {
          hide();
        }
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

  setupSeoAndSchema();
  applyConfig();
  renderBriefings();
  setupEmail();
  setupInquiry();
  setupMap();
  setupNav();
  setupPrint();
})();
