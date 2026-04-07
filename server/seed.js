const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Models
const Role = require('./models/Role');
const User = require('./models/User');
const Project = require('./models/Project');
const Sprint = require('./models/Sprint');
const Issue = require('./models/Issue');
const DependencyGraph = require('./models/DependencyGraph');
const ActivityLog = require('./models/ActivityLog');
const RecentExport = require('./models/RecentExport');

const seed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected successfully.');

    // 1. Clear existing data
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Project.deleteMany({}),
      Sprint.deleteMany({}),
      Issue.deleteMany({}),
      DependencyGraph.deleteMany({}),
      ActivityLog.deleteMany({}),
      RecentExport.deleteMany({})
    ]);

    // 2. Seed Roles
    console.log('[Seed] Seeding Roles...');
    const roles = [
      {
        roleName: 'Admin',
        color: '#EF4444',
        permissions: { fileMapScan:true, viewProjects:true, editIssues:true, kanban:true, export:true, adminPanel:true }
      },
      {
        roleName: 'ProjectManager',
        color: '#F59E0B',
        permissions: { fileMapScan:true, viewProjects:true, editIssues:true, kanban:true, export:true, adminPanel:false }
      },
      {
        roleName: 'Developer',
        color: '#4F8EF7',
        permissions: { fileMapScan:true, viewProjects:true, editIssues:true, kanban:true, export:false, adminPanel:false }
      },
      {
        roleName: 'RepoAnalyst',
        color: '#43D9AD',
        permissions: { fileMapScan:true, viewProjects:true, editIssues:false, kanban:false, export:true, adminPanel:false }
      },
      {
        roleName: 'Viewer',
        color: '#6B7280',
        permissions: { fileMapScan:false, viewProjects:true, editIssues:false, kanban:false, export:false, adminPanel:false }
      }
    ];
    await Role.insertMany(roles);

    // 3. Seed Users
    console.log('[Seed] Seeding Users...');
    const salt = await bcrypt.genSalt(12);
    const users = [
      {
          userId: 'usr-admin-01',
          name: 'Jane Doe',
          email: 'admin@filemap.dev',
          passwordHash: await bcrypt.hash('Admin@123', salt),
          role: 'Admin'
      },
      {
          userId: 'usr-pm-01',
          name: 'John Smith',
          email: 'manager@filemap.dev',
          passwordHash: await bcrypt.hash('Manager@123', salt),
          role: 'ProjectManager'
      },
      {
          userId: 'usr-dev-01',
          name: 'Alice Johnson',
          email: 'dev@filemap.dev',
          passwordHash: await bcrypt.hash('Dev@123', salt),
          role: 'Developer'
      },
      {
          userId: 'usr-analyst-01',
          name: 'Bob Wilson',
          email: 'analyst@filemap.dev',
          passwordHash: await bcrypt.hash('Analyst@123', salt),
          role: 'RepoAnalyst'
      },
      {
          userId: 'usr-viewer-01',
          name: 'Carol Martinez',
          email: 'viewer@filemap.dev',
          passwordHash: await bcrypt.hash('Viewer@123', salt),
          role: 'Viewer'
      }
    ];
    await User.insertMany(users);

    const pm = await User.findOne({ email: 'manager@filemap.dev' });
    const dev = await User.findOne({ email: 'dev@filemap.dev' });

    // 4. Seed Projects
    console.log('[Seed] Seeding Projects...');
    const projects = [
      { 
          projectId: 'proj-ecom-01',
          name: 'E-commerce Platform', 
          description: 'Full-stack e-commerce rebuild', 
          ownerId: pm.userId, 
          status: 'ACTIVE' 
      },
      { 
          projectId: 'proj-mobile-01',
          name: 'Mobile App Redesign', 
          description: 'iOS/Android UI overhaul', 
          ownerId: pm.userId, 
          status: 'ACTIVE' 
      },
    ];
    await Project.insertMany(projects);

    // 5. Seed Sprints
    console.log('[Seed] Seeding Sprints...');
    const sprints = [
      { 
          projectId: 'proj-ecom-01',
          sprintId: 'spr-23',
          name: 'Sprint 23', 
          status: 'CLOSED', 
          startDate: new Date('2026-01-01'), 
          endDate: new Date('2026-01-14') 
      },
      { 
          projectId: 'proj-ecom-01',
          sprintId: 'spr-24',
          name: 'Sprint 24', 
          status: 'ACTIVE', 
          startDate: new Date('2026-01-15'), 
          endDate: new Date('2026-01-28') 
      },
      { 
          projectId: 'proj-ecom-01',
          sprintId: 'spr-25',
          name: 'Sprint 25', 
          status: 'PLANNED', 
          startDate: new Date('2026-01-29'), 
          endDate: new Date('2026-02-11') 
      },
    ];
    await Sprint.insertMany(sprints);

    // 6. Seed Issues
    console.log('[Seed] Seeding Issues...');
    const issues = [
      { issueId:'ISS-1247', projectId:'proj-ecom-01', title:'Implement OAuth 2.0 authentication flow', priority:'High', status:'InProgress', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-24', dueDate: new Date('2026-03-05') },
      { issueId:'ISS-1246', projectId:'proj-ecom-01', title:'Fix memory leak in WebSocket connections', priority:'High', status:'Review', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-24', dueDate: new Date('2026-02-28') },
      { issueId:'ISS-1245', projectId:'proj-ecom-01', title:'Design new dashboard layout', priority:'Medium', status:'ToDo', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-25', dueDate: new Date('2026-03-10') },
      { issueId:'ISS-1244', projectId:'proj-ecom-01', title:'Update dependencies to latest versions', priority:'Low', status:'ToDo', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-25', dueDate: new Date('2026-03-15') },
      { issueId:'ISS-1243', projectId:'proj-ecom-01', title:'Implement real-time collaboration features', priority:'High', status:'InProgress', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-24', dueDate: new Date('2026-03-03') },
      { issueId:'ISS-1242', projectId:'proj-ecom-01', title:'Optimize database query performance', priority:'Medium', status:'Done', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-23', dueDate: new Date('2026-02-25') },
      { issueId:'ISS-1241', projectId:'proj-ecom-01', title:'Add export to PDF functionality', priority:'Low', status:'ToDo', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-25', dueDate: new Date('2026-03-12') },
      { issueId:'ISS-1240', projectId:'proj-ecom-01', title:'Implement notification system', priority:'Medium', status:'Review', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-24', dueDate: new Date('2026-03-01') },
      { issueId:'ISS-1239', projectId:'proj-ecom-01', title:'Setup CI/CD pipeline for automated deployments', priority:'High', status:'Review', assigneeId:pm.userId, createdBy:pm.userId, sprintId:'spr-24', dueDate: new Date('2026-02-27') },
      { issueId:'ISS-1238', projectId:'proj-ecom-01', title:'Write unit tests for auth module', priority:'Medium', status:'Done', assigneeId:pm.userId, createdBy:pm.userId, sprintId:'spr-23', dueDate: new Date('2026-02-20') },
      { issueId:'ISS-1237', projectId:'proj-ecom-01', title:'Refactor database schema for better performance', priority:'Medium', status:'InProgress', assigneeId:pm.userId, createdBy:pm.userId, sprintId:'spr-24', dueDate: new Date('2026-03-02') },
      { issueId:'ISS-1236', projectId:'proj-ecom-01', title:'Add unit tests for payment processing module', priority:'High', status:'Done', assigneeId:pm.userId, createdBy:pm.userId, sprintId:'spr-23', dueDate: new Date('2026-02-18') },
      { issueId:'ISS-1235', projectId:'proj-ecom-01', title:'Implement role-based access control', priority:'Medium', status:'Done', assigneeId:pm.userId, createdBy:pm.userId, sprintId:'spr-23', dueDate: new Date('2026-02-15') },
      { issueId:'ISS-1234', projectId:'proj-ecom-01', title:'Fix responsive layout issues on mobile devices', priority:'Low', status:'Done', assigneeId:dev.userId, createdBy:pm.userId, sprintId:'spr-23', dueDate: new Date('2026-02-12') },
      { issueId:'ISS-1233', projectId:'proj-ecom-01', title:'Update API documentation for v2 endpoints', priority:'Low', status:'ToDo', assigneeId:pm.userId, createdBy:pm.userId, sprintId:'spr-25', dueDate: new Date('2026-03-18') }
    ];
    await Issue.insertMany(issues);

    // 7. Seed Dependency Graphs
    console.log('[Seed] Seeding Dependency Graphs...');
    const now = new Date();
    const graphs = [
      {
        graphId: 'g-frontend-01',
        repoPath: 'github.com/company/frontend-app',
        status: 'COMPLETED',
        nodesCount: 1247, edgesCount: 328, cyclesCount: 3,
        scannedBy: 'usr-analyst-01', scannedAt: new Date('2026-02-27T14:32:00'),
        fanInTop5:  [{ file:'helpers.ts', count: 8 },{ file:'types.ts', count: 7 },{ file:'storage.ts', count: 5 },{ file:'logger.ts', count: 5 },{ file:'cache.ts', count: 4 }],
        fanOutTop5: [{ file:'App.tsx', count: 6 },{ file:'api.ts', count: 5 },{ file:'client.ts', count: 4 },{ file:'helpers.ts', count: 3 },{ file:'store.ts', count: 5 }],
        dotContent: '...',
        nodes: [],   
        edges: []
      },
      {
        graphId: 'g-backend-01',
        repoPath: 'github.com/company/api-service',
        status: 'COMPLETED',
        nodesCount: 892, edgesCount: 156, cyclesCount: 0,
        scannedBy: 'usr-analyst-01', scannedAt: new Date('2026-02-27T11:18:00'),
        fanInTop5: [], fanOutTop5: [],
      },
      {
        graphId: 'g-mobile-01',
        repoPath: 'github.com/company/mobile-app',
        status: 'COMPLETED',
        nodesCount: 654, edgesCount: 198, cyclesCount: 1,
        scannedBy: 'usr-analyst-01', scannedAt: new Date('2026-02-26T09:22:00'),
        fanInTop5: [], fanOutTop5: [],
      }
    ];

    // Seed 7 more scan records for trend charts
    for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        graphs.push({
            graphId: `g-trend-${i}`,
            repoPath: 'github.com/company/frontend-app',
            status: 'COMPLETED',
            nodesCount: 1200 + (Math.random() * 100),
            edgesCount: 300 + (Math.random() * 50),
            cyclesCount: Math.floor(Math.random() * 5),
            scannedBy: 'usr-analyst-01',
            scannedAt: date
        });
    }
    await DependencyGraph.insertMany(graphs);

    // 8. Seed Activity Logs
    console.log('[Seed] Seeding Activity Logs...');
    const logs = issues.map(issue => ({
        entityType: 'Issue',
        entityId: issue.issueId,
        action: 'ISSUE_CREATED',
        performedBy: pm.userId,
        projectId: issue.projectId,
        details: { issueId: issue.issueId, title: issue.title },
        timestamp: new Date()
    }));
    await ActivityLog.insertMany(logs);

    // 9. Seed Recent Exports
    console.log('[Seed] Seeding Recent Exports...');
    const recentExports = [
      { filename:'sprint-27-report.pdf',     artifactTypes:['SPRINT_PDF'],   sizeBytes:912384,  generatedBy:pm.userId, generatedAt: new Date('2026-02-27T09:23:00') },
      { filename:'dependency-graph.png',     artifactTypes:['PNG'],          sizeBytes:2411520, generatedBy:'usr-analyst-01',  generatedAt: new Date('2026-02-26T16:45:00') },
      { filename:'issue-export.csv',         artifactTypes:['CSV'],          sizeBytes:131072,  generatedBy:pm.userId, generatedAt: new Date('2026-02-26T14:12:00') },
      { filename:'comparison-jan-feb.pdf',   artifactTypes:['COMPARISON'],   sizeBytes:1258291, generatedBy:'usr-analyst-01',  generatedAt: new Date('2026-02-25T11:30:00') },
      { filename:'full-export.zip',          artifactTypes:['FULL_ZIP'],     sizeBytes:6082150, generatedBy:pm.userId, generatedAt: new Date('2026-02-24T08:15:00') },
    ];
    await RecentExport.insertMany(recentExports);

    console.log('✓ Seed complete. Default credentials:');
    console.log('  admin@filemap.dev   / Admin@123');
    console.log('  manager@filemap.dev / Manager@123');
    console.log('  dev@filemap.dev     / Dev@123');
    console.log('  analyst@filemap.dev / Analyst@123');
    console.log('  viewer@filemap.dev  / Viewer@123');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seed();
