import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Table } from '../../types';
import { generateQrDataUrl, generateQrSvg, printQrCard } from '../../utils/qr';
import { QrCode, Download, Printer, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QRManager: React.FC = () => {
  const { tables, settings, updateTable } = useStore();
  const [selectedTable, setSelectedTable] = useState<Table>(tables[0] || null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const getTableQrUrl = (table: Table) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dineflow.app';
    return `${origin}/qr/${settings.id}/${table.id}`;
  };

  useEffect(() => {
    if (selectedTable) {
      const url = getTableQrUrl(selectedTable);
      generateQrDataUrl(url).then(setQrDataUrl);
    }
  }, [selectedTable, settings.id]);

  const handleDownloadPng = async (table: Table) => {
    const url = getTableQrUrl(table);
    const dataUrl = await generateQrDataUrl(url);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_Code_Table_${table.tableNumber}_${settings.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleDownloadSvg = async (table: Table) => {
    const url = getTableQrUrl(table);
    const svgStr = await generateQrSvg(url);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `QR_Code_Table_${table.tableNumber}_${settings.name.replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handlePrintCard = async (table: Table) => {
    const url = getTableQrUrl(table);
    const dataUrl = await generateQrDataUrl(url);
    printQrCard(
      settings.name,
      settings.logoUrl,
      table.tableNumber,
      table.name,
      dataUrl
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>Table QR Code Station</span>
          </h3>
          <p className="text-xs text-zinc-400">Generate, preview, export SVG/PNG, and print lamination QR cards</p>
        </div>
      </div>

      {/* Main Grid: Left Table Selector, Right QR Card Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables Picker List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Select Table to Manage QR</h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  selectedTable?.id === table.id
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div>
                  <p className="text-xs font-extrabold text-amber-400">TABLE {table.tableNumber}</p>
                  <p className="text-xs font-medium">{table.name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${table.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {table.isActive ? 'Active QR' : 'Deactivated'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected QR Card Preview & Actions */}
        {selectedTable && (
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
            {/* Formatted Card Mockup */}
            <div className="w-full max-w-[280px] bg-white text-zinc-950 p-6 rounded-2xl border-4 border-zinc-800 shadow-2xl flex flex-col items-center text-center space-y-4 shrink-0">
              <div className="flex flex-col items-center gap-1">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                )}
                <h4 className="text-sm font-black tracking-tight uppercase text-zinc-950">{settings.name}</h4>
                <span className="bg-zinc-950 text-white text-[11px] font-bold px-3 py-0.5 rounded-full tracking-wide">
                  TABLE {selectedTable.tableNumber}
                </span>
              </div>

              <div className="p-2 border-2 border-dashed border-zinc-300 rounded-xl bg-white">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Table QR" className="w-40 h-40 display-block" />
                ) : (
                  <div className="w-40 h-40 bg-zinc-100 flex items-center justify-center text-xs text-zinc-400">Generating...</div>
                )}
              </div>

              <div>
                <p className="text-xs font-black text-zinc-950">📱 Scan to View Menu & Order</p>
                <p className="text-[9px] text-zinc-500 font-medium">Contactless Table Service</p>
              </div>
            </div>

            {/* Actions & Details */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white">Table {selectedTable.tableNumber} QR Config</h4>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs font-semibold text-zinc-300">
                    {selectedTable.section}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-mono break-all bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                  {getTableQrUrl(selectedTable)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => handlePrintCard(selectedTable)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print A5/A6 Card</span>
                </button>

                <button
                  onClick={() => setPreviewModalOpen(true)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-zinc-700 transition"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Full Screen Preview</span>
                </button>

                <button
                  onClick={() => handleDownloadPng(selectedTable)}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-zinc-800 transition"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={() => handleDownloadSvg(selectedTable)}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-zinc-800 transition"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download Vector SVG</span>
                </button>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => updateTable(selectedTable.id, { isActive: !selectedTable.isActive })}
                  className="text-xs font-semibold text-rose-400 hover:underline"
                >
                  {selectedTable.isActive ? 'Deactivate this Table QR' : 'Re-activate Table QR'}
                </button>

                <button
                  onClick={() => {
                    const url = getTableQrUrl(selectedTable);
                    generateQrDataUrl(url).then(setQrDataUrl);
                  }}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate QR</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen QR Preview Modal */}
      <AnimatePresence>
        {previewModalOpen && selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white text-zinc-950 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center text-center space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 font-bold text-lg"
              >
                ✕
              </button>

              <div className="flex flex-col items-center gap-1.5">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-contain" />
                )}
                <h2 className="text-xl font-extrabold uppercase tracking-tight">{settings.name}</h2>
                <span className="bg-zinc-950 text-white font-bold text-sm px-4 py-1 rounded-full">
                  TABLE {selectedTable.tableNumber} ({selectedTable.name})
                </span>
              </div>

              <div className="p-4 border-2 border-dashed border-zinc-300 rounded-2xl bg-white">
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 display-block" />
              </div>

              <div>
                <p className="text-base font-black text-zinc-950">📱 Scan to Order Contactless</p>
                <p className="text-xs text-zinc-500 mt-0.5">Powered by DineFlow Operating System</p>
              </div>

              <button
                onClick={() => {
                  handlePrintCard(selectedTable);
                  setPreviewModalOpen(false);
                }}
                className="w-full bg-zinc-950 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl"
              >
                <Printer className="w-4 h-4" />
                <span>Print This Card</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
