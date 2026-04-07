/**
 * server/utils/tarjanSCC.js
 * Implements Tarjan's Strongly Connected Components algorithm.
 * Uses an ITERATIVE approach to prevent call-stack overflows on exceptionally large module graphs.
 */

/**
 * Iterative version of Tarjan's strongly connected components algorithm.
 * 
 * @param {Map<string, string[]>} adjacencyList - The dependency graph. Keys are file paths, values are arrays of imported files.
 * @returns {string[][]} Array of SCCs (arrays of file paths that form cycles). Single-node components are excluded.
 */
function tarjanSCC(adjacencyList) {
  let index = 0;
  const indices = new Map();
  const lowlinks = new Map();
  const onStack = new Map();
  const stack = [];
  const sccs = [];

  for (const v of adjacencyList.keys()) {
    if (!indices.has(v)) {
      // Simulate recursive DFS using a call stack
      const callStack = [{ node: v, edgeIndex: 0 }];

      while (callStack.length > 0) {
        const top = callStack[callStack.length - 1];
        const vNode = top.node;

        if (top.edgeIndex === 0) {
          indices.set(vNode, index);
          lowlinks.set(vNode, index);
          index++;
          stack.push(vNode);
          onStack.set(vNode, true);
        }

        const edges = adjacencyList.get(vNode) || [];
        let pushedNewChild = false;

        // Process edges
        while (top.edgeIndex < edges.length) {
          const w = edges[top.edgeIndex++];
          if (!indices.has(w)) {
            // Unvisited child: push to stack and process it
            callStack.push({ node: w, edgeIndex: 0 });
            pushedNewChild = true;
            break; 
          } else if (onStack.get(w)) {
            // Already visiting (back-edge that forms/is part of a cycle)
            lowlinks.set(vNode, Math.min(lowlinks.get(vNode), indices.get(w)));
          }
        }

        if (pushedNewChild) continue; 

        // Finished processing all children of vNode
        // If it's not the root of our DFS call stack, update the parent's lowlink
        if (callStack.length > 1) {
          const parent = callStack[callStack.length - 2].node;
          lowlinks.set(parent, Math.min(lowlinks.get(parent), lowlinks.get(vNode)));
        }

        // If vNode is a root node of an SCC, collect the components
        if (lowlinks.get(vNode) === indices.get(vNode)) {
          const scc = [];
          let w;
          do {
            w = stack.pop();
            onStack.set(w, false);
            scc.push(w);
          } while (w !== vNode);

          // Only collect cycles formed of more than 1 file
          if (scc.length > 1) {
            sccs.push(scc);
          }
        }

        // Pop the current node off the simulated call stack
        callStack.pop();
      }
    }
  }

  return sccs;
}

/**
 * Helper to check if a file is part of a cycle.
 * Takes a precomputed Set of cyclic files for performance O(1).
 * 
 * @param {string} file 
 * @param {Set<string>} cycleFilesSet 
 * @returns {boolean}
 */
function isCyclic(file, cycleFilesSet) {
  return cycleFilesSet.has(file);
}

/**
 * Builds a reverse adjacency list (dependents instead of dependencies).
 * Useful for finding "Files that depend on X".
 * 
 * @param {Map<string, string[]>} adjacencyList
 * @returns {Map<string, string[]>}
 */
function buildReverseMap(adjacencyList) {
  const reverseMap = new Map();
  for (const [node, edges] of adjacencyList.entries()) {
    if (!reverseMap.has(node)) reverseMap.set(node, []);
    for (const edge of edges) {
      if (!reverseMap.has(edge)) {
        reverseMap.set(edge, []);
      }
      reverseMap.get(edge).push(node);
    }
  }
  return reverseMap;
}

module.exports = {
  tarjanSCC,
  isCyclic,
  buildReverseMap
};

// Inline Test
if (require.main === module) {
  const graph = new Map();
  graph.set('A', ['B']);
  graph.set('B', ['C']);
  graph.set('C', ['A']); // Cycle A-B-C
  graph.set('D', ['E']); // No cycle
  graph.set('F', ['F']); // Self-loop

  const result = tarjanSCC(graph);
  console.log('Test Graph SCC Result (Should be [["C", "B", "A"]]):', result);
}
