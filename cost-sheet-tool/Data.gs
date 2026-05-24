// ============================================================
//  Cost Sheet Generator — Data.gs
//  Static data: rates, dropdowns, AE list
//  Source: จากข้อมูลจริง 2025–2026 (Gross / ก่อน WHT 3%)
// ============================================================

// Rate reference by Tier → Position → { median, p75 }
// Keys ต้องตรงกับ ALL_POSITIONS ใน Sidebar.html
const RATE_DATA = {
  A: {
    'Videographer (Outsource)':        { median: 3000,  p75: 6240,  n: 21 },
    'Photographer (Outsource)':        { median: 26605, p75: 38302, n: 2  },
    'Editor (Outsource)':              { median: 16000, p75: 24000, n: 5  },
    'Colorist (Outsource)':            { median: 15000, p75: 15000, n: 1  },
    'Sound Engineer (Outsource)':      { median: 3000,  p75: 3250,  n: 1  },
    'Voice Over (Outsource)':          { median: 4000,  p75: 4000,  n: 0  },
    'ค่าเช่าอุปกรณ์':                   { median: 16800, p75: 16800, n: 33 },
    'Production Design (Outsource)':   { median: 45240, p75: 50960, n: 4  },
    'Location':                        { median: 19353, p75: 35425, n: 4  },
    'Catering (Outsource)':            { median: 11250, p75: 13950, n: 4  },
    'Assistant Director (Outsource)':  { median: 7500,  p75: 8750,  n: 2  },
    'ช่างแต่งหน้า':                     { median: 3000,  p75: 3000,  n: 1  },
    'Retouch Photo (Outsource)':       { median: 15450, p75: 15450, n: 1  },
    'Creative (Outsource)':            { median: 6000,  p75: 6000,  n: 0  },
    'ค่าทำซับ/แปลภาษา':                { median: 1540,  p75: 2035,  n: 0  },
  },
  B: {
    'Videographer (Outsource)':        { median: 3210,  p75: 4250,  n: 21 },
    'Photographer (Outsource)':        { median: 10500, p75: 13750, n: 2  },
    'Editor (Outsource)':              { median: 9500,  p75: 11500, n: 10 },
    'Colorist (Outsource)':            { median: 15000, p75: 15000, n: 6  },
    'Sound Engineer (Outsource)':      { median: 3000,  p75: 3250,  n: 3  },
    'Voice Over (Outsource)':          { median: 4000,  p75: 4000,  n: 1  },
    'ค่าเช่าอุปกรณ์':                   { median: 6500,  p75: 12870, n: 34 },
    'Production Design (Outsource)':   { median: 12500, p75: 18000, n: 1  },
    'Location':                        { median: 7505,  p75: 7505,  n: 1  },
    'ช่างแต่งหน้า':                     { median: 3500,  p75: 3500,  n: 0  },
    'Creative (Outsource)':            { median: 6000,  p75: 6000,  n: 1  },
    'ค่าทำซับ/แปลภาษา':                { median: 1540,  p75: 2035,  n: 4  },
  },
  C: {
    'Videographer (Outsource)':        { median: 3120,  p75: 3120,  n: 3  },
    'Photographer (Outsource)':        { median: 4000,  p75: 4000,  n: 1  },
    'Editor (Outsource)':              { median: 5000,  p75: 16750, n: 10 },
    'Sound Engineer (Outsource)':      { median: 3000,  p75: 3000,  n: 2  },
    'ค่าเช่าอุปกรณ์':                   { median: 3745,  p75: 5720,  n: 9  },
    'Production Design (Outsource)':   { median: 7000,  p75: 12500, n: 3  },
    'ช่างแต่งหน้า':                     { median: 3750,  p75: 5625,  n: 10 },
    'ค่าทำซับ/แปลภาษา':                { median: 200,   p75: 400,   n: 4  },
  },
};

// AE / PM list
const AE_LIST = [
  'คุณ ภัทรลดา พุ่มเจริญ',
  'คุณ วิไลลักษณ์ โพธิ์ตระกูล',
  'คุณ นครินทร์ วนกิจไพบูลย์',
  'คุณ ศุภวษา ศรีหนองโคตร',
  'คุณ ศิลา รัตนวลีวงศ์',
  'คุณ ชนาธิป โรจน์สิรวรพัฒน์',
  'คุณ นนทกร ธุวะชาวสวน',
  'คุณ มัทนิน ภูมิ',
  'คุณ สุรัตนา ทรรปณ์ทิพากร',
  'คุณ มาสสุภา เอี่ยมมงคลศิลป์',
  'คุณ สุกัญญา แก้วชิงดวง',
  'คุณ ธัญญ์นรี นิธิพัชรโรจน์',
  'คุณ ณัฐณิชา แก้วมหาดไทย',
  'คุณ ภัทรธิดา สุวรรณประทีป',
  'คุณ อภิสิทธิ์ หรรษาภิรมย์โชค',
  'คุณ ชฎารัตน์ ธุมา',
  'คุณ อาทิตยา อิสสรานุสรณ์',
  'คุณ ภัทรสุดา บุญญศรี',
  'คุณ กรรญารัตน์ สุทธิสน',
  'คุณ รมิดา วงศานิตย์',
  'คุณ ปวริศา ตั้งตุลานนท์',
];

// Business units / Outlets
const OUTLETS = [
  'THE STANDARD NEWS',
  'The STANDARD POP',
  'The STANDARD LIFE',
  'The STANDARD WEALTH',
  'The Secret Sauce',
  'KND',
  'THE STANDARD PODCAST',
  'THE STANDARD SPORT',
  'Event + Virtual Event',
  'Content Agency',
  'Center',
];

// Revenue product types with item codes
const PRODUCT_TYPES = [
  { name: 'Article',                           code: 'A'  },
  { name: 'Video',                             code: 'V'  },
  { name: 'Live',                              code: 'L'  },
  { name: 'Event Planning & Management',       code: 'EP' },
  { name: 'Boostpost & Management',            code: 'BP' },
  { name: 'Boostpost & Management Fee',        code: 'BF' },
  { name: 'Banner',                            code: 'BN' },
  { name: 'Event - Ticket Sales',              code: 'ET' },
  { name: 'Event - Sponsorships',              code: 'ES' },
  { name: 'Event - Others',                    code: 'EO' },
  { name: 'Print Media, Goods & Merchandise',  code: 'G'  },
  { name: 'Marketing Planning',                code: 'MP' },
];
