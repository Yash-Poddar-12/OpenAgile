/**
 * server/utils/csvSerializer.js
 * Serializer for CSV format.
 */

/**
 * Converts dependency graph nodes to CSV format.
 * @param {Array} nodes 
 * @returns {string} CSV content
 */
const graphToCSV = (nodes) => {
  if (!nodes || nodes.length === 0) {
    return 'file,type,fanIn,fanOut,isCyclic\n';
  }

  const headers = 'file,type,fanIn,fanOut,isCyclic\n';
  const rows = nodes.map(node => {
    // Map data fields to match headers
    const file = `"${node.label || node.id}"`;
    const type = `"${node.type || 'Core'}"`;
    const fanIn = node.fanIn || 0;
    const fanOut = node.fanOut || 0;
    const isCyclic = node.type === 'Cyclic';
    
    return `${file},${type},${fanIn},${fanOut},${isCyclic}`;
  }).join('\n');

  return headers + rows;
};

/**
 * Converts agile issues to CSV format.
 * @param {Array} issues 
 * @returns {string} CSV content
 */
const issuesToCSV = (issues) => {
  if (!issues || issues.length === 0) {
    const headers = 'issueId,title,status,priority,assignee,sprint,dueDate,createdAt\n';
    return headers;
  }

  const headers = 'issueId,title,status,priority,assignee,sprint,dueDate,createdAt\n';
  const rows = issues.map(issue => {
    const id = `"${issue.issueId}"`;
    const title = `"${issue.title.replace(/"/g, '""')}"`; // Escape double quotes
    const status = `"${issue.status}"`;
    const priority = `"${issue.priority}"`;
    const assignee = `"${issue.assigneeId || 'Unassigned'}"`;
    const sprint = `"${issue.sprintId || 'None'}"`;
    const dueDate = issue.dueDate ? `"${new Date(issue.dueDate).toISOString().split('T')[0]}"` : '""';
    const createdAt = `"${new Date(issue.createdAt).toISOString().split('T')[0]}"`;

    return `${id},${title},${status},${priority},${assignee},${sprint},${dueDate},${createdAt}`;
  }).join('\n');

  return headers + rows;
};

module.exports = { graphToCSV, issuesToCSV };
