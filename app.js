const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server has started");
    });
  } catch (error) {
    console.log(`DB Error: &{error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDetailsToDBResponseData = (dbObject) => {
  const { player_id, player_name } = dbObject;
  return {
    playerId: player_id,
    playerName: player_name,
  };
};
const convertMatchDetailsToDBResponseData = (dbObject) => {
  const { match_id, match, year } = dbObject;
  return {
    matchId: match_id,
    match,
    year,
  };
};
const convertPlayerMatchScoreToDBResponseData = (dbObject) => {
  const {
    player_match_id,
    player_id,
    match_id,
    score,
    fours,
    sixes,
  } = dbObject;
  return {
    playerMatchId: player_match_id,
    playerId: player_id,
    matchId: match_id,
    score,
    fours,
    sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details`;
  const dbData = await db.all(getPlayersQuery);
  response.send(
    dbData.map((eachData) => convertPlayerDetailsToDBResponseData(eachData))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT 
  * 
  FROM 
    player_details 
  WHERE 
    player_id=${playerId};`;

  const playerDetails = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsToDBResponseData(playerDetails));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE 
    player_details 
  SET
    player_name='${playerName}'
  WHERE 
    player_id=${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
  SELECT 
  * 
  FROM 
    match_details 
  WHERE 
    match_id=${matchId};`;

  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchDetailsToDBResponseData(matchDetails));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsToDBResponseData(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playerMatches = await db.all(getMatchPlayersQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertPlayerDetailsToDBResponseData(eachMatch)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT
      player_match_score.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes
    FROM player_match_score 
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerScoreQuery);
  response.send(playerMatches);
});

module.exports = app;
