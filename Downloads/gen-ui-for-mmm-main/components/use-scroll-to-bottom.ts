import { useEffect, useRef, useState, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
  () => void
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const [shouldIgnoreMutations, setShouldIgnoreMutations] = useState(false);
  
  // Function to manually trigger scroll to bottom
  const scrollToBottom = () => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver((mutations) => {
        // Only scroll if we're not ignoring mutations
        if (shouldIgnoreMutations) return;
        
        // Only scroll for certain types of mutations (new messages)
        const shouldScroll = mutations.some(mutation => {
          // Check if this is a new message being added
          return mutation.type === 'childList' && 
                 mutation.addedNodes.length > 0 &&
                 !mutation.target.closest('.sql-query-result');
        });
        
        if (shouldScroll) {
          end.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, [shouldIgnoreMutations]);

  return [containerRef, endRef, scrollToBottom];
}
