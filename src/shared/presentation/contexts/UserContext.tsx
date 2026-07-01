import React, { createContext, useContext, useState } from 'react';
import { User } from '../../domain/entities/User';

interface UserContextData {
  user: User | null;
}

const UserContext = createContext<UserContextData>({} as UserContextData);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User>({
    id: 'u1',
    name: 'Usuário Teste',
    email: 'teste@teste.com',
    coins: 100,
    favoriteTeamIds: []
  });

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context.user;
};
