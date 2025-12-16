import React, { useState, useEffect } from 'react';
import { Company, EmissionStatus, EmissionRecord } from '../types';
import { CERTIFICATE_DEFINITIONS } from '../constants';
import { StorageService } from '../services/storage';
import { ExternalLink, Copy, CheckCircle2, AlertCircle, Upload, FileText, ChevronLeft, Calendar, FileDown, Loader2, History, Plus } from 'lucide-react';
import { getCurrentCycle, formatCycleDisplay } from '../utils/format';
import { PDFDocument } from 'pdf-lib';

interface CertificateHubProps {
  company: Company;
  onBack: () => void;
}

export const CertificateHub: React.FC<CertificateHubProps> = ({ company, onBack }) => {
  const [cycle, setCycle] = useState(getCurrentCycle());
  const [availableCycles, setAvailableCycles] = useState<string[]>([]);
  const [emissions, setEmissions] = useState<Record<string, EmissionRecord>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadEmissions();
      await updateAvailableCycles();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, company.id]);

  const loadEmissions = async () => {
    try {
      const records = await StorageService.getEmissions(company.id, cycle);
      const map: Record<string, EmissionRecord> = {};
      records.forEach(r => {
        map[r.certificateDefId] = r;
      });
      setEmissions(map);
    } catch (error) {
      console.error("Error loading emissions:", error);
      showToast("Erro ao carregar certidões.", 'error');
    }
  };

  const updateAvailableCycles = async () => {
    try {
      const cycles = await StorageService.getCompanyCycles(company.id);
      // Ensure current cycle is in the list if it has data, or just for selection logic
      if (!cycles.includes(cycle) && Object.keys(emissions).length > 0) {
          cycles.unshift(cycle);
          cycles.sort().reverse();
      }
      setAvailableCycles(cycles);
    } catch (e) {
      console.error("Error updating cycles", e);
    }
  };

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyAndOpen = async (text: string, message: string, url?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message, 'success');
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      showToast('Erro ao copiar dados.', 'info');
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleFileUpload = async (certId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const record: EmissionRecord = {
      id: generateId(),
      companyId: company.id,
      certificateDefId: certId,
      cycle: cycle,
      status: EmissionStatus.ISSUED,
      issuedAt: new Date().toISOString(),
      fileName: file.name,
      fileBlob: file // Store the actual Blob in IndexedDB
    };

    try {
      await StorageService.saveEmission(record);
      await loadEmissions();
      await updateAvailableCycles(); 
      showToast('Certidão emitida e salva com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar certidão.', 'error');
    }
  };

  const handleMergePdfs = async () => {
    if (Object.keys(emissions).length === 0) {
      showToast('Nenhuma certidão emitida para gerar o dossiê.', 'error');
      return;
    }

    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      let addedCount = 0;

      // Iterate in order of definitions to maintain a consistent structure
      for (const def of CERTIFICATE_DEFINITIONS) {
        const record = emissions[def.id];
        
        if (record && record.fileUrl) {
          try {
            // Fetch bytes from the Blob URL (created by getEmissions)
            const fileBytes = await fetch(record.fileUrl).then(res => res.arrayBuffer());
            const fileName = record.fileName?.toLowerCase() || '';

            if (fileName.endsWith('.pdf')) {
              const srcPdf = await PDFDocument.load(fileBytes);
              const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
              copiedPages.forEach((page) => mergedPdf.addPage(page));
              addedCount++;
            } else if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
              // Handle images by embedding them into a new page
              const page = mergedPdf.addPage();
              let image;
              if (fileName.endsWith('.png')) {
                image = await mergedPdf.embedPng(fileBytes);
              } else {
                image = await mergedPdf.embedJpg(fileBytes);
              }
              
              // Scale image to fit page with some margin
              const { width, height } = image.scale(1);
              const pageWidth = page.getWidth();
              const pageHeight = page.getHeight();
              const margin = 50;
              
              const scaleFactor = Math.min(
                (pageWidth - margin * 2) / width, 
                (pageHeight - margin * 2) / height
              );

              const dims = image.scale(scaleFactor);
              
              page.drawImage(image, {
                x: pageWidth / 2 - dims.width / 2,
                y: pageHeight / 2 - dims.height / 2,
                width: dims.width,
                height: dims.height,
              });
              
              // Add title
              page.drawText(`${def.name} - ${company.razãoSocial}`, {
                x: 50,
                y: pageHeight - 40,
                size: 12,
              });
              addedCount++;
            }
          } catch (e) {
            console.error(`Erro ao processar ${def.name}:`, e);
          }
        }
      }

      if (addedCount === 0) {
        throw new Error("Não foi possível processar nenhum arquivo. Certifique-se que são PDFs ou Imagens válidos.");
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dossie_${company.razãoSocial.replace(/\s+/g, '_')}_${cycle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Dossiê gerado com sucesso!', 'success');

    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar dossiê unificado.', 'error');
    } finally {
      setIsMerging(false);
    }
  };

  const stats = {
    total: CERTIFICATE_DEFINITIONS.length,
    completed: Object.keys(emissions).length,
    pending: CERTIFICATE_DEFINITIONS.length - Object.keys(emissions).length
  };

  const progressPercentage = Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <button 
            onClick={onBack}
            className="flex items-center text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={20} className="mr-1" /> Voltar
        </button>
        <div className="text-right">
            <h1 className="text-xl font-bold text-slate-800">{company.razãoSocial}</h1>
            <p className="text-slate-500 font-mono text-xs">CNPJ: {company.cnpj}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Months History */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-700 flex items-center">
                        <History size={18} className="mr-2 text-slate-400" />
                        Competência
                    </h2>
                </div>
                
                {/* Current/New Month Selector */}
                <div className="mb-4">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Selecionar Mês</label>
                     <div className="flex items-center bg-slate-50 border rounded-lg px-2">
                        <Calendar size={16} className="text-slate-500 mr-2" />
                        <input 
                            type="month" 
                            value={cycle}
                            onChange={(e) => setCycle(e.target.value)}
                            className="bg-transparent border-none text-slate-700 font-medium text-sm py-2 focus:ring-0 cursor-pointer w-full outline-none"
                        />
                     </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Histórico</p>
                    {availableCycles.length === 0 && (
                        <p className="text-sm text-slate-400 italic px-2">Nenhum histórico.</p>
                    )}
                    {availableCycles.map(c => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                                cycle === c 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span>{formatCycleDisplay(c)}</span>
                            {cycle === c && <CheckCircle2 size={14} />}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Content: Certificates */}
        <div className="flex-1 space-y-6">
            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-slate-600">Progresso de {formatCycleDisplay(cycle)}</span>
                <span className="text-sm font-bold text-blue-600">{progressPercentage}% Completo</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                ></div>
                </div>
            </div>

            {/* Certificate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {CERTIFICATE_DEFINITIONS.map((cert, index) => {
                const record = emissions[cert.id];
                const isIssued = !!record;
                const cleanCnpj = company.cnpj.replace(/\D/g, '');
                const formattedIndex = String(index + 1).padStart(2, '0');

                return (
                    <div 
                    key={cert.id} 
                    className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-200 ${
                        isIssued 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    >
                    <div>
                        <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                            isIssued ? 'bg-green-200 text-green-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {cert.category}
                        </span>
                        {isIssued ? (
                            <CheckCircle2 className="text-green-600" size={20} />
                        ) : (
                            <AlertCircle className="text-amber-500" size={20} />
                        )}
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1 leading-snug min-h-[48px] flex items-start gap-2">
                            <span className="text-blue-600 font-mono text-lg opacity-50 font-bold">{formattedIndex}</span>
                            {cert.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 pl-8">
                        {isIssued 
                            ? `Emitida em: ${new Date(record.issuedAt!).toLocaleDateString()}` 
                            : 'Pendente emissão'}
                        </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100/50">
                        {/* Action Buttons */}
                        {cert.id === 'falencia-concordata-tjsp' ? (
                        <div className="flex flex-col gap-2">
                            <button
                            onClick={() => handleCopyAndOpen(company.razãoSocial, 'Razão Social copiada! Selecione "Jurídica" e o modelo de Falências.', cert.url)}
                            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                            >
                            <Copy size={14} className="mr-2 group-hover:scale-110 transition-transform" />
                            <span className="mr-1">Copiar Razão & Abrir</span>
                            <ExternalLink size={12} />
                            </button>
                            <button
                            onClick={() => handleCopyAndOpen(cleanCnpj, 'CNPJ copiado!')}
                            className="flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            >
                            <Copy size={12} className="mr-2" />
                            <span>Copiar apenas CNPJ</span>
                            </button>
                        </div>
                        ) : (
                        <button
                            onClick={() => {
                            let text = cleanCnpj;
                            let msg = 'CNPJ copiado! Abrindo site...';
                            if (cert.id === 'divida-ativa-estadual-sp') {
                                text = cleanCnpj.substring(0, 8);
                                msg = 'CNPJ Base (8 dígitos) copiado! Abrindo site...';
                            }
                            handleCopyAndOpen(text, msg, cert.url);
                            }}
                            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                        >
                            <Copy size={14} className="mr-2 group-hover:scale-110 transition-transform" />
                            <span className="mr-1">
                            Copiar {cert.id === 'divida-ativa-estadual-sp' ? 'CNPJ Base' : 'CNPJ'} & Abrir
                            </span>
                            <ExternalLink size={12} />
                        </button>
                        )}

                        {/* Upload Action */}
                        <div className="relative">
                        <input
                            type="file"
                            id={`file-${cert.id}`}
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload(cert.id, e)}
                        />
                        <label
                            htmlFor={`file-${cert.id}`}
                            className={`flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                            isIssued 
                                ? 'text-green-700 bg-green-200 hover:bg-green-300'
                                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                            }`}
                        >
                            {isIssued ? (
                            <>
                                <FileText size={14} className="mr-2" />
                                {record.fileName && record.fileName.length > 15 
                                ? record.fileName.substring(0, 12) + '...' 
                                : record.fileName || 'Arquivo Anexado'}
                            </>
                            ) : (
                            <>
                                <Upload size={14} className="mr-2" />
                                Confirmar / Upload
                            </>
                            )}
                        </label>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 text-white text-sm font-medium animate-bounce ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Unified Download Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg transform transition-transform duration-300 z-40 ${
        Object.keys(emissions).length > 0 ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
             <div className="bg-blue-100 p-2 rounded-full">
                <FileDown className="text-blue-600" size={24} />
             </div>
             <div>
                <h3 className="font-bold text-slate-800">Dossiê de {formatCycleDisplay(cycle)}</h3>
                <p className="text-sm text-slate-500">
                  {Object.keys(emissions).length} certidões prontas para unificação.
                  {Object.keys(emissions).length < stats.total && ' (Incompleto)'}
                </p>
             </div>
          </div>
          
          <button
            onClick={handleMergePdfs}
            disabled={isMerging}
            className={`flex items-center px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
              isMerging 
              ? 'bg-slate-400 cursor-not-allowed' 
              : Object.keys(emissions).length === stats.total 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isMerging ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Gerando PDF Unificado...
              </>
            ) : (
              <>
                <FileDown className="mr-2" size={20} />
                Baixar Dossiê Completo (PDF)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};