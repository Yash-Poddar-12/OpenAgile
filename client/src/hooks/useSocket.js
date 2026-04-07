import { useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * useSocket hook to subscribe to specific board events.
 * 
 * @param {string} eventName - The event to listen for.
 * @param {function} callback - Handler function for the event.
 * @param {Array} dependencies - Dependency array to reset listener if values change.
 * @param {('board'|'scan')} namespace - Socket namespace selector.
 */
export const useSocket = (eventName, callback, dependencies = [], namespace = 'board') => {
  const { socket, scanSocket, connected, scanConnected } = useSocketContext();
  const targetSocket = namespace === 'scan' ? scanSocket : socket;
  const isConnected = namespace === 'scan' ? scanConnected : connected;

  useEffect(() => {
    if (targetSocket && isConnected) {
      targetSocket.on(eventName, callback);

      return () => {
        targetSocket.off(eventName, callback);
      };
    }
    return undefined;
  }, [targetSocket, isConnected, eventName, callback, ...dependencies]);
};
