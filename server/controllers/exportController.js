const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const { createCanvas } = require('canvas');
const DependencyGraph = require('../models/DependencyGraph');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const RecentExport = require('../models/RecentExport');
const { toDOT } = require('../utils/dotSerializer');
const { graphToCSV, issuesToCSV } = require('../utils/csvSerializer');

/**
 * server/controllers/exportController.js
 * Comprehensive export system for reports and artifacts.
 */

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const createArchiveBuffer = (files) => new Promise((resolve, reject) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks = [];

  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(chunks)));
  archive.on('error', reject);
  archive.pipe(stream);

  files.forEach((file) => {
    archive.append(file.content, { name: file.name });
  });

  archive.finalize().catch(reject);
});

const generateDocxBuffer = async ({ project, issues, sprint }) => {
  const now = new Date().toISOString();
  const summaryLines = [
    `Project: ${project.name}`,
    `Status: ${project.status}`,
    `Repository Path: ${project.repositoryPath || 'Not set'}`,
    `Generated At: ${new Date().toLocaleString()}`,
    `Open Issues: ${issues.filter((issue) => issue.status !== 'Done').length}`,
    `Total Issues: ${issues.length}`,
    `Current Sprint: ${sprint?.name || 'None'}`,
  ];

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>OpenAgile Project Summary</w:t></w:r></w:p>
    <w:p><w:r><w:t>${escapeXml(project.name)}</w:t></w:r></w:p>
    ${summaryLines.map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`).join('')}
    <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Project Description</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">${escapeXml(project.description || 'No description provided.')}</w:t></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Issue Overview</w:t></w:r></w:p>
    ${issues.slice(0, 25).map((issue) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(`[${issue.issueId}] ${issue.title} - ${issue.status} (${issue.priority})`)}</w:t></w:r></w:p>`).join('')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
  </w:style>
</w:styles>`;

  return createArchiveBuffer([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/styles.xml', content: stylesXml },
    {
      name: 'docProps/core.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>OpenAgile Project Summary</dc:title>
  <dc:creator>OpenAgile</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
    },
    {
      name: 'docProps/app.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>OpenAgile Export</Application>
</Properties>`,
    },
  ]);
};

const resolveGraphForExport = async (graphId) => {
  const query = graphId
    ? { graphId, status: 'COMPLETED' }
    : { status: 'COMPLETED' };

  const graph = await DependencyGraph.findOne(query).sort({ scannedAt: -1 }).lean();
  if (!graph) {
    throw new Error('Graph data not found');
  }

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    throw new Error('Graph has no nodes to render');
  }

  return graph;
};

