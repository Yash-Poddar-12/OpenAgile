/**
 * server/utils/fileMapEngine.js
 * The core File-Map repository dependency analyzer.
 */
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { globSync } = require('glob');
const babelParser = require('@babel/parser');
const { tarjanSCC } = require('./tarjanSCC');
const DependencyGraph = require('../models/DependencyGraph');

/**
 * Validates a repository path against shell metacharacters and max length.
 */
function validateRepoPath(repoPath) {
  if (repoPath.length > 500) {
    throw new Error('Repository path exceeds maximum length of 500 characters.');
  }
  const invalidChars = /[;|&$`><!(){}[\]]/;
  if (invalidChars.test(repoPath)) {
    throw new Error('Repository path contains invalid shell metacharacters.');
  }
}

// Removed git clone logic.
/**
 * Step 3.3.2 — Walk the directory tree and parse dependencies.
 */
function parseFiles(workDir, config, onProgress) {
  const includePattern = config.includePattern || '**/*.{js,ts,jsx,tsx}';
  const excludePattern = config.excludePattern || '**/node_modules/**';
  
  const extensions = (config.fileExtensions || '.js,.jsx,.ts,.tsx')
    .split(',')
    .map(e => e.trim().toLowerCase());

  // Find all matching files (ignoring excludePattern and .git and node_modules manually for safety)
  let allFiles = globSync(includePattern, { 
    cwd: workDir, 
    absolute: true, 
    nodir: true,
    ignore: [excludePattern, '**/node_modules/**', '**/.git/**'],
    maxDepth: config.maxDepth || 10
  });

  // Filter strictly by requested extensions
  allFiles = allFiles.filter(f => extensions.some(ext => f.toLowerCase().endsWith(ext)));

  onProgress(20, `Found ${allFiles.length} files to parse`);

  const parsedMap = new Map(); // Map<absoluteFilePath, Set<absoluteFilePath>>
  let parsedCount = 0;

  for (const filePath of allFiles) {
    parsedCount++;
    if (parsedCount % 100 === 0) {
      onProgress(20 + Math.floor((parsedCount / allFiles.length) * 35), `Parsed ${parsedCount} files...`);
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.size === 0 || stat.size > 1024 * 1024) continue; // Skip empty or > 1MB

      const code = fs.readFileSync(filePath, 'utf-8');
      const deps = new Set();
      
      const ext = path.extname(filePath).toLowerCase();
      const isJSVariant = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
      
      let parsedSuccessfully = false;

      // 1. AST Parser
      if (config.useAST && isJSVariant) {
        try {
          const ast = babelParser.parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy'],
            errorRecovery: true // don't crash entire file on syntax error
          });
          
          traverseAST(ast, (importSource) => {
            const resolved = resolveImportPath(importSource, filePath, extensions);
            if (resolved) deps.add(resolved);
          });
          parsedSuccessfully = true;
        } catch (e) {
          // Fall back to regex if AST completely fails
        }
      }

      // 2. Regex Fallback
      if (!parsedSuccessfully) {
        const regexDeps = fallbackRegexParser(code);
        for (const dep of regexDeps) {
          const resolved = resolveImportPath(dep, filePath, extensions);
          if (resolved) deps.add(resolved);
        }
      }

      parsedMap.set(filePath, deps);
    } catch (e) {
      // Safely ignore read errors of individual files
      console.warn(`[FileMapEngine] Skipping file due to read error: ${filePath}`);
    }
  }

  onProgress(55, 'All files parsed into memory');
  return parsedMap;
}

/**
 * AST Node Traversal Helper.
 */
function traverseAST(node, onImportFound) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'ImportDeclaration' && node.source && node.source.value) {
    onImportFound(node.source.value);
  } else if (node.type === 'ExportNamedDeclaration' && node.source && node.source.value) { // export * from '...'
    onImportFound(node.source.value);
  } else if (node.type === 'ExportAllDeclaration' && node.source && node.source.value) {
    onImportFound(node.source.value);
  } else if (node.type === 'CallExpression' && node.callee && node.callee.name === 'require') {
    if (node.arguments.length > 0 && node.arguments[0].type === 'StringLiteral') {
      onImportFound(node.arguments[0].value);
    }
  }

  for (const key in node) {
    if (Array.isArray(node[key])) {
      node[key].forEach(child => {
        try {
          traverseAST(child, onImportFound);
        } catch(e) {}
      });
    } else if (node[key] && typeof node[key] === 'object') {
      try {
        traverseAST(node[key], onImportFound);
      } catch(e) {}
    }
  }
}

/**
 * Fallback Regex parser for arbitrary languages or failed ASTs.
 */
function fallbackRegexParser(code) {
  const deps = [];
  // Standard import/require matches: require('xs'), import 'xs', from 'xs', include 'xs'
  const stdPattern = /(?:import|require|from|include)\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = stdPattern.exec(code)) !== null) {
    deps.push(match[1]);
  }
  
  // Python style: import sys, from x import y
  const pyPattern = /(?:import|from)\s+([a-zA-Z0-9_\.]+)/g;
  while ((match = pyPattern.exec(code)) !== null) {
    // Avoid re-capturing "from x import y" twice unnecessarily, but it's safe since external deps are ignored
    if (match[1] !== 'import') deps.push(match[1]);
  }

  return deps;
}

/**
 * Resolves a raw import string to an absolute path.
 * Returns null if the path is external (e.g. 'react', 'lodash') or cannot be resolved.
 */
function resolveImportPath(importStr, sourceFilePath, extensions) {
  if (!importStr.startsWith('.') && !importStr.startsWith('..')) {
    // External package or tsconfig alias
    return null; 
  }

  const baseDir = path.dirname(sourceFilePath);
  let resolvedBase = path.resolve(baseDir, importStr);

  // Try exact match first
  if (fs.existsSync(resolvedBase) && fs.statSync(resolvedBase).isFile()) {
    return resolvedBase;
  }

  // Try appending extensions
  for (const ext of [''].concat(extensions)) {
    // e.g., if importStr is "./Component", try "./Component.tsx", "./Component/index.tsx"
    const withExt = resolvedBase + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }

    const asIndex = path.join(resolvedBase, `index${ext}`);
    if (fs.existsSync(asIndex) && fs.statSync(asIndex).isFile()) {
      return asIndex;
    }
  }

  return null; // Could not resolve locally
}


/**
 * Step 3.3.3 — Map the parsed file paths into nodes and edges for rendering.
 */
function buildGraph(parsedMap, workDir, onProgress) {
  const nodesMap = new Map();
  const edges = [];
  const fanInMap = new Map();
  const fanOutMap = new Map();

  const getLabel = (absolutePath) => {
    // Convert to relative path universally using forward slashes for display
    return path.relative(workDir, absolutePath).replace(/\\/g, '/');
  };

  // Convert map keys to normalized labels to ensure we only process tracked project files
  const validFiles = new Set();
  for (const [absPath] of parsedMap.entries()) {
    validFiles.add(getLabel(absPath));
  }

  for (const [absSource, dependencies] of parsedMap.entries()) {
    const sourceLabel = getLabel(absSource);

    if (!nodesMap.has(sourceLabel)) {
      nodesMap.set(sourceLabel, { 
        id: sourceLabel, 
        label: sourceLabel, 
        type: 'Core', // Will overwrite later
      });
      fanInMap.set(sourceLabel, 0);
      fanOutMap.set(sourceLabel, 0);
    }

    for (const absTarget of dependencies) {
      const targetLabel = getLabel(absTarget);

      // Only link to files within our scanned scope (not random external paths or unparsed files)
      if (validFiles.has(targetLabel)) {
        if (!nodesMap.has(targetLabel)) {
          nodesMap.set(targetLabel, { id: targetLabel, label: targetLabel, type: 'Core' });
          fanInMap.set(targetLabel, 0);
          fanOutMap.set(targetLabel, 0);
        }

        edges.push({ source: sourceLabel, target: targetLabel });
        
        fanOutMap.set(sourceLabel, (fanOutMap.get(sourceLabel) || 0) + 1);
        fanInMap.set(targetLabel, (fanInMap.get(targetLabel) || 0) + 1);
      }
    }
  }

  onProgress(70, 'Dependency graph relationships mapped');

  return { nodesMap, edges, fanInMap, fanOutMap };
}


/**
 * Extracted classification node logic.
 */
function classifyNode(id, fanIn, cycleFiles) {
  if (cycleFiles.has(id)) {
    return 'Cyclic';
  } else if (fanIn > 3) {
    return 'Core';
  } else if (/util|helper|lib|shared|common|api\.js/i.test(id)) {
    return 'Util';
  } else if (/api|service|controller|handler|route/i.test(id)) {
    return 'API';
  }
  return 'Core';
}

/**
 * Step 3.3.4 — Identify clusters (cycles) using Tarjan's SCC and compute final node types.
 */
function computeMetrics(nodesMap, edges, fanInMap, fanOutMap, onProgress) {
  
  // 1. Build Adjacency List
  const adjacencyList = new Map();
  for (const node of nodesMap.values()) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of edges) {
    adjacencyList.get(edge.source).push(edge.target);
  }

  // 2. Tarjan SCC iteratively
  const cyclesArrays = tarjanSCC(adjacencyList);
  const cycleFiles = new Set(cyclesArrays.flat());
  const cyclesCount = cyclesArrays.length;

  // 3. Classify Nodes
  const finalNodes = [];
  for (const [id, node] of nodesMap.entries()) {
    const fanIn = fanInMap.get(id) || 0;
    const fanOut = fanOutMap.get(id) || 0;
    
    const type = classifyNode(id, fanIn, cycleFiles);
    finalNodes.push({ ...node, type, fanIn, fanOut });
  }

  // 4. Calculate Top 5 bounds
  const sortByCount = (a, b) => b.count - a.count;

  const fanInTop5 = Array.from(fanInMap.entries())
    .map(([file, count]) => ({ file, count }))
    .sort(sortByCount)
    .slice(0, 5);

  const fanOutTop5 = Array.from(fanOutMap.entries())
    .map(([file, count]) => ({ file, count }))
    .sort(sortByCount)
    .slice(0, 5);

  onProgress(90, 'Algorithmic metrics computed successfully');

  return {
    nodes: finalNodes,
    edges,
    fanInTop5,
    fanOutTop5,
    cyclesCount,
    cycleFiles
  };
}


/**
 * Step 3.3.5 — Converts graph representation to standard Graphviz DOT format.
 */
function generateDotContent(nodes, edges) {
  let dot = 'digraph DependencyGraph {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=ellipse fontname="Inter" fontsize=10];\n';
  dot += '  edge [color="#2A2A3E"];\n\n';

  const typeConfig = {
    Core:   { color: '#4F8EF7', fill: '#4F8EF720' },
    Util:   { color: '#43D9AD', fill: '#43D9AD20' },
    API:    { color: '#F59E0B', fill: '#F59E0B20' },
    Cyclic: { color: '#EF4444', fill: '#EF444420' }
  };

  // Safe wrapping for node labels in DOT format
  const wrap = (str) => `"${str.replace(/"/g, '\\"')}"`;

  for (const n of nodes) {
    const c = typeConfig[n.type] || typeConfig.Core;
    dot += `  ${wrap(n.id)} [color="${c.color}" style=filled fillcolor="${c.fill}"];\n`;
  }
  dot += '\n';

  for (const e of edges) {
    dot += `  ${wrap(e.source)} -> ${wrap(e.target)};\n`;
  }

  dot += '}\n';
  return dot;
}

