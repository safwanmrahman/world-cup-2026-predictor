export const MANUAL_PREDICTION_STORAGE_KEY = "wc26-manual-prediction";
export const MANUAL_SHARE_PREFIX = "#prediction=";

export const GROUP_MATCHDAY_LABELS = ["Matchday 1", "Matchday 2", "Matchday 3"];

export const LEFT_BRACKET_TREE = {
  roundOf32: [74, 77, 73, 75, 83, 84, 81, 82],
  roundOf16: [89, 90, 93, 94],
  quarterfinals: [97, 98],
  semifinal: 101,
};

export const RIGHT_BRACKET_TREE = {
  roundOf32: [76, 78, 79, 80, 86, 88, 85, 87],
  roundOf16: [91, 92, 95, 96],
  quarterfinals: [99, 100],
  semifinal: 102,
};

export const ROUND_OF_32_TEMPLATE = [
  { match_id: 73, round: "Round of 32", home: "A2", away: "B2" },
  { match_id: 74, round: "Round of 32", home: "E1", away: "TP_A_B_C_D_F" },
  { match_id: 75, round: "Round of 32", home: "F1", away: "C2" },
  { match_id: 76, round: "Round of 32", home: "C1", away: "F2" },
  { match_id: 77, round: "Round of 32", home: "I1", away: "TP_C_D_F_G_H" },
  { match_id: 78, round: "Round of 32", home: "E2", away: "I2" },
  { match_id: 79, round: "Round of 32", home: "A1", away: "TP_C_E_F_H_I" },
  { match_id: 80, round: "Round of 32", home: "L1", away: "TP_E_H_I_J_K" },
  { match_id: 81, round: "Round of 32", home: "D1", away: "TP_B_E_F_I_J" },
  { match_id: 82, round: "Round of 32", home: "G1", away: "TP_A_E_H_I_J" },
  { match_id: 83, round: "Round of 32", home: "K2", away: "L2" },
  { match_id: 84, round: "Round of 32", home: "H1", away: "J2" },
  { match_id: 85, round: "Round of 32", home: "B1", away: "TP_E_F_G_I_J" },
  { match_id: 86, round: "Round of 32", home: "J1", away: "H2" },
  { match_id: 87, round: "Round of 32", home: "K1", away: "TP_D_E_I_J_L" },
  { match_id: 88, round: "Round of 32", home: "D2", away: "G2" },
];

export const THIRD_PLACE_ELIGIBILITY = {
  TP_A_B_C_D_F: new Set(["A", "B", "C", "D", "F"]),
  TP_C_D_F_G_H: new Set(["C", "D", "F", "G", "H"]),
  TP_C_E_F_H_I: new Set(["C", "E", "F", "H", "I"]),
  TP_E_H_I_J_K: new Set(["E", "H", "I", "J", "K"]),
  TP_B_E_F_I_J: new Set(["B", "E", "F", "I", "J"]),
  TP_A_E_H_I_J: new Set(["A", "E", "H", "I", "J"]),
  TP_E_F_G_I_J: new Set(["E", "F", "G", "I", "J"]),
  TP_D_E_I_J_L: new Set(["D", "E", "I", "J", "L"]),
};

export const KNOCKOUT_ROUND_LINKS = {
  round_of_16: [
    { match_id: 89, home_source: 74, away_source: 77, round: "Round of 16" },
    { match_id: 90, home_source: 73, away_source: 75, round: "Round of 16" },
    { match_id: 91, home_source: 76, away_source: 78, round: "Round of 16" },
    { match_id: 92, home_source: 79, away_source: 80, round: "Round of 16" },
    { match_id: 93, home_source: 83, away_source: 84, round: "Round of 16" },
    { match_id: 94, home_source: 81, away_source: 82, round: "Round of 16" },
    { match_id: 95, home_source: 86, away_source: 88, round: "Round of 16" },
    { match_id: 96, home_source: 85, away_source: 87, round: "Round of 16" },
  ],
  quarterfinals: [
    { match_id: 97, home_source: 89, away_source: 90, round: "Quarterfinals" },
    { match_id: 98, home_source: 93, away_source: 94, round: "Quarterfinals" },
    { match_id: 99, home_source: 91, away_source: 92, round: "Quarterfinals" },
    { match_id: 100, home_source: 95, away_source: 96, round: "Quarterfinals" },
  ],
  semifinals: [
    { match_id: 101, home_source: 97, away_source: 98, round: "Semifinals" },
    { match_id: 102, home_source: 99, away_source: 100, round: "Semifinals" },
  ],
  final: [{ match_id: 104, home_source: 101, away_source: 102, round: "Final" }],
};

const GROUP_LETTERS = "ABCDEFGHIJKL";
const RESULT_TYPES = new Set(["REGULAR", "PENS"]);
const MATCH_SOURCES = new Set(["manual-score", "quick-pick-generated-score"]);

function standingsSortKey(row) {
  return [row.points, row.goal_difference, row.goals_for, row.elo_rating];
}

