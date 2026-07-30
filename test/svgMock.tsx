import React from 'react';
import { View } from 'react-native';

/**
 * Mock dos imports de .svg (react-native-svg-transformer não roda sob Jest).
 * Renderiza uma View com testID previsível para asserções nos componentes de bandeira.
 */
const SvgMock = (props: Record<string, unknown>) => <View testID="svg-flag" {...props} />;

export default SvgMock;
