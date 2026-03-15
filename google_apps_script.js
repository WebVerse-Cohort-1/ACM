/**
 * ELITE_SHEET_ENGINE_V4_2_GOLD
 * Google Sheets Live Database Engine :: RESILIENT EDITION
 * -------------------------------------------------------
 * Robust, Self-Healing, and Error-Tracking
 */

const MASTER_SHEET = "Sheet1";
const META_SHEET = "_META";
const LOG_SHEET = "DEBUG_LOG";

const REQUIRED_SHEETS = {
  "Sheet1": ["MASTER_JSON"],
  "_META": ["KEY","VALUE"],
  "DEBUG_LOG": ["TIMESTAMP", "STATUS", "MESSAGE", "PAYLOAD_EXTRACT"],
  "TEAM_LOGS": ["CATEGORY","NAME","ROLE","IMAGE_URL","LINKEDIN","DESCRIPTION"],
  "EVENT_LOGS": ["SLUG","TITLE","DATE","CATEGORY","PRIZE_POOL","IMAGES_COUNT","TRACKS","EXPERTS","FAQS","DESCRIPTION"],
  "GALLERY_LOGS": ["IMAGE_URL","CAPTION","EVENT_LINK"],
  "ABOUT_LOGS": ["TYPE","DATA1","DATA2","DATA3"],
  "REGISTRATION_LOGS": ["NAME","EMAIL","PHONE","YEAR","BRANCH","COLLEGE","TEAM","EVENT","TIMESTAMP","MESSAGE"],
  "MESSAGE_LOGS": ["USER_ID","EMAIL","TIMESTAMP","CONTENT"]
};

function setupDatabase() { initializeSheets(); }

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error("CRITICAL_ERROR :: SCRIPT_NOT_BOUND_TO_SHEET");

  Object.keys(REQUIRED_SHEETS).forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    
    const headers = REQUIRED_SHEETS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeader(sheet);
    }
  });
  initializeMeta();
}

function initializeMeta() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(META_SHEET);

  if(sheet.getLastRow() < 2){
    sheet.getRange(2,1,2,2).setValues([
      ["VERSION",1],
      ["LAST_UPDATE",Date.now()]
    ]);
    return;
  }

  const key = sheet.getRange("A2").getValue();
  if(key !== "VERSION"){
    sheet.getRange(2,1,2,2).setValues([
      ["VERSION",1],
      ["LAST_UPDATE",Date.now()]
    ]);
  }
}

/**
 * onEdit(e) trigger - Automatically rebuilds JSON and bumps version
 * whenever someone edits the spreadsheet manually.
 */
function onEdit(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    rebuildMasterIndex(ss);
    logEvent("SUCCESS", "Manual Edit Rebuilt Master Index", "Version Incremented");
    lock.releaseLock();
  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    logEvent("ERROR", "onEdit Rebuild Failed", err.toString());
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    initializeSheets();
    if (!e || !e.postData || !e.postData.contents) throw new Error("BUFFER_EMPTY");
    
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 'save' action — main sync from frontend admin panel
    if (payload.action === 'save' && payload.data) {
      saveMasterJSON(ss, payload.data);
      processPayload(ss, payload.data);
      bumpVersion();
      lock.releaseLock();
      logEvent("SUCCESS", "Save Action Complete", "Full data synced");
      return jsonResponse({ status: "SUCCESS", message: "SAVE_COMPLETE" });
    }

    // 'rebuild' action — reconstruct master JSON from individual sheets
    if (payload.action === 'rebuild') {
      rebuildMasterIndex(ss);
      lock.releaseLock();
      return jsonResponse({ status: "SUCCESS", message: "REBUILD_COMPLETE" });
    }

    // 'register' action — log a new event registration
    if (payload.action === 'register' && payload.data) {
      appendRegistration(ss, payload.data);
      bumpVersion();
      lock.releaseLock();
      return jsonResponse({ status: "SUCCESS", message: "REGISTRATION_RECORDED" });
    }

    // 'message' action — log a new contact message
    if (payload.action === 'message' && payload.data) {
      appendMessage(ss, payload.data);
      bumpVersion();
      lock.releaseLock();
      return jsonResponse({ status: "SUCCESS", message: "MESSAGE_RECORDED" });
    }

    // Generic fallback
    if (payload.data) {
      saveMasterJSON(ss, payload.data);
      processPayload(ss, payload.data);
      bumpVersion();
    }
    
    lock.releaseLock();
    return jsonResponse({ status: "SUCCESS" });
  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    logEvent("CRASH", err.toString(), "In doPost");
    return jsonResponse({ status: "ERROR", message: err.toString() });
  }
}

function appendRegistration(ss, r) {
  const sheet = ss.getSheetByName("REGISTRATION_LOGS");
  sheet.appendRow([r.name||"", r.email||"", r.phone||"", r.year||"", r.branch||"", r.college||"", r.team||"", r.event||"", r.timestamp||"", r.message||""]);
  
  // Also update Master JSON to include this new registration for subsequent GETs
  updateMasterJSON(ss, function(data) {
    if(!data.registrations) data.registrations = [];
    data.registrations.unshift(r); // Add to start
    return data;
  });
}

