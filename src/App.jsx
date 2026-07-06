import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  RefreshCw, 
  TrendingUp, 
  Sparkles, 
  Calculator, 
  AlertCircle, 
  History, 
  HelpCircle,
  CheckCircle2,
  Settings,
  Info,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { 
  VARIABLE_METADATA, 
  INITIAL_VALUES, 
  BLOCKS, 
  formatValue, 
  getDeterminedSet, 
  propagateChange, 
  generateInsights,
  formatForInput,
  formatAsYouType,
  parseIndonesianFloat,
  clamp
} from './simulatorEngine';
import logoNutrifood from './assets/logo-nutrifood.png';
import pakprediTutorial from './assets/pakpreditutorial.png';

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-left">
      {lines.map((line, i) => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-bold text-slate-800 mt-4 mb-1 border-b border-slate-100 pb-1">{parseBold(cleanLine.substring(4))}</h3>;
        }
        if (cleanLine.startsWith('#### ')) {
          return <h4 key={i} className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-3 mb-1">{parseBold(cleanLine.substring(5))}</h4>;
        }
        if (cleanLine.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-1.5 ml-2 my-0.5 text-xs text-slate-600">
              <span className="text-emerald-500">•</span>
              <span className="flex-1">{parseBold(cleanLine.substring(2))}</span>
            </div>
          );
        }
        if (cleanLine === '') {
          return <div key={i} className="h-1" />;
        }
        return <p key={i} className="text-xs text-slate-600 leading-relaxed my-1">{parseBold(cleanLine)}</p>;
      })}
    </div>
  );
}

function parseBold(text) {
  const parts = text.split('**');
  return parts.map((chunk, idx) => {
    return idx % 2 === 1 
      ? <strong key={idx} className="font-bold text-emerald-800">{chunk}</strong> 
      : chunk;
  });
}