function compareStandings(left, right) {
  const leftKey = standingsSortKey(left);
  const rightKey = standingsSortKey(right);

  for (let index = 0; index < leftKey.length; index += 1) {
    if (rightKey[index] !== leftKey[index]) {
      return rightKey[index] - leftKey[index];
    }
  }

  return left.team_name.localeCompare(right.team_name);
}

function createBlankRow(team) {
  return {
    team_code: team.code,
    team_name: team.name,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    elo_rating: team.elo_rating,
  };
}

function parseScore(value) {
  if (value === "" || value == null) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return Math.floor(numeric);
}

function normalizeResultType(value) {
  return RESULT_TYPES.has(value) ? value : "REGULAR";
}

function normalizeSource(value) {
  return MATCH_SOURCES.has(value) ? value : null;
}

function weightedPick(options) {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = Math.random() * total;

  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) {
      return option.value;
    }
  }

  return options[options.length - 1]?.value ?? null;
}

function pickAutoOutcome(teamA, teamB, stage) {
  const eloA = teamElo(teamA);
  const eloB = teamElo(teamB);
  const expectedA = 1 / (1 + 10 ** ((eloB - eloA) / 400));

  if (stage === "group") {
    const drawWeight = Math.max(18, 30 - Math.round(Math.abs(eloA - eloB) / 25));
    return weightedPick([
      { value: "teamA", weight: expectedA * 70 },
      { value: "draw", weight: drawWeight },
      { value: "teamB", weight: (1 - expectedA) * 70 },
    ]);
  }

  return weightedPick([
    { value: "teamA", weight: expectedA * 100 },
    { value: "teamB", weight: (1 - expectedA) * 100 },
  ]);
}

function deriveSelectedOutcome(homeGoals, awayGoals, stage) {
  if (homeGoals == null || awayGoals == null) {
    return null;
  }

  if (homeGoals > awayGoals) {
    return "teamA";
  }

  if (awayGoals > homeGoals) {
    return "teamB";
  }

  return stage === "group" ? "draw" : null;
}

function teamKey(team) {
  return team?.code ?? team?.team_code ?? "";
}

function teamElo(team) {
  return team?.elo_rating ?? team?.elo ?? 1500;
}

function buildPenaltyShootout() {
  return weightedPick([
    { value: { home: 4, away: 3 }, weight: 34 },
    { value: { home: 5, away: 4 }, weight: 24 },
    { value: { home: 3, away: 2 }, weight: 18 },
    { value: { home: 4, away: 2 }, weight: 14 },
    { value: { home: 5, away: 3 }, weight: 10 },
  ]);
}

function flipScore(score) {
  return {
    ...score,
    scoreA: score.scoreB,
    scoreB: score.scoreA,
    penaltiesHome: score.penaltiesAway ?? null,
    penaltiesAway: score.penaltiesHome ?? null,
  };
}

export function validateScoreInput(value) {
  if (value === "" || value == null) {
    return "";
  }

  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) {
    return "";
  }

  return String(Math.min(20, Number(digits)));
}

export function generateRealisticScore(teamA, teamB, selectedOutcome, stage) {
  const eloA = teamElo(teamA);
  const eloB = teamElo(teamB);
  const selectedHome = selectedOutcome === "teamA";
  const selectedAway = selectedOutcome === "teamB";
  const selectedDraw = selectedOutcome === "draw";
  const selectedStrength = selectedHome ? eloA : eloB;
  const otherStrength = selectedHome ? eloB : eloA;
  const selectedIsFavored = selectedStrength >= otherStrength;
  const strengthGap = Math.min(Math.abs(eloA - eloB), 320);
  const blowoutBoost = selectedIsFavored ? Math.round(strengthGap / 80) : 0;

  if (selectedDraw) {
    const draw = weightedPick([
      { value: { scoreA: 0, scoreB: 0 }, weight: 26 },
      { value: { scoreA: 1, scoreB: 1 }, weight: 52 },
      { value: { scoreA: 2, scoreB: 2 }, weight: 18 },
      { value: { scoreA: 3, scoreB: 3 }, weight: 4 },
    ]);
    return {
      ...draw,
      resultType: "REGULAR",
      penaltiesHome: null,
      penaltiesAway: null,
    };
  }

  const regularWinTemplates = selectedIsFavored
    ? [
        { value: { scoreA: 1, scoreB: 0 }, weight: 14 },
        { value: { scoreA: 2, scoreB: 0 }, weight: 18 + blowoutBoost },
        { value: { scoreA: 2, scoreB: 1 }, weight: 22 },
        { value: { scoreA: 3, scoreB: 0 }, weight: 10 + blowoutBoost },
        { value: { scoreA: 3, scoreB: 1 }, weight: 14 + Math.round(blowoutBoost / 2) },
        { value: { scoreA: 4, scoreB: 1 }, weight: Math.max(4, blowoutBoost) },
        { value: { scoreA: 4, scoreB: 0 }, weight: Math.max(2, Math.round(blowoutBoost / 2)) },
      ]
    : [
        { value: { scoreA: 1, scoreB: 0 }, weight: 26 },
        { value: { scoreA: 2, scoreB: 1 }, weight: 26 },
        { value: { scoreA: 2, scoreB: 0 }, weight: 14 },
        { value: { scoreA: 3, scoreB: 1 }, weight: 10 },
        { value: { scoreA: 3, scoreB: 2 }, weight: 8 },
        { value: { scoreA: 1, scoreB: 0 }, weight: 16 },
      ];

  const shouldGoToPens =
    stage === "knockout"
    && weightedPick([
      { value: false, weight: selectedIsFavored ? 74 : 68 },
      { value: true, weight: selectedIsFavored ? 26 : 32 },
    ]);

  if (shouldGoToPens) {
    const tieScore = weightedPick([
      { value: { scoreA: 1, scoreB: 1 }, weight: 48 },
      { value: { scoreA: 0, scoreB: 0 }, weight: 26 },
      { value: { scoreA: 2, scoreB: 2 }, weight: 22 },
      { value: { scoreA: 3, scoreB: 3 }, weight: 4 },
    ]);
    const penalties = buildPenaltyShootout();
    const result = {
      ...tieScore,
      resultType: "PENS",
      penaltiesHome: penalties.home,
      penaltiesAway: penalties.away,
    };
    return selectedHome ? result : flipScore(result);
  }

  const regular = weightedPick(regularWinTemplates);
  const result = {
    ...regular,
    resultType: "REGULAR",
    penaltiesHome: null,
    penaltiesAway: null,
  };

  return selectedHome ? result : flipScore(result);
}

