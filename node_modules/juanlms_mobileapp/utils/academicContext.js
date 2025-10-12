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
 * Fetches the active quarter information for the current academic year
 * @returns {Promise<{quarterName: string, termName: string, schoolYear: string, isActive: boolean}>}
 */
export const fetchActiveQuarter = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    
    // First get the active academic year
    const academicContext = await fetchAcademicContext();
    const schoolYearName = academicContext.year;
    
    // Fetch quarters for the current school year
    const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/quarters/schoolyear/${schoolYearName}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const quarters = await response.json();
      console.log('Fetched quarters:', quarters);
      
      // Find the active quarter
      const activeQuarter = quarters.find(q => q.status === 'active');
      
      if (activeQuarter) {
        console.log('Active quarter found:', activeQuarter);
        return {
          quarterName: activeQuarter.quarterName,
          termName: activeQuarter.termName,
          schoolYear: activeQuarter.schoolYear,
          isActive: true,
          startDate: activeQuarter.startDate,
          endDate: activeQuarter.endDate
        };
      } else {
        console.log('No active quarter found, using default');
        // Fallback to default quarter based on current term
        const defaultQuarter = academicContext.currentTerm === 'Term 1' ? 'Quarter 1' : 'Quarter 3';
        return {
          quarterName: defaultQuarter,
          termName: academicContext.currentTerm,
          schoolYear: schoolYearName,
          isActive: false
        };
      }
    }
    
    // Fallback to default values
    const defaultQuarter = academicContext.currentTerm === 'Term 1' ? 'Quarter 1' : 'Quarter 3';
    return {
      quarterName: defaultQuarter,
      termName: academicContext.currentTerm,
      schoolYear: academicContext.year,
      isActive: false
    };
  } catch (error) {
    console.error('Error fetching active quarter:', error);
    // Fallback to default values
    return {
      quarterName: 'Quarter 1',
      termName: 'Term 1',
      schoolYear: '2025-2026',
      isActive: false
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
