const tarjanSCC = require('../utils/tarjanSCC');

describe('tarjanSCC Algorithm', () => {
  test('detects simple 3-node cycle A→B→C→A', () => {
    const graph = new Map([
      ['A', ['B']], 
      ['B', ['C']], 
      ['C', ['A']]
    ]);
    const cycles = tarjanSCC(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].sort()).toEqual(['A', 'B', 'C']);
  });

  test('no cycle in linear chain A→B→C', () => {
    const graph = new Map([
      ['A', ['B']], 
      ['B', ['C']], 
      ['C', []]
    ]);
    const cycles = tarjanSCC(graph);
    expect(cycles).toHaveLength(0);
  });

  test('two independent cycles', () => {
    const graph = new Map([
      ['A', ['B']], 
      ['B', ['A']],
      ['C', ['D']], 
      ['D', ['C']]
    ]);
    const cycles = tarjanSCC(graph);
    expect(cycles).toHaveLength(2);
  });

  test('self-loop excluded (single-node SCC)', () => {
    const graph = new Map([['A', ['A']]]);
    const cycles = tarjanSCC(graph);
    expect(cycles).toHaveLength(0);
  });

  test('empty graph returns empty array', () => {
    const cycles = tarjanSCC(new Map());
    expect(cycles).toHaveLength(0);
  });

  test('large cycle (100 nodes)', () => {
    const graph = new Map();
    for (let i = 0; i < 100; i++) {
        graph.set(`node${i}`, [`node${(i + 1) % 100}`]);
    }
    const cycles = tarjanSCC(graph);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toHaveLength(100);
  });
});