function createDefaultGroupScoreState() {
  return {
    homeGoals: "",
    awayGoals: "",
    selectedOutcome: null,
    source: null,
    resultType: "REGULAR",
  };
}

function createDefaultKnockoutState() {
  return {
    homeGoals: "",
    awayGoals: "",
    penaltiesHome: "",
    penaltiesAway: "",
    selectedOutcome: null,
    advancedTeamId: null,
    source: null,
    resultType: "REGULAR",
  };
}

function isUntouchedGroupEntry(entry) {
  return (
    entry.homeGoals === ""
    && entry.awayGoals === ""
    && entry.selectedOutcome == null
    && entry.source == null
  );
}

function isUntouchedKnockoutEntry(entry) {
  return (
    entry.homeGoals === ""
    && entry.awayGoals === ""
    && entry.penaltiesHome === ""
    && entry.penaltiesAway === ""
    && entry.selectedOutcome == null
    && entry.advancedTeamId == null
    && entry.source == null
  );
}

export function createInitialPredictionState(groups, fixtures) {
  const groupScores = {};

  fixtures.forEach((fixture) => {
    groupScores[fixture.match_id] = createDefaultGroupScoreState();
  });

  return {
    mode: "manual",
    groupScores,
    groupOverrides: {},
    selectedThirdPlaceTeams: [],
    knockoutMatches: {},
    groupTables: {},
    groupAdvancers: {},
    champion: null,
    runnerUp: null,
    thirdPlace: null,
    expandedGroups: groups.slice(0, 2).map((group) => group.name),
    advancedOverrideGroups: [],
    updatedAt: Date.now(),
  };
}

function updateStandingsRow(home, away, homeGoals, awayGoals) {
  home.played += 1;
  away.played += 1;
  home.goals_for += homeGoals;
  home.goals_against += awayGoals;
  away.goals_for += awayGoals;
  away.goals_against += homeGoals;
  home.goal_difference = home.goals_for - home.goals_against;
  away.goal_difference = away.goals_for - away.goals_against;

  if (homeGoals > awayGoals) {
    home.wins += 1;
    away.losses += 1;
    home.points += 3;
    return;
  }

  if (awayGoals > homeGoals) {
    away.wins += 1;
    home.losses += 1;
    away.points += 3;
    return;
  }

  home.draws += 1;
  away.draws += 1;
  home.points += 1;
  away.points += 1;
}

function applyOverrideOrder(table, overrideOrder) {
  if (!Array.isArray(overrideOrder) || !overrideOrder.length) {
    return table;
  }

  const remaining = new Map(table.map((row) => [row.team_code, row]));
  const ordered = [];

  overrideOrder.forEach((code) => {
    if (remaining.has(code)) {
      ordered.push(remaining.get(code));
      remaining.delete(code);
    }
  });

  if (!ordered.length) {
    return table;
  }

  return [...ordered, ...remaining.values()];
}