function App() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [prevValues, setPrevValues] = useState(INITIAL_VALUES);
  const [locked, setLocked] = useState(new Set());
  const [changedVar, setChangedVar] = useState(null);
  
  // Flash tracking states
  const [lastUpdateTimes, setLastUpdateTimes] = useState({});
  const [changeDirections, setChangeDirections] = useState({});
  
  // History log
  const [history, setHistory] = useState([]);
  const [activePreset, setActivePreset] = useState('custom');

  // Welcome Popup Modal state
  const [showWelcome, setShowWelcome] = useState(true);

  // User Onboarding Tutorial state (null = inactive, 0 to 4 = active steps)
  const [tutorialStep, setTutorialStep] = useState(null);

  // Input editing temporary state to avoid cursor jumping
  const [tempInputs, setTempInputs] = useState({});

  // Draggable Node Positions state (using Lane-aligned percentages as defaults)
  const [nodePositions, setNodePositions] = useState({
    jp: { x: 24, y: 15 },
    ci: { x: 48, y: 15 },
    omzet: { x: 36, y: 38 },
    ea: { x: 24, y: 62 },
    ds: { x: 48, y: 62 },
    ro: { x: 12, y: 88 },
    pct_ea: { x: 36, y: 88 },
    indeks_ro: { x: 12, y: 50 },
    pa: { x: 76, y: 25 },
    line_ro: { x: 64, y: 55 },
    pct_pa: { x: 88, y: 55 },
    pct_retur: { x: 64, y: 85 },
    sku: { x: 88, y: 85 }
  });

  const [draggedNode, setDraggedNode] = useState(null);
  const dragNodeRef = useRef(null);
  const containerRef = useRef(null);

  const handleNodeMouseDown = (key, e) => {
    // Prevent dragging if clicking input or buttons inside node
    if (
      e.target.tagName === 'INPUT' || 
      e.target.tagName === 'BUTTON' || 
      e.target.closest('button') || 
      e.target.closest('input')
    ) {
      return;
    }
    
    e.preventDefault();
    dragNodeRef.current = key;
    setDraggedNode(key);
    
    const handleMouseMove = (moveEvent) => {
      if (!dragNodeRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const xPx = moveEvent.clientX - rect.left;
      const yPx = moveEvent.clientY - rect.top;
      
      // Clamp node position to be within the boundaries (2% to 98%)
      const xPct = Math.min(Math.max((xPx / rect.width) * 100, 2), 98);
      const yPct = Math.min(Math.max((yPx / rect.height) * 100, 2), 98);
      
      setNodePositions(prev => ({
        ...prev,
        [dragNodeRef.current]: { x: xPct, y: yPct }
      }));
    };
    
    const handleMouseUp = () => {
      dragNodeRef.current = null;
      setDraggedNode(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleNodeTouchStart = (key, e) => {
    if (
      e.target.tagName === 'INPUT' || 
      e.target.tagName === 'BUTTON' || 
      e.target.closest('button') || 
      e.target.closest('input')
    ) {
      return;
    }
    
    // Stop event propagation to prevent panning the parent container when dragging cards
    e.stopPropagation();
    dragNodeRef.current = key;
    setDraggedNode(key);
    
    const handleTouchMove = (moveEvent) => {
      if (!dragNodeRef.current || !containerRef.current) return;
      
      const touch = moveEvent.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const xPx = touch.clientX - rect.left;
      const yPx = touch.clientY - rect.top;
      
      const xPct = Math.min(Math.max((xPx / rect.width) * 100, 2), 98);
      const yPct = Math.min(Math.max((yPx / rect.height) * 100, 2), 98);
      
      setNodePositions(prev => ({
        ...prev,
        [dragNodeRef.current]: { x: xPct, y: yPct }
      }));
    };
    
    const handleTouchEnd = () => {
      dragNodeRef.current = null;
      setDraggedNode(null);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const aboutRef = useRef(null);

  // Determined set of variables (disabled sliders)
  const determined = getDeterminedSet(locked);

  // Sync temp inputs when values change or on component load
  useEffect(() => {
    const nextTemp = {};
    Object.keys(values).forEach(key => {
      // Don't overwrite if user is actively typing in that key
      if (document.activeElement?.id !== `input-${key}` && document.activeElement?.id !== `node-input-${key}`) {
        nextTemp[key] = formatForInput(key, values[key]);
      }
    });
    setTempInputs(prev => ({ ...prev, ...nextTemp }));
  }, [values]);

  // Run change detection for flash animations
  const updateValues = (newVals, sourceKey) => {
    setPrevValues(values);
    setValues(newVals);
    setChangedVar(sourceKey);

    const now = Date.now();
    const nextTimes = { ...lastUpdateTimes };
    const nextDirs = { ...changeDirections };

    Object.keys(newVals).forEach(key => {
      const diff = newVals[key] - values[key];
      const pctDiff = values[key] !== 0 ? (diff / values[key]) : diff;
      if (Math.abs(pctDiff) > 0.0001) {
        nextTimes[key] = now;
        nextDirs[key] = diff > 0 ? 'up' : 'down';
      }
    });

    setLastUpdateTimes(nextTimes);
    setChangeDirections(nextDirs);
  };

  // Lock and Unlock handler
  const handleLockToggle = (key) => {
    const nextLocked = new Set(locked);
    const isLocked = nextLocked.has(key);
    
    if (isLocked) {
      nextLocked.delete(key);
      setActivePreset('custom');
    } else {
      // Rule: cannot lock if already determined (disabled)
      if (determined.has(key)) return;
      nextLocked.add(key);
      setActivePreset('custom');
    }
    setLocked(nextLocked);
  };

  // Handle slider or manual input changes
  const handleValueChange = (key, rawVal) => {
    const nextVals = propagateChange(key, rawVal, values, locked);
    updateValues(nextVals, key);
  };

  // Handle manual keyboard inputs parsing with instant formatting for counts/money
  const handleManualInput = (key, text, inputEl) => {
    // Allow digits, commas, dots, and minus signs
    let clean = text;
    if (['jp', 'ci', 'omzet', 'ro', 'ea', 'ds', 'sku', 'pa', 'indeks_ro', 'pct_ea', 'pct_pa', 'pct_retur', 'line_ro'].includes(key)) {
      clean = text.replace(/[^0-9,.-]/g, '');
    }

    // Format instantly as you type for currency/counts to prevent zero-counting errors
    const formatted = formatAsYouType(key, clean);
    
    // Save cursor position
    const selectionStart = inputEl ? inputEl.selectionStart : 0;
    const oldLength = text.length;

    setTempInputs(prev => ({ ...prev, [key]: formatted }));
    
    // Parse using smart Indonesian float parser
    const parsed = parseIndonesianFloat(formatted);
    
    if (!isNaN(parsed)) {
      handleValueChange(key, parsed);
    } else if (clean === '' || clean === '-') {
      // Allow empty inputs during typing
      updateValues({ ...values, [key]: VARIABLE_METADATA[key].min }, key);
    }

    // Restore cursor position on next render cycle
    if (inputEl && ['jp', 'ci', 'omzet', 'ro', 'ea', 'ds', 'sku', 'pa', 'indeks_ro'].includes(key)) {
      setTimeout(() => {
        const newLength = formatted.length;
        const cursorOffset = newLength - oldLength;
        inputEl.selectionStart = inputEl.selectionEnd = Math.max(0, selectionStart + cursorOffset);
      }, 0);
    }
  };

  // Formats floats and percentages on blur
  const handleInputBlur = (key) => {
    setTempInputs(prev => ({
      ...prev,
      [key]: formatForInput(key, values[key])
    }));
  };

  // Preset scenarios in Indonesian
  const applyPreset = (presetName) => {
    setActivePreset(presetName);
    if (presetName === 'baseline') {
      setLocked(new Set());
      setValues(INITIAL_VALUES);
      setPrevValues(INITIAL_VALUES);
      setChangedVar(null);
      setLastUpdateTimes({});
      setChangeDirections({});
    } 
    else if (presetName === 'growth') {
      const nextLocked = new Set(['jp', 'ci']);
      setLocked(nextLocked);
      const nextVals = propagateChange('omzet', 7500000000, INITIAL_VALUES, nextLocked);
      updateValues(nextVals, 'omzet');
    } 
    else if (presetName === 'efficiency') {
      const nextLocked = new Set(['omzet', 'ro']);
      setLocked(nextLocked);
      const nextVals = propagateChange('ds', 2500000, INITIAL_VALUES, nextLocked);
      updateValues(nextVals, 'ds');
    }
    else if (presetName === 'productivity') {
      const nextLocked = new Set(['sku']);
      setLocked(nextLocked);
      const nextVals = propagateChange('pct_pa', 80, INITIAL_VALUES, nextLocked);
      updateValues(nextVals, 'pct_pa');
    }
  };

  // Save current simulation to the history log
  const saveScenarioToLog = () => {
    const scenarioName = activePreset === 'custom' ? `Skenario #${history.length + 1}` : `Preset ${activePreset.toUpperCase()}`;
    const record = {
      id: Date.now(),
      name: scenarioName,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      values: { ...values },
      locked: new Set(locked),
      insight: generateInsights(changedVar, values, prevValues, locked)
    };
    setHistory(prev => [record, ...prev].slice(0, 5));
  };

  // Load a saved scenario from history
  const loadScenarioFromLog = (record) => {
    setValues(record.values);
    setLocked(record.locked);
    setChangedVar(null);
    setLastUpdateTimes({});
    setChangeDirections({});
    setActivePreset('custom');
  };

  const startTutorial = () => {
    setShowWelcome(false);
    setTutorialStep(0);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < 4) {
      setTutorialStep(prev => prev + 1);
    } else {
      setTutorialStep(null);
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(prev => prev - 1);
    }
  };

  const handleLearnMore = () => {
    setShowWelcome(false);
    setTutorialStep(null);
    setTimeout(() => {
      aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const currentInsight = generateInsights(changedVar, values, prevValues, locked);

  // Return backgrounds for nodes that are flashing (light theme colors)
  const getNodeFlashClass = (key) => {
    const isLocked = locked.has(key);
    const lastUpdate = lastUpdateTimes[key];
    
    if (!lastUpdate || Date.now() - lastUpdate > 1500) {
      if (determined.has(key) && !isLocked) {
        return 'border-slate-200 bg-slate-50 opacity-60 text-slate-400';
      }
      if (isLocked) {
        return 'border-emerald-500 bg-emerald-50 text-slate-800 shadow-sm';
      }
      return 'border-slate-200 bg-white text-slate-800 hover:shadow-md shadow-sm';
    }
    
    const dir = changeDirections[key];
    return dir === 'up' 
      ? 'border-emerald-500 bg-emerald-100 text-emerald-950 scale-[1.03] duration-150 animate-flash-green' 
      : 'border-rose-500 bg-rose-100 text-rose-950 scale-[1.03] duration-150 animate-flash-red';
  };

  // Tutorial narrative bubble parameters
  const tutorialNarratives = [
    {
      title: "Selamat Datang!",
      message: "Halo! Saya **Pak Predi**. Selamat datang di Simulator Kinerja Penjualan Nutrifood! Di sini Anda dapat mensimulasikan skenario penjualan secara interaktif. Mari kita lihat cara kerjanya!",
      targetId: null
    },
    {
      title: "Pusat Kontrol Parameter",
      message: "Di sebelah kiri adalah **Pusat Kontrol Parameter**. Di sini Anda dapat mengubah 12 parameter penting seperti Jumlah Penduduk, Coverage, dan Financials secara manual menggunakan slider maupun mengetik angka langsung.",
      targetId: "control-panel-container"
    },
    {
      title: "Sistem Penguncian Pintar",
      message: "Gunakan tombol kunci gembok untuk mempertahankan nilai tertentu. Jika Anda mengunci 2 variabel dalam suatu rumus, variabel ke-3 akan **otomatis dinonaktifkan (abu-abu)** karena terkunci secara matematis!",
      targetId: "lock-guide-target"
    },
    {
      title: "Pohon Alur Metrik",
      message: "Di bagian tengah adalah **Pohon Alur Metrik**. Anda bisa melihat bagaimana **Omzet** bercabang menjadi **Effective Accounts (EA)** dan **Drop Size**. Garis bercahaya menunjukkan arah aliran kalkulasi data!",
      targetId: "metrics-tree-canvas"
    },
    {
      title: "Eksperimen Interaktif",
      message: "Sekarang, giliran Anda! Coba ketik atau geser slider **Drop Size** di panel kiri, dan lihat bagaimana variabel lain berkedip hijau (naik) atau merah (turun) secara otomatis. Selamat mencoba!",
      targetId: "node-card-ds"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      
      {/* WELCOME POPUP MODAL */}
      {showWelcome && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoNutrifood} alt="Logo Nutrifood" className="h-8 object-contain" />
              <div className="h-6 w-px bg-slate-200" />
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Simulator Kinerja Penjualan
              </h2>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Selamat datang di Simulator Interaktif Kinerja Penjualan. Alat ini dirancang untuk melakukan simulasi skenario <strong>"What-If"</strong> pada 12 parameter operasional penjualan secara real-time.
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600" /> Logika Penguncian Pintar (Smart Locking):
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Gunakan ikon kunci untuk mempertahankan nilai parameter tertentu.</li>
                <li>Pada setiap rumus, maksimal hanya 2 variabel yang dapat dikunci.</li>
                <li>Simulator otomatis menonaktifkan variabel ke-3 jika over-constrained, lalu menyeimbangkan nilai secara dua arah (Goal-Seeking).</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={startTutorial}
                className="w-full sm:w-auto flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold py-2.5 px-4 rounded-xl border border-emerald-200/50 flex items-center justify-center gap-2 transition-all"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" /> Pelajari Cara Kerja (Tur Interaktif)
              </button>
              <button 
                onClick={() => setShowWelcome(false)}
                className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                Lewati & Mulai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE TUTORIAL BUBBLE CHAT OVERLAY */}
      {tutorialStep !== null && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-6 md:right-6 md:w-96 z-50 bg-white/95 backdrop-blur-md border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-fade-in-up">
          <button 
            onClick={() => setTutorialStep(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4">
            <img 
              src={pakprediTutorial} 
              alt="Pak Predi" 
              className="w-16 h-16 rounded-full border-2 border-emerald-500 object-cover bg-emerald-50 shadow-inner flex-shrink-0" 
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-extrabold text-sm text-slate-900">Pak Predi</h3>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Pemandu</span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider mb-2">
                {tutorialNarratives[tutorialStep].title}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {tutorialNarratives[tutorialStep].message.split('**').map((chunk, idx) => {
                  return idx % 2 === 1 
                    ? <strong key={idx} className="text-emerald-700 font-extrabold">{chunk}</strong> 
                    : chunk;
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400 font-mono">
              Langkah {tutorialStep + 1} dari 5
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={prevTutorialStep}
                disabled={tutorialStep === 0}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextTutorialStep}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
              >
                {tutorialStep === 4 ? 'Selesai' : 'Lanjut'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="border-b border-slate-200/80 bg-white px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4 text-center sm:text-left w-full sm:w-auto">
          <img src={logoNutrifood} alt="Logo Nutrifood" className="h-8 sm:h-9 object-contain" />
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              Simulator Kinerja Penjualan
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Analisis Skenario "What-If" untuk Keputusan Manajemen Penjualan</p>
          </div>
        </div>

        {/* Preset Scenarios Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-100 p-1.5 border border-slate-200 rounded-xl w-full md:w-auto overflow-x-auto max-w-full">
          <button 
            onClick={() => applyPreset('baseline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activePreset === 'baseline' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Baseline
          </button>
          <button 
            onClick={() => applyPreset('growth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activePreset === 'growth' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Pertumbuhan
          </button>
          <button 
            onClick={() => applyPreset('efficiency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activePreset === 'efficiency' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <Calculator className="w-3.5 h-3.5" /> Efisiensi
          </button>
          <button 
            onClick={() => applyPreset('productivity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activePreset === 'productivity' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Produktivitas
          </button>
          <div className="w-px h-5 bg-slate-300 mx-1" />
          <button
            onClick={startTutorial}
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" /> Tur Panduan
          </button>
        </div>
      </header>

      {/* DASHBOARD LAYOUT CONTENT */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN: CONTROL CENTER (4 cols) */}
        <section 
          id="control-panel-container"
          className={`lg:col-span-4 flex flex-col gap-6 transition-all duration-300 ${tutorialStep === 1 ? 'ring-4 ring-emerald-500 ring-offset-4 ring-offset-slate-50 scale-[1.01] z-30 shadow-2xl' : ''}`}
        >
          <div className="glass-panel-glow p-5 flex flex-col h-full bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" /> Pusat Kontrol Parameter
              </h2>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-lg font-bold font-mono">
                {locked.size} Dikunci
              </span>
            </div>

            {/* Loop Variable Blocks */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[70vh]">
              {Object.entries(BLOCKS).map(([blockKey, block]) => (
                <div key={blockKey} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <h3 className="text-[10px] font-extrabold text-emerald-700 mb-2.5 tracking-wider uppercase px-1">
                    {block.title}
                  </h3>
                  <div className="space-y-2">
                    {block.variables.map(key => {
                      const meta = VARIABLE_METADATA[key];
                      const isLocked = locked.has(key);
                      const isDetermined = determined.has(key);
                      
                      const isPulsingHighlight = (tutorialStep === 2 && key === 'omzet') || (tutorialStep === 4 && key === 'ds');
                      
                      return (
                        <div 
                          key={key} 
                          className={`flex flex-col gap-1.5 p-2 rounded-lg transition-all ${isDetermined && !isLocked ? 'bg-slate-100/50 opacity-55' : 'bg-white border border-slate-100 hover:border-slate-200/80 shadow-sm'} ${isPulsingHighlight ? 'ring-2 ring-emerald-500 scale-[1.02] shadow' : ''}`}
                        >
                          
                          {/* Row Top: Info & Label */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              {meta.label}
                              {isDetermined && !isLocked && (
                                <span className="group relative">
                                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                  <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-slate-900 text-[10px] text-white p-2 rounded-lg shadow-xl w-44 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity leading-normal">
                                    Disesuaikan otomatis oleh sistem. Lepas kunci variabel lain dalam rumus untuk mengedit.
                                  </span>
                                </span>
                              )}
                            </span>

                            {/* Manual Numeric input */}
                            <input
                              id={`input-${key}`}
                              type="text"
                              value={tempInputs[key] || ''}
                              disabled={isDetermined && !isLocked}
                              onChange={(e) => handleManualInput(key, e.target.value, e.target)}
                              onBlur={() => handleInputBlur(key)}
                              className={`w-28 text-right bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded-lg px-2 py-0.5 text-xs font-mono font-bold focus:outline-none transition-all ${isDetermined && !isLocked ? 'text-slate-400 bg-slate-100/55 border-slate-200/50 cursor-not-allowed' : 'text-emerald-700'}`}
                            />
                          </div>

                          {/* Row Bottom: Slider & Lock */}
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={meta.min}
                              max={key === 'pa' ? values.sku : meta.max}
                              step={meta.step}
                              value={values[key]}
                              disabled={isDetermined && !isLocked}
                              onChange={(e) => handleValueChange(key, parseFloat(e.target.value))}
                              className={`flex-1 ${isDetermined && !isLocked ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}
                            />
                            
                            <button
                              id={key === 'omzet' ? 'lock-guide-target' : undefined}
                              onClick={() => handleLockToggle(key)}
                              disabled={isDetermined && !isLocked}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isLocked 
                                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm shadow-emerald-600/10' 
                                  : isDetermined && !isLocked
                                    ? 'text-slate-300 bg-slate-100 cursor-not-allowed border-slate-200/80' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                              } ${tutorialStep === 2 && key === 'omzet' ? 'animate-bounce' : ''}`}
                              title={isLocked ? "Buka Kunci" : isDetermined ? "Tidak Dapat Dikunci (Ditentukan Otomatis)" : "Kunci Variabel"}
                            >
                              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CENTER & RIGHT COLUMN: MAIN CONTENT (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6 min-w-0 w-full">
          
          {/* TOP AREA: THE INTERACTIVE METRICS TREE */}
          <div 
            id="metrics-tree-canvas"
            className={`glass-panel-glow p-3 sm:p-5 flex flex-col flex-1 min-h-[500px] bg-white min-w-0 w-full overflow-hidden transition-all duration-300 ${tutorialStep === 3 ? 'ring-4 ring-emerald-500 ring-offset-4 ring-offset-slate-50 scale-[1.01] z-30 shadow-2xl' : ''}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Pohon Alur Metrik (Interactive Tree)
              </h2>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 text-[10px] text-slate-500 font-bold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></span> Nilai Naik</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500"></span> Nilai Turun</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-600"></span> Arah Rumus</span>
              </div>
            </div>

            {/* Tree Canvas Wrapper with Horizontal Scroll on Mobile */}
            <div className="overflow-x-auto w-full max-w-full border border-slate-100 rounded-xl shadow-inner bg-slate-50 scrollbar-thin">
              <div 
                ref={containerRef} 
                className="relative w-[850px] h-[550px] overflow-hidden select-none"
              >
              
              {/* SVG Connector overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Base SVG Flow Lines (Background) */}
                {/* JP -> Omzet */}
                <line x1={`${nodePositions.jp.x}%`} y1={`${nodePositions.jp.y}%`} x2={`${nodePositions.omzet.x}%`} y2={`${nodePositions.omzet.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.jp.x}%`} y1={`${nodePositions.jp.y}%`} x2={`${nodePositions.omzet.x}%`} y2={`${nodePositions.omzet.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* CI -> Omzet */}
                <line x1={`${nodePositions.ci.x}%`} y1={`${nodePositions.ci.y}%`} x2={`${nodePositions.omzet.x}%`} y2={`${nodePositions.omzet.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.ci.x}%`} y1={`${nodePositions.ci.y}%`} x2={`${nodePositions.omzet.x}%`} y2={`${nodePositions.omzet.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* Omzet -> EA */}
                <line x1={`${nodePositions.omzet.x}%`} y1={`${nodePositions.omzet.y}%`} x2={`${nodePositions.ea.x}%`} y2={`${nodePositions.ea.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.omzet.x}%`} y1={`${nodePositions.omzet.y}%`} x2={`${nodePositions.ea.x}%`} y2={`${nodePositions.ea.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* Omzet -> DS */}
                <line x1={`${nodePositions.omzet.x}%`} y1={`${nodePositions.omzet.y}%`} x2={`${nodePositions.ds.x}%`} y2={`${nodePositions.ds.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.omzet.x}%`} y1={`${nodePositions.omzet.y}%`} x2={`${nodePositions.ds.x}%`} y2={`${nodePositions.ds.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* EA -> RO */}
                <line x1={`${nodePositions.ea.x}%`} y1={`${nodePositions.ea.y}%`} x2={`${nodePositions.ro.x}%`} y2={`${nodePositions.ro.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.ea.x}%`} y1={`${nodePositions.ea.y}%`} x2={`${nodePositions.ro.x}%`} y2={`${nodePositions.ro.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* EA -> %EA */}
                <line x1={`${nodePositions.ea.x}%`} y1={`${nodePositions.ea.y}%`} x2={`${nodePositions.pct_ea.x}%`} y2={`${nodePositions.pct_ea.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.ea.x}%`} y1={`${nodePositions.ea.y}%`} x2={`${nodePositions.pct_ea.x}%`} y2={`${nodePositions.pct_ea.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* JP -> Indeks RO */}
                <line x1={`${nodePositions.jp.x}%`} y1={`${nodePositions.jp.y}%`} x2={`${nodePositions.indeks_ro.x}%`} y2={`${nodePositions.indeks_ro.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.jp.x}%`} y1={`${nodePositions.jp.y}%`} x2={`${nodePositions.indeks_ro.x}%`} y2={`${nodePositions.indeks_ro.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* RO -> Indeks RO */}
                <line x1={`${nodePositions.ro.x}%`} y1={`${nodePositions.ro.y}%`} x2={`${nodePositions.indeks_ro.x}%`} y2={`${nodePositions.indeks_ro.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.ro.x}%`} y1={`${nodePositions.ro.y}%`} x2={`${nodePositions.indeks_ro.x}%`} y2={`${nodePositions.indeks_ro.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* PA -> Line/RO */}
                <line x1={`${nodePositions.pa.x}%`} y1={`${nodePositions.pa.y}%`} x2={`${nodePositions.line_ro.x}%`} y2={`${nodePositions.line_ro.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.pa.x}%`} y1={`${nodePositions.pa.y}%`} x2={`${nodePositions.line_ro.x}%`} y2={`${nodePositions.line_ro.y}%`} stroke="#a855f7" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />

                {/* PA -> %PA */}
                <line x1={`${nodePositions.pa.x}%`} y1={`${nodePositions.pa.y}%`} x2={`${nodePositions.pct_pa.x}%`} y2={`${nodePositions.pct_pa.y}%`} stroke="rgba(226, 232, 240, 0.8)" strokeWidth="2.5" />
                <line x1={`${nodePositions.pa.x}%`} y1={`${nodePositions.pa.y}%`} x2={`${nodePositions.pct_pa.x}%`} y2={`${nodePositions.pct_pa.y}%`} stroke="#a855f7" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-dash" />
              </svg>

              {/* NODE LAYOUT CONTAINER */}
              {/* JP */}
              <NodeCard 
                varKey="jp" 
                posStyle={{ left: `${nodePositions.jp.x}%`, top: `${nodePositions.jp.y}%` }}
                isDragging={draggedNode === 'jp'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
              />

              {/* CI */}
              <NodeCard 
                varKey="ci" 
                posStyle={{ left: `${nodePositions.ci.x}%`, top: `${nodePositions.ci.y}%` }}
                isDragging={draggedNode === 'ci'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
              />

              {/* OMZET */}
              <NodeCard 
                varKey="omzet" 
                posStyle={{ left: `${nodePositions.omzet.x}%`, top: `${nodePositions.omzet.y}%` }}
                isDragging={draggedNode === 'omzet'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
                isRoot={true}
              />

              {/* EA */}
              <NodeCard 
                varKey="ea" 
                posStyle={{ left: `${nodePositions.ea.x}%`, top: `${nodePositions.ea.y}%` }}
                isDragging={draggedNode === 'ea'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
              />

              {/* DS */}
              <NodeCard 
                varKey="ds" 
                posStyle={{ left: `${nodePositions.ds.x}%`, top: `${nodePositions.ds.y}%` }}
                isDragging={draggedNode === 'ds'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
                isPulsingHighlight={tutorialStep === 4}
              />

              {/* RO */}
              <NodeCard 
                varKey="ro" 
                posStyle={{ left: `${nodePositions.ro.x}%`, top: `${nodePositions.ro.y}%` }}
                isDragging={draggedNode === 'ro'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
              />

              {/* %EA */}
              <NodeCard 
                varKey="pct_ea" 
                posStyle={{ left: `${nodePositions.pct_ea.x}%`, top: `${nodePositions.pct_ea.y}%` }}
                isDragging={draggedNode === 'pct_ea'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
              />

              {/* INDEKS RO */}
              <NodeCard 
                varKey="indeks_ro" 
                posStyle={{ left: `${nodePositions.indeks_ro.x}%`, top: `${nodePositions.indeks_ro.y}%` }}
                isDragging={draggedNode === 'indeks_ro'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
              />

              {/* PA */}
              <NodeCard 
                varKey="pa" 
                posStyle={{ left: `${nodePositions.pa.x}%`, top: `${nodePositions.pa.y}%` }}
                isDragging={draggedNode === 'pa'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
                accent="purple"
              />

              {/* SKU */}
              <NodeCard 
                varKey="sku" 
                posStyle={{ left: `${nodePositions.sku.x}%`, top: `${nodePositions.sku.y}%` }}
                isDragging={draggedNode === 'sku'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
                accent="slate"
              />

              {/* %PA */}
              <NodeCard 
                varKey="pct_pa" 
                posStyle={{ left: `${nodePositions.pct_pa.x}%`, top: `${nodePositions.pct_pa.y}%` }}
                isDragging={draggedNode === 'pct_pa'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
                accent="purple"
              />

              {/* Standalone 1: %Retur */}
              <NodeCard 
                varKey="pct_retur" 
                posStyle={{ left: `${nodePositions.pct_retur.x}%`, top: `${nodePositions.pct_retur.y}%` }}
                isDragging={draggedNode === 'pct_retur'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
                accent="slate"
              />

              {/* Standalone 2: Line/RO */}
              <NodeCard 
                varKey="line_ro" 
                posStyle={{ left: `${nodePositions.line_ro.x}%`, top: `${nodePositions.line_ro.y}%` }}
                isDragging={draggedNode === 'line_ro'}
                onMouseDown={handleNodeMouseDown}
                onTouchStart={handleNodeTouchStart}
                values={values} 
                locked={locked} 
                determined={determined}
                tempInputs={tempInputs}
                handleManualInput={handleManualInput}
                handleInputBlur={handleInputBlur}
                handleLockToggle={handleLockToggle}
                getNodeFlashClass={getNodeFlashClass}
                accent="purple"
              />
            </div>
            </div>
          </div>

          {/* BOTTOM AREA: DYNAMIC AI INSIGHTS & HISTORY */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Realtime AI Insights Panel (8 cols) */}
            <div className="md:col-span-8 glass-panel-glow p-5 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <h2 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Analisis Insights AI Real-Time
                  </h2>
                  <button 
                    onClick={saveScenarioToLog}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Simpan Skenario
                  </button>
                </div>
                
                <div className="text-slate-700 text-sm leading-relaxed p-3 bg-slate-50 border border-slate-200/80 rounded-xl min-h-[72px]">
                  {renderMarkdown(currentInsight)}
                </div>
              </div>
              
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-2.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Ubah nilai parameter di atas untuk memantau perubahan domino. Skenario yang disimpan akan tampil di sisi kanan.
              </div>
            </div>

            {/* History comparison panel (4 cols) */}
            <div className="md:col-span-4 glass-panel p-5 flex flex-col bg-white">
              <h2 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" /> Log Skenario
              </h2>
              
              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[110px] pr-1">
                {history.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-4">Belum ada skenario disimpan.</p>
                ) : (
                  history.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => loadScenarioFromLog(record)}
                      className="w-full text-left bg-slate-50 hover:bg-slate-100/85 border border-slate-200/80 rounded-lg p-2 transition-all flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-1">
                        <span className="font-bold text-slate-700 block truncate">{record.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{record.timestamp}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold font-mono">
                        {formatValue('omzet', record.values.omzet).replace('Rp', '').trim()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ABOUT & DOCUMENTATION GUIDE SECTION */}
      <section ref={aboutRef} className="bg-white border-t border-slate-200 mt-12 py-10 px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Panduan Penggunaan & Penjelasan Komponen
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm leading-relaxed text-slate-600">
            {/* Col 1: Cara Kerja */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Info className="w-4.5 h-4.5 text-emerald-600" /> Bagaimana Cara Kerjanya?
              </h3>
              <p>
                Simulator ini menggunakan sistem <strong className="text-slate-800 font-bold">ketergantungan matematika</strong> terintegrasi. Ketika Anda menggeser salah satu parameter penjualan, variabel lain akan bergerak menyesuaikan untuk menyeimbangkan persamaan tanpa memicu perulangan tak terbatas.
              </p>
              <p>
                <strong className="text-slate-800 font-bold">Sistem Penguncian (Locking):</strong> Mengunci variabel menempatkan batasan tetap. Misalnya, jika Anda menetapkan target <strong className="text-slate-800 font-bold">Omzet</strong> tertentu dan mengunci nilainya, mengubah <strong className="text-slate-800 font-bold">Effective Accounts (EA)</strong> akan secara otomatis menyesuaikan <strong className="text-slate-800 font-bold">Drop Size</strong> demi mencapai omzet tersebut.
              </p>
            </div>

            {/* Col 2: Komponen Metrik Utama */}
            <div className="space-y-3 col-span-2">
              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-1.5">
                Daftar Detail 12 Parameter
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <p><strong className="text-slate-800 font-bold">• Jumlah Penduduk (JP):</strong> Estimasi total populasi di wilayah pemasaran.</p>
                  <p><strong className="text-slate-800 font-bold">• Indeks Konsumsi (CI):</strong> Tingkat konsumsi rata-rata produk per kepala (CI = Omzet / JP).</p>
                  <p><strong className="text-slate-800 font-bold">• Omzet:</strong> Total target/nilai penjualan bruto dalam rupiah.</p>
                  <p><strong className="text-slate-800 font-bold">• Registered Outlets (RO):</strong> Total jumlah warung/outlets yang terdaftar secara resmi.</p>
                  <p><strong className="text-slate-800 font-bold">• Effective Accounts (EA):</strong> Jumlah outlet yang aktif memesan produk dalam kurun waktu tertentu.</p>
                  <p><strong className="text-slate-800 font-bold">• % Effective Accounts (%EA):</strong> Persentase cakupan outlet aktif (%EA = EA / RO * 100).</p>
                </div>
                <div className="space-y-2">
                  <p><strong className="text-slate-800 font-bold">• Drop Size:</strong> Rata-rata nominal belanja per transaksi outlet aktif (Drop Size = Omzet / EA).</p>
                  <p><strong className="text-slate-800 font-bold">• Stock Keeping Units (SKU):</strong> Varian produk yang aktif ditawarkan di pasar.</p>
                  <p><strong className="text-slate-800 font-bold">• Product Active (PA):</strong> Outlet yang aktif melakukan transaksi berulang dengan produk aktif.</p>
                  <p><strong className="text-slate-800 font-bold">• % Product Active (%PA):</strong> Penetrasi produktivitas produk (%PA = PA / SKU * 100).</p>
                  <p><strong className="text-slate-800 font-bold">• % Retur:</strong> Rasio pengembalian produk rusak/kedaluwarsa.</p>
                  <p><strong className="text-slate-800 font-bold">• Line/RO:</strong> Rata-rata item pesanan terdaftar di setiap outlet.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© 2026 PT Nutrifood Indonesia. Hak Cipta Dilindungi.</p>
            <p>Dikembangkan untuk Kebutuhan Presentasi Manajemen Internal.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Reusable Node component for the flow chart
function NodeCard({ 
  varKey, 
  posStyle,
  isDragging,
  onMouseDown,
  onTouchStart,
  values, 
  locked, 
  determined, 
  tempInputs, 
  handleManualInput, 
  handleInputBlur,
  handleLockToggle, 
  getNodeFlashClass,
  isRoot = false,
  isPulsingHighlight = false,
  accent = 'cyan' // can be cyan, purple, slate
}) {
  const meta = VARIABLE_METADATA[varKey];
  const isLocked = locked.has(varKey);
  const isDetermined = determined.has(varKey);
  const activeTempInput = tempInputs[varKey] || '';
  
  // Decide accent color themes (White/Green Theme styles)
  const activeBorders = {
    cyan: isLocked ? 'border-emerald-500 bg-emerald-50 text-slate-800' : 'hover:border-emerald-500/50',
    purple: isLocked ? 'border-purple-500 bg-purple-50 text-slate-800' : 'hover:border-purple-500/50',
    slate: isLocked ? 'border-slate-500 bg-slate-100 text-slate-800' : 'hover:border-slate-500/50'
  };

  const lockBgColors = {
    cyan: isLocked ? 'bg-emerald-600 text-white border border-emerald-700' : 'text-slate-400 hover:text-slate-600',
    purple: isLocked ? 'bg-purple-600 text-white border border-purple-700' : 'text-slate-400 hover:text-slate-600',
    slate: isLocked ? 'bg-slate-600 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-600'
  };

  return (
    <div 
      id={`node-card-${varKey}`}
      style={{ ...posStyle, transform: 'translate(-50%, -50%)', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onMouseDown={(e) => onMouseDown && onMouseDown(varKey, e)}
      onTouchStart={(e) => onTouchStart && onTouchStart(varKey, e)}
      className={`absolute w-40 flex flex-col p-2.5 rounded-xl border border-slate-200 text-left ${getNodeFlashClass(varKey)} ${activeBorders[accent]} ${isPulsingHighlight ? 'ring-2 ring-emerald-500 scale-[1.03] shadow' : ''} ${isDragging ? 'shadow-lg z-50 scale-[1.05] border-emerald-500/80 ring-2 ring-emerald-500/30' : 'transition-all duration-300'}`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between mb-1.5 select-none">
        <span className="text-[8px] font-extrabold text-slate-500 tracking-wider uppercase truncate max-w-[105px]">
          {meta.label}
        </span>
        
        {/* Node Lock Button */}
        <button
          onClick={() => handleLockToggle(varKey)}
          disabled={isDetermined && !isLocked}
          className={`p-0.5 rounded transition-all ${lockBgColors[accent]} ${isDetermined && !isLocked ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-100'}`}
        >
          {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
        </button>
      </div>

      {/* Node Input Value */}
      <input
        id={`node-input-${varKey}`}
        type="text"
        value={activeTempInput}
        disabled={isDetermined && !isLocked}
        onChange={(e) => handleManualInput(varKey, e.target.value, e.target)}
        onBlur={() => handleInputBlur(varKey)}
        className="w-full text-left bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 text-emerald-700 disabled:text-slate-400 disabled:bg-slate-100/50"
      />

      {/* Variable Unit Badge */}
      <div className="mt-1 flex items-center justify-between text-[8px] text-slate-400 font-mono font-semibold select-none">
        <span>{meta.unit}</span>
        {isDetermined && !isLocked ? (
          <span className="text-slate-400 font-sans font-normal">sistem</span>
        ) : isLocked ? (
          <span className="text-emerald-600 font-sans">kunci</span>
        ) : (
          <span className="text-slate-400 font-sans font-normal">edit</span>
        )}
      </div>
    </div>
  );
}

export default App;
