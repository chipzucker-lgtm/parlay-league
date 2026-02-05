// API Integration for Live Game Scores
// This file provides functions to fetch real-time sports data

/**
 * Fetch live scores from The Odds API
 * Sign up at: https://the-odds-api.com
 * Free tier: 500 requests/month
 */
export const fetchOddsAPIScores = async (apiKey) => {
  try {
    // Fetch NFL scores
    const nflResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=${apiKey}&daysFrom=3`
    );
    const nflData = await nflResponse.json();
    
    // Fetch College Football scores
    const cfbResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/scores/?apiKey=${apiKey}&daysFrom=3`
    );
    const cfbData = await cfbResponse.json();
    
    const allGames = [...nflData, ...cfbData];
    
    return allGames.map(game => ({
      id: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      homeScore: game.scores?.find(s => s.name === game.home_team)?.score || 0,
      awayScore: game.scores?.find(s => s.name === game.away_team)?.score || 0,
      completed: game.completed,
      lastUpdate: game.last_update
    }));
  } catch (error) {
    console.error('Error fetching from The Odds API:', error);
    throw error;
  }
};

/**
 * Fetch scores from ESPN (free, unofficial API)
 * More reliable for real-time scores but may change without notice
 */
export const fetchESPNScores = async () => {
  try {
    // Fetch NFL scoreboard
    const nflResponse = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
    );
    const nflData = await nflResponse.json();
    
    // Fetch College Football scoreboard
    const cfbResponse = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'
    );
    const cfbData = await cfbResponse.json();
    
    const nflGames = nflData.events.map(event => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
      
      return {
        id: event.id,
        league: 'NFL',
        homeTeam: homeTeam.team.displayName,
        awayTeam: awayTeam.team.displayName,
        homeScore: parseInt(homeTeam.score) || 0,
        awayScore: parseInt(awayTeam.score) || 0,
        completed: event.status.type.completed,
        status: event.status.type.description
      };
    });
    
    const cfbGames = cfbData.events.map(event => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
      
      return {
        id: event.id,
        league: 'NCAAF',
        homeTeam: homeTeam.team.displayName,
        awayTeam: awayTeam.team.displayName,
        homeScore: parseInt(homeTeam.score) || 0,
        awayScore: parseInt(awayTeam.score) || 0,
        completed: event.status.type.completed,
        status: event.status.type.description
      };
    });
    
    return [...nflGames, ...cfbGames];
  } catch (error) {
    console.error('Error fetching from ESPN:', error);
    throw error;
  }
};

/**
 * Match game results to user picks and determine if pick was correct
 */
export const evaluatePick = (pick, gameResult, game) => {
  if (!gameResult || !game) return false;
  
  const scoreDiff = gameResult.homeScore - gameResult.awayScore;
  
  if (pick.pickType === 'spread') {
    // Extract spread value and team
    const spreadMatch = game.spread.match(/(.+?)\s*([-+]?\d+\.?\d*)/);
    if (!spreadMatch) return false;
    
    const spreadTeam = spreadMatch[1].trim();
    const spreadValue = parseFloat(spreadMatch[2]);
    
    // Determine if home team is favored
    const homeTeamFavored = spreadTeam === game.home;
    
    if (homeTeamFavored) {
      // Home team needs to win by more than spread
      return scoreDiff > Math.abs(spreadValue);
    } else {
      // Away team needs to win or lose by less than spread
      return scoreDiff < -Math.abs(spreadValue);
    }
  } else if (pick.pickType === 'over' || pick.pickType === 'under') {
    // Extract over/under value
    const ouMatch = game.over_under.match(/(\d+\.?\d*)/);
    if (!ouMatch) return false;
    
    const ouValue = parseFloat(ouMatch[1]);
    const totalScore = gameResult.homeScore + gameResult.awayScore;
    
    return pick.pickType === 'over' ? 
      totalScore > ouValue : 
      totalScore < ouValue;
  }
  
  return false;
};

/**
 * Match games from spreadsheet to API results by team names
 * Handles variations in team names (e.g., "SF 49ers" vs "San Francisco 49ers")
 */
export const matchGameByTeams = (game, results) => {
  const normalizeTeamName = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/saint/g, '')
      .replace(/new/g, '')
      .replace(/los/g, '')
      .replace(/san/g, '');
  };
  
  const homeNormalized = normalizeTeamName(game.home);
  const awayNormalized = normalizeTeamName(game.away);
  
  return results.find(result => {
    const resultHomeNormalized = normalizeTeamName(result.homeTeam);
    const resultAwayNormalized = normalizeTeamName(result.awayTeam);
    
    return (
      (homeNormalized.includes(resultHomeNormalized) || resultHomeNormalized.includes(homeNormalized)) &&
      (awayNormalized.includes(resultAwayNormalized) || resultAwayNormalized.includes(awayNormalized))
    );
  });
};

/**
 * Check all user picks against game results and determine winners
 */
export const checkAllPicksAgainstResults = (picks, games, results) => {
  const userResults = {};
  
  Object.entries(picks).forEach(([user, userPicks]) => {
    let correctPicks = 0;
    const pickResults = [];
    
    userPicks.forEach(pick => {
      const game = games.find(g => g.id === pick.gameId);
      if (!game) return;
      
      const gameResult = matchGameByTeams(game, results);
      const isCorrect = evaluatePick(pick, gameResult, game);
      
      if (isCorrect) correctPicks++;
      
      pickResults.push({
        pick,
        game,
        gameResult,
        correct: isCorrect
      });
    });
    
    userResults[user] = {
      correctPicks,
      totalPicks: userPicks.length,
      isWinner: correctPicks === 3,
      pickResults
    };
  });
  
  return userResults;
};

/**
 * Configuration for API keys
 * In production, use environment variables
 */
export const getAPIKey = () => {
  // Check for environment variable first
  if (typeof process !== 'undefined' && process.env.VITE_ODDS_API_KEY) {
    return process.env.VITE_ODDS_API_KEY;
  }
  
  // Fall back to localStorage for development
  return localStorage.getItem('oddsApiKey') || '';
};

export const setAPIKey = (key) => {
  localStorage.setItem('oddsApiKey', key);
};