/**
 * Main orchestrator handling everything from cloning to DB persistence.
 * @param {Object} scanConfig 
 * @param {String} graphId 
 * @param {Function} onProgress 
 */
async function runScan(scanConfig, graphId, onProgress) {
  // Directly use the user-provided local path
  const workDir = scanConfig.repoPath;
  onProgress(0, 'Initializing scanner instance...');

  try {
    // 1. Validate Repository path
    validateRepoPath(workDir);
    if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
      throw new Error('Invalid repository path');
    }
    
    onProgress(10, `Using local repository at ${workDir}`);

    // 2. Parse file tree to extract dependencies
    const parsedMap = parseFiles(workDir, scanConfig, onProgress);

    // 3. Translate paths to virtual visual graph structures
    const { nodesMap, edges, fanInMap, fanOutMap } = buildGraph(parsedMap, workDir, onProgress);

    // 4. Algorithm calculations (Tarjan's)
    const metrics = computeMetrics(nodesMap, edges, fanInMap, fanOutMap, onProgress);

    // 5. DOT Output
    const dotContent = generateDotContent(metrics.nodes, metrics.edges);

    // 6. Database Update
    const result = {
      status: 'COMPLETED',
      nodes: metrics.nodes,
      edges: metrics.edges,
      fanInTop5: metrics.fanInTop5,
      fanOutTop5: metrics.fanOutTop5,
      nodesCount: metrics.nodes.length,
      edgesCount: metrics.edges.length,
      cyclesCount: metrics.cyclesCount,
      dotContent,
      scannedAt: new Date()
    };

    onProgress(100, 'Scan Complete! Committing results...');

    await DependencyGraph.findOneAndUpdate(
      { graphId },
      { $set: result }
    );

    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  runScan,
  parseFiles,
  buildGraph,
  computeMetrics,
  generateDotContent
};
