/*
  SITE CONFIG
  This is the one file to edit for routine updates.

  To rename the media series across the whole site, change these three lines:
    seriesName, youtubeUrl, substackUrl

  To add a briefing, copy one block inside "briefings" and paste it at the TOP
  of the list (newest first). The first two briefings appear on the home page.
*/
window.SITE_CONFIG = {
  // Media series (rename here)
  seriesName: "Paul's Peace Park",
  youtubeUrl: "https://www.youtube.com/@PaulsPeacePark",
  substackUrl: "https://paulspeacepark.substack.com",

  // Profile links
  linkedinUrl: "https://www.linkedin.com/in/paulrlarson",

  // Link for "Reimagine Task Force" in the executive profile.
  // Leave empty ("") to show the phrase as plain text.
  reimagineUrl: "",

  // Email is stored in two parts so simple scrapers do not find a full address.
  emailUser: "larson.paulrichard",
  emailDomain: "gmail.com",

  // Optional: paste a Formspree endpoint (for example "https://formspree.io/f/abcdwxyz")
  // to send inquiries from the form directly. Leave empty to open the visitor's email app instead.
  formspreeEndpoint: "",

  // Briefings (newest first)
  briefings: [
    {
      title: "How a Gold Mine Raid Exposed Pakistan's Taliban Dilemma",
      date: "Nov 2026",
      summary:
        "Analyzes the November 11 Kohat river-mining ambush, cross-border illicit revenue allegations, and why Islamabad's demand for a written Taliban guarantee runs into verification, political will, and enforcement capacity limits.",
      youtubeId: "ZDBPRiOpzMs",
      substackUrl: "https://paulspeacepark.substack.com/p/the-gold-economy-behind-the-kohat"
    },
    {
      title: "The Hijacking of the French Protests",
      date: "Nov 2026",
      summary:
        "Uses timeline and bargaining-power forensics to examine how French national labor unions absorbed a high-school student blockade movement and shifted the negotiation Zone of Possible Agreement (ZOPA) from classrooms to wages and pensions.",
      youtubeId: "9QLxlBL96fQ",
      substackUrl: ""
    }
  ]
};
