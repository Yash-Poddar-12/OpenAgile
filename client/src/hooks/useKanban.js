import { useState, useCallback, useEffect } from 'react';
import { getIssues, updateStatus } from '../services/issueService';
import { useToast } from '../context/ToastContext';
import { useSocket } from './useSocket';
import { useSocketContext } from '../context/SocketContext';

/**
 * useKanban hook to manage the board state.
 * 
 * @param {string} projectId - Current project ID.
 * @param {string} sprintId - Current sprint ID (optional).
 */
export const useKanban = (projectId, sprintId) => {
  const [columns, setColumns] = useState({
    ToDo: [],
    InProgress: [],
    Review: [],
    Done: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [presenceUsers, setPresenceUsers] = useState([]);

  const { showToast } = useToast();
  const { joinProject, leaveProject } = useSocketContext();

  const loadBoard = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const filters = { projectId };
      if (sprintId) filters.sprintId = sprintId;
      
      const { issues } = await getIssues(filters);
      
      const newColumns = {
        ToDo: issues.filter(i => i.status === 'ToDo'),
        InProgress: issues.filter(i => i.status === 'InProgress'),
        Review: issues.filter(i => i.status === 'Review'),
        Done: issues.filter(i => i.status === 'Done')
      };
      
      setColumns(newColumns);
    } catch (err) {
      showToast('error', 'Failed to load board');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sprintId, showToast]);

  // Initial load
  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Presence handling
  useEffect(() => {
    if (projectId) {
      joinProject(projectId);
      return () => {
        leaveProject(projectId);
      };
    }
  }, [projectId, joinProject, leaveProject]);

  const moveCard = async (issueId, fromStatus, toStatus) => {
    if (fromStatus === toStatus) return;

    // Save previous state for rollback
    const prevColumns = { ...columns };

    // 1. Optimistic UI update
    const issueToMove = columns[fromStatus].find(i => i.issueId === issueId);
    if (!issueToMove) return;

    const newColumns = {
      ...columns,
      [fromStatus]: columns[fromStatus].filter(i => i.issueId !== issueId),
      [toStatus]: [...columns[toStatus], { ...issueToMove, status: toStatus }]
    };
    
    setColumns(newColumns);

    // 2. API Call
    try {
      await updateStatus(issueId, toStatus);
      // No toast on success to keep it smooth
    } catch (err) {
      // 3. Rollback on failure
      setColumns(prevColumns);
      const msg = err.response?.data?.error || 'Invalid move';
      showToast('error', msg);
    }
  };

  /**
   * handleBoardUpdated - respond to socket event from other users.
   */
  const handleBoardUpdated = useCallback(({ issueId, newStatus, updatedIssue }) => {
    setColumns(prev => {
      // Find where it was
      let oldStatus = null;
      for (const [status, issues] of Object.entries(prev)) {
        if (issues.some(i => i.issueId === issueId)) {
          oldStatus = status;
          break;
        }
      }

      if (oldStatus === newStatus) {
        // Just update data if same column
        return {
          ...prev,
          [newStatus]: prev[newStatus].map(i => i.issueId === issueId ? updatedIssue : i)
        };
      }

      const cleanColumns = { ...prev };
      if (oldStatus) {
        cleanColumns[oldStatus] = prev[oldStatus].filter(i => i.issueId !== issueId);
      }
      
      cleanColumns[newStatus] = [...(cleanColumns[newStatus] || []), updatedIssue];
      
      return cleanColumns;
    });
  }, []);

  const handleCardCreated = useCallback(({ issue }) => {
    setColumns(prev => ({
      ...prev,
      [issue.status]: [...prev[issue.status], issue]
    }));
  }, []);

  const handleUserJoined = useCallback((user) => {
    setPresenceUsers(prev => {
      if (prev.some(u => u.userId === user.userId)) return prev;
      return [...prev, user];
    });
  }, []);

  const handleUserLeft = useCallback(({ userId }) => {
    setPresenceUsers(prev => prev.filter(u => u.userId !== userId));
  }, []);

  // Bind socket listeners
  useSocket('boardUpdated', handleBoardUpdated, []);
  useSocket('cardCreated', handleCardCreated, []);
  useSocket('userJoined', handleUserJoined, []);
  useSocket('userLeft', handleUserLeft, []);

  return {
    columns,
    isLoading,
    activeCard,
    setActiveCard,
    presenceUsers,
    loadBoard,
    moveCard
  };
};
