// ============================================================
//  Cost Sheet Generator — Web App version
//  Deploy: Extensions → Apps Script → Deploy → New deployment
//  Execute as: Me · Access: Anyone in organisation
// ============================================================

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Cost Sheet Generator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
