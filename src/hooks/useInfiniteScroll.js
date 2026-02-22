import { useState, useEffect } from 'react';

function useInfiniteScroll(loadMore) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      
      if (scrollTop + clientHeight >= scrollHeight - 1000 && !isLoading && hasMore) {
        setIsLoading(true);
        loadMore().then((hasMoreData) => {
          setIsLoading(false);
          setHasMore(hasMoreData);
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoading, hasMore]);

  return { isLoading, hasMore };
}

export default useInfiniteScroll;