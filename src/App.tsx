import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { captureUtmParams } from './lib/tracking';

export const App: React.FC = () => {
  useEffect(() => {
    // Capture marketing UTM parameters on initial entry
    captureUtmParams();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
