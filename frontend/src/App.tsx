import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Calendar, Users, FileText, Upload, AlertCircle,
    Settings, ChevronLeft, Search, Bell, Menu, ChevronRight,
    Zap, ArrowRightLeft, Sparkles, UserSearch, LogOut
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Reconciliation from './components/Reconciliation';
import Employees from './components/Employees';
import UploadCenter from './components/UploadCenter';
import HRActions from './components/HRActions';
import Reports from './components/Reports';
import AIAnalytics from './components/AIAnalytics';
import EmployeeSummary from './components/EmployeeSummary';
import { ToastContainer } from './components/SharedUI';

type TabId = 'dashboard' | 'attendance' | 'reconciliation' | 'employees' | 'vendors' | 'stores' | 'departments' | 'shifts' | 'overtime' | 'reports' | 'upload' | 'actions' | 'settings' | 'aianalytics' | 'employee-summary';

interface SidebarItem {
    id: TabId;
    label: string;
    icon: React.ElementType;
    category?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Calendar, category: 'Attendance' },
    { id: 'reconciliation', label: 'Reconciliation', icon: ArrowRightLeft, category: 'Attendance' },
    { id: 'employees', label: 'Employees', icon: Users, category: 'Master Data' },
    { id: 'overtime', label: 'Overtime', icon: Zap, category: 'Operations' },
    { id: 'reports', label: 'Reports', icon: FileText, category: 'Operations' },
    { id: 'upload', label: 'Upload Center', icon: Upload, category: 'Operations' },
    { id: 'actions', label: 'HR Action Center', icon: AlertCircle, category: 'Operations' },
    { id: 'aianalytics', label: 'AI Analytics', icon: Sparkles, category: 'Operations' },
    { id: 'employee-summary', label: 'Employee Summary', icon: UserSearch, category: 'Operations' },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>          {/* <-- ADD THIS */}
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
}

function AppContent() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toasts, setToasts] = useState<any[]>([]);
    const [employeeSummaryPR, setEmployeeSummaryPR] = useState<string>('');

    useEffect(() => {
        const handleNavigate = (e: any) => {
            if (e.detail) {
                setActiveTab(e.detail);
                if (e.pr_number) {
                    setEmployeeSummaryPR(e.pr_number);
                }
            }
        };
        window.addEventListener('navigate', handleNavigate);
        return () => window.removeEventListener('navigate', handleNavigate);
    }, []);

    const addToast = (message: string, type: string = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // ── Show login screen if not authenticated ──
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-700 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'attendance': return <Attendance />;
            case 'reconciliation': return <Reconciliation />;
            case 'employees': return <Employees />;
            case 'vendors': return <Employees />;
            case 'stores': return <Employees />;
            case 'departments': return <Employees />;
            case 'shifts': return <Reports />;
            case 'overtime': return <Attendance />;
            case 'reports': return <Reports />;
            case 'upload': return <UploadCenter />;
            case 'actions': return <HRActions />;
            case 'aianalytics': return <AIAnalytics />;
            case 'employee-summary': return <EmployeeSummary initialPR={employeeSummaryPR} />;
            case 'settings': return <Reports />;
            default: return <Dashboard />;
        }
    };

    const groupedSidebar = SIDEBAR_ITEMS.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, SidebarItem[]>);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out`}>
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    {sidebarOpen && (
                        <div>
                            <h1 className="text-sm font-bold text-slate-800 leading-tight">SeaBird</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">HR Analytics</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-6">
                    {Object.entries(groupedSidebar).map(([category, items]) => (
                        <div key={category}>
                            {sidebarOpen && category !== 'General' && (
                                <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</p>
                            )}
                            <div className="space-y-1">
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === item.id
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
                                        {sidebarOpen && <span>{item.label}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t border-slate-100">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="p-2 text-slate-400 hover:text-slate-600 lg:hidden">
                            <Menu size={20} />
                        </button>
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search employees, PR, actions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-700">
                                    {user?.name?.charAt(0) || "U"}
                                </span>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-slate-700">{user?.name || "User"}</p>
                                <p className="text-xs text-slate-400">{user?.role || "hr_manager"}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {renderContent()}
                </main>
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}