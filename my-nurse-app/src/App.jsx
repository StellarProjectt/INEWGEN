import './index.css';

import React, { useState, useEffect } from 'react';
import { 
  User, Clock, CheckCircle, AlertCircle, 
  LogOut, Activity, FileText, Pill, 
  Stethoscope, Bell, ScanLine, ChevronRight,
  LayoutDashboard, Users, Calendar, ArrowRight,
  BedDouble, List, Clipboard, X, Save, History, FilePlus,
  AlertTriangle, CheckSquare, Square, Settings, ZoomIn, ClipboardList
} from 'lucide-react';

// --- Configuration & Mock Data ---

const THEME = {
  primary: "bg-teal-600 hover:bg-teal-700",
  primaryLight: "bg-teal-50",
  primaryText: "text-teal-700",
  secondary: "bg-slate-800",
  background: "bg-slate-50",
  card: "bg-white",
  border: "border-slate-200",
};

const NURSES = [
  { id: 1, name: "พยาบาล วันดี โค้ไพบูลย์", role: "หัวหน้าเวร (Charge Nurse)", code: "RN-001" },
  { id: 2, name: "พยาบาล สิตานันท์ เนียมหอม", role: "พยาบาลวิชาชีพ (Registered Nurse)", code: "RN-024" },
  { id: 3, name: "พยาบาล กานต์ วงษ์พานิชย์", role: "ผู้ช่วยพยาบาล (Practical Nurse)", code: "PN-105" }
];

const SHIFTS = [
  { id: 'morning', label: "เวรเช้า (Morning Shift)", time: "08:00 - 16:00" },
  { id: 'afternoon', label: "เวรบ่าย (Afternoon Shift)", time: "16:00 - 00:00" },
  { id: 'night', label: "เวรดึก (Night Shift)", time: "00:00 - 08:00" }
];

// Mock Data: ข้อมูลการส่งเวร
const PREVIOUS_HANDOVER_INFO = {
  fromShift: "เวรดึก (Night Shift)",
  fromNurse: "พยาบาล สายใจ เกื้อกูล (RN-099)",
  stats: { total: 12, admit: 1, discharge: 0, critical: 1 },
  note: "เหตุการณ์ทั่วไปปกติ\n- เตียง 03 มีไข้สูงช่วงตี 3 (T: 39.0) ให้ Paracetamol แล้วไข้ลดลง เช้านี้ต้องประเมินซ้ำ\n- เตียง 05 ระดับน้ำตาลยังสวิง (DTX 06:00 = 250) รอแพทย์พิจารณาปรับยา\n- รับใหม่ 1 ราย (เตียง 01) ปวดท้องรุนแรง Observe อาการใกล้ชิด"
};

// Initial Tasks (งานค้าง)
const INITIAL_TASKS = [
  { id: 1, task: "เจาะ DTX เตียง 05 (ก่อนอาหารเช้า)", priority: "high", completed: false },
  { id: 2, task: "เตรียมผู้ป่วยเตียง 09 ไป X-ray", priority: "medium", completed: false },
  { id: 3, task: "ติดตามผล Lab เตียง 01", priority: "medium", completed: false }
];

const PATIENTS = [
  { bed: "01", name: "นาย สมชาย มั่งมี", age: 45, diagnosis: "Acute Abdominal Pain", status: "stable", vitals: "BP: 120/80", allergy: "ไม่มี", doctor: "นพ. รักษา ดี" },
  { bed: "02", name: "นาง สมหญิง รักดี", age: 62, diagnosis: "Post-op Appendicitis", status: "monitor", vitals: "Temp: 37.8°C", allergy: "Penicillin", doctor: "พญ. ใจดี" },
  { bed: "03", name: "ด.ช. เก่ง กล้าหาญ", age: 10, diagnosis: "Dengue Fever", status: "critical", vitals: "Plt: Low", allergy: "ไม่มี", doctor: "นพ. เด็กดี" },
  { bed: "04", name: "ว่าง", status: "empty" },
  { bed: "05", name: "นาย มีชัย ใจสู้", age: 55, diagnosis: "Diabetes Mellitus", status: "stable", vitals: "BS: 110", allergy: "Aspirin", doctor: "นพ. เบาหวาน" },
  { bed: "06", name: "น.ส. มานี มีตา", age: 28, diagnosis: "Migraine", status: "stable", vitals: "BP: 110/70", allergy: "ไม่มี", doctor: "พญ. ประสาท" },
  { bed: "07", name: "ลุง บุญมี", age: 70, diagnosis: "COPD Exacerbation", status: "monitor", vitals: "O2: 94%", allergy: "Sulfa", doctor: "นพ. ปอดเหล็ก" },
  { bed: "08", name: "ว่าง", status: "empty" },
  { bed: "09", name: "ป้า แจ่ม", age: 65, diagnosis: "Hypertension", status: "stable", vitals: "BP: 140/90", allergy: "ไม่มี", doctor: "พญ. ความดัน" },
  { bed: "10", name: "นาย แดง", age: 40, diagnosis: "Fracture Leg", status: "stable", vitals: "Pain: 4/10", allergy: "ไม่มี", doctor: "นพ. กระดูก" },
  { bed: "11", name: "เด็กหญิง ฟ้า", age: 5, diagnosis: "Viral Infection", status: "monitor", vitals: "Temp: 38.5°C", allergy: "Paracetamol", doctor: "นพ. เด็กดี" },
  { bed: "12", name: "ว่าง", status: "empty" },
];

