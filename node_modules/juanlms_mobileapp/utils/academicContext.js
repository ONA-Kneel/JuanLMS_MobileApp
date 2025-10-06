import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Fetches the current academic year and term from the web platform
 * @returns {Promise<{year: string, currentTerm: string, context: string}>}
 */
export const fetchAcademicContext = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    const response = await fetch('https://juanlms-webapp-server.onrender.com/api/academic-year/active', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.academicYear) {
        return {
          year: data.academicYear.year,
          currentTerm: data.academicYear.currentTerm,
          context: `${data.academicYear.year} | ${data.academicYear.currentTerm}`
        };
      }
    }
    
    // Fallback to default values
    return {
      year: '2025-2026',
      currentTerm: 'Term 1',
      context: '2025-2026 | Term 1'
    };
  } catch (error) {
    console.error('Error fetching academic context:', error);
    // Fallback to default values
    return {
      year: '2025-2026',
      currentTerm: 'Term 1',
      context: '2025-2026 | Term 1'
    };
  }
};

/**
 * Hook to manage academic context state
 * @returns {[string, function]} [academicContext, setAcademicContext]
 */
export const useAcademicContext = () => {
  const [academicContext, setAcademicContext] = React.useState('2025-2026 | Term 1');
  
  React.useEffect(() => {
    const loadAcademicContext = async () => {
      const context = await fetchAcademicContext();
      setAcademicContext(context.context);
    };
    
    loadAcademicContext();
  }, []);
  
  return [academicContext, setAcademicContext];
};
