/**
 * Setup global dos testes.
 *
 * @expo/vector-icons carrega a fonte de forma assíncrona e faz setState fora de
 * act(), poluindo a saída dos testes de componente. O mock troca o ícone por um
 * Text com o nome do ícone, o que também permite asserções sobre qual ícone
 * cada estado do componente renderiza.
 */
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const makeIconSet = () => {
    const Icon = ({ name, ...props }: { name: string; [key: string]: unknown }) =>
      React.createElement(Text, { testID: `icon-${name}`, ...props }, name);
    return Icon;
  };

  return {
    Ionicons: makeIconSet(),
    MaterialIcons: makeIconSet(),
    MaterialCommunityIcons: makeIconSet(),
    FontAwesome: makeIconSet(),
    FontAwesome5: makeIconSet(),
    Feather: makeIconSet(),
    AntDesign: makeIconSet(),
    Entypo: makeIconSet(),
  };
});
