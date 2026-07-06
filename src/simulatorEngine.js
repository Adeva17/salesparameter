export const VARIABLE_METADATA = {
  jp: { name: "Jumlah Penduduk", label: "Jumlah Penduduk", min: 0, max: 20000000, step: 0.1, unit: "Jiwa", format: "number" },
  ci: { name: "Indeks Konsumsi (CI)", label: "Indeks Konsumsi (CI)", min: 0, max: 100000, step: 0.01, unit: "Rp/Jiwa", format: "currency" },
  omzet: { name: "Omzet", label: "Omzet", min: 0, max: 100000000000, step: 1000, unit: "Rupiah", format: "currency" },
  ro: { name: "Registered Outlets (RO)", label: "Registered Outlets (RO)", min: 0, max: 50000, step: 0.01, unit: "Outlet", format: "number" },
  pct_ea: { name: "% Effective Accounts (%EA)", label: "% Effective Accounts (%EA)", min: 0, max: 100, step: 0.01, unit: "%", format: "percentage" },
  ea: { name: "Effective Accounts (EA)", label: "Effective Accounts (EA)", min: 0, max: 50000, step: 0.01, unit: "Outlet", format: "number" },
  ds: { name: "Drop Size", label: "Drop Size", min: 0, max: 50000000, step: 1, unit: "Rp/Outlet", format: "currency" },
  sku: { name: "Stock Keeping Units (SKU)", label: "Stock Keeping Units (SKU)", min: 0, max: 500, step: 1, unit: "Varian", format: "number" },
  pa: { name: "Product Active (PA)", label: "Product Active (PA)", min: 0, max: 500, step: 0.01, unit: "Varian", format: "number" },
  pct_pa: { name: "% Product Active (%PA)", label: "% Product Active (%PA)", min: 0, max: 100, step: 0.01, unit: "%", format: "percentage" },
  pct_retur: { name: "% Retur", label: "% Retur", min: 0, max: 100, step: 0.01, unit: "%", format: "percentage" },
  line_ro: { name: "Line/RO", label: "Line/RO", min: 0, max: 100, step: 0.01, unit: "Baris/RO", format: "float" },
  indeks_ro: { name: "Indeks RO", label: "Indeks RO", min: 0, max: 100000, step: 0.01, unit: "Jiwa/Outlet", format: "float" }
};

export const INITIAL_VALUES = {
  jp: 1297672.71,
  ci: 700.0,
  omzet: 908370897.0,
  ro: 916.0,
  pct_ea: 71.06986899563319,
  ea: 651.0,
  ds: 1395347.0,
  sku: 50.0,
  pa: 7.802,
  pct_pa: 47.0,
  pct_retur: 1.5,
  line_ro: 16.6,
  indeks_ro: 1416.6732641921397
};

export const BLOCKS = {
  demographics: {
    title: "Demografi & Pasar",
    variables: ["jp", "ci"]
  },
  coverage: {
    title: "Metrik Cakupan (Coverage)",
    variables: ["ro", "pct_ea", "ea", "indeks_ro"]
  },
  productivity: {
    title: "Metrik Produktivitas",
    variables: ["line_ro", "pct_pa", "pa"]
  },
  financials: {
    title: "Metrik Keuangan",
    variables: ["omzet", "ds"]
  },
  standalone: {
    title: "Metrik Tambahan",
    variables: ["pct_retur", "sku"]
  }
};

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export function formatValue(key, val) {
  const meta = VARIABLE_METADATA[key];
  if (!meta) return val;
  
  const hasDecimal = val % 1 !== 0;
  
  if (meta.format === "currency") {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: hasDecimal ? 2 : 0,
      minimumFractionDigits: hasDecimal ? 1 : 0
    }).format(val);
  }
  if (meta.format === "percentage") {
    const formattedNum = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2,
      minimumFractionDigits: hasDecimal ? 1 : 0
    }).format(val);
    return `${formattedNum}%`;
  }
  if (meta.format === "number") {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: hasDecimal ? 2 : 0,
      minimumFractionDigits: hasDecimal ? 1 : 0
    }).format(val);
  }
  if (meta.format === "float") {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 1
    }).format(val);
  }
  return val;
}

