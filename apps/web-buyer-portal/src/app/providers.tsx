'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { rehydrateAuthFromStorage } from '../store/slices/authSlice';

function AuthHydrator({ children }: { children: React.ReactNode }): React.JSX.Element {
  useEffect(() => {
    store.dispatch(rehydrateAuthFromStorage());
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
