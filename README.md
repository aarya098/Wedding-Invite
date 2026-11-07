# Vaishak & Anagha — Wedding Invitation Website

A static, responsive wedding invitation website.

## Pages
- `index.html` — cover page with full-height Radha–Krishna artwork on the right.
- `invitation.html` — invitation, countdown, event links and RSVP form.
- `thalikettu.html` — wedding ceremony details and directions QR.
- `reception.html` — reception details and directions QR.

## Run locally
1. Extract the ZIP.
2. Open the `worksite` folder in VS Code.
3. Open `index.html` in a browser, or use the VS Code Live Server extension.

No build step or npm installation is required.

## Artwork
- Original user image: `images/radha_watermark.jpg`.
- The cover uses `images/radha-watermark-transparent.png`, a background-keyed transparent version prepared for the right-side watermark. The source JPG is retained in the project.
- Adjust `.cover-watermark` opacity, `max-width`, and `right` in `style.css` if desired.

## RSVP setup
`script.js` contains a placeholder `RSVP_ENDPOINT`. The RSVP form will not submit to a spreadsheet until you deploy the included `Code.gs` as a Google Apps Script Web App and paste its deployed `/exec` URL into `script.js`.

## Event details currently included
- Wedding: Sunday, 6 December 2026, 11:20 AM–12:00 PM, Ishaar Convention Centre, Ambalappara, Ottappalam.
- Reception: Sunday, 6 December 2026, 6:00 PM–9:00 PM, Nalanda Convention Centre, Peradiyoor, Vilayoor (West), Pattambi.

Check names, venue details, QR codes and map links before publishing.


## Background music
- `music/thalikettu-invitation.mp3` plays on the Invitation and Thalikettu pages.
- `music/reception.mp3` plays on the Reception page.
- The first “Tap to Open” interaction unlocks the music session. Some mobile browsers may still require a tap on the destination page before sound can begin; the small circular music control indicates this and can mute/unmute playback.
- The same track resumes near its previous position when moving between Invitation and Thalikettu. Reception uses its own track.

## RSVP
The Apps Script Web App endpoint is configured in `script.js`. The browser uses a `no-cors` form submission, so the success message cannot independently confirm the Google Sheet write; verify test submissions in the `Responses` tab.