export function formatForInput(key, val) {
  if (val === undefined || val === null || val === '') return '';
  const meta = VARIABLE_METADATA[key];
  if (!meta) return val.toString();
  
  const hasDecimal = val % 1 !== 0;
  
  if (meta.format === "currency") {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: hasDecimal ? 2 : 0,
      minimumFractionDigits: hasDecimal ? 1 : 0
    }).format(val);
  }
  if (meta.format === "number") {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: hasDecimal ? 2 : 0,
      minimumFractionDigits: hasDecimal ? 1 : 0
    }).format(val);
  }
  if (meta.format === "percentage" || meta.format === "float") {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2,
      minimumFractionDigits: hasDecimal ? 1 : 0
    }).format(val);
  }
  return val.toString();
}

export function formatAsYouType(key, cleanText) {
  if (!cleanText) return '';
  const meta = VARIABLE_METADATA[key];
  if (!meta) return cleanText;

  let workingText = cleanText.replace(/[Rp\s]/gi, '');

  const commaIndex = workingText.indexOf(',');
  if (commaIndex !== -1) {
    const integerPart = workingText.slice(0, commaIndex);
    const decimalPart = workingText.slice(commaIndex + 1);
    
    const formattedInteger = formatIntegerOnly(key, integerPart);
    const prefix = meta.format === 'currency' ? 'Rp ' : '';
    return prefix + formattedInteger + ',' + decimalPart.replace(/[^0-9]/g, '');
  }

  const dotIndex = workingText.indexOf('.');
  if (dotIndex !== -1 && workingText.split('.').length === 2 && workingText.split('.')[1].length !== 3) {
    const integerPart = workingText.slice(0, dotIndex);
    const decimalPart = workingText.slice(dotIndex + 1);
    
    const formattedInteger = formatIntegerOnly(key, integerPart);
    const prefix = meta.format === 'currency' ? 'Rp ' : '';
    return prefix + formattedInteger + ',' + decimalPart.replace(/[^0-9]/g, '');
  }

  const prefix = meta.format === 'currency' ? 'Rp ' : '';
  return prefix + formatIntegerOnly(key, workingText);
}

function formatIntegerOnly(key, cleanText) {
  const num = parseInt(cleanText.replace(/[^0-9-]/g, ''), 10);
  if (isNaN(num)) return cleanText;
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
}

export function parseIndonesianFloat(text) {
  if (!text) return NaN;
  let clean = text.replace(/[Rp\s]/gi, ''); // remove Rp and spaces
  
  if (clean.includes(',')) {
    // Dot is thousands, comma is decimal
    clean = clean.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // Check if single dot is decimal
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length !== 3) {
      // Keep dot
    } else if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      // Strip dots
      clean = clean.replace(/\./g, '');
    }
  }
  return parseFloat(clean);
}

export function getDeterminedSet(locked) {
  const determined = new Set(locked);
  const equations = [
    ['ci', 'jp', 'omzet'],
    ['pct_ea', 'ro', 'ea'],
    ['pct_pa', 'line_ro', 'pa'],
    ['ds', 'omzet', 'ea'],
    ['indeks_ro', 'jp', 'ro']
  ];
  
  let added = true;
  while (added) {
    added = false;
    for (const eq of equations) {
      const detInEq = eq.filter(v => determined.has(v));
      if (detInEq.length === 2) {
        const rem = eq.find(v => !determined.has(v));
        if (rem && !determined.has(rem)) {
          determined.add(rem);
          added = true;
        }
      }
    }
  }
  return determined;
}

const getSliderPos = (key, val, lineRoMax, roMax) => {
  const meta = VARIABLE_METADATA[key];
  const maxVal = key === 'pa' ? lineRoMax : (key === 'ea' ? roMax : meta.max);
  const range = maxVal - meta.min;
  if (range <= 0) return 0.5;
  return (val - meta.min) / range;
};

