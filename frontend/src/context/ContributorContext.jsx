import React, { createContext, useState, useEffect } from 'react';

export const ContributorContext = createContext(null);

export function ContributorProvider({ children }) {
  const [contributorName, setContributorName] = useState(() => {
    return localStorage.getItem('contributorName') || 'Sakshi';
  });

  useEffect(() => {
    localStorage.setItem('contributorName', contributorName);
  }, [contributorName]);

  return (
    <ContributorContext.Provider value={{ contributorName, setContributorName }}>
      {children}
    </ContributorContext.Provider>
  );
}
