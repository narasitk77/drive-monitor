function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Cost Sheet Generator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