// Safe numerical Division helper
const safeDiv = (num, den) => {
  if (den === 0) return 0;
  const res = num / den;
  return isNaN(res) || !isFinite(res) ? 0 : res;
};

// Virtual base ratio calculation to avoid 0 multiplier stucks and explosions
const getRatio = (nextVal, currentVal) => {
  const den = currentVal === 0 ? 0.0001 : currentVal;
  const ratio = nextVal / den;
  return isNaN(ratio) || !isFinite(ratio) ? 1 : ratio;
};

const scaleVal = (currentVal, ratio, weight) => {
  const base = currentVal === 0 ? 0.0001 : currentVal;
  const res = base * Math.pow(ratio, weight);
  return isNaN(res) || !isFinite(res) ? 0 : res;
};

export function propagateChange(changedVar, newVal, current, locked) {
  const next = { ...current };
  
  const determined = getDeterminedSet(locked);
  const isDet = (v) => determined.has(v);

  // Visited set to prevent loops and protect locked variables
  const visited = new Set(locked);
  visited.add(changedVar);

  const updateVar = (v, val) => {
    if (v !== changedVar && locked.has(v)) return false; // never overwrite locks
    
    let maxVal = VARIABLE_METADATA[v].max;
    if (v === 'pa') maxVal = next.line_ro;
    if (v === 'ea') maxVal = next.ro;
    
    next[v] = clamp(val, VARIABLE_METADATA[v].min, maxVal);
    return true;
  };

  // Clamp current changed variable
  const meta = VARIABLE_METADATA[changedVar];
  let activeMax = meta.max;
  if (changedVar === 'pa') activeMax = next.line_ro;
  if (changedVar === 'ea') activeMax = next.ro;
  next[changedVar] = clamp(newVal, meta.min, activeMax);

  // Eq 3: [pct_pa, line_ro, pa] - decoupled
  if (['pct_pa', 'line_ro', 'pa'].includes(changedVar)) {
    if (changedVar === 'line_ro') {
      if (next.pa > next.line_ro) {
        next.pa = next.line_ro;
      }
      if (locked.has('pct_pa')) {
        updateVar('pa', next.line_ro * (next.pct_pa / 100));
      } else {
        updateVar('pct_pa', safeDiv(next.pa, next.line_ro) * 100);
      }
    } 
    else if (changedVar === 'pa') {
      if (locked.has('pct_pa')) {
        updateVar('line_ro', safeDiv(next.pa, next.pct_pa / 100));
      } else {
        updateVar('pct_pa', safeDiv(next.pa, next.line_ro) * 100);
      }
    } 
    else if (changedVar === 'pct_pa') {
      if (locked.has('pa')) {
        updateVar('line_ro', safeDiv(next.pa, next.pct_pa / 100));
      } else {
        updateVar('pa', next.line_ro * (next.pct_pa / 100));
      }
    }
    return next;
  }

  // Recursive Solver for Coupled Equations (1, 2, 4, 5)
  const resolveEq1 = (source) => {
    if (source === 'omzet') {
      if (visited.has('ci') && visited.has('jp')) return;
      if (visited.has('ci') || locked.has('ci')) {
        if (!visited.has('jp')) {
          updateVar('jp', safeDiv(next.omzet, next.ci));
          visited.add('jp');
          resolveEq5('jp');
        }
      } else {
        updateVar('ci', safeDiv(next.omzet, next.jp));
        visited.add('ci');
      }
    } else if (source === 'ci') {
      if (visited.has('omzet') && visited.has('jp')) return;
      if (visited.has('omzet') || locked.has('omzet')) {
        if (!visited.has('jp')) {
          updateVar('jp', safeDiv(next.omzet, next.ci));
          visited.add('jp');
          resolveEq5('jp');
        }
      } else {
        updateVar('omzet', next.ci * next.jp);
        visited.add('omzet');
        resolveEq4('omzet');
      }
    } else if (source === 'jp') {
      if (visited.has('omzet') && visited.has('ci')) return;
      if (visited.has('omzet') || locked.has('omzet')) {
        if (!visited.has('ci')) {
          updateVar('ci', safeDiv(next.omzet, next.jp));
          visited.add('ci');
        }
      } else {
        updateVar('ci', safeDiv(next.omzet, next.jp));
        visited.add('ci');
      }
    }
  };

  const resolveEq5 = (source) => {
    if (source === 'indeks_ro') {
      if (visited.has('jp') && visited.has('ro')) return;
      if (visited.has('jp') || locked.has('jp')) {
        if (!visited.has('ro')) {
          updateVar('ro', safeDiv(next.jp, next.indeks_ro));
          visited.add('ro');
          resolveEq2('ro');
        }
      } else {
        updateVar('jp', next.indeks_ro * next.ro);
        visited.add('jp');
        resolveEq1('jp');
      }
    } else if (source === 'jp') {
      if (visited.has('indeks_ro') && visited.has('ro')) return;
      if (visited.has('ro') || locked.has('ro')) {
        if (!visited.has('indeks_ro')) {
          updateVar('indeks_ro', safeDiv(next.jp, next.ro));
          visited.add('indeks_ro');
        }
      } else {
        updateVar('indeks_ro', safeDiv(next.jp, next.ro));
        visited.add('indeks_ro');
      }
    } else if (source === 'ro') {
      if (visited.has('indeks_ro') && visited.has('jp')) return;
      if (visited.has('jp') || locked.has('jp')) {
        if (!visited.has('indeks_ro')) {
          updateVar('indeks_ro', safeDiv(next.jp, next.ro));
          visited.add('indeks_ro');
        }
      } else {
        updateVar('indeks_ro', safeDiv(next.jp, next.ro));
        visited.add('indeks_ro');
      }
    }
  };

  const resolveEq2 = (source) => {
    if (source === 'ea') {
      if (visited.has('ro') && visited.has('pct_ea')) return;
      if (visited.has('ro') || locked.has('ro')) {
        if (!visited.has('pct_ea')) {
          updateVar('pct_ea', safeDiv(next.ea, next.ro) * 100);
          visited.add('pct_ea');
        }
      } else {
        updateVar('ro', safeDiv(next.ea, next.pct_ea / 100));
        visited.add('ro');
        resolveEq5('ro');
      }
    } else if (source === 'ro') {
      if (visited.has('ea') && visited.has('pct_ea')) return;
      if (visited.has('ea') || locked.has('ea')) {
        if (!visited.has('pct_ea')) {
          updateVar('pct_ea', safeDiv(next.ea, next.ro) * 100);
          visited.add('pct_ea');
        }
      } else {
        updateVar('ea', next.ro * (next.pct_ea / 100));
        visited.add('ea');
        resolveEq4('ea');
      }
    } else if (source === 'pct_ea') {
      if (visited.has('ea') && visited.has('ro')) return;
      if (visited.has('ea') || locked.has('ea')) {
        if (!visited.has('ro')) {
          updateVar('ro', safeDiv(next.ea, next.pct_ea / 100));
          visited.add('ro');
          resolveEq5('ro');
        }
      } else {
        updateVar('ea', next.ro * (next.pct_ea / 100));
        visited.add('ea');
        resolveEq4('ea');
      }
    }
  };

  const resolveEq4 = (source) => {
    if (source === 'omzet') {
      if (visited.has('ds') && visited.has('ea')) return;
      if (visited.has('ds') || locked.has('ds')) {
        if (!visited.has('ea')) {
          updateVar('ea', safeDiv(next.omzet, next.ds));
          visited.add('ea');
          resolveEq2('ea');
        }
      } else if (visited.has('ea') || locked.has('ea')) {
        if (!visited.has('ds')) {
          updateVar('ds', safeDiv(next.omzet, next.ea));
          visited.add('ds');
        }
      } else {
        // Proportional propagation
        const R = getRatio(next.omzet, current.omzet);
        if (Math.abs(R - 1) > 0.0001) {
          const pDS = getSliderPos('ds', current.ds, next.sku, next.ro);
          const pEA = getSliderPos('ea', current.ea, next.sku, next.ro);
          let rawW_DS = R > 1 ? (1 - pDS) : pDS;
          let rawW_EA = R > 1 ? (1 - pEA) : pEA;
          if (rawW_DS + rawW_EA <= 0) { rawW_DS = 0.5; rawW_EA = 0.5; }
          const w_DS = rawW_DS / (rawW_DS + rawW_EA);
          const w_EA = rawW_EA / (rawW_DS + rawW_EA);
          
          updateVar('ds', scaleVal(current.ds, R, w_DS));
          visited.add('ds');
          updateVar('ea', safeDiv(next.omzet, next.ds));
          visited.add('ea');
          resolveEq2('ea');
        }
      }
    } else if (source === 'ds') {
      if (visited.has('omzet') && visited.has('ea')) return;
      if (visited.has('omzet') || locked.has('omzet')) {
        if (!visited.has('ea')) {
          updateVar('ea', safeDiv(next.omzet, next.ds));
          visited.add('ea');
          resolveEq2('ea');
        }
      } else if (visited.has('ea') || locked.has('ea')) {
        if (!visited.has('omzet')) {
          updateVar('omzet', next.ds * next.ea);
          visited.add('omzet');
          resolveEq1('omzet');
        }
      } else {
        // Proportional propagation
        const R = getRatio(next.ds, current.ds);
        if (Math.abs(R - 1) > 0.0001) {
          const pOmzet = getSliderPos('omzet', current.omzet, next.sku, next.ro);
          const pEA = getSliderPos('ea', current.ea, next.sku, next.ro);
          let rawW_Omzet = R > 1 ? (1 - pOmzet) : pOmzet;
          let rawW_EA = R > 1 ? pEA : (1 - pEA);
          if (rawW_Omzet + rawW_EA <= 0) { rawW_Omzet = 0.5; rawW_EA = 0.5; }
          const w_Omzet = rawW_Omzet / (rawW_Omzet + rawW_EA);
          const w_EA = rawW_EA / (rawW_Omzet + rawW_EA);
          
          updateVar('omzet', scaleVal(current.omzet, R, w_Omzet));
          visited.add('omzet');
          updateVar('ea', safeDiv(next.omzet, next.ds));
          visited.add('ea');
          resolveEq1('omzet');
          resolveEq2('ea');
        }
      }
    } else if (source === 'ea') {
      if (visited.has('omzet') && visited.has('ds')) return;
      if (visited.has('omzet') || locked.has('omzet')) {
        if (!visited.has('ds')) {
          updateVar('ds', safeDiv(next.omzet, next.ea));
          visited.add('ds');
        }
      } else if (visited.has('ds') || locked.has('ds')) {
        if (!visited.has('omzet')) {
          updateVar('omzet', next.ds * next.ea);
          visited.add('omzet');
          resolveEq1('omzet');
        }
      } else {
        // Proportional propagation
        const R = getRatio(next.ea, current.ea);
        if (Math.abs(R - 1) > 0.0001) {
          const pOmzet = getSliderPos('omzet', current.omzet, next.sku, next.ro);
          const pDS = getSliderPos('ds', current.ds, next.sku, next.ro);
          let rawW_Omzet = R > 1 ? (1 - pOmzet) : pOmzet;
          let rawW_DS = R > 1 ? pDS : (1 - pDS);
          if (rawW_Omzet + rawW_DS <= 0) { rawW_Omzet = 0.5; rawW_DS = 0.5; }
          const w_Omzet = rawW_Omzet / (rawW_Omzet + rawW_DS);
          const w_DS = rawW_DS / (rawW_Omzet + rawW_DS);
          
          updateVar('omzet', scaleVal(current.omzet, R, w_Omzet));
          visited.add('omzet');
          updateVar('ds', safeDiv(next.omzet, next.ea));
          visited.add('ds');
          resolveEq1('omzet');
        }
      }
    }
  };

  // Trigger propagation from the changedVar source
  if (changedVar === 'jp') {
    if (next.jp === 0) {
      updateVar('omzet', 0);
      visited.add('omzet');
      updateVar('ci', 0);
      visited.add('ci');
      updateVar('ds', 0);
      visited.add('ds');
      updateVar('ea', 0);
      visited.add('ea');
      resolveEq2('ea');
    } else {
      resolveEq1('jp');
    }
    resolveEq5('jp');
  } 
  else if (changedVar === 'ci') {
    resolveEq1('ci');
  }
  else if (changedVar === 'omzet') {
    resolveEq1('omzet');
    resolveEq4('omzet');
  }
  else if (changedVar === 'ds') {
    resolveEq4('ds');
  }
  else if (changedVar === 'ea') {
    resolveEq2('ea');
    resolveEq4('ea');
  }
  else if (changedVar === 'ro') {
    if (next.ro === 0) {
      updateVar('ea', 0);
      visited.add('ea');
      updateVar('pct_ea', 0);
      visited.add('pct_ea');
      resolveEq4('ea');
    } else {
      resolveEq2('ro');
    }
    resolveEq5('ro');
  }
  else if (changedVar === 'pct_ea') {
    resolveEq2('pct_ea');
  }
  else if (changedVar === 'indeks_ro') {
    resolveEq5('indeks_ro');
  }
  
  return next;
}

