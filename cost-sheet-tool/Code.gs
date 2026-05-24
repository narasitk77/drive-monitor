// ============================================================
//  Cost Sheet Generator — Code.gs
//  Entry points, sidebar, and sheet generation logic
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📋 Cost Sheet')
    .addItem('สร้าง Cost Sheet ใหม่', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Cost Sheet Generator')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Called from Sidebar to populate dropdowns
function getDropdownData() {
  return {
    rateData: RATE_DATA,
    aeList: AE_LIST,
    outlets: OUTLETS,
    productTypes: PRODUCT_TYPES,
  };
}

// ============================================================
//  Main: create a new sheet tab and fill it
// ============================================================
function generateCostSheet(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rawName = (formData.title || 'Cost Sheet').substring(0, 45);
    const sheetName = rawName + ' [CS]';

    // Replace existing sheet if same name
    const existing = ss.getSheetByName(sheetName);
    if (existing) ss.deleteSheet(existing);

    const sheet = ss.insertSheet(sheetName, 0); // insert at position 0
    buildCostSheet(sheet, formData);

    return {
      success: true,
      sheetName: sheetName,
      url: ss.getUrl() + '#gid=' + sheet.getSheetId(),
    };
  } catch (e) {
    Logger.log(e);
    return { success: false, error: e.toString() };
  }
}