export function calculateManualGroupResults(groups, fixtures, groupScores, teamsByCode, groupOverrides = {}) {
  const fixturesByGroup = fixtures.reduce((accumulator, fixture) => {
    accumulator[fixture.group] ||= [];
    accumulator[fixture.group].push(fixture);
    return accumulator;
  }, {});

  return groups.map((group, groupIndex) => {
    const rowsByTeam = Object.fromEntries(group.teams.map((team) => [team.code, createBlankRow(team)]));
    const playedMatches = fixturesByGroup[group.name].map((fixture) => {
      const savedScore = {
        ...createDefaultGroupScoreState(),
        ...(groupScores[fixture.match_id] ?? {}),
      };
      const homeGoals = parseScore(savedScore.homeGoals);
      const awayGoals = parseScore(savedScore.awayGoals);
      const selectedOutcome = deriveSelectedOutcome(homeGoals, awayGoals, "group") ?? savedScore.selectedOutcome;
      const match = {
        ...fixture,
        home_goals: homeGoals,
        away_goals: awayGoals,
        complete: homeGoals != null && awayGoals != null,
        selected_outcome: selectedOutcome,
        source: normalizeSource(savedScore.source),
        result_type: normalizeResultType(savedScore.resultType),
      };

      if (match.complete) {
        updateStandingsRow(rowsByTeam[fixture.home_team], rowsByTeam[fixture.away_team], homeGoals, awayGoals);
      }

      return match;
    });

    const sorted = Object.values(rowsByTeam).sort(compareStandings);
    const overrideOrder = groupOverrides[group.name];
    const table = applyOverrideOrder(sorted, overrideOrder);
    const completedMatches = playedMatches.filter((match) => match.complete).length;

    return {
      name: group.name,
      letter: GROUP_LETTERS[groupIndex],
      teams: group.teams,
      table,
      matches: playedMatches,
      overrideOrder: overrideOrder ?? [],
      autoCalculated: !overrideOrder?.length,
      completedMatches,
      totalMatches: playedMatches.length,
      isComplete: completedMatches === playedMatches.length,
    };
  });
}

function groupPlacements(groupResults) {
  const placements = {};

  groupResults.forEach((group) => {
    group.table.forEach((row, index) => {
      placements[`${group.letter}${index + 1}`] = row;
    });
  });

  return placements;
}

function bestThirdPlaceRows(groupResults) {
  return groupResults
    .map((group) => ({
      ...group.table[2],
      group_letter: group.letter,
      group_name: group.name,
    }))
    .sort(compareStandings);
}

function normalizeSelectedThirdPlaces(groupResults, selectedThirdPlaceTeams) {
  const candidates = bestThirdPlaceRows(groupResults);
  const candidateByCode = new Map(candidates.map((row) => [row.team_code, row]));
  const selected = selectedThirdPlaceTeams
    .map((code) => candidateByCode.get(code))
    .filter(Boolean);

  if (selected.length === 8) {
    return selected;
  }

  return candidates.slice(0, 8);
}

function resolveThirdPlaceSlots(selectedThirdPlaces) {
  const remaining = [...selectedThirdPlaces];
  const slotAssignments = {};

  Object.entries(THIRD_PLACE_ELIGIBILITY).forEach(([slotKey, allowedGroups]) => {
    const allowedIndex = remaining.findIndex((team) => allowedGroups.has(team.group_letter));
    const team = allowedIndex >= 0 ? remaining.splice(allowedIndex, 1)[0] : remaining.shift();
    slotAssignments[slotKey] = team ?? null;
  });

  return slotAssignments;
}

function createBaseMatch(template, placements, slotAssignments) {
  const homePlacement = placements[template.home];
  const awayPlacement = placements[template.away];
  const slotHome = slotAssignments[template.home];
  const slotAway = slotAssignments[template.away];

  return {
    match_id: template.match_id,
    round: template.round,
    home_team: homePlacement?.team_code ?? slotHome?.team_code ?? null,
    away_team: awayPlacement?.team_code ?? slotAway?.team_code ?? null,
  };
}

function deriveKnockoutWinner(homeCode, awayCode, homeGoals, awayGoals, penaltiesHome, penaltiesAway, explicitWinner) {
  if (!homeCode || !awayCode || homeGoals == null || awayGoals == null) {
    return null;
  }

  if (homeGoals > awayGoals) {
    return homeCode;
  }

  if (awayGoals > homeGoals) {
    return awayCode;
  }

  if (penaltiesHome != null && penaltiesAway != null && penaltiesHome !== penaltiesAway) {
    return penaltiesHome > penaltiesAway ? homeCode : awayCode;
  }

  if (explicitWinner === homeCode || explicitWinner === awayCode) {
    return explicitWinner;
  }

  return null;
}

