// Makiety układu 13 ekranów mobilnych (wygenerowane narzędziem AI, 2026-10-24).
// Tylko wzór rozmieszczenia elementów; styl (kolory, karty, cienie) bierzemy
// ze styl-kokpit.jpg. Plik nie wchodzi do aplikacji (wykluczony w tsconfig
// i eslint), nie poprawiamy go.
import React from 'react';
import {
  ChevronLeft, ChevronRight, MoreHorizontal, Home, List, Plus,
  CalendarClock, PieChart, TrendingUp, TrendingDown, Search,
  SlidersHorizontal, ShoppingBag, Utensils, Car, Zap, Film,
  HeartPulse, Wallet, X, Trash2, Edit2, Pause, User, ArrowLeft,
  AlertCircle, RefreshCcw, Check, RefreshCw
} from 'lucide-react';

// --- UTILITY COMPONENTS ---

const DeviceShell = ({ children, title }) => (
  <div className="flex flex-col items-center">
    <span className="text-gray-500 font-semibold mb-4 text-sm">{title}</span>
    <div className="w-[390px] h-[844px] bg-[#F2F2F7] border-[12px] border-black rounded-[50px] relative overflow-hidden shadow-2xl shrink-0">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50"></div>

      {/* Status Bar */}
      <div className="absolute top-2 left-6 text-[11px] font-semibold z-50">9:41</div>
      <div className="absolute top-2 right-5 flex space-x-1 z-50 items-center">
        <div className="w-4 h-2.5 border border-black rounded-sm relative">
            <div className="absolute left-0 top-0 h-full w-2/3 bg-black"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full h-full relative overflow-y-auto overflow-x-hidden hide-scrollbar bg-[#F2F2F7]">
        {children}
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black rounded-full z-50 pointer-events-none"></div>
    </div>
  </div>
);

const Header = ({ title = "październik 2026", leftIcon = <ChevronLeft size={24}/>, showRight = true }) => (
  <div className="pt-12 pb-4 px-4 flex justify-between items-center sticky top-0 bg-[#F2F2F7]/90 backdrop-blur-md z-30">
    <button className="p-2 -ml-2 text-blue-500 touch-target">{leftIcon}</button>
    <button className="font-semibold text-lg flex items-center gap-1 active:opacity-70">{title}</button>
    {showRight ? (
      <div className="flex gap-2">
        <button className="p-2 text-blue-500 touch-target"><ChevronRight size={24}/></button>
        <button className="p-2 -mr-2 text-blue-500 touch-target"><MoreHorizontal size={24}/></button>
      </div>
    ) : <div className="w-12"></div>}
  </div>
);

const BottomNav = ({ active }) => (
  <div className="absolute bottom-0 w-full h-[90px] bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around items-start pt-2 px-2 z-40 pb-6">
    <NavItem icon={<Home />} label="Kokpit" isActive={active === 'kokpit'} />
    <NavItem icon={<List />} label="Historia" isActive={active === 'historia'} />

    <div className="relative -top-6 flex flex-col items-center">
      <button className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 touch-target active:scale-95 transition-transform">
        <Plus size={28} />
      </button>
    </div>

    <NavItem icon={<CalendarClock />} label="Zlecenia" isActive={active === 'zlecenia'} />
    <NavItem icon={<PieChart />} label="Raporty" isActive={active === 'raporty'} />
  </div>
);

const NavItem = ({ icon, label, isActive }) => (
  <button className={`flex flex-col items-center justify-center space-y-1 p-2 touch-target w-16 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
    {React.cloneElement(icon, { size: 24, strokeWidth: isActive ? 2.5 : 2 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const BottomSheetOverlay = () => <div className="absolute inset-0 bg-black/40 z-40" />;
const BottomSheet = ({ children, h = "h-auto" }) => (
  <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 pt-3 pb-10 px-5 flex flex-col shadow-2xl ${h}`}>
    <div className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />
    {children}
  </div>
);

const SegmentedControl = ({ options, active }) => (
  <div className="flex bg-gray-200/80 p-1 rounded-xl w-full relative">
    {options.map((opt) => (
      <button
        key={opt}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg relative z-10 transition-colors ${active === opt ? 'text-gray-900' : 'text-gray-500'}`}
      >
        {opt}
        {active === opt && <div className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10" />}
      </button>
    ))}
  </div>
);

const FormatCurrency = (amount) => {
  const parts = amount.toFixed(2).split('.');
  const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${whole},${parts[1]} zł`;
};

// --- SCREENS ---

const Screen1 = () => (
  <DeviceShell title="EKRAN 1 - Kokpit">
    <Header />
    <div className="px-4 space-y-4 pb-32">
      {/* Saldo Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
        <span className="text-gray-500 font-medium">Saldo</span>
        <div className="text-[40px] font-bold text-gray-900 mt-1 tracking-tight">3 450,20 zł</div>
      </div>

      {/* Income/Expense Cards */}
      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100/50">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3">
            <TrendingUp size={20} />
          </div>
          <span className="text-gray-500 text-sm font-medium">Przychody</span>
          <div className="text-lg font-bold text-gray-900 mt-1">8 200,00 zł</div>
        </div>
        <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100/50">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
            <TrendingDown size={20} />
          </div>
          <span className="text-gray-500 text-sm font-medium">Wydatki</span>
          <div className="text-lg font-bold text-gray-900 mt-1">4 749,80 zł</div>
        </div>
      </div>

      {/* Budget Mini-indicator */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/50">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
          <span>Budżet miesięczny</span>
          <span>Wykorzystano 58% · zostało 3 450,20 zł</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: '58%' }}></div>
        </div>
      </div>
    </div>
    <BottomNav active="kokpit" />
  </DeviceShell>
);

const Screen2 = () => (
  <DeviceShell title="EKRAN 2 - Historia">
    <Header />
    <div className="px-4 space-y-4 pb-32">
      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-200/70 rounded-xl flex items-center px-3 h-11 text-gray-500">
          <Search size={20} />
          <input type="text" placeholder="Szukaj w opisie i kategorii" className="bg-transparent border-none focus:outline-none ml-2 text-sm w-full text-gray-900 placeholder-gray-500" />
        </div>
        <button className="w-11 h-11 bg-gray-200/70 rounded-xl flex items-center justify-center text-blue-600 relative touch-target">
          <SlidersHorizontal size={20} />
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">2</span>
        </button>
      </div>

      {/* List */}
      <div className="mt-4">
        <div className="flex justify-between text-sm font-semibold text-gray-500 mb-3 px-1">
          <span>Dziś, 24 października</span>
          <span>−12,99 zł</span>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {/* Normal Row */}
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                <Utensils size={24} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Jedzenie</div>
                <div className="text-sm text-gray-500">Biedronka</div>
              </div>
            </div>
            <div className="font-semibold text-gray-900">−45,99 zł</div>
          </div>

          {/* Swiped Row */}
          <div className="relative flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50" style={{ transform: 'translateX(-120px)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                <Film size={24} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Rozrywka</div>
                <div className="text-sm text-gray-500">Kino</div>
              </div>
            </div>
            <div className="font-semibold text-gray-900">−33,00 zł</div>

            {/* Actions Behind */}
            <div className="absolute right-[-120px] top-0 bottom-0 flex">
              <button className="w-16 bg-blue-500 flex flex-col items-center justify-center text-white text-xs gap-1">
                <Edit2 size={18}/> Edytuj
              </button>
              <button className="w-16 bg-red-500 flex flex-col items-center justify-center text-white text-xs gap-1">
                <Trash2 size={18}/> Usuń
              </button>
            </div>
          </div>

          {/* Income Row with recurring */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Wallet size={24} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Wypłata</div>
                <div className="text-sm text-gray-500">Wynagrodzenie</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="font-semibold text-green-600">+8 200,00 zł</div>
              <RefreshCw size={12} className="text-gray-400 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <BottomNav active="historia" />
  </DeviceShell>
);

const Screen3 = () => (
  <DeviceShell title="EKRAN 3 - Filtry">
    <div className="w-full h-full relative">
      <Screen2Content /> {/* Just static content for background */}
      <BottomSheetOverlay />
      <BottomSheet>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Filtry</h2>

        <div className="space-y-6 overflow-y-auto hide-scrollbar max-h-[500px]">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Typ</h3>
            <SegmentedControl options={['Uznania', 'Obciążenia']} active="Obciążenia" />
            <div className="flex items-center justify-between mt-4">
              <span className="font-medium text-gray-900">Tylko zlecenia stałe</span>
              <div className="w-12 h-7 bg-gray-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Kategorie</h3>
            <div className="flex flex-wrap gap-2">
              {['Jedzenie', 'Transport'].map(c => (
                <button key={c} className="px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-medium text-sm flex items-center gap-1">
                  {c} <Check size={14}/>
                </button>
              ))}
              {['Rachunki', 'Rozrywka', 'Zdrowie', 'Wypłata'].map(c => (
                <button key={c} className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Sortuj</h3>
            <div className="flex gap-4 mb-3">
              <span className="w-16 text-sm text-gray-500">Data</span>
              <SegmentedControl options={['Najnowsze', 'Najstarsze']} active="Najnowsze" />
            </div>
            <div className="flex gap-4">
              <span className="w-16 text-sm text-gray-500">Kwota</span>
              <SegmentedControl options={['Rosnąco', 'Malejąco']} active="Malejąco" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <button className="w-full bg-blue-600 text-white font-semibold text-lg py-4 rounded-2xl active:bg-blue-700 touch-target">
            Pokaż 12 wyników
          </button>
          <button className="w-full text-blue-600 font-semibold text-base py-2 touch-target">
            Wyczyść wszystko
          </button>
        </div>
      </BottomSheet>
    </div>
  </DeviceShell>
);

// Helper for bg
const Screen2Content = () => (
  <div className="pt-12 px-4 space-y-4 filter blur-[2px] opacity-80 pointer-events-none">
     <div className="flex justify-between items-center mb-8 text-gray-400"><ChevronLeft/><span className="font-bold text-gray-800">Historia</span><MoreHorizontal/></div>
     <div className="h-11 bg-gray-200 rounded-xl"></div>
     <div className="h-40 bg-white rounded-2xl"></div>
  </div>
);

const Screen4 = () => (
  <DeviceShell title="EKRAN 4 - Nowa transakcja">
    <div className="w-full h-full bg-white flex flex-col relative pt-12">
      <div className="px-4 flex justify-between items-center mb-6">
        <button className="p-2 -ml-2 text-gray-900 touch-target"><X size={24}/></button>
        <span className="font-semibold text-lg">Nowa transakcja</span>
        <div className="w-10"></div>
      </div>

      <div className="px-6 flex flex-col flex-1">
        <div className="w-48 self-center mb-8">
          <SegmentedControl options={['Wydatek', 'Przychód']} active="Wydatek" />
        </div>

        <div className="text-center mb-8">
          <div className="text-[56px] font-bold text-gray-900 leading-none tracking-tighter">0,00 <span className="text-4xl text-gray-400 font-normal">zł</span></div>
        </div>

        <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-8">
           {[
             {i: <Utensils/>, l: 'Jedzenie', active: true, color: 'bg-orange-100 text-orange-500'},
             {i: <Car/>, l: 'Transport', color: 'bg-blue-100 text-blue-500'},
             {i: <Zap/>, l: 'Rachunki', color: 'bg-yellow-100 text-yellow-600'},
             {i: <Film/>, l: 'Rozrywka', color: 'bg-indigo-100 text-indigo-500'},
             {i: <HeartPulse/>, l: 'Zdrowie', color: 'bg-red-100 text-red-500'},
             {i: <ShoppingBag/>, l: 'Zakupy', color: 'bg-pink-100 text-pink-500'},
             {i: <Plus/>, l: 'Nowa', color: 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'}
           ].map((cat, idx) => (
             <div key={idx} className="flex flex-col items-center gap-2">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center ${cat.active ? 'ring-2 ring-offset-2 ring-orange-500 bg-orange-500 text-white' : cat.color}`}>
                 {React.cloneElement(cat.i, { size: 24 })}
               </div>
               <span className={`text-[11px] font-medium ${cat.active ? 'text-gray-900' : 'text-gray-500'}`}>{cat.l}</span>
             </div>
           ))}
        </div>

        <div className="space-y-4 mt-auto mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center text-gray-900 font-medium">
            <span>Data</span>
            <span className="text-gray-500">Dziś, 24.10.2026</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-500 font-medium">
            Opis (opcjonalnie)
          </div>
        </div>
      </div>

      {/* Keyboard Area */}
      <div className="bg-gray-100 pb-8 pt-4 px-2 relative rounded-t-3xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="px-4 -mt-10 mb-4 relative z-10">
          <button className="w-full bg-blue-600 text-white font-semibold text-lg py-4 rounded-2xl shadow-lg shadow-blue-600/30 active:bg-blue-700">
            Zapisz
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-6">
          {[1,2,3,4,5,6,7,8,9,',',0].map(n => (
            <button key={n} className="h-14 bg-white rounded-xl text-2xl font-medium text-gray-900 active:bg-gray-200 shadow-sm">{n}</button>
          ))}
          <button className="h-14 rounded-xl flex items-center justify-center text-2xl text-gray-900 active:bg-gray-300">
            <X size={28}/> {/* Simulate backspace icon */}
          </button>
        </div>
      </div>
    </div>
  </DeviceShell>
);

const Screen5 = () => (
  <DeviceShell title="EKRAN 5 - Edycja">
    <div className="w-full h-full bg-white flex flex-col relative pt-12 overflow-y-auto hide-scrollbar pb-32">
      <div className="px-4 flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
        <button className="p-2 -ml-2 text-gray-900 touch-target"><X size={24}/></button>
        <span className="font-semibold text-lg">Edytuj transakcję</span>
        <div className="w-10"></div>
      </div>

      <div className="px-6 flex flex-col flex-1">
        <div className="w-48 self-center mb-8">
          <SegmentedControl options={['Wydatek', 'Przychód']} active="Wydatek" />
        </div>

        <div className="text-center mb-8">
          <div className="text-[56px] font-bold text-gray-900 leading-none tracking-tighter">45,99 <span className="text-4xl text-gray-400 font-normal">zł</span></div>
        </div>

        <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-8">
           {[
             {i: <Utensils/>, l: 'Jedzenie', active: true},
             {i: <Car/>, l: 'Transport', color: 'bg-blue-100 text-blue-500'},
             {i: <Zap/>, l: 'Rachunki', color: 'bg-yellow-100 text-yellow-600'},
             {i: <Film/>, l: 'Rozrywka', color: 'bg-indigo-100 text-indigo-500'},
             {i: <Plus/>, l: 'Nowa', color: 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'}
           ].map((cat, idx) => (
             <div key={idx} className="flex flex-col items-center gap-2">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center ${cat.active ? 'ring-2 ring-offset-2 ring-orange-500 bg-orange-500 text-white' : cat.color}`}>
                 {React.cloneElement(cat.i, { size: 24 })}
               </div>
               <span className={`text-[11px] font-medium ${cat.active ? 'text-gray-900' : 'text-gray-500'}`}>{cat.l}</span>
             </div>
           ))}
        </div>

        <div className="space-y-4 mt-auto mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center text-gray-900 font-medium">
            <span>Data</span>
            <span className="text-gray-900">Dziś, 24.10.2026</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium">
            Biedronka
          </div>
        </div>

        <div className="space-y-3 mb-10">
          <button className="w-full bg-blue-600 text-white font-semibold text-lg py-4 rounded-2xl shadow-lg active:bg-blue-700">
            Zapisz zmiany
          </button>
          <button className="w-full bg-red-50 text-red-600 font-semibold text-lg py-4 rounded-2xl active:bg-red-100 flex items-center justify-center gap-2">
            <Trash2 size={20}/> Usuń transakcję
          </button>
        </div>
      </div>
    </div>
  </DeviceShell>
);

const Screen6 = () => (
  <DeviceShell title="EKRAN 6 - Nowa kategoria">
    <div className="w-full h-full relative">
       <div className="w-full h-full bg-white filter blur-sm"></div>
       <BottomSheetOverlay />
       <BottomSheet>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Nowa kategoria</h2>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-400 font-medium flex items-center">
              <span className="text-gray-900">Nazwa kategorii...</span>
              <div className="ml-auto w-1 h-5 bg-blue-500 animate-pulse"></div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-xl w-max">
              Typ: <span className="font-semibold text-gray-900">Wydatek</span>
            </div>
          </div>

          <div className="flex gap-4">
             <button className="flex-1 bg-gray-100 text-gray-700 font-semibold text-base py-4 rounded-2xl">
               Anuluj
             </button>
             <button className="flex-1 bg-blue-600 text-white font-semibold text-base py-4 rounded-2xl opacity-50">
               Dodaj
             </button>
          </div>
       </BottomSheet>
    </div>
  </DeviceShell>
);

const Screen7 = () => (
  <DeviceShell title="EKRAN 7 - Wybór okresu">
    <div className="w-full h-full relative bg-[#F2F2F7]">
       <Header />
       <BottomSheetOverlay />
       <BottomSheet>
          <div className="flex justify-between items-center mb-6 px-4">
            <button className="p-2 text-gray-400"><ChevronLeft size={24}/></button>
            <span className="text-xl font-bold text-gray-900">2026</span>
            <button className="p-2 text-gray-400"><ChevronRight size={24}/></button>
          </div>

          <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-8">
            {['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'].map((m, i) => {
              const isOct = i === 9;
              const isCur = i === 8; // wrzesien np
              return (
                <button key={m} className={`h-12 rounded-xl text-sm font-semibold flex items-center justify-center capitalize transition-colors
                  ${isOct ? 'bg-blue-600 text-white shadow-md' :
                    isCur ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                  {m}
                </button>
              )
            })}
          </div>

          <button className="w-full bg-gray-100 text-gray-900 font-semibold text-base py-4 rounded-2xl active:bg-gray-200">
             Bieżący miesiąc
          </button>
       </BottomSheet>
    </div>
  </DeviceShell>
);

const Screen8 = () => (
  <DeviceShell title="EKRAN 8 - Potwierdzenie">
    <div className="w-full h-full relative bg-white">
       <BottomSheetOverlay />
       <BottomSheet>
          <div className="flex flex-col items-center mb-6 mt-2">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Usunąć transakcję?</h2>
            <p className="text-gray-500 text-center text-sm px-4">
              Ta akcja jest nieodwracalna. Transakcja zostanie trwale usunięta z historii.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex justify-between items-center border border-gray-100">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                  <Utensils size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Jedzenie</div>
                  <div className="text-xs text-gray-500">Biedronka, 24 paź</div>
                </div>
             </div>
             <div className="font-bold text-gray-900">45,99 zł</div>
          </div>

          <div className="flex flex-col gap-3">
             <button className="w-full bg-red-500 text-white font-semibold text-lg py-4 rounded-2xl shadow-sm active:bg-red-600">
               Usuń
             </button>
             <button className="w-full bg-gray-100 text-gray-700 font-semibold text-lg py-4 rounded-2xl active:bg-gray-200">
               Anuluj
             </button>
          </div>
       </BottomSheet>
    </div>
  </DeviceShell>
);

const Screen9 = () => (
  <DeviceShell title="EKRAN 9 - Zlecenia">
    <Header title="Zlecenia stałe" showRight={false} />
    <div className="px-4 pb-32">
      <button className="w-full mb-6 text-blue-600 font-semibold text-sm flex items-center justify-center gap-1 p-2 bg-blue-50 rounded-xl">
        <Plus size={18}/> Dodaj zlecenie
      </button>

      <div className="space-y-4">
        {/* Active Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold text-gray-900 text-lg">Czynsz</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Zap size={14}/> Rachunki</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">−2 400,00 zł</div>
              <div className="text-xs text-green-600 font-medium mt-1 bg-green-50 px-2 py-0.5 rounded text-center inline-block">Aktywne</div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-50">
            <div className="text-sm">
              <div className="text-gray-900 font-medium">Co miesiąc, 10. dnia</div>
              <div className="text-gray-500 text-xs mt-0.5">Nast. termin: 10.11.2026</div>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-12 h-7 bg-green-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div>
               </div>
               <button className="p-2 text-gray-400"><MoreHorizontal size={20}/></button>
            </div>
          </div>
        </div>

        {/* Paused Card */}
        <div className="bg-white/50 rounded-2xl p-5 shadow-sm border border-gray-100 opacity-70">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold text-gray-700 text-lg">Netflix</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Film size={14}/> Rozrywka</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-700">−60,00 zł</div>
              <div className="text-xs text-gray-500 font-medium mt-1 bg-gray-200 px-2 py-0.5 rounded text-center inline-block">Wstrzymane</div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-50">
             <div className="text-sm">
              <div className="text-gray-600 font-medium">Co miesiąc, 15. dnia</div>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-12 h-7 bg-gray-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div>
               </div>
               <button className="p-2 text-gray-400"><MoreHorizontal size={20}/></button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1 uppercase tracking-wider">Nadchodzące (30 dni)</h3>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-medium">10 lis (Wtorek)</span>
            <span className="font-bold">−2 400,00 zł</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-gray-900 font-medium">15 lis (Niedziela)</span>
             <span className="font-bold text-gray-400 line-through">−60,00 zł</span>
          </div>
        </div>
      </div>
    </div>
    <BottomNav active="zlecenia" />
  </DeviceShell>
);

const Screen10 = () => (
  <DeviceShell title="EKRAN 10 - Form. zlecenia">
    <div className="w-full h-full bg-[#F2F2F7] flex flex-col relative pt-12 overflow-y-auto pb-32">
      <div className="px-4 flex justify-between items-center mb-6">
        <button className="p-2 -ml-2 text-gray-900 touch-target"><X size={24}/></button>
        <span className="font-semibold text-lg">Nowe zlecenie</span>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
        <SegmentedControl options={['Wydatek', 'Przychód']} active="Wydatek" />

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="p-4 flex justify-between items-center border-b border-gray-50">
             <span className="text-gray-900 font-medium">Kwota</span>
             <span className="text-xl font-bold text-gray-400">0,00 zł</span>
          </div>
          <div className="p-4 flex justify-between items-center border-b border-gray-50">
             <span className="text-gray-900 font-medium">Kategoria</span>
             <span className="text-gray-400 flex items-center gap-1">Wybierz <ChevronRight size={16}/></span>
          </div>
           <div className="p-4 flex justify-between items-center">
             <span className="text-gray-900 font-medium">Opis</span>
             <span className="text-gray-400">Opcjonalnie</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2 px-2">CZĘSTOTLIWOŚĆ</h3>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
               <span className="text-gray-900">Co miesiąc</span>
               <Check size={20} className="text-blue-500"/>
            </div>
            <div className="p-4 border-b border-gray-50 flex justify-between items-center text-gray-900">
               <span>Co tydzień</span>
            </div>
            <div className="p-4 border-b border-gray-50 flex justify-between items-center text-gray-900">
               <span>Co rok</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-gray-900">Inne:</span>
              <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-600">Co 2 miesiące</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2 px-2">ZAKOŃCZENIE</h3>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-1">
             <SegmentedControl options={['Bezterminowo', 'W dniu', 'Po liczbie']} active="Bezterminowo" />
          </div>
        </div>

        <div className="pt-4">
          <button className="w-full bg-blue-600 text-white font-semibold text-lg py-4 rounded-2xl shadow-lg active:bg-blue-700">
            Zapisz zlecenie
          </button>
        </div>
      </div>
    </div>
  </DeviceShell>
);

const Screen11 = () => (
  <DeviceShell title="EKRAN 11 - Raporty">
    <Header />
    <div className="px-4 pb-32">
      <div className="w-64 mx-auto mb-6">
        <SegmentedControl options={['Miesiąc', 'Rok']} active="Miesiąc" />
      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center mb-6 relative">
         <div className="relative w-56 h-56">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
               <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
               <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="100" />
               <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="200" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Zostało</span>
              <span className="text-2xl font-bold text-gray-900">3 450,20 zł</span>
            </div>
         </div>
         <div className="mt-4 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-1.5 rounded-full">
           Wykorzystano 58% budżetu
         </div>
      </div>

      {/* Legend & Accordion */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
         <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-gray-200">
           <span className="font-semibold text-gray-900 text-sm">STRUKTURA TRANSAKCJI</span>
           <ChevronLeft size={18} className="transform -rotate-90 text-gray-400"/>
         </div>

         <div className="p-4 border-b border-gray-50 bg-white flex flex-col">
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                 <span className="font-medium text-gray-900">Wydatki</span>
               </div>
               <span className="font-bold text-gray-900">4 749,80 zł</span>
            </div>

            {/* Sub-category expanded */}
            <div className="ml-5 mt-2 space-y-3">
               <div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-gray-700 flex items-center gap-2">Jedzenie <span className="text-xs text-gray-400">40%</span></span>
                     <span className="font-medium text-gray-700">1 899,92 zł</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="w-2/5 h-full bg-orange-400 rounded-full"></div></div>
               </div>

               <div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-gray-700 flex items-center gap-2">Rachunki <span className="text-xs text-gray-400">35%</span></span>
                     <span className="font-medium text-gray-700">1 662,43 zł</span>
                  </div>
                   <div className="mt-1 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="w-[35%] h-full bg-yellow-400 rounded-full"></div></div>
               </div>
            </div>
         </div>

         <div className="p-4 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium text-gray-900">Przychody</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">8 200,00 zł</span>
              <ChevronRight size={18} className="text-gray-400"/>
            </div>
         </div>
      </div>
    </div>
    <BottomNav active="raporty" />
  </DeviceShell>
);

const Screen12 = () => (
  <DeviceShell title="EKRAN 12 - Więcej">
    <div className="pt-12 pb-4 px-4 flex justify-between items-center sticky top-0 bg-[#F2F2F7] z-30">
      <button className="p-2 -ml-2 text-blue-500 touch-target flex items-center gap-1 font-medium"><ArrowLeft size={24}/> Wróć</button>
      <span className="font-semibold text-lg absolute left-1/2 -translate-x-1/2">Więcej</span>
    </div>

    <div className="px-4 pb-20 space-y-6 pt-4">
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
         <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
           <User size={32}/>
         </div>
         <div>
           <div className="text-sm text-gray-500">Zalogowany jako</div>
           <div className="text-xl font-bold text-gray-900">wiktor</div>
         </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Kategorie</h3>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center"><Utensils size={16}/></div>
              <span className="text-gray-900 font-medium">Jedzenie</span>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Domyślna</span>
          </div>
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center"><Film size={16}/></div>
              <span className="text-gray-900 font-medium">Hobby (własna)</span>
            </div>
            <div className="flex gap-3 text-gray-400">
              <Edit2 size={18}/>
              <Trash2 size={18} className="text-red-400"/>
            </div>
          </div>
          <button className="w-full p-4 text-blue-600 font-medium flex items-center justify-center gap-2 bg-blue-50/50">
            <Plus size={18}/> Dodaj kategorię
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Ustawienia</h3>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 space-y-1">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <span className="text-gray-900 font-medium">Wygląd</span>
            <div className="w-40"><SegmentedControl options={['System', 'Jasny']} active="System" /></div>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <span className="text-gray-900 font-medium">Wersja interfejsu</span>
            <SegmentedControl options={['Auto', 'Komp.', 'Mobilna']} active="Mobilna" />
          </div>
        </div>
      </div>

      <button className="w-full bg-white text-red-500 font-semibold text-lg py-4 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50">
        Wyloguj się
      </button>
    </div>
  </DeviceShell>
);

const Screen13 = () => (
  <DeviceShell title="EKRAN 13 - Stany pomocnicze">
    <Header />
    <div className="h-full flex flex-col divide-y-4 divide-gray-200">

      {/* 1. Empty History */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white relative">
        <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">1. Pusta lista</span>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
          <Search size={32} />
        </div>
        <div className="text-gray-900 font-semibold text-center mb-1">Brak transakcji</div>
        <div className="text-sm text-gray-500 text-center mb-6">Brak transakcji pasujących do filtrów.</div>
        <button className="px-6 py-2 bg-blue-100 text-blue-700 font-medium rounded-xl text-sm">
          Wyczyść filtry
        </button>
      </div>

      {/* 2. Loading Dashboard */}
      <div className="flex-1 p-4 bg-[#F2F2F7] relative">
        <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">2. Ładowanie</span>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-6">
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="w-48 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm h-28 flex flex-col justify-between">
             <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
             <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm h-28 flex flex-col justify-between">
             <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
             <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 3. Error Banner */}
      <div className="flex-1 bg-white relative">
        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">3. Błąd pobierania</span>
        <div className="absolute top-0 w-full bg-red-500 text-white p-3 flex justify-between items-center shadow-md">
          <div className="flex gap-2 items-center text-sm font-medium">
             <AlertCircle size={18}/>
             Nie udało się pobrać danych.
          </div>
          <button className="bg-red-600 px-3 py-1 rounded text-xs font-bold shadow-sm active:bg-red-700 flex items-center gap-1">
             <RefreshCcw size={12}/> Spróbuj
          </button>
        </div>
        <div className="pt-16 p-4">
           <div className="h-20 bg-gray-100 rounded-2xl opacity-50"></div>
           <div className="h-20 bg-gray-100 rounded-2xl opacity-50 mt-4"></div>
        </div>
      </div>

    </div>
  </DeviceShell>
);


// --- MAIN APP (GRID LAYOUT) ---

export default function App() {
  return (
    <div className="min-h-screen bg-gray-800 p-8 font-sans">
      <div className="max-w-[2000px] mx-auto">
        <div className="mb-12 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Budżet Domowy - Makiety UI (13 ekranów)</h1>
          <p className="text-gray-400">Przewiń w dół, aby zobaczyć wszystkie widoki. Design inspirowany natywnym iOS, wykonany w Tailwind CSS.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-12 gap-y-16 justify-items-center">
          <Screen1 />
          <Screen2 />
          <Screen3 />
          <Screen4 />
          <Screen5 />
          <Screen6 />
          <Screen7 />
          <Screen8 />
          <Screen9 />
          <Screen10 />
          <Screen11 />
          <Screen12 />
          <Screen13 />
        </div>
      </div>

      {/* Global styles for hide-scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
