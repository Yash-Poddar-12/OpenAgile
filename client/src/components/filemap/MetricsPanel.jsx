import React from 'react';
import { FileCode, Table, Image as ImageIcon } from 'lucide-react';
import Skeleton from '../common/Skeleton';

const MetricsPanel = ({ metrics, scanStatus, onExport }) => {
  const isCompleted = scanStatus === 'completed';
  const isScanning = scanStatus === 'scanning';

  const formatNumber = (num) => new Intl.NumberFormat().format(num || 0);

  const renderTop5Rows = (list = []) => {
    if (!isCompleted) {
      return (
        <div className="flex flex-col gap-2 mt-2">
          <Skeleton.Row />
          <Skeleton.Row />
          <Skeleton.Row />
        </div>
      );
    }

    if (list.length === 0) {
      return <div className="text-sm text-muted py-2">No data recorded.</div>;
    }

    return list.map((item, index) => {
      const basename = item.file.split(/[/\\]/).pop(); // Extract filename safely
      
      return (
        <div key={index} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 hover:bg-[#1E1E2E] rounded transition-colors px-1">
          <span className="text-xs text-muted truncate max-w-[180px]" title={item.file}>
            {basename}
          </span>
          <span className="text-xs font-mono text-blue font-medium bg-[#12121F] px-2 py-0.5 rounded shadow-sm border border-[#2A2A3E]">
            {item.count}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="w-[300px] bg-[#12121F] border-l border-[#2A2A3E] overflow-y-auto px-4 py-4 flex flex-col custom-scrollbar shrink-0 h-full">
      
      {/* REPOSITORY METRICS CARD */}
      <div className="bg-[#16162A] border border-[#2A2A3E] rounded-xl p-4 mb-4 shadow-sm relative overflow-hidden">
        {isScanning && (
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue via-mint to-blue bg-[length:200%_auto] animate-shimmer"></div>
        )}
        <h3 className="text-sm font-semibold text-white mb-3 tracking-wide">Repository Metrics</h3>
        
        <div className="flex flex-col">
          <div className="flex justify-between items-center py-1.5 border-b border-border">
             <span className="text-sm text-muted">Total Files</span>
             {isCompleted ? <span className="text-sm font-medium text-white">{formatNumber(metrics?.nodesCount)}</span> : <Skeleton.Text width="40px" />}
          </div>
          
          <div className="flex justify-between items-center py-1.5 border-b border-border">
             <span className="text-sm text-muted">Total Dependencies</span>
             {isCompleted ? <span className="text-sm font-medium text-white">{formatNumber(metrics?.edgesCount)}</span> : <Skeleton.Text width="40px" />}
          </div>

          <div className="flex justify-between items-center py-1.5 border-border">
             <span className="text-sm text-muted">Cycles Detected</span>
             {isCompleted ? (
               <div className={`px-2 py-0.5 rounded text-xs font-bold border ${metrics.cyclesCount > 0 ? 'bg-danger/10 text-danger border-danger/30 animate-pulse-ring' : 'bg-success/10 text-success border-success/30'}`}>
                 {formatNumber(metrics.cyclesCount)}
               </div>
             ) : <Skeleton.Text width="30px" />}
          </div>
        </div>
      </div>

      {/* FAN-IN (DEPENDED UPON) */}
      <div className="bg-[#16162A] border border-[#2A2A3E] rounded-xl p-4 mb-4 shadow-sm">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-white tracking-wide">Fan-In (Top 5)</h3>
          <span className="text-[10px] text-muted uppercase tracking-wider">(Most imported by others)</span>
        </div>
        
        <div className="flex flex-col mt-3">
          {renderTop5Rows(metrics?.fanInTop5)}
        </div>
      </div>

      {/* FAN-OUT (DEPENDENCIES) */}
      <div className="bg-[#16162A] border border-[#2A2A3E] rounded-xl p-4 mb-4 shadow-sm">
         <div className="mb-2">
          <h3 className="text-sm font-semibold text-white tracking-wide">Fan-Out (Top 5)</h3>
          <span className="text-[10px] text-muted uppercase tracking-wider">(Highest external dependency count)</span>
        </div>
        
        <div className="flex flex-col mt-3">
          {renderTop5Rows(metrics?.fanOutTop5)}
        </div>
      </div>

      {/* EXPORT CARD */}
      <div className="bg-[#16162A] border border-[#2A2A3E] rounded-xl p-4 mt-auto mb-2 shadow-sm">
        <h3 className="text-sm font-semibold text-white tracking-wide mb-4">Export Analysis</h3>
        
        <div className="flex flex-col gap-2.5">
          <button 
            disabled={!isCompleted}
            onClick={() => onExport('DOT')}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A3E] border border-[#2A2A3E] hover:border-blue transition-all rounded-lg py-2.5 text-sm text-[#E2E8F0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
          >
            <FileCode size={16} className="text-blue group-hover:scale-110 transition-transform" />
            <span>Export Graph (DOT)</span>
          </button>
          
          <button 
            disabled={!isCompleted}
            onClick={() => onExport('CSV')}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A3E] border border-[#2A2A3E] hover:border-mint transition-all rounded-lg py-2.5 text-sm text-[#E2E8F0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
          >
            <Table size={16} className="text-mint group-hover:scale-110 transition-transform" />
            <span>Export Metrics (CSV)</span>
          </button>

          <button 
            disabled={!isCompleted}
            onClick={() => onExport('PNG')}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A3E] border border-[#2A2A3E] hover:border-warning transition-all rounded-lg py-2.5 text-sm text-[#E2E8F0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
          >
            <ImageIcon size={16} className="text-warning group-hover:scale-110 transition-transform" />
            <span>Export Image (PNG)</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default MetricsPanel;
