import type { Team, Match } from './types';
import { INITIAL_TEAMS } from './teams';


export const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

type MatchPair = [Team, Team];

/**
 * Generates the round-robin fixture (rounds) for a set of teams using the
 * "circle method". Works for any number of teams: if the count is odd, a
 * "bye" placeholder is added and matches involving it are dropped.
 */
function generateRoundRobinRounds(items: Team[]): MatchPair[][] {
  const BYE_ID = '__BYE__';
  const BYE: Team = { id: BYE_ID, name: '', group: '', flagUrl: '' };

  const teams: Team[] = [...items];
  if (teams.length % 2 !== 0) {
    teams.push(BYE);
  }

  const n = teams.length;
  if (n < 2) return [];

  const numRounds = n - 1;
  const half = n / 2;
  const rounds: MatchPair[][] = [];
  let arr = teams.slice();

  for (let r = 0; r < numRounds; r++) {
    const roundPairs: MatchPair[] = [];
    for (let i = 0; i < half; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home.id !== BYE_ID && away.id !== BYE_ID) {
        // Alternate home/away orientation per round to spread home games out.
        roundPairs.push(r % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    rounds.push(roundPairs);

    // Rotate: keep the first team fixed, rotate the rest ("circle method").
    const fixed = arr[0];
    const rest = arr.slice(1);
    const last = rest.pop();
    if (last !== undefined) rest.unshift(last);
    arr = [fixed, ...rest];
  }

  return rounds;
}

function getFixtureScore(homeId: string, awayId: string): { homeScore: number; awayScore: number } {
  const customScores: Record<string, { h: number; a: number }> = {
    // Grupo A: mex(9), rsa(4), kor(3), cze(1)
    'mex-rsa': { h: 2, a: 0 },
    'mex-kor': { h: 1, a: 0 },
    'mex-cze': { h: 3, a: 0 },
    'rsa-kor': { h: 1, a: 0 },
    'rsa-cze': { h: 1, a: 1 },
    'kor-cze': { h: 2, a: 1 },
    
    // Grupo B: sui(7), can(4), bih(4), qat(1)
    'sui-can': { h: 2, a: 1 },
    'sui-bih': { h: 4, a: 1 },
    'sui-qat': { h: 1, a: 1 },
    'can-bih': { h: 1, a: 1 },
    'can-qat': { h: 2, a: 1 },
    'bih-qat': { h: 3, a: 1 },

    // Grupo C: bra(7), mar(7), sco(3), hai(0)
    'bra-mar': { h: 1, a: 1 },
    'bra-sco': { h: 2, a: 1 },
    'bra-hai': { h: 2, a: 0 },
    'mar-sco': { h: 1, a: 0 },
    'mar-hai': { h: 2, a: 0 },
    'sco-hai': { h: 1, a: 0 },

    // Grupo D: usa(9), aus(6), par(3), tur(0)
    'usa-aus': { h: 2, a: 1 },
    'usa-par': { h: 1, a: 0 },
    'usa-tur': { h: 3, a: 0 },
    'aus-par': { h: 2, a: 1 },
    'aus-tur': { h: 1, a: 0 },
    'par-tur': { h: 1, a: 0 },

    // Grupo E: ger(9), ecu(4), civ(3), cuw(1)
    'ger-ecu': { h: 2, a: 1 },
    'ger-civ': { h: 3, a: 1 },
    'ger-cuw': { h: 2, a: 0 },
    'ecu-civ': { h: 1, a: 1 },
    'ecu-cuw': { h: 1, a: 1 },
    'civ-cuw': { h: 1, a: 0 },

    // Grupo F: ned(7), jpn(5), swe(4), tun(0)
    'ned-jpn': { h: 1, a: 1 },
    'ned-swe': { h: 2, a: 1 },
    'ned-tun': { h: 2, a: 0 },
    'jpn-swe': { h: 1, a: 1 },
    'jpn-tun': { h: 2, a: 0 },
    'swe-tun': { h: 1, a: 0 },

    // Grupo G: bel(9), egy(4), irn(3), nzl(1)
    'bel-egy': { h: 3, a: 1 },
    'bel-irn': { h: 2, a: 0 },
    'bel-nzl': { h: 3, a: 0 },
    'egy-irn': { h: 1, a: 1 },
    'egy-nzl': { h: 1, a: 1 },
    'irn-nzl': { h: 1, a: 0 },

    // Grupo H: esp(9), uru(6), ksa(3), cpv(0)
    'esp-uru': { h: 2, a: 1 },
    'esp-ksa': { h: 3, a: 0 },
    'esp-cpv': { h: 4, a: 0 },
    'uru-ksa': { h: 2, a: 1 },
    'uru-cpv': { h: 2, a: 0 },
    'ksa-cpv': { h: 1, a: 0 },

    // Grupo I: fra(7), nor(6), sen(4), irq(0)
    'fra-nor': { h: 2, a: 1 },
    'fra-sen': { h: 1, a: 1 },
    'fra-irq': { h: 3, a: 0 },
    'nor-sen': { h: 2, a: 1 },
    'nor-irq': { h: 2, a: 0 },
    'sen-irq': { h: 2, a: 0 },

    // Grupo J: arg(9), aut(4), alg(4), jor(0)
    'arg-aut': { h: 3, a: 1 },
    'arg-alg': { h: 2, a: 0 },
    'arg-jor': { h: 4, a: 0 },
    'aut-alg': { h: 1, a: 1 },
    'aut-jor': { h: 2, a: 1 },
    'alg-jor': { h: 2, a: 0 },

    // Grupo K: col(7), por(5), cod(4), uzb(0)
    'col-por': { h: 2, a: 2 },
    'col-cod': { h: 2, a: 1 },
    'col-uzb': { h: 2, a: 0 },
    'por-cod': { h: 1, a: 1 },
    'por-uzb': { h: 3, a: 2 },
    'cod-uzb': { h: 1, a: 0 },

    // Grupo L: eng(9), cro(6), gha(3), pan(0)
    'eng-cro': { h: 2, a: 1 },
    'eng-gha': { h: 3, a: 1 },
    'eng-pan': { h: 3, a: 0 },
    'cro-gha': { h: 2, a: 1 },
    'cro-pan': { h: 2, a: 0 },
    'gha-pan': { h: 1, a: 0 }
  };

  const key1 = `${homeId}-${awayId}`;
  if (customScores[key1]) return { homeScore: customScores[key1].h, awayScore: customScores[key1].a };
  const key2 = `${awayId}-${homeId}`;
  if (customScores[key2]) return { homeScore: customScores[key2].a, awayScore: customScores[key2].h };

  return { homeScore: 0, awayScore: 0 };
}

/**
 * Builds the group-stage calendar for every group found in INITIAL_TEAMS.
 * Teams without a `group` are ignored; groups with any number of teams
 * (not just 4) are supported via the generic round-robin generator above.
 */
function generateGroupStageMatches(teams: Team[]): Match[] {
  const groupsMap = new Map<string, Team[]>();
  teams.forEach(team => {
    const groupKey = (team.group || '').trim();
    if (!groupKey) return;
    if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, []);
    groupsMap.get(groupKey)!.push(team);
  });

  const matches: Match[] = [];
  const baseDate = new Date('2026-06-11T12:00:00.000Z');
  let dayOffset = 0;

  Array.from(groupsMap.keys()).sort().forEach(groupKey => {
    const groupTeams = groupsMap.get(groupKey)!;
    const rounds = generateRoundRobinRounds(groupTeams);

    rounds.forEach((roundPairs, roundIndex) => {
      roundPairs.forEach(([home, away]) => {
        const matchDate = new Date(baseDate.getTime());
        matchDate.setUTCDate(matchDate.getUTCDate() + dayOffset);

        const scores = getFixtureScore(home.id, away.id);

        matches.push({
          id: `${home.id}-${away.id}`,
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          group: `GRUPO ${groupKey}`,
          round: `RODADA ${roundIndex + 1}`,
          date: matchDate.toISOString(),
          status: 'FINISHED',
        });
      });

      dayOffset += 1;
    });
  });

  return matches;
}

export const INITIAL_MATCHES: Match[] = generateGroupStageMatches(INITIAL_TEAMS);