function appendMessage(ss, m) {
  const sheet = ss.getSheetByName("MESSAGE_LOGS");
  sheet.appendRow([m.user||"", m.email||"", m.timestamp||"", m.content||""]);
  
  updateMasterJSON(ss, function(data) {
    if(!data.messages) data.messages = [];
    data.messages.unshift(m);
    return data;
  });
}

function updateMasterJSON(ss, callback) {
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const range = sheet.getRange("A1");
  let data = {};
  try {
    data = JSON.parse(range.getValue() || "{}");
  } catch(e) {}
  const updated = callback(data);
  range.setValue(JSON.stringify(updated));
}

function doGet(e) {
  try {
    initializeSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "get";

    if (action === "logs") {
      const sheet = ss.getSheetByName(LOG_SHEET);
      const values = sheet.getDataRange().getValues();
      const logs = [];
      for (let i = 1; i < values.length; i++) {
        logs.push({
          timestamp: values[i][0],
          status: values[i][1],
          message: values[i][2],
          payload: values[i][3]
        });
      }
      return jsonResponse({ logs: logs.reverse().slice(0, 100) }); // Top 100 logs
    }

    const meta = ss.getSheetByName(META_SHEET);
    const currentVersion = meta.getRange("B2").getValue();
    const clientVersion = (e && e.parameter && e.parameter.version) ? e.parameter.version : null;

    if (clientVersion && Number(clientVersion) === Number(currentVersion)) {
      return jsonResponse({ status: "NO_UPDATE", version: currentVersion });
    }

    const master = ss.getSheetByName(MASTER_SHEET);
    let rawData = master.getRange("A1").getValue();
    if (!rawData || rawData === "") rawData = "{}";

    let parsedData = {};
    try {
      parsedData = JSON.parse(rawData);
    } catch(err) {
      parsedData = {};
    }

    return jsonResponse({ version: currentVersion, data: parsedData });
  } catch (err) {
    logEvent("CRASH", err.toString(), "In doGet");
    return jsonResponse({ status: "ERROR", message: err.toString() });
  }
}

function bumpVersion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meta = ss.getSheetByName(META_SHEET);
  let version = parseInt(meta.getRange("B2").getValue()) || 0;
  version++;
  meta.getRange("B2").setValue(version);
  meta.getRange("B3").setValue(Date.now());
}

function saveMasterJSON(ss, data) {
  const sheet = ss.getSheetByName(MASTER_SHEET);
  sheet.getRange("A1").setValue(JSON.stringify(data));
}

function processPayload(ss, data) {
  if (!data) return;
  if (data.team) writeTeam(ss, data.team);
  if (data.events) writeEvents(ss, data.events);
  if (data.gallery) writeGallery(ss, data.gallery);
  if (data.about) writeAbout(ss, data.about);
  if (data.registrations) writeRegistrations(ss, data.registrations);
  if (data.messages) writeMessages(ss, data.messages);
}

function writeTeam(ss, team) {
  const rows = [REQUIRED_SHEETS["TEAM_LOGS"]];
  Object.keys(team).forEach(function(cat) {
    if (Array.isArray(team[cat])) {
      team[cat].forEach(function(m) {
        rows.push([cat, m.name||"", m.role||"", m.image||"", m.linkedin||"", m.desc||""]);
      });
    }
  });
  writeToSheet(ss, "TEAM_LOGS", rows);
}

function writeEvents(ss, events) {
  const rows = [REQUIRED_SHEETS["EVENT_LOGS"]];
  if (Array.isArray(events)) {
    events.forEach(function(e) {
      rows.push([
        e.slug||"", e.title||"", e.dateText||"", e.category||"", e.prizePool||0, e.maxTeamSize||1, (e.images||[]).length,
        (e.tracks||[]).join(", "),
        (e.speakers||[]).map(function(s) { return s.name + " (" + (s.type || 'SPEAKER') + " - " + s.role + ") [" + (s.link || 'NO_LINK') + "]"; }).join(" | "),
        (e.faqs||[]).map(function(f) { return "Q: " + f.question + " A: " + f.answer; }).join(" | "),
        e.desc||""
      ]);
    });
  }
  writeToSheet(ss, "EVENT_LOGS", rows);
}

function writeGallery(ss, gallery) {
  const rows = [REQUIRED_SHEETS["GALLERY_LOGS"]];
  if (Array.isArray(gallery)) {
    gallery.forEach(function(g) { rows.push([g.src||"", g.caption||"", g.eventSlug||""]); });
  }
  writeToSheet(ss, "GALLERY_LOGS", rows);
}

