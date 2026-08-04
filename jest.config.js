module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup.tsx'],
  // react-native-reanimated importa react-native-worklets, cuja entrada
  // `.native` exige o módulo nativo e explode em Jest. Este resolver (shipado
  // pelo próprio worklets) tira a extensão `.native` da resolução e faz o
  // pacote cair na implementação JS — necessário para testar qualquer
  // componente animado, como AnimacaoAbrirPacote.
  resolver: 'react-native-worklets/jest/resolver',
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/presentation/screens/**',
    '!src/declarations.d.ts',
  ],
};
