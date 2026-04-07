/**
 * server/utils/dotSerializer.js
 * Serializer for Graphviz DOT format.
 */

/**
 * Converts nodes and edges to DOT format string.
 * @param {Array} nodes 
 * @param {Array} edges 
 * @returns {string} DOT content
 */
const toDOT = (nodes, edges) => {
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

  const wrap = (str) => `"${str.replace(/"/g, '\\"')}"`;

  for (const n of nodes) {
    const c = typeConfig[n.type] || typeConfig.Core;
    dot += `  ${wrap(n.id)} [color="${c.color}" style=filled fillcolor="${c.fill}"];\n`;
  }
  dot += '\n';

  for (const e of edges) {
    const source = typeof e.source === 'string' ? e.source : e.source.id;
    const target = typeof e.target === 'string' ? e.target : e.target.id;
    dot += `  ${wrap(source)} -> ${wrap(target)};\n`;
  }

  dot += '}\n';
  return dot;
};

/**
 * Basic DOT parser to extract nodes and edges.
 * Currently supports a simple subset of DOT.
 * @param {string} dotString 
 * @returns {Object} { nodes, edges }
 */
const fromDOT = (dotString) => {
  const nodes = [];
  const edges = [];
  const lines = dotString.split('\n');

  const nodeRegex = /^\s*"([^"]+)"\s+\[color="([^"]+)"/;
  const edgeRegex = /^\s*"([^"]+)"\s+->\s+"([^"]+)"/;

  for (const line of lines) {
    const nodeMatch = line.match(nodeRegex);
    if (nodeMatch) {
      nodes.push({ id: nodeMatch[1], label: nodeMatch[1] });
      continue;
    }

    const edgeMatch = line.match(edgeRegex);
    if (edgeMatch) {
      edges.push({ source: edgeMatch[1], target: edgeMatch[2] });
    }
  }

  return { nodes, edges };
};

module.exports = { toDOT, fromDOT };
