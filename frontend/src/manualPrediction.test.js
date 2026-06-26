import test from "node:test";
import assert from "node:assert/strict";

import { hydrateManualKnockoutMatch, updateKnockoutMatch } from "./manualPrediction.js";
import { getKnockoutWinnerCode } from "./utils/knockoutUtils.js";

function createState(entry, matchId = 104) {
  return {
    groupScores: {},
    knockoutMatches: {
      [matchId]: entry,
    },
    groupOverrides: {},
    selectedThirdPlaceTeams: [],
    expandedGroups: [],
    updatedAt: 0,
  };
}

function renderWinnerFromEntry(match, entry) {
  return getKnockoutWinnerCode({
    home_team: match.home_team,
    away_team: match.away_team,
    home_goals: Number(entry.homeGoals),
    away_goals: Number(entry.awayGoals),
    penalties: {
      home: Number(entry.penaltiesHome),
      away: Number(entry.penaltiesAway),
    },
    winner: entry.advancedTeamId,
  });
}

function renderHydratedMatch(match, entry) {
  return hydrateManualKnockoutMatch(match, {
    ...entry,
    homeTeamCode: match.home_team,
    awayTeamCode: match.away_team,
  });
}

test("Spain home vs Uruguay away: clicking home penalty tab keeps Spain as winner", () => {
  const match = { match_id: 104, home_team: "ESP", away_team: "URU", round: "Final" };
  const state = createState({
    homeGoals: "0",
    awayGoals: "0",
    penaltiesHome: "3",
    penaltiesAway: "4",
    selectedOutcome: "teamB",
    advancedTeamId: "URU",
    resultType: "PENS",
  });

  const next = updateKnockoutMatch(state, match, { advancedTeamId: "ESP" });
  const entry = next.knockoutMatches[104];

  assert.equal(entry.advancedTeamId, "ESP");
  assert.equal(entry.selectedOutcome, "teamA");
  assert.ok(Number(entry.penaltiesHome) > Number(entry.penaltiesAway));
  assert.equal(renderWinnerFromEntry(match, entry), "ESP");
});

test("Spain home vs Uruguay away: clicking away penalty tab keeps Uruguay as winner", () => {
  const match = { match_id: 104, home_team: "ESP", away_team: "URU", round: "Final" };
  const state = createState({
    homeGoals: "0",
    awayGoals: "0",
    penaltiesHome: "4",
    penaltiesAway: "2",
    selectedOutcome: "teamA",
    advancedTeamId: "ESP",
    resultType: "PENS",
  });

  const next = updateKnockoutMatch(state, match, { advancedTeamId: "URU" });
  const entry = next.knockoutMatches[104];

  assert.equal(entry.advancedTeamId, "URU");
  assert.equal(entry.selectedOutcome, "teamB");
  assert.ok(Number(entry.penaltiesAway) > Number(entry.penaltiesHome));
  assert.equal(renderWinnerFromEntry(match, entry), "URU");
});

test("Netherlands home vs Iran away: clicking Iran keeps Iran as winner", () => {
  const match = { match_id: 3, home_team: "NED", away_team: "IRN", round: "Third Place" };
  const state = createState({
    homeGoals: "1",
    awayGoals: "1",
    penaltiesHome: "4",
    penaltiesAway: "3",
    selectedOutcome: "teamA",
    advancedTeamId: "NED",
    resultType: "PENS",
  }, 3);

  const next = updateKnockoutMatch(state, match, { advancedTeamId: "IRN" });
  const entry = next.knockoutMatches[3];

  assert.equal(entry.advancedTeamId, "IRN");
  assert.equal(entry.selectedOutcome, "teamB");
  assert.ok(Number(entry.penaltiesAway) > Number(entry.penaltiesHome));
  assert.equal(renderWinnerFromEntry(match, entry), "IRN");
});

test("Netherlands home vs Iran away: clicking Netherlands keeps Netherlands as winner", () => {
  const match = { match_id: 3, home_team: "NED", away_team: "IRN", round: "Third Place" };
  const state = createState({
    homeGoals: "1",
    awayGoals: "1",
    penaltiesHome: "2",
    penaltiesAway: "5",
    selectedOutcome: "teamB",
    advancedTeamId: "IRN",
    resultType: "PENS",
  }, 3);

  const next = updateKnockoutMatch(state, match, { advancedTeamId: "NED" });
  const entry = next.knockoutMatches[3];

  assert.equal(entry.advancedTeamId, "NED");
  assert.equal(entry.selectedOutcome, "teamA");
  assert.ok(Number(entry.penaltiesHome) > Number(entry.penaltiesAway));
  assert.equal(renderWinnerFromEntry(match, entry), "NED");
});

