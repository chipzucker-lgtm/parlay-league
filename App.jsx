import React, { useState, useEffect } from 'react';
import { User, Upload, Lock, Trophy, ChevronDown, Check, X, Clock, TrendingUp } from 'lucide-react';

const ParlayLeague = () => {
  const [mode, setMode] = useState('user'); // 'admin' or 'user'
  const [currentUser, setCurrentUser] = useState('');
  const [week, setWeek] = useState(1);
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const [userPicks, setUserPicks] = useState([]);
  const [locked, setLocked] = useState(false);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('make-picks');
  
  // Sample data structure
  const sampleGames = [
    { id: 1, league: 'NFL', home: 'Kansas City Chiefs', away: 'Buffalo Bills', spread: 'KC -3.5', over_under: 'O/U 52.5', time: 'Sun 1:00 PM' },
    { id: 2, league: 'NFL', home: 'San Francisco 49ers', away: 'Dallas Cowboys', spread: 'SF -6', over_under: 'O/U 48.5', time: 'Sun 4:25 PM' },
    { id: 3, league: 'NCAAF', home: 'Alabama', away: 'Georgia', spread: 'ALA -2.5', over_under: 'O/U 55', time: 'Sat 7:00 PM' },
    { id: 4, league: 'NFL', home: 'Philadelphia Eagles', away: 'New York Giants', spread: 'PHI -10', over_under: 'O/U 45', time: 'Sun 1:00 PM' },
    { id: 5, league: 'NCAAF', home: 'Michigan', away: 'Ohio State', spread: 'OSU -3', over_under: 'O/U 50.5', time: 'Sat 12:00 PM' },
  ];

  useEffect(() => {
    if (games.length === 0) {
      setGames(sampleGames);
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').slice(1); // Skip header
        const parsedGames = rows.filter(row => row.trim()).map((row, idx) => {
          const [league, home, away, spread, over_under, time] = row.split(',');
          return { 
            id: idx + 1, 
            league: league?.trim(), 
            home: home?.trim(), 
            away: away?.trim(), 
            spread: spread?.trim(), 
            over_under: over_under?.trim(), 
            time: time?.trim() 
          };
        });
        setGames(parsedGames);
      };
      reader.readAsText(file);
    }
  };

  const togglePick = (gameId, pickType) => {
    const pickKey = `${gameId}-${pickType}`;
    const newPicks = [...userPicks];
    
    if (newPicks.includes(pickKey)) {
      setUserPicks(newPicks.filter(p => p !== pickKey));
    } else if (newPicks.length < 3) {
      setUserPicks([...newPicks, pickKey]);
    }
  };

  const submitPicks = () => {
    if (userPicks.length === 3 && currentUser) {
      setPicks(prev => ({
        ...prev,
        [currentUser]: userPicks.map(pick => {
          const [gameId, pickType] = pick.split('-');
          const game = games.find(g => g.id === parseInt(gameId));
          return { gameId: parseInt(gameId), pickType, game };
        })
      }));
      alert('Picks submitted successfully!');
    }
  };

  const checkResults = async () => {
    // Simulate checking results - in production, this would call The Odds API
    const mockResults = games.map(game => ({
      gameId: game.id,
      homeScore: Math.floor(Math.random() * 35) + 14,
      awayScore: Math.floor(Math.random() * 35) + 14,
      total: 0
    }));
    
    mockResults.forEach(r => r.total = r.homeScore + r.awayScore);

    const winners = [];
    Object.entries(picks).forEach(([user, userPicksList]) => {
      let correctPicks = 0;
      userPicksList.forEach(pick => {
        const result = mockResults.find(r => r.gameId === pick.gameId);
        const game = games.find(g => g.id === pick.gameId);
        
        if (!result || !game) return;
        
        const scoreDiff = result.homeScore - result.awayScore;
        const spreadValue = parseFloat(game.spread.match(/-?\d+\.?\d*/)[0]);
        
        if (pick.pickType === 'spread') {
          const covered = game.spread.includes(game.home) ? 
            scoreDiff > Math.abs(spreadValue) : 
            scoreDiff < -Math.abs(spreadValue);
          if (covered) correctPicks++;
        } else if (pick.pickType === 'over') {
          const ouValue = parseFloat(game.over_under.match(/\d+\.?\d*/)[0]);
          if (result.total > ouValue) correctPicks++;
        } else if (pick.pickType === 'under') {
          const ouValue = parseFloat(game.over_under.match(/\d+\.?\d*/)[0]);
          if (result.total < ouValue) correctPicks++;
        }
      });
      
      if (correctPicks === 3) {
        winners.push(user);
      }
    });

    setResults({ mockResults, winners });
  };

  const AdminView = () => (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-bold mb-4 neon-text">Upload Week {week} Odds</h2>
        <div className="flex items-center gap-4">
          <label className="btn-primary cursor-pointer">
            <Upload size={20} />
            <span>Upload CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <div className="text-sm text-gray-400">
            CSV Format: League, Home Team, Away Team, Spread, Over/Under, Time
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold neon-text">All Picks ({Object.keys(picks).length}/16)</h2>
          <button 
            onClick={() => setLocked(!locked)}
            className={`btn-${locked ? 'danger' : 'success'}`}
          >
            {locked ? <Lock size={20} /> : <Clock size={20} />}
            <span>{locked ? 'Picks Locked' : 'Lock Picks'}</span>
          </button>
        </div>
        
        <div className="grid gap-3">
          {Object.entries(picks).map(([user, userPicksList]) => (
            <div key={user} className="pick-card">
              <div className="font-bold text-lg mb-2">{user}</div>
              <div className="space-y-1">
                {userPicksList.map((pick, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2">
                    <span className="pick-badge">{idx + 1}</span>
                    <span>{pick.game.away} @ {pick.game.home}</span>
                    <span className="text-cyan-400">→ {pick.pickType.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-2xl font-bold mb-4 neon-text">Check Results</h2>
        <button onClick={checkResults} className="btn-primary">
          <TrendingUp size={20} />
          <span>Fetch Game Results</span>
        </button>
        
        {results.winners && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-3 text-yellow-400">🏆 Winners This Week</h3>
            {results.winners.length > 0 ? (
              <div className="space-y-2">
                {results.winners.map(winner => (
                  <div key={winner} className="winner-card">
                    <Trophy size={24} className="text-yellow-400" />
                    <span className="text-xl font-bold">{winner}</span>
                    <span className="text-green-400">3/3 CORRECT!</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400">No perfect parlays this week</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const UserView = () => (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-center gap-4 mb-6">
          <User size={32} className="text-cyan-400" />
          <input
            type="text"
            placeholder="Enter your name..."
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            className="input-field flex-1"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-lg">
            Picks Selected: <span className="neon-text font-bold">{userPicks.length}/3</span>
          </div>
          <button 
            onClick={submitPicks}
            disabled={userPicks.length !== 3 || !currentUser}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={20} />
            Submit Picks
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {games.map(game => (
          <div key={game.id} className="game-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="league-badge">{game.league}</div>
                <div className="text-xs text-gray-400 mt-1">{game.time}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-lg font-bold">{game.away}</div>
              <div className="text-sm text-gray-400 my-1">@</div>
              <div className="text-lg font-bold">{game.home}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => togglePick(game.id, 'spread')}
                className={`pick-option ${userPicks.includes(`${game.id}-spread`) ? 'picked' : ''}`}
                disabled={userPicks.length >= 3 && !userPicks.includes(`${game.id}-spread`)}
              >
                <div className="text-xs opacity-70">SPREAD</div>
                <div className="font-bold">{game.spread}</div>
              </button>
              
              <button
                onClick={() => togglePick(game.id, 'over')}
                className={`pick-option ${userPicks.includes(`${game.id}-over`) ? 'picked' : ''}`}
                disabled={userPicks.length >= 3 && !userPicks.includes(`${game.id}-over`)}
              >
                <div className="text-xs opacity-70">OVER</div>
                <div className="font-bold">{game.over_under.split(' ')[1]}</div>
              </button>
              
              <button
                onClick={() => togglePick(game.id, 'under')}
                className={`pick-option ${userPicks.includes(`${game.id}-under`) ? 'picked' : ''}`}
                disabled={userPicks.length >= 3 && !userPicks.includes(`${game.id}-under`)}
              >
                <div className="text-xs opacity-70">UNDER</div>
                <div className="font-bold">{game.over_under.split(' ')[1]}</div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Rajdhani', sans-serif;
          color: #fff;
        }

        .glass-panel {
          background: rgba(15, 15, 35, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);
        }

        .neon-text {
          color: #22d3ee;
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 1px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
        }

        .btn-success {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-field {
          padding: 12px 16px;
          background: rgba(15, 15, 35, 0.8);
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          outline: none;
          transition: border-color 0.3s;
        }

        .input-field:focus {
          border-color: #8b5cf6;
        }

        .game-card {
          background: linear-gradient(135deg, rgba(15, 15, 35, 0.9) 0%, rgba(30, 15, 50, 0.9) 100%);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          transition: all 0.3s;
        }

        .game-card:hover {
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-2px);
        }

        .league-badge {
          display: inline-block;
          padding: 4px 12px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .pick-option {
          padding: 12px;
          background: rgba(15, 15, 35, 0.8);
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Rajdhani', sans-serif;
        }

        .pick-option:hover:not(:disabled) {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.2);
        }

        .pick-option.picked {
          border-color: #22d3ee;
          background: rgba(34, 211, 238, 0.2);
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
        }

        .pick-option:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pick-card {
          background: rgba(15, 15, 35, 0.6);
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #8b5cf6;
        }

        .pick-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
        }

        .winner-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%);
          border: 2px solid rgba(234, 179, 8, 0.5);
          border-radius: 12px;
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(234, 179, 8, 0.3); }
          50% { box-shadow: 0 0 30px rgba(234, 179, 8, 0.5); }
        }

        .mode-toggle {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: rgba(15, 15, 35, 0.7);
          border-radius: 12px;
        }

        .mode-btn {
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
        }

        .mode-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}>
            <span className="neon-text">PARLAY LEAGUE</span>
          </h1>
          <div className="text-xl text-gray-400">Week {week} • 2024 Season</div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="mode-toggle">
            <button 
              onClick={() => setMode('user')} 
              className={`mode-btn ${mode === 'user' ? 'active' : ''}`}
            >
              Make Picks
            </button>
            <button 
              onClick={() => setMode('admin')} 
              className={`mode-btn ${mode === 'admin' ? 'active' : ''}`}
            >
              Admin
            </button>
          </div>
        </div>

        {mode === 'admin' ? <AdminView /> : <UserView />}
      </div>
    </div>
  );
};

export default ParlayLeague;
