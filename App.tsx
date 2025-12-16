import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Company, DashboardStats } from './types';
import { StorageService } from './services/storage';
import { formatCNPJ, getCurrentCycle, formatCycleDisplay } from './utils/format';
import { Plus, Trash2, Search, ArrowRight, TrendingUp, CheckCircle, Clock, Building, Building2, Calendar } from 'lucide-react';
import { CertificateHub } from './components/CertificateHub';
import { CERTIFICATE_DEFINITIONS } from './constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', cnpj: '' });
  const [error, setError] = useState('');
  const [dashboardCycle, setDashboardCycle] = useState(getCurrentCycle());
  const [searchTerm, setSearchTerm] = useState('');

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalCertificatesInCycle: 0,
    completedCertificates: 0,
    pendingCertificates: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    refreshData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dashboardCycle]);

  useEffect(() => {
    const filtered = companies.filter(c => 
      c.razãoSocial.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.cnpj.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
    );
    setFilteredCompanies(filtered);
  }, [searchTerm, companies]);

  const refreshData = async () => {
    try {
      const loadedCompanies = await StorageService.getCompanies();
      setCompanies(loadedCompanies);
      await calculateStats(loadedCompanies);
    } catch (e) {
      console.error("Failed to refresh data", e);
    }
  };

  const calculateStats = async (comps: Company[]) => {
    const emissions = await StorageService.getAllEmissionsInCycle(dashboardCycle);
    const totalPotential = comps.length * CERTIFICATE_DEFINITIONS.length;
    const completed = emissions.length;

    setStats({
      totalCompanies: comps.length,
      totalCertificatesInCycle: totalPotential,
      completedCertificates: completed,
      pendingCertificates: totalPotential - completed
    });

    // Chart Data Preparation
    const data = comps.map(c => {
        const companyEmissions = emissions.filter(e => e.companyId === c.id);
        return {
            name: c.razãoSocial.length > 15 ? c.razãoSocial.substring(0, 15) + '...' : c.razãoSocial,
            completed: companyEmissions.length,
            pending: CERTIFICATE_DEFINITIONS.length - companyEmissions.length,
            fullCompletion: companyEmissions.length === CERTIFICATE_DEFINITIONS.length
        };
    });
    setChartData(data);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newCompany.name || !newCompany.cnpj) {
      setError('Preencha todos os campos.');
      return;
    }

    try {
      const company: Company = {
        id: generateId(),
        razãoSocial: newCompany.name,
        cnpj: newCompany.cnpj,
        createdAt: new Date().toISOString()
      };
      await StorageService.saveCompany(company);
      setNewCompany({ name: '', cnpj: '' });
      setIsModalOpen(false);
      await refreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCompany = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      await StorageService.deleteCompany(id);
      await refreshData();
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCompany({ ...newCompany, cnpj: formatCNPJ(e.target.value) });
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard de Conformidade</h1>
            <p className="text-slate-500">Visão geral das emissões de {formatCycleDisplay(dashboardCycle)}</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg border shadow-sm">
          <Calendar size={18} className="text-slate-500 ml-2" />
          <input 
            type="month" 
            value={dashboardCycle}
            onChange={(e) => setDashboardCycle(e.target.value)}
            className="bg-transparent border-none text-slate-700 font-medium focus:ring-0 cursor-pointer outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Building size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Empresas Ativas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalCompanies}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Emitidas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.completedCertificates}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <Clock size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Pendentes</p>
                <p className="text-2xl font-bold text-slate-800">{stats.pendingCertificates}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <TrendingUp size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Conformidade</p>
                <p className="text-2xl font-bold text-slate-800">
                    {stats.totalCertificatesInCycle > 0 
                     ? Math.round((stats.completedCertificates / stats.totalCertificatesInCycle) * 100) 
                     : 0}%
                </p>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Status por Empresa</h2>
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, CERTIFICATE_DEFINITIONS.length]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="completed" stackId="a" radius={[0, 4, 4, 0]} barSize={20}>
                         {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fullCompletion ? '#22c55e' : '#3b82f6'} />
                        ))}
                    </Bar>
                    <Bar dataKey="pending" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Render Company List
  const renderCompanyList = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestão de Carteira</h1>
          <p className="text-slate-500">Selecione uma empresa para iniciar as emissões</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Empresa
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Razão Social ou CNPJ..." 
            className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
        />
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Building className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-600">Nenhuma empresa cadastrada</h3>
            <p className="text-slate-400">Adicione sua primeira empresa para começar.</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
         <div className="text-center py-10">
            <p className="text-slate-500">Nenhuma empresa encontrada para a busca.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map(company => (
            <div 
                key={company.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 group cursor-pointer overflow-hidden"
                onClick={() => setSelectedCompany(company)}
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Building2 size={24} />
                        </div>
                        <button 
                            onClick={(e) => handleDeleteCompany(company.id, e)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Remover empresa"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1 truncate">{company.razãoSocial}</h3>
                    <p className="text-sm text-slate-500 font-mono mb-6">{company.cnpj}</p>
                    
                    <div className="flex items-center justify-between text-blue-600 font-medium group-hover:underline">
                        <span>Iniciar Emissões</span>
                        <ArrowRight size={18} />
                    </div>
                </div>
                <div className="h-1 w-full bg-slate-100">
                    <div className="h-full bg-blue-600 w-0 group-hover:w-full transition-all duration-500"></div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout activeTab={activeTab} onChangeTab={(tab) => { setSelectedCompany(null); setActiveTab(tab); }}>
      {selectedCompany ? (
        <CertificateHub company={selectedCompany} onBack={() => { setSelectedCompany(null); refreshData(); }} />
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'companies' && renderCompanyList()}
        </>
      )}

      {/* Add Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Cadastrar Nova Empresa</h2>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Minha Empresa LTDA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={newCompany.cnpj}
                  onChange={handleCnpjChange}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;