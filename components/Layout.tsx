import React from 'react';
import { LayoutDashboard, Building2, FileCheck, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'companies';
  onChangeTab: (tab: 'dashboard' | 'companies') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onChangeTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ id, label, icon: Icon }: { id: 'dashboard' | 'companies'; label: string; icon: any }) => (
    <button
      onClick={() => {
        onChangeTab(id);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
        activeTab === id
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2">
            <FileCheck className="text-blue-600" size={24} />
            <span className="font-bold text-lg text-slate-800">CertiGest</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b flex items-center space-x-2">
          <FileCheck className="text-blue-600" size={28} />
          <span className="font-bold text-xl text-slate-800">CertiGest</span>
        </div>
        <nav className="p-4 space-y-2">
          <NavItem id="dashboard" label="Visão Geral" icon={LayoutDashboard} />
          <NavItem id="companies" label="Empresas" icon={Building2} />
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
             &copy; 2024 CertiGest System
          </p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};