function writeAbout(ss, about) {
  const rows = [REQUIRED_SHEETS["ABOUT_LOGS"]];
  rows.push(["HOME_HEADING_1", about.homeHeading1||"", "", ""]);
  rows.push(["HOME_HEADING_2", about.homeHeading2||"", "", ""]);
  rows.push(["HOME_HEADING_3", about.homeHeading3||"", "", ""]);
  rows.push(["HOME_TAGLINE", about.homeDesc||"", "", ""]);
  rows.push(["MISSION_STATEMENT", about.mission||"", "", ""]);
  if(Array.isArray(about.stats)) about.stats.forEach(function(s){ rows.push(["STATISTIC", s.label||"", s.value||"", ""]); });
  if(Array.isArray(about.legacyLogs)) about.legacyLogs.forEach(function(l){ rows.push(["LEGACY_LOG", l.year||"", l.title||"", l.desc||""]); });
  writeToSheet(ss, "ABOUT_LOGS", rows);
}

function writeRegistrations(ss, data) {
  const rows = [REQUIRED_SHEETS["REGISTRATION_LOGS"]];
  if (Array.isArray(data)) {
    data.forEach(function(r){ rows.push([r.name||"", r.email||"", r.phone||"", r.year||"", r.branch||"", r.college||"", r.team||"", r.event||"", r.timestamp||"", r.message||""]); });
  }
  writeToSheet(ss, "REGISTRATION_LOGS", rows);
}

function writeMessages(ss, data) {
  const rows = [REQUIRED_SHEETS["MESSAGE_LOGS"]];
  if (Array.isArray(data)) {
    data.forEach(function(m){ rows.push([m.user||"", m.email||"", m.timestamp||"", m.content||""]); });
  }
  writeToSheet(ss, "MESSAGE_LOGS", rows);
}

function rebuildMasterIndex(ss) {
  const data = {
    events: readEvents(ss),
    team: readTeam(ss),
    gallery: readGallery(ss),
    about: readAbout(ss),
    registrations: readRegistrations(ss),
    messages: readMessages(ss)
  };
  saveMasterJSON(ss, data);
  bumpVersion();
}

function readEvents(ss) {
  const sheet = ss.getSheetByName("EVENT_LOGS");
  const values = sheet.getDataRange().getValues();
  const events = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    events.push({
      slug: row[0], title: row[1], dateText: row[2], category: row[3], 
      prizePool: row[4], maxTeamSize: row[5],
      images: [], // Images are separate in detailed logic usually, but here we keep count
      tracks: row[7] ? row[7].split(", ").filter(x=>x) : [],
      speakers: [], // Complex to parse back from string perfectly
      faqs: [],
      desc: row[10]
    });
  }
  return events;
}

function readTeam(ss) {
  const sheet = ss.getSheetByName("TEAM_LOGS");
  const values = sheet.getDataRange().getValues();
  const team = {};
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const cat = row[0];
    if (!team[cat]) team[cat] = [];
    team[cat].push({ name: row[1], role: row[2], image: row[3], linkedin: row[4], desc: row[5] });
  }
  return team;
}

function readGallery(ss) {
  const sheet = ss.getSheetByName("GALLERY_LOGS");
  const values = sheet.getDataRange().getValues();
  const gallery = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    gallery.push({ src: row[0], caption: row[1], eventSlug: row[2] });
  }
  return gallery;
}

function readAbout(ss) {
  const sheet = ss.getSheetByName("ABOUT_LOGS");
  const values = sheet.getDataRange().getValues();
  const about = { stats: [], legacyLogs: [] };
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const type = row[0];
    if (type === "HOME_HEADING_1") about.homeHeading1 = row[1];
    else if (type === "HOME_HEADING_2") about.homeHeading2 = row[1];
    else if (type === "HOME_HEADING_3") about.homeHeading3 = row[1];
    else if (type === "HOME_TAGLINE") about.homeDesc = row[1];
    else if (type === "MISSION_STATEMENT") about.mission = row[1];
    else if (type === "STATISTIC") about.stats.push({ label: row[1], value: row[2] });
    else if (type === "LEGACY_LOG") about.legacyLogs.push({ year: row[1], title: row[2], desc: row[3] });
  }
  return about;
}

function readRegistrations(ss) {
  const sheet = ss.getSheetByName("REGISTRATION_LOGS");
  const values = sheet.getDataRange().getValues();
  const registrations = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    registrations.push({ name: row[0], email: row[1], phone: row[2], year: row[3], branch: row[4], college: row[5], team: row[6], event: row[7], timestamp: row[8], message: row[9] });
  }
  return registrations;
}

function readMessages(ss) {
  const sheet = ss.getSheetByName("MESSAGE_LOGS");
  const values = sheet.getDataRange().getValues();
  const messages = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    messages.push({ user: row[0], email: row[1], timestamp: row[2], content: row[3] });
  }
  return messages;
}

function writeToSheet(ss, name, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    formatHeader(sheet);
  }
}

function formatHeader(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    const header = sheet.getRange(1, 1, 1, lastCol);
    header.setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  }
}

function logEvent(status, message, payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(LOG_SHEET) || ss.insertSheet(LOG_SHEET);
    sheet.appendRow([new Date(), status, message, payload]);
  } catch(e) {}
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
