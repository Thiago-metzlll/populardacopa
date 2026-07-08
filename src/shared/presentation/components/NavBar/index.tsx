import React from 'react';
import { BottomTabBar, BottomTabBarProps } from "expo-router/js-tabs";
import { colors } from '../../theme';

/**
 * NavBar — barra de navegação inferior global.
 * Encapsula o estilo da tab bar do Expo Router para uso consistente
 * em toda a aplicação. Consumida via `tabBar` prop no TabsLayout.
 *
 * Uso:
 *   <Tabs tabBar={(props) => <NavBar {...props} />} />
 */
export const NavBar: React.FC<BottomTabBarProps> = (props) => {
  return (
    <BottomTabBar
      {...props}
      style={{
        backgroundColor: colors.background,
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      }}
    />
  );
};

/** Opções de tela padrão para qualquer Tabs que use NavBar */
export const navBarScreenOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarStyle: {
    backgroundColor: colors.background,
    borderTopWidth: 0,
    elevation: 0,
  },
} as const;
