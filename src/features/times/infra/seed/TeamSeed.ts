import { Team } from '../../domain/entities/Team';

export const mockTeams: Team[] = [
  { id: 't1', name: 'Brasil', countryId: 'br', groupId: 'g1', ranking: 1, winRate: 0.8, isFavorite: true, titles: ['1958', '1962', '1970', '1994', '2002'], worldCupWins: 5, description: 'A Seleção Brasileira é a líder em conquistas de títulos da Copa do Mundo, acumulando um histórico de muitas vitórias memoráveis.', isUnbeaten: true },
  { id: 't2', name: 'Argentina', countryId: 'ar', groupId: 'g1', ranking: 2, winRate: 0.75, isFavorite: false, titles: ['1978', '1986', '2022'], worldCupWins: 3, description: 'Atual campeã mundial, a Argentina possui uma das seleções mais fortes do planeta.', isUnbeaten: true },
  { id: 't3', name: 'França', countryId: 'fr', groupId: 'g1', ranking: 3, winRate: 0.7, isFavorite: true, titles: ['1998', '2018'], worldCupWins: 2, description: 'A França tem sido uma potência dominante no futebol europeu e mundial recente.', isUnbeaten: false },
  { id: 't4', name: 'Alemanha', countryId: 'de', groupId: 'g1', ranking: 4, winRate: 0.65, isFavorite: false, titles: ['1954', '1974', '1990', '2014'], worldCupWins: 4, description: 'Sempre uma equipe perigosa e eficiente, tetracampeã mundial.', isUnbeaten: false },
  { id: 't5', name: 'Espanha', countryId: 'es', groupId: 'g2', ranking: 5, winRate: 0.6, isFavorite: false, titles: ['2010'], worldCupWins: 1, description: 'A Fúria espanhola, famosa por seu estilo de jogo focado na posse de bola.', isUnbeaten: false },
  { id: 't6', name: 'Inglaterra', countryId: 'gb', groupId: 'g2', ranking: 6, winRate: 0.58, isFavorite: true, titles: ['1966'], worldCupWins: 1, description: 'A terra onde o futebol moderno foi inventado, campeã em 1966.', isUnbeaten: false },
  { id: 't7', name: 'Portugal', countryId: 'pt', groupId: 'g2', ranking: 7, winRate: 0.55, isFavorite: false, titles: [], worldCupWins: 0, description: 'Uma seleção de craques que sempre impressiona nos torneios internacionais.', isUnbeaten: false },
  { id: 't8', name: 'Itália', countryId: 'it', groupId: 'g2', ranking: 8, winRate: 0.52, isFavorite: false, titles: ['1934', '1938', '1982', '2006'], worldCupWins: 4, description: 'A Azzurra tem quatro títulos mundiais e uma defesa historicamente impenetrável.', isUnbeaten: false },
  { id: 't9', name: 'Uruguai', countryId: 'uy', groupId: 'g3', ranking: 9, winRate: 0.5, isFavorite: true, titles: ['1930', '1950'], worldCupWins: 2, description: 'O Uruguai, conhecido por sua raça, foi o primeiro campeão mundial.', isUnbeaten: false },
];