function hydrateMatchState(baseMatch, savedMatch = {}) {
  if (!baseMatch.home_team || !baseMatch.away_team) {
    return {
      ...baseMatch,
      home_goals: null,
      away_goals: null,
      winner: null,
      decision: "pending",
      penalties: null,
      manual: false,
      selected_outcome: null,
      source: null,
      result_type: "REGULAR",
      advanced_team: null,
    };
  }

  const teamsChanged =
    savedMatch.home_team
    && (savedMatch.home_team !== baseMatch.home_team || savedMatch.away_team !== baseMatch.away_team);
  const sourceState = {
    ...createDefaultKnockoutState(),
    ...(teamsChanged ? {} : savedMatch),
  };
  const homeGoals = parseScore(sourceState.homeGoals);
  const awayGoals = parseScore(sourceState.awayGoals);
  const penaltiesHome = parseScore(sourceState.penaltiesHome);
  const penaltiesAway = parseScore(sourceState.penaltiesAway);
  const explicitWinner = sourceState.advancedTeamId ?? sourceState.winner ?? null;
  const winner = deriveKnockoutWinner(
    baseMatch.home_team,
    baseMatch.away_team,
    homeGoals,
    awayGoals,
    penaltiesHome,
    penaltiesAway,
    explicitWinner,
  );
  const resultType = normalizeResultType(sourceState.resultType);
  const selectedOutcome =
    homeGoals != null && awayGoals != null && homeGoals !== awayGoals
      ? homeGoals > awayGoals
        ? "teamA"
        : "teamB"
      : explicitWinner === baseMatch.home_team
        ? "teamA"
        : explicitWinner === baseMatch.away_team
          ? "teamB"
          : null;
  const decision =
    homeGoals == null || awayGoals == null
      ? "pending"
      : homeGoals !== awayGoals
        ? "full_time"
        : penaltiesHome != null && penaltiesAway != null && penaltiesHome !== penaltiesAway
          ? "penalties"
          : winner && resultType === "PENS"
            ? "penalties"
            : winner
              ? "manual"
              : "tied";

  return {
    ...baseMatch,
    home_goals: homeGoals,
    away_goals: awayGoals,
    winner,
    decision,
    penalties:
      penaltiesHome != null && penaltiesAway != null
        ? { home: penaltiesHome, away: penaltiesAway }
        : null,
    manual: true,
    selected_outcome: selectedOutcome,
    source: normalizeSource(sourceState.source),
    result_type: resultType,
    advanced_team: winner,
  };
}

function buildFollowUpMatches(roundKey, winnersByMatch, savedMatches) {
  return KNOCKOUT_ROUND_LINKS[roundKey].map((template) => {
    const baseMatch = {
      match_id: template.match_id,
      round: template.round,
      home_team: winnersByMatch[template.home_source]?.winner ?? null,
      away_team: winnersByMatch[template.away_source]?.winner ?? null,
    };

    return hydrateMatchState(baseMatch, savedMatches[template.match_id]);
  });
}

function losersFromSemifinals(semifinals) {
  return semifinals
    .map((match) => {
      if (!match.winner || !match.home_team || !match.away_team) {
        return null;
      }
      return match.winner === match.home_team ? match.away_team : match.home_team;
    })
    .filter(Boolean);
}

export function buildManualTournament(state, groups, fixtures, teamsByCode) {
  const groupResults = calculateManualGroupResults(
    groups,
    fixtures,
    state.groupScores,
    teamsByCode,
    state.groupOverrides,
  );
  const placements = groupPlacements(groupResults);
  const selectedThirdPlaces = normalizeSelectedThirdPlaces(groupResults, state.selectedThirdPlaceTeams);
  const thirdPlaceSlots = resolveThirdPlaceSlots(selectedThirdPlaces);
  const roundOf32 = ROUND_OF_32_TEMPLATE.map((template) =>
    hydrateMatchState(
      createBaseMatch(template, placements, thirdPlaceSlots),
      state.knockoutMatches[template.match_id],
    ),
  );
  const winnersByRound32 = Object.fromEntries(roundOf32.map((match) => [match.match_id, match]));
  const roundOf16 = buildFollowUpMatches("round_of_16", winnersByRound32, state.knockoutMatches);
  const winnersByRound16 = Object.fromEntries(roundOf16.map((match) => [match.match_id, match]));
  const quarterfinals = buildFollowUpMatches("quarterfinals", winnersByRound16, state.knockoutMatches);
  const winnersByQuarterfinal = Object.fromEntries(quarterfinals.map((match) => [match.match_id, match]));
  const semifinals = buildFollowUpMatches("semifinals", winnersByQuarterfinal, state.knockoutMatches);
  const winnersBySemifinal = Object.fromEntries(semifinals.map((match) => [match.match_id, match]));
  const final = buildFollowUpMatches("final", winnersBySemifinal, state.knockoutMatches);
  const semifinalLosers = losersFromSemifinals(semifinals);
  const thirdPlaceBase = {
    match_id: "3P",
    round: "Third Place",
    home_team: semifinalLosers[0] ?? null,
    away_team: semifinalLosers[1] ?? null,
  };
  const thirdPlaceMatch = hydrateMatchState(thirdPlaceBase, state.knockoutMatches["3P"]);
  const finalMatch = final[0] ?? null;
  const runnerUp =
    finalMatch?.winner && finalMatch.home_team && finalMatch.away_team
      ? finalMatch.winner === finalMatch.home_team
        ? finalMatch.away_team
        : finalMatch.home_team
      : null;
  const groupAdvancers = Object.fromEntries(
    groupResults.map((group) => [
      group.name,
      {
        first: group.table[0]?.team_code ?? null,
        second: group.table[1]?.team_code ?? null,
        third: group.table[2]?.team_code ?? null,
        thirdPlaceAdvanced: selectedThirdPlaces.some((team) => team.team_code === group.table[2]?.team_code),
      },
    ]),
  );
  const groupTables = Object.fromEntries(groupResults.map((group) => [group.name, group.table]));

  return {
    groupResults,
    groupTables,
    bestThirdPlaces: selectedThirdPlaces,
    placements,
    groupAdvancers,
    qualifiedForRoundOf32: [
      ...groupResults.flatMap((group) => group.table.slice(0, 2).map((row) => row.team_code)),
      ...selectedThirdPlaces.map((team) => team.team_code),
    ],
    bracket: {
      round_of_32: roundOf32,
      round_of_16: roundOf16,
      quarterfinals,
      semifinals,
      final,
    },
    thirdPlaceMatch,
    champion: finalMatch?.winner ?? null,
    runnerUp,
    thirdPlace: thirdPlaceMatch?.winner ?? null,
    semifinalists: semifinals
      .map((match) => [match.home_team, match.away_team])
      .flat()
      .filter(Boolean),
    finalists: finalMatch ? [finalMatch.home_team, finalMatch.away_team].filter(Boolean) : [],
  };
}

