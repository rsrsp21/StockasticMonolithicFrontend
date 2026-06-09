import { useEffect } from 'react';

/**
 * Custom hook to set the document title for a page
 * @param {string} title - The page title (will be appended with " | Stockastic")
 */
export const usePageTitle = (title) => {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title ? `${title} | Stockastic` : 'Stockastic';
        
        // Cleanup: restore previous title when component unmounts
        return () => {
            document.title = previousTitle;
        };
    }, [title]);
};

export default usePageTitle;
