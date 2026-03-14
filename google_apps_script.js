/**
 * ELITE_SHEET_ENGINE_V4
 * Google Sheets Live Database Engine
 * Optimized for High Performance & Reliable Initialization
 */

const MASTER_SHEET = "Sheet1";
const META_SHEET = "_META";

const REQUIRED_SHEETS = {
  "Sheet1": ["MASTER_JSON"],
  "_META": ["KEY","VALUE"],
  "TEAM_LOGS": ["CATEGORY","NAME","ROLE","IMAGE_URL","LINKEDIN","DESCRIPTION"],
  "EVENT_LOGS": ["SLUG","TITLE","DATE","CATEGORY","PRIZE_POOL","IMAGES_COUNT","TRACKS","EXPERTS","FAQS","DESCRIPTION"],
  "GALLERY_LOGS": ["IMAGE_URL","CAPTION","EVENT_LINK"],
  "ABOUT_LOGS": ["TYPE","DATA1","DATA2","DATA3"],
  "REGISTRATION_LOGS": ["NAME","EMAIL","PHONE","YEAR","BRANCH","COLLEGE","TEAM","EVENT","TIMESTAMP","MESSAGE"],
  "MESSAGE_LOGS": ["USER_ID","EMAIL","TIMESTAMP","CONTENT"]
};

/**
 * INITIALIZATION LAYER
 * Ensures all tables exist with correct headers
 */
function initializeSheets(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(REQUIRED_SHEETS).forEach(name=>{
    let sheet = ss.getSheetByName(name);
    if(!sheet){
      sheet = ss.insertSheet(name);
    }
    if(sheet.getLastRow()==0){
      const header = REQUIRED_SHEETS[name];
      sheet.getRange(1,1,1,header.length).setValues([header]);
      formatHeader(sheet);
    }
  });

  initializeMeta();
}

function initializeMeta(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(META_SHEET);
  const data = sheet.getRange(2,1,2,2).getValues();

  // If version doesn't exist, set defaults
  if(!data[0][0] || data[0][1] === ""){
    sheet.getRange(2,1,2,2).setValues([
      ["VERSION", 1],
      ["LAST_UPDATE", Date.now()]
    ]);
  }
}

/**
 * POST API - UPLINK FROM WEBSITE
 */
function doPost(e){
  initializeSheets();
  try{
    if (!e || !e.postData || !e.postData.contents) throw new Error("BUFFER_EMPTY");
    
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if(payload.data) {
      saveMasterJSON(ss, payload.data);
      processPayload(ss, payload.data);
      bumpVersion();
    }

    return jsonResponse({ status: "SUCCESS" });
  }catch(err){
    return jsonResponse({ status: "ERROR", message: err.toString() });
  }
}

/**
 * GET API - LIVE SYNC DOWNLINK
 */
function doGet(e){
  initializeSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meta = ss.getSheetByName(META_SHEET);
  const currentVersion = meta.getRange("B2").getValue();

  // Version Check (Optimization)
  const clientVersion = e.parameter.version;
  if(clientVersion && Number(clientVersion) === Number(currentVersion)){
    return jsonResponse({ status: "NO_UPDATE", version: currentVersion });
  }

  const master = ss.getSheetByName(MASTER_SHEET);
  const rawData = master.getRange("A1").getValue() || "{}";

  return jsonResponse({
    version: currentVersion,
    data: JSON.parse(rawData)
  });
}

/**
 * CORE LOGIC
 */
function bumpVersion(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meta = ss.getSheetByName(META_SHEET);
  let version = Number(meta.getRange("B2").getValue()) || 0;
  version++;
  meta.getRange("B2").setValue(version);
  meta.getRange("B3").setValue(Date.now());
}

function saveMasterJSON(ss, data){
  const sheet = ss.getSheetByName(MASTER_SHEET);
  sheet.getRange("A1").setValue(JSON.stringify(data));
}

function processPayload(ss, data){
  if(!data) return;
  if(data.team) writeTeam(ss, data.team);
  if(data.events) writeEvents(ss, data.events);
  if(data.gallery) writeGallery(ss, data.gallery);
  if(data.about) writeAbout(ss, data.about);
  if(data.registrations) writeRegistrations(ss, data.registrations);
  if(data.messages) writeMessages(ss, data.messages);
}

