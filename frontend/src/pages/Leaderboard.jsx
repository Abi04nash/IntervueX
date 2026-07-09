import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import axios from "axios";
import { 
  FaTrophy, FaCode, 
  FaSearch, FaUser, FaCrown,
  FaSpinner, FaAward
} from "react-icons/fa";

const Leaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");
  const [leaderboardData, setLeaderboardData] = useState([]);

  // Fetch Real Data from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/user/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let rawData = res.data.leaderboard.map(user => {
          let finalScore = 0;
          if (user.averageScore) {
            finalScore = user.averageScore;
          } else if (user.totalScore && user.totalInterviews > 0) {
            finalScore = Math.round(user.totalScore / user.totalInterviews);
          } else if (user.totalScore) {
            finalScore = user.totalScore;
          }

          return {
            _id: user._id || user.id, // Grab either _id or id
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            role: user.targetRole || "fullstack",
            score: finalScore, 
            totalInterviews: user.totalInterviews || 0
          };
        });

        rawData.sort((a, b) => b.score - a.score);

        const rankedData = rawData.map((user, index) => ({
          ...user,
          rank: index + 1 
        }));

        setLeaderboardData(rankedData);
      } catch (error) {
        console.error("Failed to load leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Filter Logic
  const filteredData = filterRole === "all" 
    ? leaderboardData 
    : leaderboardData.filter(user => user.role.toLowerCase() === filterRole.toLowerCase());

  const topThree = filteredData.slice(0, 3);
  const restOfLeaderboard = filteredData.slice(3);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] text-indigo-400 space-y-4">
        <FaSpinner className="animate-spin text-4xl" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Loading Global Ranks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-0 sm:px-6 lg:px-8 text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
        <div className="w-full lg:w-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
            <FaTrophy className="text-yellow-500" /> Global Hall of Fame
          </h1>
          <p className="text-slate-400 max-w-xl text-sm md:text-base">
            Compete against top developers worldwide. Your rank is based on your AI interview performance, consistency, and problem-solving skills.
          </p>
        </div>
        
        <div className="flex bg-[#050812] p-1.5 rounded-xl border border-slate-800/80 shadow-xl overflow-x-auto w-full lg:w-auto scrollbar-hide">
          {["all", "fullstack", "frontend", "backend", "data"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 lg:flex-none ${
                filterRole === role 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-[#0B0F19]/60"
              }`}
            >
              {role === "all" ? "Global Ranks" : role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 PODIUM - Responsive Flexbox */}
      <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-6 mb-16 pt-10">
        
        {/* Rank 2 - Silver */}
        {topThree[1] && (
          <div className="order-2 md:order-1 w-full md:w-1/3 max-w-sm bg-gradient-to-b from-slate-400/10 to-[#0B0F19]/80 backdrop-blur-md border border-slate-400/30 rounded-3xl p-6 flex flex-col items-center relative shadow-lg transform hover:-translate-y-2 transition-transform">
            <div className="absolute -top-6 bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 w-12 h-12 flex items-center justify-center rounded-full text-xl font-black border-4 border-[#050812] shadow-[0_0_15px_rgba(148,163,184,0.4)]">2</div>
            
            <Link to={`/profile/${topThree[1]._id}`} className="flex flex-col items-center group w-full cursor-pointer">
              <div className="w-20 h-20 bg-[#050812] rounded-full flex items-center justify-center mt-4 mb-4 border-2 border-slate-400 overflow-hidden shadow-inner transition-transform group-hover:scale-105 group-hover:border-indigo-400">
                {topThree[1].avatar ? <img src={topThree[1].avatar} className="w-full h-full object-cover"/> : <FaUser className="text-3xl text-slate-500" />}
              </div>
              <h3 className="text-xl font-bold text-white text-center truncate w-full group-hover:text-indigo-300 transition-colors">{topThree[1].name}</h3>
              <p className="text-indigo-400 text-sm mb-5 truncate w-full text-center group-hover:underline">@{topThree[1].username}</p>
            </Link>

            <div className="w-full flex justify-between items-center bg-[#050812]/80 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Score</p>
                <p className="text-lg font-black text-slate-300">{topThree[1].score}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Interviews</p>
                <p className="text-lg font-black text-slate-300 flex items-center gap-1 justify-center">{topThree[1].totalInterviews}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rank 1 - Gold */}
        {topThree[0] && (
          <div className="order-1 md:order-2 w-full md:w-1/3 max-w-sm bg-gradient-to-b from-yellow-500/15 to-[#0B0F19]/90 backdrop-blur-xl border border-yellow-500/40 rounded-3xl p-8 flex flex-col items-center relative shadow-[0_0_40px_rgba(234,179,8,0.15)] transform md:-translate-y-8 hover:-translate-y-10 transition-transform z-10">
            <FaCrown className="absolute -top-10 text-5xl text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-bounce" style={{ animationDuration: '3s' }} />
            <div className="absolute -top-3 bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 w-14 h-14 flex items-center justify-center rounded-full text-2xl font-black border-4 border-[#050812] shadow-[0_0_20px_rgba(234,179,8,0.5)]">1</div>
            
            <Link to={`/profile/${topThree[0]._id}`} className="flex flex-col items-center group w-full cursor-pointer">
              <div className="w-28 h-28 bg-[#050812] rounded-full flex items-center justify-center mt-6 mb-4 border-4 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.4)] overflow-hidden transition-transform group-hover:scale-105 group-hover:border-yellow-400">
                {topThree[0].avatar ? <img src={topThree[0].avatar} className="w-full h-full object-cover"/> : <FaUser className="text-4xl text-slate-500" />}
              </div>
              <h3 className="text-2xl font-black text-white text-center truncate w-full group-hover:text-yellow-400 transition-colors">{topThree[0].name}</h3>
              <p className="text-indigo-400 text-sm mb-6 truncate w-full text-center group-hover:underline">@{topThree[0].username}</p>
            </Link>

            <div className="w-full flex justify-between items-center bg-[#050812]/90 p-4.5 rounded-xl border border-yellow-500/20 shadow-inner">
              <div className="text-center">
                <p className="text-[10px] text-yellow-500/70 uppercase tracking-widest font-bold">Avg Score</p>
                <p className="text-2xl font-black text-yellow-400 drop-shadow-md">{topThree[0].score}</p>
              </div>
              <div className="w-px h-10 bg-slate-800"></div>
              <div className="text-center">
                <p className="text-[10px] text-yellow-500/70 uppercase tracking-widest font-bold">Interviews</p>
                <p className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1 drop-shadow-md">{topThree[0].totalInterviews}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rank 3 - Bronze */}
        {topThree[2] && (
          <div className="order-3 md:order-3 w-full md:w-1/3 max-w-sm bg-gradient-to-b from-amber-700/10 to-[#0B0F19]/80 backdrop-blur-md border border-amber-700/30 rounded-3xl p-6 flex flex-col items-center relative shadow-lg transform hover:-translate-y-2 transition-transform">
            <div className="absolute -top-6 bg-gradient-to-br from-amber-600 to-amber-800 text-white w-12 h-12 flex items-center justify-center rounded-full text-xl font-black border-4 border-[#050812] shadow-[0_0_15px_rgba(180,83,9,0.4)]">3</div>
            
            <Link to={`/profile/${topThree[2]._id}`} className="flex flex-col items-center group w-full cursor-pointer">
              <div className="w-20 h-20 bg-[#050812] rounded-full flex items-center justify-center mt-4 mb-4 border-2 border-amber-700 overflow-hidden shadow-inner transition-transform group-hover:scale-105 group-hover:border-amber-500">
                {topThree[2].avatar ? <img src={topThree[2].avatar} className="w-full h-full object-cover"/> : <FaUser className="text-3xl text-slate-500" />}
              </div>
              <h3 className="text-xl font-bold text-white text-center truncate w-full group-hover:text-amber-500 transition-colors">{topThree[2].name}</h3>
              <p className="text-indigo-400 text-sm mb-5 truncate w-full text-center group-hover:underline">@{topThree[2].username}</p>
            </Link>

            <div className="w-full flex justify-between items-center bg-[#050812]/80 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Score</p>
                <p className="text-lg font-black text-slate-300">{topThree[2].score}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Interviews</p>
                <p className="text-lg font-black text-slate-300 flex items-center gap-1 justify-center">{topThree[2].totalInterviews}</p>
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Table Header (Math fixed to exactly 12 columns everywhere) */}
        <div className="grid grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 bg-[#050812] items-center">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-7 md:col-span-4 lg:col-span-4">Hacker</div>
          <div className="hidden md:block md:col-span-4 lg:col-span-3 text-left">Role Target</div>
          <div className="hidden lg:block lg:col-span-2 text-center">Interviews</div>
          <div className="col-span-3 md:col-span-3 lg:col-span-2 text-right md:pr-4">Avg Score</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {restOfLeaderboard.map((user) => (
            <div key={user._id} className="grid grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 items-center hover:bg-slate-800/40 transition-colors group">
              
              <div className="col-span-2 md:col-span-1 text-center font-mono text-base md:text-lg font-black text-slate-500 group-hover:text-white transition-colors">
                #{user.rank}
              </div>
              
              <Link to={`/profile/${user._id}`} className="col-span-7 md:col-span-4 lg:col-span-4 flex items-center gap-3 overflow-hidden min-w-0 cursor-pointer group/link">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#050812] rounded-full flex items-center justify-center border border-slate-700 overflow-hidden flex-shrink-0 transition-transform group-hover/link:scale-110 group-hover/link:border-indigo-500">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <FaUser className="text-slate-500 text-xs md:text-sm" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm md:text-base text-slate-200 font-bold group-hover/link:text-indigo-400 group-hover/link:underline underline-offset-2 transition-colors truncate">{user.name}</p>
                  <p className="text-[10px] md:text-xs text-slate-500 truncate group-hover/link:text-indigo-300">@{user.username}</p>
                </div>
              </Link>

              {/* Role (Hidden on mobile) */}
              <div className="hidden md:flex md:col-span-4 lg:col-span-3 items-center min-w-0">
                <span className="px-3 py-1.5 bg-[#050812] border border-slate-800/80 rounded-lg text-xs font-semibold text-slate-300 capitalize flex items-center gap-2 truncate max-w-full">
                  <FaCode className="text-indigo-400 flex-shrink-0" /> 
                  <span className="truncate">{user.role}</span>
                </span>
              </div>

              <div className="hidden lg:block lg:col-span-2 text-center text-slate-400 font-medium">
                {user.totalInterviews}
              </div>

              <div className="col-span-3 md:col-span-3 lg:col-span-2 flex flex-col items-end justify-center md:pr-4">
                <div className="text-base md:text-lg font-black text-emerald-400">{user.score}</div>
                <div className="text-[10px] md:text-xs text-slate-500 font-semibold lg:hidden truncate">
                  {user.totalInterviews} <span className="hidden sm:inline">Int.</span>
                </div>
              </div>

            </div>
          ))}

          {filteredData.length === 0 && !loading && (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-[#050812] rounded-full flex items-center justify-center mb-4 border border-slate-800/80">
                <FaSearch className="text-2xl text-slate-600" />
              </div>
              <p className="text-lg font-medium text-slate-400">No hackers found</p>
              <p className="text-sm mt-1">Be the first to dominate this category!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Leaderboard;