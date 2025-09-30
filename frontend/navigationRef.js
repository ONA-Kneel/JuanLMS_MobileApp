import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    }
  } catch (e) {
    console.log('Navigation error:', e);
  }
};