/**
 * MODULE WRITERS
 */
function writeTeam(ss, team){
  const rows = [REQUIRED_SHEETS["TEAM_LOGS"]];
  Object.keys(team).forEach(cat=>{
    if(Array.isArray(team[cat])) {
      team[cat].forEach(m=>{
        rows.push([cat, m.name||"", m.role||"", m.image||"", m.linkedin||"", m.desc||""]);
      });
    }
  });
  writeToSheet(ss, "TEAM_LOGS", rows);
}

function writeEvents(ss, events){
  const rows = [REQUIRED_SHEETS["EVENT_LOGS"]];
  if(Array.isArray(events)) {
    events.forEach(e=>{
      rows.push([
        e.slug||"", 
        e.title||"", 
        e.dateText||"", 
        e.category||"", 
        e.prizePool||0, 
        (e.images||[]).length,
        (e.tracks||[]).join(", "),
        (e.speakers||[]).map(s => `${s.name} (${s.type||'SPEAKER'} - ${s.role}) [${s.link||'NO_LINK'}]`).join(" | "),
        (e.faqs||[]).map(f => `Q: ${f.question} A: ${f.answer}`).join(" | "),
        e.desc||""
      ]);
    });
  }
  writeToSheet(ss, "EVENT_LOGS", rows);
}

function writeGallery(ss, gallery){
  const rows = [REQUIRED_SHEETS["GALLERY_LOGS"]];
  if(Array.isArray(gallery)) {
    gallery.forEach(g=>{
      rows.push([g.src||"", g.caption||"", g.eventSlug||""]);
    });
  }
  writeToSheet(ss, "GALLERY_LOGS", rows);
}

function writeAbout(ss, about){
  const rows = [REQUIRED_SHEETS["ABOUT_LOGS"]];
  rows.push(["HOME_HEADING_1", about.homeHeading1||"", "", ""]);
  rows.push(["HOME_HEADING_2", about.homeHeading2||"", "", ""]);
  rows.push(["HOME_HEADING_3", about.homeHeading3||"", "", ""]);
  rows.push(["HOME_TAGLINE", about.homeDesc||"", "", ""]);
  rows.push(["MISSION_STATEMENT", about.mission||"", "", ""]);
  if(Array.isArray(about.stats)) about.stats.forEach(s=>rows.push(["STATISTIC", s.label||"", s.value||"", ""]));
  if(Array.isArray(about.legacyLogs)) about.legacyLogs.forEach(l=>rows.push(["LEGACY_LOG", l.year||"", l.title||"", l.desc||""]));
  writeToSheet(ss, "ABOUT_LOGS", rows);
}

function writeRegistrations(ss, data){
  const rows = [REQUIRED_SHEETS["REGISTRATION_LOGS"]];
  if(Array.isArray(data)) {
    data.forEach(r=>rows.push([r.name||"", r.email||"", r.phone||"", r.year||"", r.branch||"", r.college||"", r.team||"", r.event||"", r.timestamp||"", r.message||""]));
  }
  writeToSheet(ss, "REGISTRATION_LOGS", rows);
}

function writeMessages(ss, data){
  const rows = [REQUIRED_SHEETS["MESSAGE_LOGS"]];
  if(Array.isArray(data)) {
    data.forEach(m=>rows.push([m.user||"", m.email||"", m.timestamp||"", m.content||""]));
  }
  writeToSheet(ss, "MESSAGE_LOGS", rows);
}

/**
 * UTILS
 */
function writeToSheet(ss, name, rows){
  let sheet = ss.getSheetByName(name);
  if(!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  if(rows.length > 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    formatHeader(sheet);
  }
}

function formatHeader(sheet){
  const lastCol = sheet.getLastColumn();
  if(lastCol > 0) {
    const header = sheet.getRange(1, 1, 1, lastCol);
    header.setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  }
}

function jsonResponse(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function setupDatabase(){
  initializeSheets();
}
