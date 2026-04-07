import React, { useRef, useState, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, Search, GitBranch } from 'lucide-react';

const GraphViewer = ({ graph, scanStatus, progress, progressMessage }) => {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);

  const isScanning = scanStatus === 'scanning';
  const isCompleted = scanStatus === 'completed';

  // Resize observer to keep the canvas filling the container automatically
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight - 49 // minus control bar height (48px + border)
      });
    };
    
    updateDimensions();
    
    // Simple window resize listener
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update highlighting whenever search changes
  useEffect(() => {
    if (!graph || !searchTerm) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const term = searchTerm.toLowerCase();
    const newHLNodes = new Set();
    
    graph.nodes.forEach(node => {
      if (node.label.toLowerCase().includes(term)) {
        newHLNodes.add(node.id);
      }
    });
    
    setHighlightNodes(newHLNodes);
  }, [searchTerm, graph]);

  // Graph styling
  const nodeColor = (node) => {
    switch(node.type) {
      case 'Core':   return '#4F8EF7';
      case 'Util':   return '#43D9AD';
      case 'API':    return '#F59E0B';
      case 'Cyclic': return '#EF4444';
      default:       return '#4F8EF7';
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.5, 400); // 400ms transition
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.5, 400);
    }
  };

  const handleFitScreen = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50); // duration ms, padding px
    }
  };

  const handleNodeHover = useCallback((node) => {
    setHoverNode(node);
    
    if (!node) {
      // If not searching, clear highlights
      if (!searchTerm) {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
      }
      return;
    }
    
    if (searchTerm) return; // Keep search highlights if searching

    // Highlight hovered node and its neighbors
    const nodes = new Set();
    const links = new Set();
    
    nodes.add(node.id);
    
    graph?.links?.forEach(link => {
      // Handle d3 linking structure (source/target can be objects after runtime)
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === node.id || targetId === node.id) {
        links.add(link);
        nodes.add(sourceId);
        nodes.add(targetId);
      }
    });
    
    setHighlightNodes(nodes);
    setHighlightLinks(links);
  }, [graph, searchTerm]);

  return (
    <div ref={containerRef} className="flex-1 bg-[#1E1E2E] flex flex-col relative overflow-hidden h-full">
      
      {/* CONTROLS BAR */}
      <div className="bg-[#12121F] border-b border-[#2A2A3E] px-4 py-2.5 flex items-center justify-between shrink-0 z-10 w-full shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleZoomIn}
            className="p-1.5 text-[#6B7280] hover:text-[#E2E8F0] hover:bg-[#2A2A3E] rounded transition-colors"
            title="Zoom In"
            disabled={!isCompleted}
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-1.5 text-[#6B7280] hover:text-[#E2E8F0] hover:bg-[#2A2A3E] rounded transition-colors"
            title="Zoom Out"
            disabled={!isCompleted}
          >
            <ZoomOut size={18} />
          </button>
          <div className="w-px h-5 bg-[#2A2A3E] mx-1"></div>
          <button 
            onClick={handleFitScreen}
            className="p-1.5 text-[#6B7280] hover:text-[#E2E8F0] hover:bg-[#2A2A3E] rounded transition-colors"
            title="Fit to Screen"
            disabled={!isCompleted}
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="relative w-64">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-muted" />
           </div>
           <input 
             type="text"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             disabled={!isCompleted}
             placeholder="Search files..."
             className="w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-md pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue transition-colors disabled:opacity-50"
           />
        </div>
      </div>

      {/* GRAPH CANVAS AREA */}
      <div className="flex-1 relative w-full h-full">
        
        {/* EMPTY STATE */}
        {(!scanStatus || scanStatus === 'idle' || scanStatus === 'failed') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center text-center animate-fade-in max-w-sm">
              <div className="w-20 h-20 rounded-full bg-[#16162A] border border-[#2A2A3E] flex items-center justify-center mb-5 shadow-lg">
                <GitBranch size={32} className="text-[#41415D]" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-[#E2E8F0] mb-2 tracking-wide">No dependency graph yet</h2>
              <p className="text-sm text-muted">
                {scanStatus === 'failed' 
                  ? 'The previous scan failed. Check the logs and try again.' 
                  : 'Enter a repository path in the sidebar and click Scan Repository to generate visualization.'}
              </p>
            </div>
          </div>
        )}

        {/* SCANNING STATE */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#1E1E2E]/80 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center max-w-xs text-center">
               <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                 {/* Outer glowing rings */}
                 <div className="absolute inset-0 rounded-full border border-blue/20 animate-ping"></div>
                 <div className="absolute inset-2 rounded-full border border-mint/40 animate-pulse-ring delay-150"></div>
                 {/* Inner spinner */}
                 <div className="w-12 h-12 border-4 border-[#2A2A3E] border-t-blue rounded-full animate-spin shadow-[0_0_15px_rgba(79,142,247,0.4)]"></div>
                 
                 <div className="absolute text-[10px] font-bold text-white tracking-widest bg-[#12121F] px-1 py-0.5 rounded border border-[#2A2A3E]">
                   {progress}%
                 </div>
               </div>
               
               <h3 className="text-white font-medium text-lg tracking-wide mb-1">Analyzing Codebase</h3>
               <p className="text-sm text-muted truncate w-full">{progressMessage || 'Parsing module trees...'}</p>
            </div>
          </div>
        )}

        {/* FORCE GRAPH */}
        {isCompleted && graph && dimensions.width > 0 && dimensions.height > 0 && (
          <div className="absolute inset-0 animate-fade-in">
             <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graph}
                
                nodeId="id"
                nodeLabel="label"
                
                backgroundColor="#1E1E2E"
                
                linkColor={() => '#2A2A3E'}
                linkWidth={(link) => highlightLinks.has(link) ? 2 : 0.8}
                linkDirectionalArrowLength={3}
                linkDirectionalArrowRelPos={1}
                linkHoverPrecision={4}

                nodeCanvasObject={(node, ctx, globalScale) => {
                  const x = node.x;
                  const y = node.y;
                  
                  // Handle Dimming for search/hover isolation
                  const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
                  ctx.globalAlpha = isHighlighted ? 1 : 0.2;

                  // Base Circle
                  ctx.beginPath();
                  ctx.arc(x, y, 5, 0, 2 * Math.PI);
                  ctx.fillStyle = nodeColor(node);
                  ctx.fill();

                  // Custom Cyclic Pulsing Ring Animation
                  if (node.type === 'Cyclic') {
                    if (!node.__pulse) node.__pulse = Math.random() * 1000; // Offset staggering
                    
                    const time = Date.now() + node.__pulse;
                    const pulseExpansion = (Math.sin(time / 400) + 1) * 3; // Waves between 0 and 6
                    const pulseSize = 5 + pulseExpansion;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, pulseSize, 0, 2 * Math.PI);
                    ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 - (pulseExpansion/6)})`; // Fade out as it expands
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                  }

                  // Hover ring
                  if (node === hoverNode) {
                    ctx.beginPath();
                    ctx.arc(x, y, 7, 0, 2 * Math.PI);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                  }

                  // Label Rendering (only if zoomed in)
                  if (globalScale > 1.5 && isHighlighted) {
                    const label = node.label.split(/[/\\]/).pop(); // basename
                    const fontSize = Math.max(12 / globalScale, 4);
                    
                    ctx.font = `${fontSize}px Inter, sans-serif`;
                    ctx.fillStyle = '#E2E8F0';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(label, x, y + 8);
                  }

                  ctx.globalAlpha = 1; // Reset
                }}

                onNodeHover={handleNodeHover}
                
                onEngineStop={() => handleFitScreen()} // Auto-fit once layout settles initially

                d3Force={(forceType) => {
                   // Optional: Tuning force parameters to exactly match spec if desired, 
                   // but usually leaving default d3 forces works best. 
                   // To explicitly set them:
                   return undefined; 
                }}
             />
             
             {/* Floating Tooltip Custom Overlay (optional enhancement over native canvas title) */}
             {hoverNode && (
               <div className="absolute bottom-4 right-4 bg-[#12121F] border border-[#2A2A3E] p-3 rounded-lg shadow-xl max-w-xs pointer-events-none animate-fade-in z-20">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: nodeColor(hoverNode) }}></div>
                   <span className="text-xs font-bold text-white uppercase tracking-wider">{hoverNode.type} MODULE</span>
                 </div>
                 <p className="text-sm font-mono text-[#E2E8F0] break-all">{hoverNode.id}</p>
                 <div className="mt-2 text-xs flex gap-4 text-muted">
                   <span><strong className="text-blue">In:</strong> {hoverNode.fanIn || 0}</span>
                   <span><strong className="text-mint">Out:</strong> {hoverNode.fanOut || 0}</span>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphViewer;
