# Paul Larson, personal executive site

A static website: plain HTML, CSS, and JavaScript with no build step. Any free static host can serve this folder as it is.

## What is in this folder

| File | Purpose |
| --- | --- |
| `index.html` | Home page |
| `methodology.html` | Practice areas and the three methodologies |
| `briefings.html` | YouTube explainers and Substack dossiers, listed from `site-config.js` |
| `about.html` | Executive profile and CV, with a print or save-as-PDF button |
| `contact.html` | Topic-routed inquiry form |
| `404.html` | Page shown for a wrong address |
| `site-config.js` | **The one file to edit for routine updates** |
| `assets/` | Styles, scripts, the field map graphic, and the favicon |
| `tools/check_site.py` | Pre-publish checks |
| `.nojekyll` | Tells GitHub Pages to serve the files exactly as they are |

## Preview on your Mac

Double-click `index.html` to open it in your browser. For the most accurate preview (the inquiry form and video players behave exactly as they will online), run this in Terminal from this folder and open http://localhost:8080:

```
python3 -m http.server 8080
```

## Rename the media series

Open `site-config.js` and change these three lines:

```
seriesName: "Paul's Peace Park",
youtubeUrl: "https://www.youtube.com/@PaulsPeacePark",
substackUrl: "https://paulspeacepark.substack.com",
```

Every page fills in the series name and links from those lines. Also update the `substackUrl` inside each briefing if the Substack address changes.

## Add a new briefing

In `site-config.js`, copy one briefing block and paste it at the top of the `briefings` list, so the newest briefing comes first:

```
{
  title: "Title of the new briefing",
  date: "Dec 2026",
  summary: "One or two sentences on what the briefing analyzes.",
  youtubeId: "ABCDEFGHIJK",
  substackUrl: "https://paulspeacepark.substack.com/p/the-post-slug"
},
```

- `youtubeId` is the 11 characters after `watch?v=` in the YouTube address.
- Leave `substackUrl` as `""` if the briefing has no companion post.
- The first two briefings in the list appear on the home page.

## Optional settings in site-config.js

- **Reimagine Task Force link.** Paste the address into `reimagineUrl` to turn the phrase "Reimagine Task Force" on the profile page into a link. Empty means plain text.
- **Send inquiries without the visitor's email app.** By default, the inquiry form opens the visitor's email app with the topic, name, and message filled in. To send inquiries straight to your inbox instead, create a form at formspree.io, then paste its endpoint (for example `https://formspree.io/f/abcdwxyz`) into `formspreeEndpoint`. The button text changes to "Send inquiry" automatically.

## Privacy

- No phone number appears anywhere on the site.
- The email address is stored in two parts in `site-config.js` and is only assembled when a visitor selects "Show email address" or submits the inquiry form, which keeps it away from simple address-harvesting bots.
- Videos load from youtube-nocookie.com only after a visitor selects play.

## Run the checks before publishing

From this folder:

```
python3 tools/check_site.py
python3 tools/check_site.py --online
```

The first command checks the writing rules (no long dashes, banned words, internal pipeline details, phone numbers, or a plain-text email address), every internal link and anchor, and the Reimagine link if one is set. The `--online` option also tests every external link. LinkedIn blocks automated checks, so open that link by hand.

## Publish for free

A free GitHub account is enough. GitHub Pages hosting is included for public repositories at no cost.

**GitHub Pages (recommended)**

1. Create a free account at github.com.
2. Create a new public repository named exactly `<your-username>.github.io`, with no README.
3. In Terminal, from this folder:
   ```
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```
4. In the repository, open Settings, then Pages, and set the source to "Deploy from a branch", branch `main`, folder `/ (root)`. The site goes live at `https://<your-username>.github.io` within a few minutes.

To update the site later: edit files, then run `git add -A`, `git commit -m "Describe the change"`, and `git push`.

**Other free hosts that serve this folder as it is**

- Cloudflare Pages: create a Pages project with Direct Upload and upload this folder. Choose Direct Upload or Git at the start, because Cloudflare does not let a Git-connected project switch to Direct Upload later.
- Netlify Drop: drag this folder onto app.netlify.com/drop.

A custom domain (for example paullarson.com) can be added later on any of these hosts. The domain itself costs a yearly registration fee; the hosting stays free.