export function applyGroupOverride(groupName, currentOrder, teamCode, direction, existingOverrides) {
  const order = [...(existingOverrides[groupName]?.length ? existingOverrides[groupName] : currentOrder)];
  const index = order.indexOf(teamCode);

  if (index < 0) {
    return existingOverrides;
  }

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= order.length) {
    return existingOverrides;
  }

  [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
  return {
    ...existingOverrides,
    [groupName]: order,
  };
}

export function updateGroupScore(state, match, side, value) {
  const entry = {
    ...createDefaultGroupScoreState(),
    ...(state.groupScores[match.match_id] ?? {}),
  };
  const nextEntry = {
    ...entry,
    [side]: validateScoreInput(value),
  };
  const homeGoals = parseScore(nextEntry.homeGoals);
  const awayGoals = parseScore(nextEntry.awayGoals);

  nextEntry.selectedOutcome = deriveSelectedOutcome(homeGoals, awayGoals, "group");
  nextEntry.resultType = "REGULAR";
  nextEntry.source =
    nextEntry.homeGoals === "" && nextEntry.awayGoals === ""
      ? null
      : "manual-score";

  return {
    ...state,
    groupScores: {
      ...state.groupScores,
      [match.match_id]: nextEntry,
    },
    updatedAt: Date.now(),
  };
}

export function quickPickGroupMatch(state, match, teamsByCode, selectedOutcome) {
  const generated = generateRealisticScore(
    teamsByCode[match.home_team],
    teamsByCode[match.away_team],
    selectedOutcome,
    "group",
  );

  return {
    ...state,
    groupScores: {
      ...state.groupScores,
      [match.match_id]: {
        homeGoals: String(generated.scoreA),
        awayGoals: String(generated.scoreB),
        selectedOutcome,
        source: "quick-pick-generated-score",
        resultType: generated.resultType,
      },
    },
    updatedAt: Date.now(),
  };
}

export function updateKnockoutMatch(state, match, patch) {
  const entry = {
    ...createDefaultKnockoutState(),
    ...(state.knockoutMatches[match.match_id] ?? {}),
  };
  const nextEntry = {
    ...entry,
    ...patch,
  };
  const homeGoals = parseScore(nextEntry.homeGoals);
  const awayGoals = parseScore(nextEntry.awayGoals);
  const penaltiesHome = parseScore(nextEntry.penaltiesHome);
  const penaltiesAway = parseScore(nextEntry.penaltiesAway);

  if (homeGoals == null || awayGoals == null) {
    nextEntry.selectedOutcome = patch.selectedOutcome ?? entry.selectedOutcome ?? null;
    nextEntry.advancedTeamId = patch.advancedTeamId ?? entry.advancedTeamId ?? null;
  } else if (homeGoals > awayGoals) {
    nextEntry.selectedOutcome = "teamA";
    nextEntry.advancedTeamId = match.home_team;
    nextEntry.resultType = "REGULAR";
    nextEntry.penaltiesHome = "";
    nextEntry.penaltiesAway = "";
  } else if (awayGoals > homeGoals) {
    nextEntry.selectedOutcome = "teamB";
    nextEntry.advancedTeamId = match.away_team;
    nextEntry.resultType = "REGULAR";
    nextEntry.penaltiesHome = "";
    nextEntry.penaltiesAway = "";
  } else {
    const preservedWinner =
      patch.advancedTeamId
      ?? nextEntry.advancedTeamId
      ?? (nextEntry.selectedOutcome === "teamA"
        ? match.home_team
        : nextEntry.selectedOutcome === "teamB"
          ? match.away_team
          : null);
    nextEntry.advancedTeamId = preservedWinner;
    nextEntry.selectedOutcome =
      preservedWinner === match.home_team
        ? "teamA"
        : preservedWinner === match.away_team
          ? "teamB"
          : nextEntry.selectedOutcome;
    nextEntry.resultType = normalizeResultType(nextEntry.resultType);
    if (patch.advancedTeamId && nextEntry.resultType === "PENS") {
      const currentHomePens = parseScore(nextEntry.penaltiesHome);
      const currentAwayPens = parseScore(nextEntry.penaltiesAway);
      const winnerShouldBeHome = patch.advancedTeamId === match.home_team;
      const penaltiesConflict =
        currentHomePens != null
        && currentAwayPens != null
        && ((winnerShouldBeHome && currentHomePens <= currentAwayPens)
          || (!winnerShouldBeHome && currentAwayPens <= currentHomePens));

      if (currentHomePens == null || currentAwayPens == null || penaltiesConflict) {
        nextEntry.penaltiesHome = winnerShouldBeHome ? "4" : "3";
        nextEntry.penaltiesAway = winnerShouldBeHome ? "3" : "4";
      }
    }
    if (penaltiesHome != null && penaltiesAway != null && penaltiesHome !== penaltiesAway) {
      nextEntry.advancedTeamId = penaltiesHome > penaltiesAway ? match.home_team : match.away_team;
      nextEntry.selectedOutcome = nextEntry.advancedTeamId === match.home_team ? "teamA" : "teamB";
      nextEntry.resultType = "PENS";
    }
  }

  nextEntry.source =
    nextEntry.homeGoals === "" && nextEntry.awayGoals === ""
      ? nextEntry.selectedOutcome
        ? nextEntry.source
        : null
      : patch.source ?? "manual-score";

  return {
    ...state,
    knockoutMatches: {
      ...state.knockoutMatches,
      [match.match_id]: nextEntry,
    },
    updatedAt: Date.now(),
  };
}