const generators = {
  'DOT': async ({ graphId, projectId }) => {
    const graph = await resolveGraphForExport(graphId);
    const dotContent = toDOT(graph.nodes, graph.edges);
    return {
      filename: `dependency-graph-${Date.now()}.dot`,
      buffer: Buffer.from(dotContent, 'utf-8'),
      mimeType: 'text/plain'
    };
  },

  'PNG': async ({ graphId }) => {
    const graph = await resolveGraphForExport(graphId);
    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#12121F';
    ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = '#E5E7EB';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Dependency Graph Export`, 40, 50);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText(graph.repoPath, 40, 80);

    const centerX = 600;
    const centerY = 430;
    const radius = Math.min(280, 120 + graph.nodes.length * 8);
    const positions = new Map();
    const nodes = graph.nodes.slice(0, 80);

    nodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / nodes.length;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    const edgeColor = '#374151';
    (graph.edges || []).forEach((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return;

      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });

    nodes.forEach((node) => {
      const point = positions.get(node.id);
      if (!point) return;

      const palette = {
        Core: '#4F8EF7',
        Util: '#43D9AD',
        API: '#F59E0B',
        Cyclic: '#EF4444',
      };

      ctx.fillStyle = palette[node.type] || '#4F8EF7';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E5E7EB';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label.split(/[\\/]/).pop(), point.x, point.y + 22);
    });

    return {
      filename: `dependency-graph-${Date.now()}.png`,
      buffer: canvas.toBuffer('image/png'),
      mimeType: 'image/png'
    };
  },

  'CSV': async ({ projectId }) => {
    const project = await Project.findOne({ projectId });
    if (!project) throw new Error('Project not found');
    const issues = await Issue.find({ projectId, isDeleted: false }).lean();
    const csv = issuesToCSV(issues);
    return {
      filename: `issues-${project.name.replace(/\s+/g, '-')}-${Date.now()}.csv`,
      buffer: Buffer.from(csv, 'utf-8'),
      mimeType: 'text/csv'
    };
  },

  'GRAPH_CSV': async ({ graphId }) => {
    const graph = await DependencyGraph.findOne({ graphId }).lean();
    if (!graph) throw new Error('Graph not found');
    const csv = graphToCSV(graph.nodes);
    return {
      filename: `dependency-metrics-${Date.now()}.csv`,
      buffer: Buffer.from(csv, 'utf-8'),
      mimeType: 'text/csv'
    };
  },

  'SPRINT_PDF': async ({ projectId }) => {
    const sprint = await Sprint.findOne({ projectId, status: 'ACTIVE' }).lean() 
                || await Sprint.findOne({ projectId }).sort({ endDate: -1 }).lean();
    if (!sprint) throw new Error('No sprint found for this project');
    
    const issues = await Issue.find({ sprintId: sprint.sprintId, isDeleted: false }).lean();
    
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve({
          filename: `sprint-report-${sprint.name}-${Date.now()}.pdf`,
          buffer: Buffer.concat(buffers),
          mimeType: 'application/pdf'
        });
      });

      doc.fontSize(20).text(`Sprint Report: ${sprint.name}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Project ID: ${projectId}`);
      doc.text(`Status: ${sprint.status}`);
      doc.text(`Duration: ${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}`);
      doc.moveDown();

      doc.fontSize(14).text('Issue Summary', { underline: true });
      doc.moveDown(0.5);
      
      issues.forEach((issue, index) => {
        doc.fontSize(10).text(`${index + 1}. [${issue.issueId}] ${issue.title} - ${issue.status} (${issue.priority})`);
      });

      const counts = issues.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      doc.moveDown();
      doc.fontSize(14).text('Metrics', { underline: true });
      doc.fontSize(10).text(`Total Issues: ${issues.length}`);
      Object.entries(counts).forEach(([status, count]) => {
        doc.text(`${status}: ${count}`);
      });

      doc.end();
    });
  },

  'COMPARISON': async ({ projectId }) => {
    const scans = await DependencyGraph.find({ status: 'COMPLETED' })
      .sort({ scannedAt: -1 })
      .limit(2)
      .lean();
    
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve({
          filename: `comparison-report-${Date.now()}.pdf`,
          buffer: Buffer.concat(buffers),
          mimeType: 'application/pdf'
        });
      });

      doc.fontSize(20).text('Dependency Comparison Report', { align: 'center' });
      doc.moveDown();

      if (scans.length < 2) {
        doc.fontSize(12).text('Insufficient data for comparison. At least two successful scans are required.');
      } else {
        const [curr, prev] = scans;
        doc.fontSize(14).text('Scan Overview', { underline: true });
        doc.fontSize(10).text(`Current Scan: ${new Date(curr.scannedAt).toLocaleString()} (${curr.repoPath})`);
        doc.text(`Previous Scan: ${new Date(prev.scannedAt).toLocaleString()} (${prev.repoPath})`);
        doc.moveDown();

        const tableTop = 200;
        doc.text('Metric', 50, tableTop).text('Before', 200, tableTop).text('After', 300, tableTop).text('Change', 400, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

        const rows = [
          ['Files', prev.nodesCount, curr.nodesCount, curr.nodesCount - prev.nodesCount],
          ['Dependencies', prev.edgesCount, curr.edgesCount, curr.edgesCount - prev.edgesCount],
          ['Cycles', prev.cyclesCount, curr.cyclesCount, curr.cyclesCount - prev.cyclesCount]
        ];

        rows.forEach((row, i) => {
          const y = tableTop + 30 + (i * 20);
          doc.text(row[0], 50, y);
          doc.text(row[1].toString(), 200, y);
          doc.text(row[2].toString(), 300, y);
          const diff = row[3];
          doc.fillColor(diff > 0 ? 'green' : (diff < 0 ? 'red' : 'black')).text(`${diff > 0 ? '+' : ''}${diff}`, 400, y).fillColor('black');
        });
      }

      doc.end();
    });
  },

  'DOCX': async ({ projectId }) => {
    const project = await Project.findOne({ projectId });
    if (!project) throw new Error('Project not found');
    const [issues, sprint] = await Promise.all([
      Issue.find({ projectId, isDeleted: false }).sort({ createdAt: -1 }).lean(),
      Sprint.findOne({ projectId, status: 'ACTIVE' }).lean(),
    ]);
    const buffer = await generateDocxBuffer({ project, issues, sprint });
    return {
      filename: `project-summary-${project.name.replace(/\s+/g, '-')}.docx`,
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
  }
};

const normalizeArtifactType = (type, { graphId, projectId }) => {
  const upper = String(type || '').trim().toUpperCase();

  if (!upper) {
    return null;
  }

  if (upper === 'CSV') {
    return graphId && !projectId ? 'GRAPH_CSV' : 'CSV';
  }

  return upper;
};

const generateExport = async (req, res, next) => {
  try {
    const { artifacts, projectId, graphId } = req.body;

    if (!Array.isArray(artifacts) || artifacts.length === 0) {
      return res.status(400).json({ error: 'Artifacts selection is required' });
    }

    const normalizedArtifacts = artifacts
      .map((type) => normalizeArtifactType(type, { projectId, graphId }))
      .filter(Boolean);

    const isFullZip = normalizedArtifacts.includes('FULL_ZIP') || normalizedArtifacts.length > 1;
    
    // Resolve which artifact types to generate
    let typesToGenerate = normalizedArtifacts.filter((type) => type !== 'FULL_ZIP');
    if (normalizedArtifacts.includes('FULL_ZIP')) {
      typesToGenerate = ['DOT', 'PNG', 'CSV', 'GRAPH_CSV', 'SPRINT_PDF', 'COMPARISON', 'DOCX'];
    }

    // Filter by available generators
    typesToGenerate = [...new Set(typesToGenerate.filter((type) => !!generators[type]))];

    const results = await Promise.all(
      typesToGenerate.map(async (type) => {
        try {
          return await generators[type]({ projectId, graphId });
        } catch (err) {
          console.error(`Generator ${type} failed:`, err.message);
          return null;
        }
      })
    );

    const validResults = results.filter(r => r !== null);

    if (validResults.length === 0) {
      return res.status(500).json({ error: 'Failed to generate any requested artifacts' });
    }

    // Record export in history
    await RecentExport.create({
      filename: isFullZip ? `export-${Date.now()}.zip` : validResults[0].filename,
      artifactTypes: typesToGenerate,
      sizeBytes: validResults.reduce((acc, r) => acc + r.buffer.length, 0),
      generatedBy: req.user.userId,
      projectId
    });

    if (isFullZip) {
      const archive = archiver('zip', { zlib: { level: 9 } });
      res.attachment(`export-${Date.now()}.zip`);
      archive.pipe(res);

      validResults.forEach(result => {
        archive.append(result.buffer, { name: result.filename });
      });

      await archive.finalize();
    } else {
      const result = validResults[0];
      res.set('Content-Type', result.mimeType);
      res.attachment(result.filename);
      res.send(result.buffer);
    }

  } catch (err) {
    next(err);
  }
};

const getRecentExports = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = { generatedBy: req.user.userId };
    if (projectId) filter.projectId = projectId;

    const exports = await RecentExport.find(filter)
      .sort({ generatedAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ exports });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateExport,
  getRecentExports
};