test("Mexico vs Bosnia: away penalty click hydrates BIH as rendered winner", () => {
  const match = { match_id: 73, home_team: "MEX", away_team: "BIH", round: "Round of 32" };
  const state = createState({
    homeGoals: "1",
    awayGoals: "1",
    penaltiesHome: "5",
    penaltiesAway: "3",
    selectedOutcome: "teamA",
    advancedTeamId: "MEX",
    resultType: "PENS",
  }, 73);

  const next = updateKnockoutMatch(state, match, { advancedTeamId: "BIH", selectedOutcome: "teamB", resultType: "PENS" });
  const entry = next.knockoutMatches[73];
  const hydrated = renderHydratedMatch(match, entry);

  assert.equal(entry.advancedTeamId, "BIH");
  assert.equal(entry.selectedOutcome, "teamB");
  assert.ok(Number(entry.penaltiesAway) > Number(entry.penaltiesHome));
  assert.equal(hydrated.advanced_team, "BIH");
  assert.equal(hydrated.selected_outcome, "teamB");
  assert.equal(getKnockoutWinnerCode(hydrated), "BIH");
});

test("Colombia vs Croatia: away penalty click hydrates CRO as rendered winner", () => {
  const match = { match_id: 83, home_team: "COL", away_team: "CRO", round: "Round of 32" };
  const state = createState({
    homeGoals: "1",
    awayGoals: "1",
    penaltiesHome: "5",
    penaltiesAway: "3",
    selectedOutcome: "teamA",
    advancedTeamId: "COL",
    resultType: "PENS",
  }, 83);

  const next = updateKnockoutMatch(state, match, { advancedTeamId: "CRO", selectedOutcome: "teamB", resultType: "PENS" });
  const entry = next.knockoutMatches[83];
  const hydrated = renderHydratedMatch(match, entry);

  assert.equal(entry.advancedTeamId, "CRO");
  assert.equal(entry.selectedOutcome, "teamB");
  assert.ok(Number(entry.penaltiesAway) > Number(entry.penaltiesHome));
  assert.equal(hydrated.advanced_team, "CRO");
  assert.equal(hydrated.selected_outcome, "teamB");
  assert.equal(getKnockoutWinnerCode(hydrated), "CRO");
});

test("Netherlands vs Morocco: away penalty click still hydrates MAR as winner", () => {
  const match = { match_id: 75, home_team: "NED", away_team: "MAR", round: "Round of 32" };
  const state = createState({
    homeGoals: "1",
    awayGoals: "1",
    penaltiesHome: "1",
    penaltiesAway: "3",
    selectedOutcome: "teamB",
    advancedTeamId: "MAR",
    resultType: "PENS",
  }, 75);

  const next = updateKnockoutMatch(state, match, { advancedTeamId: "MAR", selectedOutcome: "teamB", resultType: "PENS" });
  const entry = next.knockoutMatches[75];
  const hydrated = renderHydratedMatch(match, entry);

  assert.equal(entry.advancedTeamId, "MAR");
  assert.equal(hydrated.advanced_team, "MAR");
  assert.equal(getKnockoutWinnerCode(hydrated), "MAR");
});

test("explicit penalty clicks always normalize to the clicked team across Round of 32 matches", () => {
  const cases = [
    { match_id: 81, home_team: "USA", away_team: "CIV", clicked: "CIV" },
    { match_id: 82, home_team: "BEL", away_team: "AUS", clicked: "AUS" },
    { match_id: 87, home_team: "POR", away_team: "CAN", clicked: "CAN" },
    { match_id: 88, home_team: "TUR", away_team: "IRN", clicked: "TUR" },
    { match_id: 83, home_team: "COL", away_team: "CRO", clicked: "CRO" },
  ];

  for (const match of cases) {
    const state = createState({
      homeGoals: "1",
      awayGoals: "1",
      penaltiesHome: "4",
      penaltiesAway: "2",
      selectedOutcome: "teamA",
      advancedTeamId: match.home_team,
      resultType: "PENS",
    }, match.match_id);

    const next = updateKnockoutMatch(state, match, {
      advancedTeamId: match.clicked,
      selectedOutcome: match.clicked === match.home_team ? "teamA" : "teamB",
      resultType: "PENS",
    });
    const entry = next.knockoutMatches[match.match_id];
    const hydrated = renderHydratedMatch(match, entry);

    assert.equal(entry.advancedTeamId, match.clicked, `${match.match_id} advancedTeamId`);
    assert.equal(
      entry.selectedOutcome,
      match.clicked === match.home_team ? "teamA" : "teamB",
      `${match.match_id} selectedOutcome`,
    );
    assert.equal(getKnockoutWinnerCode(hydrated), match.clicked, `${match.match_id} derived winner`);
    assert.equal(hydrated.advanced_team, match.clicked, `${match.match_id} hydrated advanced team`);

    if (match.clicked === match.home_team) {
      assert.ok(Number(entry.penaltiesHome) > Number(entry.penaltiesAway), `${match.match_id} home pens`);
    } else {
      assert.ok(Number(entry.penaltiesAway) > Number(entry.penaltiesHome), `${match.match_id} away pens`);
    }
  }
});