export function quickPickKnockoutMatch(state, match, teamsByCode, selectedOutcome) {
  const generated = generateRealisticScore(
    teamsByCode[match.home_team],
    teamsByCode[match.away_team],
    selectedOutcome,
    "knockout",
  );
  const advancedTeamId = selectedOutcome === "teamA" ? match.home_team : match.away_team;

  return {
    ...state,
    knockoutMatches: {
      ...state.knockoutMatches,
      [match.match_id]: {
        homeGoals: String(generated.scoreA),
        awayGoals: String(generated.scoreB),
        penaltiesHome: generated.penaltiesHome != null ? String(generated.penaltiesHome) : "",
        penaltiesAway: generated.penaltiesAway != null ? String(generated.penaltiesAway) : "",
        selectedOutcome,
        advancedTeamId,
        source: "quick-pick-generated-score",
        resultType: generated.resultType,
      },
    },
    updatedAt: Date.now(),
  };
}

export function autoFillRemainingPrediction(state, groups, fixtures, teamsByCode) {
  let nextState = state;

  fixtures.forEach((fixture) => {
    const entry = {
      ...createDefaultGroupScoreState(),
      ...(nextState.groupScores[fixture.match_id] ?? {}),
    };

    if (!isUntouchedGroupEntry(entry)) {
      return;
    }

    const selectedOutcome = pickAutoOutcome(
      teamsByCode[fixture.home_team],
      teamsByCode[fixture.away_team],
      "group",
    );
    nextState = quickPickGroupMatch(nextState, fixture, teamsByCode, selectedOutcome);
  });

  let filledMatch = true;
  while (filledMatch) {
    filledMatch = false;
    const derived = buildManualTournament(nextState, groups, fixtures, teamsByCode);
    const knockoutMatches = [
      ...derived.bracket.round_of_32,
      ...derived.bracket.round_of_16,
      ...derived.bracket.quarterfinals,
      ...derived.bracket.semifinals,
      ...derived.bracket.final,
      derived.thirdPlaceMatch,
    ].filter(Boolean);

    knockoutMatches.forEach((match) => {
      if (!match.home_team || !match.away_team) {
        return;
      }

      const entry = {
        ...createDefaultKnockoutState(),
        ...(nextState.knockoutMatches[match.match_id] ?? {}),
      };

      if (!isUntouchedKnockoutEntry(entry)) {
        return;
      }

      const selectedOutcome = pickAutoOutcome(
        teamsByCode[match.home_team],
        teamsByCode[match.away_team],
        "knockout",
      );
      nextState = quickPickKnockoutMatch(nextState, match, teamsByCode, selectedOutcome);
      filledMatch = true;
    });
  }

  return {
    ...nextState,
    updatedAt: Date.now(),
  };
}

export function clearGroupOverride(state, groupName) {
  const nextOverrides = { ...state.groupOverrides };
  delete nextOverrides[groupName];
  return {
    ...state,
    groupOverrides: nextOverrides,
    updatedAt: Date.now(),
  };
}

export function updateSelectedThirdPlaces(state, selectedCodes) {
  return {
    ...state,
    selectedThirdPlaceTeams: selectedCodes,
    updatedAt: Date.now(),
  };
}

