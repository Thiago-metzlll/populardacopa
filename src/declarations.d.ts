declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

/**
 * @types/jest declara describe/it/expect como globals, mas não o objeto
 * `jest` (jest.fn, jest.mock...) — só a namespace de tipos. O valor em
 * runtime vem do preset jest-expo; aqui só damos o tipo pro TypeScript.
 */
declare global {
  const jest: typeof import('@jest/globals')['jest'];
}
