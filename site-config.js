/*
  SITE CONFIG
  This is the one file to edit for routine updates.

  To rename the Substack briefing series across the whole site, change:
    seriesName, substackUrl

  To connect Formspree so the inquiry form submits directly on the page:
    1. Create a free form at https://formspree.io (recipient: your email)
    2. Paste the endpoint URL (e.g. "https://formspree.io/f/xyzabcde") into formspreeEndpoint below.

  To add a briefing, copy one block inside "briefings" and paste it at the TOP
  of the list (newest first). The first two briefings appear on the home page.
*/
window.SITE_CONFIG = {
  // Written briefing series (rename here when ready)
  seriesName: "Paul's Peace Park",
  substackUrl: "https://paulspeacepark.substack.com",

  // Profile links
  linkedinUrl: "https://www.linkedin.com/in/paulrlarson",

  // Link for "Reimagine Task Force" in the executive profile and focus areas.
  // Leave empty ("") to show the phrase as plain text.
  reimagineUrl: "https://www.mckinsey.com/industries/public-sector/our-insights/reimagining-us-federal-work-for-the-postpandemic-world",

  // Email is stored in two parts so simple scrapers do not find a full address.
  emailUser: "larson.paulrichard",
  emailDomain: "gmail.com",

  // Optional: paste a Formspree endpoint (for example "https://formspree.io/f/abcdwxyz")
  // to send inquiries from the form directly. Leave empty to use the email app + one-click copy fallback.
  formspreeEndpoint: "",

  // Written analytical briefings (newest first)
  briefings: [
    {
      category: "South Asia · Security & Illicit Economies",
      title: "The Gold Economy Behind Pakistan's Taliban Dilemma",
      date: "Nov 2026",
      summary:
        "Why Pakistan's demand for a written Taliban guarantee after the Kohat gold-mine police ambush runs into structural limits of verification, local resource capture, and cross-border enforcement.",
      substackUrl: "https://paulspeacepark.substack.com/p/the-gold-economy-behind-the-kohat"
    },
    {
      category: "Europe · Civil Unrest & Bargaining",
      title: "The Protest Hand-Off: How French Unions Absorbed a Student Movement",
      date: "Nov 2026",
      summary:
        "How organized labor stepped into a fading French high school blockade wave and shifted the bargaining zone from classroom conditions and university admissions to wages and pensions.",
      substackUrl: "https://paulspeacepark.substack.com"
    }
  ]
};