export function toggleExpandedGroup(state, groupName) {
  const expanded = state.expandedGroups ?? [];
  const exists = expanded.includes(groupName);
  return {
    ...state,
    expandedGroups: exists
      ? expanded.filter((name) => name !== groupName)
      : [...expanded.slice(-1), groupName],
    updatedAt: Date.now(),
  };
}

export function expandAllGroups(state, groups) {
  return {
    ...state,
    expandedGroups: groups.map((group) => group.name),
    updatedAt: Date.now(),
  };
}

export function collapseAllGroups(state) {
  return {
    ...state,
    expandedGroups: [],
    updatedAt: Date.now(),
  };
}

export function toggleAdvancedOverride(state, groupName) {
  const active = state.advancedOverrideGroups ?? [];
  const exists = active.includes(groupName);
  return {
    ...state,
    advancedOverrideGroups: exists
      ? active.filter((name) => name !== groupName)
      : [...active, groupName],
    updatedAt: Date.now(),
  };
}

export function buildPersistedManualState(state, derived) {
  return {
    ...state,
    groupTables: derived.groupTables,
    groupAdvancers: derived.groupAdvancers,
    champion: derived.champion,
    runnerUp: derived.runnerUp,
    thirdPlace: derived.thirdPlace,
    updatedAt: Date.now(),
  };
}

export function saveManualPredictionState(state) {
  localStorage.setItem(MANUAL_PREDICTION_STORAGE_KEY, JSON.stringify(state));
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function decodePredictionHash(hash) {
  if (!hash?.startsWith(MANUAL_SHARE_PREFIX)) {
    return null;
  }

  try {
    const encoded = hash.slice(MANUAL_SHARE_PREFIX.length);
    return safeParse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}

export function encodePredictionHash(state) {
  return `${MANUAL_SHARE_PREFIX}${btoa(encodeURIComponent(JSON.stringify(state)))}`;
}

export function loadManualPredictionState(groups, fixtures) {
  const initial = createInitialPredictionState(groups, fixtures);
  const shared = decodePredictionHash(window.location.hash);
  const stored = safeParse(localStorage.getItem(MANUAL_PREDICTION_STORAGE_KEY));
  const source = shared ?? stored;

  if (!source) {
    return initial;
  }

  return {
    ...initial,
    ...source,
    groupScores: Object.fromEntries(
      Object.keys(initial.groupScores).map((matchId) => [
        matchId,
        {
          ...createDefaultGroupScoreState(),
          ...(source.groupScores?.[matchId] ?? {}),
        },
      ]),
    ),
    groupOverrides: source.groupOverrides ?? {},
    selectedThirdPlaceTeams: source.selectedThirdPlaceTeams ?? [],
    knockoutMatches: Object.fromEntries(
      Object.entries(source.knockoutMatches ?? {}).map(([matchId, value]) => [
        matchId,
        {
          ...createDefaultKnockoutState(),
          ...value,
        },
      ]),
    ),
    expandedGroups: Array.isArray(source.expandedGroups) ? source.expandedGroups : initial.expandedGroups,
    advancedOverrideGroups: Array.isArray(source.advancedOverrideGroups) ? source.advancedOverrideGroups : [],
  };
}

export function resetManualPrediction(groups, fixtures) {
  localStorage.removeItem(MANUAL_PREDICTION_STORAGE_KEY);
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return createInitialPredictionState(groups, fixtures);
}

export function getComparisonData(manualTournament, simulationTournament) {
  if (!manualTournament || !simulationTournament) {
    return null;
  }

  const simulatedFirsts = Object.fromEntries(
    simulationTournament.group_results.map((group) => [group.name, group.table[0]?.team_code ?? null]),
  );
  const manualFirsts = Object.fromEntries(
    manualTournament.groupResults.map((group) => [group.name, group.table[0]?.team_code ?? null]),
  );
  const knockoutDifferences = [];
  const simulationMatches = [
    ...simulationTournament.bracket.round_of_32,
    ...simulationTournament.bracket.round_of_16,
    ...simulationTournament.bracket.quarterfinals,
    ...simulationTournament.bracket.semifinals,
    ...simulationTournament.bracket.final,
  ];
  const simulationById = Object.fromEntries(simulationMatches.map((match) => [match.match_id, match]));
  const manualMatches = [
    ...manualTournament.bracket.round_of_32,
    ...manualTournament.bracket.round_of_16,
    ...manualTournament.bracket.quarterfinals,
    ...manualTournament.bracket.semifinals,
    ...manualTournament.bracket.final,
  ];

  manualMatches.forEach((match) => {
    const simulated = simulationById[match.match_id];
    if (simulated?.winner && match.winner && simulated.winner !== match.winner) {
      knockoutDifferences.push({
        match_id: match.match_id,
        round: match.round,
        manualWinner: match.winner,
        simulatedWinner: simulated.winner,
      });
    }
  });

  return {
    manualFirsts,
    simulatedFirsts,
    knockoutDifferences,
  };
}