const MED_SCHEDULE = [
  { time: "12:00", bed: "03", patient: "ด.ช. เก่ง กล้าหาญ", drug: "Paracetamol (Syrup)", dose: "10ml", status: "pending" },
  { time: "12:00", bed: "05", patient: "นาย มีชัย ใจสู้", drug: "Insulin RI", dose: "6 units", status: "pending" },
  { time: "13:00", bed: "01", patient: "นาย สมชาย มั่งมี", drug: "Omeprazole", dose: "20mg IV", status: "pending" },
  { time: "13:00", bed: "07", patient: "ลุง บุญมี", drug: "Berodual (Neb)", dose: "1 NB", status: "done" },
];

const RECENT_LOGS = [
  { time: "10:30", bed: "02", detail: "ผู้ป่วยบ่นปวดแผล ให้ยาแก้ปวดตามแผนการรักษาแล้ว", recorder: "RN-001" },
  { time: "11:00", bed: "03", detail: "วัดไข้ได้ 38.5 เช็ดตัวลดไข้", recorder: "PN-105" },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 1.1 = 110%, 1.25 = 125%

  // Handover Tasks State (Shared between Handover screen & Dashboard)
  const [handoverTasks, setHandoverTasks] = useState(INITIAL_TASKS);

  // States for Alert
  const [showMedAlert, setShowMedAlert] = useState(false);
  const [alertData, setAlertData] = useState(null);
  
  // States for Modals
  const [activeModal, setActiveModal] = useState(null); 
  const [currentPatient, setCurrentPatient] = useState(null);
  const [noteInput, setNoteInput] = useState("");

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const goToScan = () => {
    if (!selectedNurse || !selectedShift) return;
    setCurrentPage('scan');
  };

  const handleScanCard = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setCurrentPage('confirm');
    }, 2000);
  };

  const handleConfirmShift = () => {
    setCurrentPage('handover');
  };

  const handleAcknowledgeHandover = () => {
    setCurrentPage('dashboard');
  };

  // Toggle Task Completion
  const toggleTask = (taskId) => {
    setHandoverTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const pendingCount = handoverTasks.filter(t => !t.completed).length;

  const triggerDemoAlert = () => {
    setAlertData({
      bed: "03",
      patient: "ด.ช. เก่ง กล้าหาญ",
      drug: "Furosemide 20mg (IV)",
      time: "12:00",
      detail: "ฉีดเข้าเส้นเลือดดำช้าๆ สังเกตปัสสาวะหลังฉีด"
    });
    setShowMedAlert(true);
  };

  const openPatientDetail = (patient) => {
    setCurrentPatient(patient);
    setActiveModal('patientDetail');
  };

  // --- Components ---

  const GenericModal = ({ title, icon: Icon, children, onClose, color = "teal" }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[85vh] flex flex-col">
        <div className={`bg-${color}-600 px-6 py-4 flex items-center justify-between shadow-sm shrink-0`}>
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <Icon size={24} />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );

  // Settings Modal
  const SettingsModal = () => {
    if (!showSettings) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-start justify-end p-4">
        <div className="bg-white w-80 mt-16 rounded-xl shadow-2xl border border-slate-200 p-5 animate-in slide-in-from-right-10 duration-200">
           <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} /> ตั้งค่าการแสดงผล
              </h3>
              <button onClick={() => setShowSettings(false)}><X size={18} className="text-slate-400 hover:text-slate-600"/></button>
           </div>
           
           <div className="space-y-4">
             <div>
               <label className="text-sm text-slate-500 mb-2 block flex items-center gap-2">
                 <ZoomIn size={16} /> ขนาดตัวอักษรและไอคอน
               </label>
               <div className="grid grid-cols-3 gap-2">
                 <button 
                    onClick={() => setZoomLevel(1)}
                    className={`p-2 rounded border text-sm font-bold ${zoomLevel === 1 ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                 >
                   ปกติ
                 </button>
                 <button 
                    onClick={() => setZoomLevel(1.1)}
                    className={`p-2 rounded border text-base font-bold ${zoomLevel === 1.1 ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                 >
                   ใหญ่
                 </button>
                 <button 
                    onClick={() => setZoomLevel(1.25)}
                    className={`p-2 rounded border text-lg font-bold ${zoomLevel === 1.25 ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                 >
                   ใหญ่มาก
                 </button>
               </div>
             </div>
           </div>
        </div>
      </div>
    );
  };

  // Content Blocks
  const renderMedicationSchedule = () => (
    <GenericModal title="ลำดับการให้ยา (Medication Schedule)" icon={List} onClose={() => setActiveModal(null)} color="teal">
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-slate-500 text-sm">รายการยาที่ต้องบริหารในช่วงเวลาเวรนี้</p>
          <div className="text-sm font-bold bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
            Pending: {MED_SCHEDULE.filter(m => m.status === 'pending').length}
          </div>
        </div>
        
        {MED_SCHEDULE.map((item, idx) => (
          <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border ${item.status === 'done' ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col items-center justify-center min-w-[60px]">
              <span className="text-lg font-bold text-slate-700">{item.time}</span>
              {item.status === 'done' && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> Done</span>}
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">เตียง {item.bed}</span>
                <span className="font-bold text-slate-800">{item.patient}</span>
              </div>
              <div className="text-teal-700 font-medium text-lg flex items-center gap-2">
                <Pill size={16} /> {item.drug} <span className="text-slate-400 text-sm">({item.dose})</span>
              </div>
            </div>
            {item.status === 'pending' && (
              <button className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 shadow-sm">
                จ่ายยา
              </button>
            )}
          </div>
        ))}
      </div>
    </GenericModal>
  );

  const renderShiftSummary = () => (
    <GenericModal title="สรุปเวร (Shift Summary)" icon={Clipboard} onClose={() => setActiveModal(null)} color="slate">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <FileText size={18} /> บันทึกการส่งเวร (Handover Note)
        </h3>
        <textarea 
          className="w-full h-40 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none text-slate-700"
          placeholder="พิมพ์รายละเอียดเหตุการณ์สำคัญ..."
        ></textarea>
        <div className="flex justify-end mt-4">
          <button 
            onClick={() => { alert('บันทึกสรุปเวรเรียบร้อย'); setActiveModal(null); }}
            className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-900 transition-colors"
          >
            <Save size={18} /> บันทึกและส่งเวร
          </button>
        </div>
      </div>
    </GenericModal>
  );

  const renderSymptomLogs = () => (
    <GenericModal title="บันทึกอาการ (Symptom Logs)" icon={FileText} onClose={() => setActiveModal(null)} color="teal">
      <div className="flex flex-col h-full gap-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase">เพิ่มบันทึกใหม่</h3>
          <div className="flex gap-3 mb-3">
             <select className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-teal-500">
               <option>เลือกผู้ป่วย (Bed)</option>
               {PATIENTS.filter(p => p.status !== 'empty').map(p => (
                 <option key={p.bed} value={p.bed}>เตียง {p.bed} - {p.name}</option>
               ))}
             </select>
             <input type="time" defaultValue="12:00" className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"/>
          </div>
          <textarea 
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="w-full h-24 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none mb-3 text-sm"
            placeholder="รายละเอียดอาการ..."
          ></textarea>
          <button 
            onClick={() => { 
              if(!noteInput) return;
              alert('บันทึกข้อมูลเรียบร้อย'); 
              setNoteInput("");
            }}
            className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
          >
            <FilePlus size={18} /> บันทึกข้อมูล
          </button>
        </div>
      </div>
    </GenericModal>
  );

  const renderPatientDetail = () => {
    if (!currentPatient) return null;
    return (
      <GenericModal title={`ข้อมูลผู้ป่วย: เตียง ${currentPatient.bed}`} icon={User} onClose={() => setActiveModal(null)} color="teal">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
             <div className="w-24 h-24 bg-slate-200 rounded-2xl flex items-center justify-center text-4xl font-bold text-slate-400 shrink-0">
               {currentPatient.name.charAt(0)}
             </div>
             <div className="flex-1">
               <h3 className="text-2xl font-bold text-slate-800 mb-1">{currentPatient.name}</h3>
               <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                 <span className="bg-slate-100 px-2 py-1 rounded">อายุ: {currentPatient.age} ปี</span>
                 <span className="bg-slate-100 px-2 py-1 rounded">HN: 66-004X</span>
                 <span className="bg-slate-100 px-2 py-1 rounded">แพทย์: {currentPatient.doctor}</span>
               </div>
               <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-lg text-sm font-bold text-white
                    ${currentPatient.status === 'stable' ? 'bg-emerald-500' : currentPatient.status === 'monitor' ? 'bg-amber-500' : 'bg-rose-500'}
                  `}>
                    สถานะ: {currentPatient.status === 'stable' ? 'ปกติ' : currentPatient.status === 'monitor' ? 'เฝ้าระวัง' : 'วิกฤต'}
                  </div>
               </div>
             </div>
          </div>

          <hr className="border-slate-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Stethoscope className="text-teal-600" size={20} /> การวินิจฉัย & อาการ
                </h4>
                <div className="space-y-3">
                   <div>
                     <p className="text-xs text-slate-400 uppercase">Diagnosis</p>
                     <p className="font-medium text-slate-700">{currentPatient.diagnosis}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-400 uppercase">Vital Signs ล่าสุด</p>
                     <p className="font-medium text-slate-700 bg-emerald-50 inline-block px-2 py-1 rounded text-emerald-800">{currentPatient.vitals}</p>
                   </div>
                </div>
             </div>

             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-rose-500" size={20} /> ข้อมูลสำคัญ
                </h4>
                <div className="space-y-3">
                   <div>
                     <p className="text-xs text-slate-400 uppercase">แพ้ยา (Allergies)</p>
                     <p className={`font-medium ${currentPatient.allergy === 'ไม่มี' ? 'text-slate-700' : 'text-rose-600 font-bold'}`}>
                       {currentPatient.allergy}
                     </p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-400 uppercase">อาหาร (Diet)</p>
                     <p className="font-medium text-slate-700">Soft Diet (อาหารอ่อน)</p>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
             <button className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">ดูประวัติย้อนหลัง</button>
             <button className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-md">เพิ่มบันทึกพยาบาล</button>
          </div>
        </div>
      </GenericModal>
    );
  };

  // --- Screens Logic ---

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans text-slate-800" style={{ zoom: zoomLevel }}>
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        {/* Left Side: Brand */}
        <div className="bg-slate-800 text-white p-10 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                <Activity className="text-white" size={24} />
              </div>
              <div>
                <span className="text-xl font-bold tracking-wide block">Nurse chaui</span>
                <span className="text-slate-400 text-xs">Shift Management</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="text-6xl font-thin opacity-80">{formatTime(currentTime)}</div>
            <div className="text-slate-400 mt-2 text-base">
              {currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-slate-700 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-teal-900 rounded-full opacity-20 blur-3xl"></div>
        </div>

        {/* Right Side: Selection */}
        <div className="p-10 md:w-2/3 bg-white flex flex-col relative">
           {/* Settings Button on Login Page too */}
           <div className="absolute top-6 right-6 z-20">
             <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
               <Settings size={24} />
             </button>
           </div>
           
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">1</span>
                เลือกชื่อพยาบาล (Select User)
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {NURSES.map((nurse) => (
                  <button
                    key={nurse.id}
                    onClick={() => setSelectedNurse(nurse)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all duration-200 group
                      ${selectedNurse?.id === nurse.id 
                        ? 'border-teal-500 bg-teal-50 shadow-sm ring-1 ring-teal-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-colors
                      ${selectedNurse?.id === nurse.id ? 'bg-teal-200 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>
                      {nurse.name.charAt(0)}
                    </div>
                    <div>
                      <div className={`font-semibold text-lg ${selectedNurse?.id === nurse.id ? 'text-teal-900' : 'text-slate-700'}`}>
                        {nurse.name}
                      </div>
                      <div className="text-xs text-slate-500">{nurse.role}</div>
                    </div>
                    {selectedNurse?.id === nurse.id && <CheckCircle className="ml-auto text-teal-600" size={20} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">2</span>
                เลือกช่วงเวลา (Select Shift)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {SHIFTS.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedShift(shift)}
                    className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center h-28
                      ${selectedShift?.id === shift.id 
                        ? 'border-teal-500 bg-teal-600 text-white shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'}`}
                  >
                    {shift.id === 'morning' ? <Users size={24} /> : shift.id === 'afternoon' ? <Clock size={24} /> : <Calendar size={24} />}
                    <div>
                      <div className="font-semibold text-sm">{shift.label.split(' ')[0]}</div>
                      <div className={`text-[10px] mt-1 ${selectedShift?.id === shift.id ? 'text-teal-100' : 'text-slate-400'}`}>
                        {shift.time}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={goToScan}
              disabled={!selectedNurse || !selectedShift}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300
                ${(!selectedNurse || !selectedShift) 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg active:scale-[0.98]'}`}
            >
              <span>ถัดไป</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScan = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ zoom: zoomLevel }}>
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        <button 
          onClick={() => setCurrentPage('login')}
          className="absolute top-0 left-0 -mt-16 text-slate-400 hover:text-slate-600 flex items-center gap-2"
        >
          <ArrowRight className="rotate-180" size={20}/> ย้อนกลับ
        </button>

        <h2 className="text-3xl font-bold text-slate-800 mb-2">ยืนยันตัวตน</h2>
        <p className="text-slate-500 mb-10 text-lg">กรุณาแตะบัตรประจำตัวที่เครื่องอ่าน</p>

        <div 
          onClick={handleScanCard}
          className="bg-white p-10 rounded-3xl shadow-2xl border-4 border-slate-100 cursor-pointer hover:border-teal-100 transition-colors group relative"
        >
          {isScanning ? (
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-6"></div>
              <p className="text-teal-600 font-bold text-lg animate-pulse">กำลังตรวจสอบข้อมูล...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="relative mb-6">
                <div className="w-32 h-48 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full mb-2"></div>
                  <div className="w-20 h-2 bg-white/20 rounded mb-1"></div>
                  <div className="w-14 h-2 bg-white/20 rounded"></div>
                </div>
                <ScanLine size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-teal-50 text-teal-700 rounded-full font-bold">
                <ScanLine size={20} /> แตะบัตร
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderConfirm = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" style={{ zoom: zoomLevel }}>
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg text-center border border-slate-200">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">ข้อมูลถูกต้อง?</h2>
        <p className="text-slate-500 mb-8">ตรวจสอบข้อมูลก่อนเริ่มการทำงาน</p>
        
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 text-left space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm text-teal-600 border border-slate-100">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">เจ้าหน้าที่ (Officer)</p>
              <p className="text-lg font-bold text-slate-800">{selectedNurse?.name}</p>
            </div>
          </div>
          <div className="h-px bg-slate-200"></div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm text-teal-600 border border-slate-100">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">เวลาเวร (Shift)</p>
              <p className="text-lg font-bold text-slate-800">{selectedShift?.label}</p>
              <p className="text-sm text-slate-500">{selectedShift?.time}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setCurrentPage('login')}
            className="py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          >
            ยกเลิก/แก้ไข
          </button>
          <button 
            onClick={handleConfirmShift}
            className="py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all active:scale-95"
          >
            ยืนยันเริ่มงาน
          </button>
        </div>
      </div>
    </div>
  );

  const renderHandover = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" style={{ zoom: zoomLevel }}>
       <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px] border border-slate-200">
          
          <div className="bg-slate-800 text-white px-8 py-6 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-lg">
                   <Clipboard size={24} />
                </div>
                <div>
                   <h1 className="text-xl font-bold">สรุปการส่งเวร (Shift Handover)</h1>
                   <p className="text-slate-400 text-sm">รับเวรจาก: {PREVIOUS_HANDOVER_INFO.fromShift}</p>
                </div>
             </div>
             <div className="text-right hidden md:block">
                <div className="text-xs text-slate-400 uppercase">ผู้ส่งเวร</div>
                <div className="font-bold">{PREVIOUS_HANDOVER_INFO.fromNurse}</div>
             </div>
          </div>

          <div className="flex-1 p-8 flex flex-col gap-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                   <div className="text-2xl font-bold text-slate-800">{PREVIOUS_HANDOVER_INFO.stats.total}</div>
                   <div className="text-xs text-slate-500 uppercase">ผู้ป่วยทั้งหมด</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                   <div className="text-2xl font-bold text-emerald-600">+{PREVIOUS_HANDOVER_INFO.stats.admit}</div>
                   <div className="text-xs text-emerald-800 uppercase">รับใหม่ (Admit)</div>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
                   <div className="text-2xl font-bold text-rose-600">{PREVIOUS_HANDOVER_INFO.stats.critical}</div>
                   <div className="text-xs text-rose-800 uppercase">วิกฤต (Critical)</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                   <div className="text-2xl font-bold text-slate-600">{PREVIOUS_HANDOVER_INFO.stats.discharge}</div>
                   <div className="text-xs text-slate-500 uppercase">จำหน่าย (D/C)</div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="flex flex-col">
                   <h3 className="text-slate-700 font-bold mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-teal-600"/> บันทึกเหตุการณ์ (Note)
                   </h3>
                   <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 text-slate-700 leading-relaxed whitespace-pre-line shadow-inner flex-1 font-medium">
                      {PREVIOUS_HANDOVER_INFO.note}
                   </div>
                </div>

                <div className="flex flex-col">
                   <h3 className="text-slate-700 font-bold mb-3 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-rose-500"/> งานค้าง/สิ่งที่ต้องทำ (Checklist)
                   </h3>
                   <div className="space-y-3">
                      {handoverTasks.map((task) => (
                         <div 
                            key={task.id} 
                            onClick={() => toggleTask(task.id)}
                            className={`flex items-start gap-3 p-4 border rounded-xl shadow-sm transition-all cursor-pointer
                                ${task.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-rose-100 hover:border-teal-300'}`}
                         >
                            {task.completed 
                              ? <CheckSquare className="text-emerald-500 mt-1 shrink-0" size={20} /> 
                              : <Square className="text-slate-300 mt-1 shrink-0" size={20} />
                            }
                            <div className={task.completed ? "line-through text-slate-400" : ""}>
                               <p className="font-bold text-slate-800 text-sm">{task.task}</p>
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block uppercase
                                  ${task.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}
                               `}>
                                  {task.priority === 'high' ? 'ด่วน' : 'ทั่วไป'}
                               </span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
             <button 
                onClick={handleAcknowledgeHandover}
                className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 hover:shadow-teal-200 transition-all flex items-center gap-3 active:scale-95"
             >
                <CheckCircle size={20} />
                รับทราบและเริ่มปฏิบัติงาน
             </button>
          </div>
       </div>
    </div>
  );

  const AlertModal = () => {
    if (!showMedAlert) return null;
    const [reportIssue, setReportIssue] = useState(false);
    const [issueText, setIssueText] = useState("");

    const handleAcknowledge = () => {
      setShowMedAlert(false);
      setReportIssue(false);
      setIssueText("");
    };

    const handleReportIssue = () => {
      if (!issueText.trim()) {
      alert("กรุณากรอกรายละเอียดปัญหา");
      return;
      }
      
      const utterance = new SpeechSynthesisUtterance(`มีปัญหาการให้ยาเตียง ${alertData?.bed}. ${issueText}`);
      utterance.lang = 'th-TH';
      window.speechSynthesis.speak(utterance);
      
      alert(`บันทึกปัญหา: ${issueText}`);
      handleAcknowledge();
    };

    if (reportIssue) {
      return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="bg-amber-600 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
          <AlertCircle className="text-white" size={24} />
          <h2 className="text-xl font-bold text-white">รายงานปัญหา (Report Issue)</h2>
          </div>
        </div>
        <div className="p-8 bg-white space-y-4">
          <p className="text-slate-600 font-medium">เตียง {alertData?.bed} - {alertData?.patient}</p>
          <textarea
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
          placeholder="อธิบายปัญหาที่เกิดขึ้น..."
          className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
          />
          <div className="flex gap-3">
          <button
            onClick={() => setReportIssue(false)}
            className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleReportIssue}
            className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors"
          >
            ส่งรายงาน
          </button>
          </div>
        </div>
        </div>
      </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="bg-rose-600 px-6 py-4 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-full">
          <AlertCircle className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wide">แจ้งเตือนให้ยา (Medication)</h2>
        </div>
        <span className="bg-white text-rose-600 text-xs px-2 py-1 rounded font-bold shadow-sm">URGENT</span>
        </div>
        
        <div className="p-8 bg-white">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">ข้อมูลผู้ป่วย (Patient)</p>
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-5xl font-black text-slate-800 tracking-tighter">{alertData?.bed}</span>
            <div>
            <span className="text-xl font-bold text-teal-700 block">{alertData?.patient}</span>
            <span className="text-slate-500 text-sm">HN: 66-024512</span>
            </div>
          </div>
          </div>
          
          <div className="flex-1 bg-rose-50 p-4 rounded-xl border border-rose-100 relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
              <Pill className="text-rose-600" size={18} />
              <p className="text-xs font-bold text-rose-700 uppercase">คำสั่งการรักษา</p>
             </div>
             <p className="text-xl font-bold text-slate-800 mb-1 leading-tight">{alertData?.drug}</p>
             <p className="text-slate-600 bg-white/60 p-2 rounded-lg text-sm leading-relaxed border border-rose-100/50">
             <span className="font-bold">วิธีใช้:</span> {alertData?.detail}
             </p>
          </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
          onClick={handleAcknowledge}
          className="py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-3"
          >
          <CheckCircle size={20} />
          ให้ยาเรียบร้อย
          </button>
          <button 
          onClick={() => setReportIssue(true)}
          className="py-4 bg-amber-600 text-white font-bold text-lg rounded-xl hover:bg-amber-700 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-3"
          >
          <AlertCircle size={20} />
          เกิดปัญหา
          </button>
        </div>
        </div>
      </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans" style={{ zoom: zoomLevel }}>
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
            SN
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-slate-800 leading-tight">Smart Nurse Shift</h1>
            <p className="text-xs text-slate-500">Unit: General Medicine (Ward 5)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-700">{selectedNurse?.name}</p>
            <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
               <Clock size={12} /> {selectedShift?.label}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          
          {/* Settings Button Added Here */}
          <button 
             onClick={() => setShowSettings(true)}
             className="text-slate-500 hover:text-teal-600 transition-colors p-2"
             title="ตั้งค่าการแสดงผล"
          >
            <Settings size={20} />
          </button>

          <button 
             onClick={() => { if(confirm('ต้องการจบการเข้าเวร?')) setCurrentPage('login'); }}
             className="text-slate-500 hover:text-rose-600 transition-colors p-2"
             title="ออกจากระบบ"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
           
           {/* LEFT COLUMN: Overview & Tasks */}
           <div className="md:col-span-8 flex flex-col gap-6">
             {/* Ward Status */}
             <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                         <LayoutDashboard className="text-teal-600" size={20} /> ภาพรวมหอผู้ป่วย
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">จำนวนผู้ป่วยทั้งหมด 9 ราย (ว่าง 3 เตียง)</p>
                   </div>
                   <div className="text-right">
                      <div className="text-3xl font-bold text-slate-700 font-mono">{formatTime(currentTime)}</div>
                   </div>
                </div>
  
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                   <button 
                      onClick={() => setActiveModal('medication')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors gap-2 border border-teal-100 active:scale-95 duration-100"
                   >
                      <List size={20} />
                      <span className="text-xs font-bold">ลำดับการให้ยา</span>
                   </button>
                   <button 
                      onClick={() => setActiveModal('summary')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors gap-2 border border-slate-200 active:scale-95 duration-100"
                   >
                      <Clipboard size={20} />
                      <span className="text-xs font-bold">สรุปเวร</span>
                   </button>
                   <button 
                      onClick={() => setActiveModal('notes')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors gap-2 border border-slate-200 active:scale-95 duration-100"
                   >
                      <FileText size={20} />
                      <span className="text-xs font-bold">บันทึกอาการ</span>
                   </button>
                   <button 
                      onClick={triggerDemoAlert} 
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors gap-2 border border-rose-100 active:scale-95 duration-100"
                   >
                      <Bell size={20} />
                      <span className="text-xs font-bold">แจ้งเตือน (Test)</span>
                   </button>
                </div>
             </div>

             {/* NEW WIDGET: Handover Tasks */}
             <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <ClipboardList className="text-rose-500" size={20}/> งานค้างจากเวรเก่า (Pending Tasks)
                  </h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${pendingCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {pendingCount > 0 ? `เหลือ ${pendingCount} งาน` : 'ครบถ้วน'}
                  </span>
                </div>
                <div className="space-y-2">
                  {handoverTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group
                        ${task.completed 
                          ? 'bg-slate-50 border-transparent' 
                          : 'bg-white border-slate-100 hover:border-teal-200 shadow-sm'}`}
                    >
                      {task.completed 
                         ? <CheckSquare className="text-emerald-500 shrink-0 mt-0.5" size={18} /> 
                         : <Square className="text-slate-300 group-hover:text-teal-500 shrink-0 mt-0.5" size={18} />
                      }
                      <div className="flex-1 flex justify-between items-start">
                         <span className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                           {task.task}
                         </span>
                         {!task.completed && task.priority === 'high' && (
                           <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ml-2">ด่วน</span>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           </div>

           {/* RIGHT COLUMN: Shift Info */}
           <div className="md:col-span-4 bg-slate-800 rounded-xl p-6 text-white shadow-md flex flex-col relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-teal-500 rounded-full opacity-20 blur-2xl"></div>
              <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">เวรปัจจุบันของคุณ</h3>
              <div className="text-xl font-bold mb-1">{selectedShift?.label.split(' ')[0]}</div>
              <div className="text-slate-300 text-sm mb-6">{selectedShift?.time}</div>
              <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm border border-white/5">
                 <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center font-bold text-sm">
                    {selectedNurse?.name.charAt(0)}
                 </div>
                 <div>
                    <div className="font-bold text-sm">{selectedNurse?.name}</div>
                    <div className="text-xs text-slate-300">{selectedNurse?.code}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Patient Grid */}
        <div>
           <div className="flex items-center justify-between mt-8 mb-4">
             <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
               <Users size={20} className="text-slate-400" />
               สถานะผู้ป่วยรายเตียง (Patient Status)
             </h3>
             <div className="flex gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
               <span className="w-2 h-2 rounded-full bg-emerald-500 self-center"></span><span className="text-xs text-slate-600 font-medium mr-2">ปกติ</span>
               <span className="w-2 h-2 rounded-full bg-amber-500 self-center"></span><span className="text-xs text-slate-600 font-medium mr-2">เฝ้าระวัง</span>
               <span className="w-2 h-2 rounded-full bg-rose-500 self-center"></span><span className="text-xs text-slate-600 font-medium">วิกฤต</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {PATIENTS.map((p, idx) => {
               const isEmpty = p.status === 'empty';
               return (
                 <div key={idx} className={`relative rounded-xl border transition-all duration-200 group
                   ${isEmpty 
                     ? 'bg-slate-50 border-slate-200 border-dashed min-h-[140px] flex items-center justify-center hover:bg-slate-100' 
                     : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300'
                   }`}>
                   
                   {isEmpty ? (
                      <div className="text-center text-slate-400">
                        <BedDouble size={24} className="mx-auto mb-1 opacity-40" />
                        <span className="text-xs font-bold block">เตียง {p.bed}</span>
                        <span className="text-xs">ว่าง</span>
                      </div>
                   ) : (
                     <div className="p-4">
                       <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                           <div className="bg-slate-100 text-slate-600 font-bold text-lg w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200">
                             {p.bed}
                           </div>
                           <div className="overflow-hidden">
                             <h4 className="font-bold text-slate-800 text-sm truncate w-24">{p.name}</h4>
                             <p className="text-xs text-slate-500 truncate">อายุ: {p.age}</p>
                           </div>
                         </div>
                         <div className={`w-2 h-2 rounded-full 
                           ${p.status === 'stable' ? 'bg-emerald-500' : p.status === 'monitor' ? 'bg-amber-500' : 'bg-rose-500'}
                         `}></div>
                       </div>
                       
                       <div className="space-y-2 mb-3">
                         <div className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 truncate flex items-center gap-1.5">
                           <Stethoscope size={12} className="text-teal-600 shrink-0" />
                           {p.diagnosis}
                         </div>
                         <div className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 truncate flex items-center gap-1.5">
                           <Activity size={12} className="text-rose-500 shrink-0" />
                           {p.vitals}
                         </div>
                       </div>

                       <button 
                         onClick={() => openPatientDetail(p)}
                         className="w-full py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-colors"
                       >
                         ดูข้อมูล
                       </button>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
        </div>
      </main>

      {/* Render Active Modals */}
      <AlertModal />
      <SettingsModal />
      {activeModal === 'medication' && renderMedicationSchedule()}
      {activeModal === 'summary' && renderShiftSummary()}
      {activeModal === 'notes' && renderSymptomLogs()}
      {activeModal === 'patientDetail' && renderPatientDetail()}
    </div>
  );

  return (
    <div className="font-sans text-slate-900 bg-slate-50 min-h-screen">
      {currentPage === 'login' && renderLogin()}
      {currentPage === 'scan' && renderScan()}
      {currentPage === 'confirm' && renderConfirm()}
      {currentPage === 'handover' && renderHandover()}
      {currentPage === 'dashboard' && renderDashboard()}
    </div>
  );
}