export function generateInsights(changedVar, nextValues, prevValues, locked) {
  if (!changedVar) return `
### Ringkasan Situasi
Sistem dalam kondisi seimbang. Silakan ubah variabel pada panel kontrol untuk mensimulasikan skenario What-If.
  `.trim();

  const label = (v) => VARIABLE_METADATA[v].label;
  const valStr = (v, vals) => formatValue(v, vals[v]);
  
  const diff = nextValues[changedVar] - prevValues[changedVar];
  const pctDiff = prevValues[changedVar] !== 0 ? (diff / prevValues[changedVar]) * 100 : 0;
  const direction = diff > 0 ? "meningkat" : "menurun";
  const absDiffText = valStr(changedVar, nextValues);
  
  let insightText = `### Analisis Situasi: Perubahan ${label(changedVar)}\n`;
  insightText += `Variabel ${label(changedVar)} ${direction} menjadi ${absDiffText} (bergeser sekitar ${Math.abs(pctDiff).toFixed(1)}%).\n\n`;

  if (changedVar === 'jp') {
    insightText += `#### Implikasi Bisnis:\n`;
    insightText += `- Jumlah Penduduk bertambah memperluas kapasitas pasar absolut.\n`;
    insightText += `- Untuk menyeimbangkan persamaan dengan target Omzet tetap, Indeks Konsumsi (CI) disesuaikan turun ke ${valStr('ci', nextValues)}.\n`;
    insightText += `- Indeks RO bergeser menjadi ${valStr('indeks_ro', nextValues)} jiwa/outlet, mengubah rasio populasi per toko.\n\n`;
    insightText += `#### Rekomendasi Tindakan:\n`;
    insightText += `- Rekrut outlet terdaftar baru (RO) jika indeks kepadatan outlet terlalu tinggi agar persebaran produk lebih merata.\n`;
    insightText += `- Sesuaikan alokasi stok produk sesuai pertumbuhan penduduk di area baru.`;
  }
  else if (changedVar === 'omzet') {
    insightText += `#### Implikasi Bisnis:\n`;
    if (diff > 0) {
      insightText += `- Peningkatan Omzet menuntut kenaikan pada kapasitas serap pasar atau efisiensi transaksi (Drop Size/EA).\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Berikan program insentif volume penjualan pada outlet berkinerja tinggi untuk menjaga momentum pertumbuhan.\n`;
      insightText += `- Maksimalkan ketersediaan varian produk premium di pasar.`;
    } else {
      insightText += `- Penurunan Omzet menandakan penyusutan nilai penjualan yang membutuhkan koreksi operasional rute sales.\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Lakukan pemeriksaan stok langsung di lapangan untuk mendeteksi potensi hilangnya penjualan akibat barang kosong.\n`;
      insightText += `- Buat program promosi jangka pendek untuk memicu pembelian kembali oleh outlet.`;
    }
  }
  else if (changedVar === 'ds') {
    insightText += `#### Implikasi Bisnis:\n`;
    if (diff > 0) {
      insightText += `- Kenaikan Drop Size mengindikasikan transaksi sales per outlet lebih efisien, memangkas biaya logistik per pengiriman.\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Tingkatkan penawaran produk pelengkap (cross-selling) untuk terus memperbesar ukuran keranjang belanja.\n`;
      insightText += `- Tawarkan skema harga diskon bertingkat untuk pembelian volume besar.`;
    } else {
      insightText += `- Penurunan Drop Size membuat biaya operasional kunjungan sales rep menjadi kurang efisien.\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Terapkan aturan batas nominal minimum transaksi per pengiriman agar margin logistik tetap aman.\n`;
      insightText += `- Prioritaskan penawaran produk-produk utama yang cepat berputar.`;
    }
  }
  else if (changedVar === 'ea') {
    insightText += `#### Implikasi Bisnis:\n`;
    if (diff > 0) {
      insightText += `- Kenaikan outlet aktif (EA) menunjukkan penetrasi fisik produk Nutrifood di pasar tradisional semakin meluas.\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Pastikan rute kunjungan salesmen (Call Plan) terjadwal dengan disiplin untuk mempertahankan keaktifan toko.\n`;
      insightText += `- Optimalkan logistik pengiriman agar pengantaran barang ke toko baru berjalan tepat waktu.`;
    } else {
      insightText += `- Penurunan EA menunjukkan adanya toko terdaftar (RO) yang berhenti melakukan transaksi berulang.\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Kirim tim sales khusus untuk melakukan kunjungan aktivasi ulang (win-back program) ke outlet pasif.\n`;
      insightText += `- Evaluasi keandalan salesman yang bertanggung jawab di rute tersebut.`;
    }
  }
  else if (changedVar === 'pct_retur') {
    insightText += `#### Implikasi Bisnis:\n`;
    if (diff > 0) {
      insightText += `- Kenaikan retur merusak margin keuntungan kotor dan meningkatkan biaya transportasi pengembalian barang.\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Periksa penanganan produk di gudang distributor dan selama proses pengiriman untuk mencegah kerusakan fisik.\n`;
      insightText += `- Tegakkan disiplin display produk dengan prinsip First-Expired First-Out (FEFO) di rak outlet.`;
    } else {
      insightText += `- Penurunan tingkat retur mencerminkan kualitas penanganan produk dan perputaran stok di pasar yang sangat baik.`;
    }
  }
  else if (changedVar === 'line_ro') {
    insightText += `#### Implikasi Bisnis:\n`;
    if (diff > 0) {
      insightText += `- Kenaikan rata-rata baris varian per outlet menunjukkan keragaman produk yang dibeli outlet semakin baik.\n\n`;
      insightText += `#### Rekomendasi Tindakan:\n`;
      insightText += `- Berikan insentif kepada salesman yang berhasil menjual minimal 4 varian produk yang berbeda dalam satu nota.\n`;
      insightText += `- Atur pajangan produk di toko agar varian baru diletakkan berdampingan dengan produk cepat laku.`;
    } else {
      insightText += `- Penurunan Line/RO menandakan outlet cenderung hanya membeli varian produk tertentu saja.`;
    }
  }
  else {
    insightText += `#### Implikasi Bisnis:\n`;
    insightText += `- Penyesuaian ini menuntut sistem menyelaraskan variabel lain agar model matematika tetap seimbang.\n\n`;
    insightText += `#### Rekomendasi Tindakan:\n`;
    insightText += `- Pantau terus apakah nilai parameter operasional (Drop Size/EA) tetap realistis untuk dicapai oleh sales rep di lapangan.`;
  }

  return insightText.trim();
}
