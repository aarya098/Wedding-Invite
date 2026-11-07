/**
 * Vaishak & Anagha wedding RSVP collector.
 * 1. Run setup() once from the Apps Script editor.
 * 2. Deploy as a Web app: Execute as Me; Who has access: Anyone.
 * 3. Copy the Web app URL into script.js as RSVP_ENDPOINT.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('RSVP_SHEET_ID');
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('Vaishak & Anagha Wedding RSVPs');
    id = ss.getId();
    props.setProperty('RSVP_SHEET_ID', id);
  }
  let sheet = ss.getSheetByName('Responses');
  if (!sheet) sheet = ss.insertSheet('Responses');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Guest name', 'Guest count', 'Response']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  Logger.log('Your RSVP spreadsheet: ' + ss.getUrl());
  return ss.getUrl();
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const name = String(p.name || '').trim();
    const count = Number(p.guestCount || 1);
    const response = String(p.response || '').trim();
    if (!name) throw new Error('Guest name is required.');
    if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error('Guest count must be between 1 and 10.');
    if (response !== 'accept' && response !== 'decline') throw new Error('Invalid RSVP response.');

    const id = PropertiesService.getScriptProperties().getProperty('RSVP_SHEET_ID');
    if (!id) throw new Error('Run setup() once before accepting RSVPs.');
    const sheet = SpreadsheetApp.openById(id).getSheetByName('Responses');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow([new Date(), name, count, response === 'accept' ? 'Joyfully accept' : 'Regretfully decline']);
    } finally {
      lock.releaseLock();
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