// ============================================================
//  Sheet builder
// ============================================================
function buildCostSheet(sheet, data) {
  const C = {
    navy:       '#1a1a2e',
    navyText:   '#ffffff',
    revBg:      '#0d3b6e',
    revText:    '#ffffff',
    revSubBg:   '#1a4a8c',
    costBg:     '#1e3a1e',
    costText:   '#ffffff',
    costSubBg:  '#2d5a1e',
    totalBg:    '#0d3b6e',
    gmBg:       '#6c0000',
    white:      '#ffffff',
    rowAlt:     '#f8f9fa',
    labelBg:    '#f1f3f5',
    labelText:  '#495057',
    border:     '#dee2e6',
    tierA:      '#2c1654',
    tierB:      '#0d3b6e',
    tierC:      '#1e3a1e',
  };

  const TIER_LABEL = { A: 'Tier A — Premium Commercial', B: 'Tier B — Standard Branded', C: 'Tier C — Editorial / Quick Clip' };
  const TIER_COLOR = { A: C.tierA, B: C.tierB, C: C.tierC };

  // Column widths: A(#) B(Items) C(Description) D(Amount) E(Outlets) F(Payment) G(ProdCode) H(Status) I(Note)
  [40, 230, 250, 110, 145, 125, 125, 70, 185].forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  let r = 1;
  const N = 9; // total columns

  // ── helpers ──────────────────────────────────────────────
  const R = (row, col, nr, nc) => sheet.getRange(row, col, nr || 1, nc || 1);
  function cell(row, col, val, opts) {
    const g = R(row, col);
    if (val !== undefined && val !== null) g.setValue(val);
    applyOpts(g, opts);
    return g;
  }
  function merge(row, col, nr, nc, val, opts) {
    const g = R(row, col, nr, nc).merge();
    if (val !== undefined && val !== null) g.setValue(val);
    applyOpts(g, opts);
    return g;
  }
  function applyOpts(g, opts) {
    if (!opts) return;
    if (opts.bg)     g.setBackground(opts.bg);
    if (opts.color)  g.setFontColor(opts.color);
    if (opts.bold)   g.setFontWeight('bold');
    if (opts.size)   g.setFontSize(opts.size);
    if (opts.align)  g.setHorizontalAlignment(opts.align);
    if (opts.valign) g.setVerticalAlignment(opts.valign);
    if (opts.fmt)    g.setNumberFormat(opts.fmt);
    if (opts.italic) g.setFontStyle('italic');
    if (opts.wrap)   g.setWrap(true);
  }
  function rowH(row, h) { sheet.setRowHeight(row, h); }
  function rowBg(row, bg) { R(row, 1, 1, N).setBackground(bg); }

  // ── Title ─────────────────────────────────────────────────
  rowH(r, 40);
  merge(r, 1, 1, N, 'COST SHEET', { bg: C.navy, color: C.navyText, bold: true, align: 'center', valign: 'middle', size: 18 });
  r++;

  // ── Info rows ─────────────────────────────────────────────
  const tier = data.tier || 'B';
  const tierColor = TIER_COLOR[tier] || C.navy;
  const formattedDate = data.date
    ? Utilities.formatDate(new Date(data.date + 'T12:00:00'), 'Asia/Bangkok', 'dd-MMM-yyyy')
    : '';

  const infoRows = [
    ['Project Title', data.title || '', 'Tier', TIER_LABEL[tier] || tier],
    ['Head Project / AE', data.ae || '', 'Project Manager', data.pm || ''],
    ['Starting Date', formattedDate, 'Total Revenue (excl. VAT)', data.totalRevenue || 0],
  ];

  infoRows.forEach(([l1, v1, l2, v2], idx) => {
    rowH(r, 24);
    merge(r, 1, 1, 2, l1, { bg: C.labelBg, color: C.labelText, bold: true, align: 'right', valign: 'middle', size: 11 });
    const vl = merge(r, 3, 1, 3, v1, { bg: C.white, valign: 'middle' });
    vl.setBorder(false, true, true, true, false, false, C.border, SpreadsheetApp.BorderStyle.SOLID);
    if (l1 === 'Tier') applyOpts(vl, { bg: tierColor, color: C.white, bold: true });

    merge(r, 6, 1, 1, l2, { bg: C.labelBg, color: C.labelText, bold: true, align: 'right', valign: 'middle', size: 11 });
    const vr = merge(r, 7, 1, 3, v2, { bg: C.white, valign: 'middle' });
    vr.setBorder(false, true, true, true, false, false, C.border, SpreadsheetApp.BorderStyle.SOLID);
    if (l2 === 'Total Revenue (excl. VAT)') {
      applyOpts(vr, { fmt: '#,##0', bold: true });
    }
    if (l2 === 'Tier') applyOpts(vr, { bg: tierColor, color: C.white, bold: true });
    r++;
  });

  r++; // spacer

  // ── Revenue section ───────────────────────────────────────
  rowH(r, 28);
  merge(r, 1, 1, N, '  REVENUE', { bg: C.revBg, color: C.revText, bold: true, size: 12, valign: 'middle' });
  r++;

  rowH(r, 22);
  R(r, 1, 1, N).setValues([['#', 'Items / ประเภทรายได้', 'Description', 'Amount', 'Outlets', '', 'Items Code', 'Product Code', '']])
    .setBackground(C.revSubBg).setFontColor(C.revText).setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
  r++;

  const revStart = r;
  const revItems = (data.revenueItems && data.revenueItems.length > 0) ? data.revenueItems : new Array(4).fill({});
  revItems.forEach((item, i) => {
    const bg = i % 2 === 0 ? C.white : C.rowAlt;
    rowH(r, 22); rowBg(r, bg);
    cell(r, 1, i + 1, { align: 'center', bg });
    cell(r, 2, item.type || '', { bg });
    cell(r, 3, item.description || '', { bg });
    cell(r, 4, item.amount || '', { fmt: '#,##0', bg });
    cell(r, 5, item.outlets || '', { bg });
    cell(r, 6, '', { bg });
    cell(r, 7, item.itemCode || '', { align: 'center', bg });
    cell(r, 8, item.productCode || '', { align: 'center', bg, size: 10 });
    cell(r, 9, '', { bg });
    r++;
  });

  // Revenue total row
  rowH(r, 26);
  merge(r, 1, 1, 3, 'TOTAL REVENUE', { bg: C.totalBg, color: C.white, bold: true, align: 'right', valign: 'middle' });
  R(r, 4).setFormula('=SUM(D' + revStart + ':D' + (r - 1) + ')')
    .setBackground(C.totalBg).setFontColor(C.white).setFontWeight('bold').setNumberFormat('#,##0');
  merge(r, 5, 1, 5, '', { bg: C.totalBg });
  const revTotalRow = r;
  r += 2;

  // ── Cost section ──────────────────────────────────────────
  rowH(r, 28);
  merge(r, 1, 1, N, '  PRODUCTION COST', { bg: C.costBg, color: C.costText, bold: true, size: 12, valign: 'middle' });
  r++;

  rowH(r, 22);
  R(r, 1, 1, N).setValues([['#', 'Items / Category', 'Description', 'Amount', 'Outlets', 'Payment', 'Product Code', 'Status', 'Note']])
    .setBackground(C.costSubBg).setFontColor(C.costText).setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
  r++;

  const costStart = r;
  const costItems = (data.costItems && data.costItems.length > 0) ? data.costItems : new Array(5).fill({});
  costItems.forEach((item, i) => {
    const bg = i % 2 === 0 ? C.white : C.rowAlt;
    rowH(r, 22); rowBg(r, bg);
    cell(r, 1, i + 1, { align: 'center', bg });
    cell(r, 2, item.category || '', { bg, size: 11 });
    cell(r, 3, item.description || '', { bg });
    cell(r, 4, item.amount || '', { fmt: '#,##0', bg });
    cell(r, 5, item.outlets || '', { bg });
    cell(r, 6, item.payment || 'จ่ายผ่านบัญชี', { bg, size: 11 });
    cell(r, 7, item.productCode || '', { align: 'center', bg, size: 10 });
    cell(r, 8, item.status || '', { align: 'center', bg });
    cell(r, 9, item.note || '', { bg, size: 11 });
    r++;
  });

  // Cost total
  rowH(r, 26);
  merge(r, 1, 1, 3, 'TOTAL COST', { bg: C.costBg, color: C.costText, bold: true, align: 'right', valign: 'middle' });
  R(r, 4).setFormula('=SUM(D' + costStart + ':D' + (r - 1) + ')')
    .setBackground(C.costBg).setFontColor(C.costText).setFontWeight('bold').setNumberFormat('#,##0');
  merge(r, 5, 1, 5, '', { bg: C.costBg });
  const costTotalRow = r;
  r++;

  // Gross margin
  rowH(r, 26);
  merge(r, 1, 1, 3, 'GROSS MARGIN', { bg: C.gmBg, color: C.white, bold: true, align: 'right', valign: 'middle' });
  R(r, 4).setFormula('=D' + revTotalRow + '-D' + costTotalRow)
    .setBackground(C.gmBg).setFontColor(C.white).setFontWeight('bold').setNumberFormat('#,##0');
  R(r, 5).setFormula('=IFERROR(D' + r + '/D' + revTotalRow + ',0)')
    .setBackground(C.gmBg).setFontColor(C.white).setFontWeight('bold').setNumberFormat('0.0%');
  merge(r, 6, 1, 4, '', { bg: C.gmBg });
  r += 2;

  // ── Signature ─────────────────────────────────────────────
  rowH(r, 32);
  merge(r, 1, 1, 4, '___________________________', { align: 'center', valign: 'bottom' });
  merge(r, 6, 1, 4, '___________________________', { align: 'center', valign: 'bottom' });
  r++;

  merge(r, 1, 1, 4, '(                                          )', { align: 'center' });
  merge(r, 6, 1, 4, '(  ไวกูณฐ์  เอื้อรักษาสัตย์  )', { align: 'center' });
  r++;

  merge(r, 1, 1, 4, 'ผู้จัดทำและนำเสนอ', { align: 'center', bold: true, size: 11 });
  merge(r, 6, 1, 4, 'ผู้ตรวจสอบ', { align: 'center', bold: true, size: 11 });
  r++;

  // ── Global border + freeze ────────────────────────────────
  sheet.getRange(1, 1, r - 1, N)
    .setBorder(true, true, true, true, true, true, C.border, SpreadsheetApp.BorderStyle.SOLID_THIN);
  sheet.setFrozenRows(4);

  // Default font for whole sheet
  sheet.getRange(1, 1, r - 1, N).setFontFamily('Sarabun');
}
