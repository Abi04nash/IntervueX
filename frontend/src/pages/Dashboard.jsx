import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  TrendingUp, 
  Clock, 
  Award, 
  FileText, 
  Play, 
  Code, 
  Brain,
  ChevronRight,
  Activity,
  Target,
  Star,
} from "lucide-react";

import { FaSpinner } from "react-icons/fa";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [userStats, setUserStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    resumeStrength: 0, 
    globalRank: 0,    
    highestScore: 0,  
    targetRole: "",   
  });
  
  const [recentInterviews, setRecentInterviews] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com';
        
        // Fetch User Data
        const userRes = await axios.get(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = userRes.data.user;

        // Fetch Resume Data (For ATS Score)
        let fetchedAtsScore = 0;
        try {
          const resumeRes = await axios.get(`${API_URL}/api/resume`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resumeRes.data?.resume?.parsedData) {
            fetchedAtsScore = resumeRes.data.resume.parsedData.atsScore || 0;
          }
        } catch (resumeErr) {
        }

        // Fetch REAL Report History
        let reports = [];
        try {
          const reportRes = await axios.get(`${API_URL}/api/report/all`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          reports = reportRes.data.reports || [];
        } catch (reportErr) {
          console.error("No reports found or error fetching reports.");
        }

        // Process Reports for UI
        let highest = 0;
        const formattedRecent = reports.slice(0, 4).map((r) => {
          if (r.overallScore > highest) highest = r.overallScore;
          
          return {
            _id: r.interviewId?._id || r.interviewId, // The ID to navigate to the report
            role: r.interviewId?.topic || "Technical Interview",
            date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: r.isPassed ? "Passed" : "Review",
            score: r.overallScore
          };
        });

        // Set Dynamic States
        setUserName(user?.name?.split(" ")[0] || "Hacker"); 
        setRecentInterviews(formattedRecent);
        
        // Grab the AI Summary from the most recent report
        if (reports.length > 0 && reports[0].performanceSummary) {
          setAiInsight(reports[0].performanceSummary);
        }

        const calculatedAvg = user.totalInterviews > 0 
          ? Math.round(user.totalScore / user.totalInterviews) 
          : 0;

        setUserStats({
          totalInterviews: user.totalInterviews || 0,
          avgScore: user.averageScore || calculatedAvg, 
          resumeStrength: fetchedAtsScore, 
          globalRank: userRes.data.globalRank || 0,    
          highestScore: highest, // Pulled directly from real reports!
          targetRole: user.targetRole || "Fullstack",
        });

      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] text-indigo-400 space-y-4">
        <FaSpinner className="animate-spin text-4xl" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Loading DashBoard...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back, {userName}</h1>
          <p className="text-sm text-slate-400 mt-1">Here is your interview readiness overview.</p>
        </div>
        <Link 
          to="/dashboard/interview" 
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5"
        >
          <Play size={16} className="fill-white" /> New Mock Interview
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-6">
        
        <div className="bg-[#0B0F19]/80 border border-slate-800/80 p-5 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Code size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{userStats.totalInterviews}</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Interviews Taken</p>
          </div>
        </div>

        <div className="bg-[#0B0F19]/80 border border-slate-800/80 p-5 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Activity size={18} /></div>
            {userStats.avgScore > 0 && <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">+<TrendingUp size={12}/></span>}
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{userStats.avgScore}<span className="text-lg text-slate-500 font-normal">/100</span></h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Average Score</p>
          </div>
        </div>

        <div className="bg-[#0B0F19]/80 border border-slate-800/80 p-5 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg"><Star size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{userStats.highestScore} <span className="text-lg text-slate-500 font-normal">/100</span></h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Personal Best</p>
          </div>
        </div>

        <div className="bg-[#0B0F19]/80 border border-slate-800/80 p-5 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg"><Target size={18} /></div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white capitalize truncate">{userStats.targetRole}</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">AI Target Role</p>
          </div>
        </div>

        <div className="bg-[#0B0F19]/80 border border-slate-800/80 p-5 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-fuchsia-500/10 rounded-full blur-xl group-hover:bg-fuchsia-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg"><FileText size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{userStats.resumeStrength}<span className="text-lg text-slate-500 font-normal">%</span></h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Resume ATS Match</p>
          </div>
        </div>

        <div className="bg-[#0B0F19]/80 border border-slate-800/80 p-5 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Award size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{userStats.globalRank > 0 ? (
                <><span className="text-xl text-slate-500 font-normal">#</span>{userStats.globalRank}</>
              ) : (
                <span className="text-xl">Unranked 🏳️</span>
              )}</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Global Leaderboard</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-[#0B0F19]/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Clock size={18} className="text-indigo-400"/> Recent Sessions</h2>
            <Link to="/dashboard/history" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">View All <ChevronRight size={14}/></Link>
          </div>
          
          <div className="space-y-3">
            {recentInterviews.length > 0 ? (
              recentInterviews.map((interview) => (
                <Link 
                  to={`/report/${interview._id}`} 
                  key={interview._id} 
                  className="flex items-center justify-between p-4 bg-[#050812] border border-slate-800/50 rounded-xl hover:border-indigo-500/50 hover:bg-[#0B0F19] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                      <Brain size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 capitalize">{interview.role}</h4>
                      <p className="text-xs text-slate-500">{interview.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className={`text-xs font-bold uppercase tracking-wider ${interview.status === "Passed" ? "text-emerald-400" : "text-amber-400"}`}>
                        {interview.status}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-black text-white group-hover:border-indigo-500 transition-colors">
                      {interview.score}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl">
                <p className="text-slate-400 mb-2">No interviews taken yet.</p>
                <Link to="/dashboard/interview" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                  Start your first mock interview →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-b from-indigo-900/20 to-[#0B0F19]/60 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4">IntervueX AI Insight</h2>
            {aiInsight ? (
              <p className="text-sm text-slate-300 leading-relaxed">
                {aiInsight}
              </p>
            ) : (
               <p className="text-sm text-slate-300 leading-relaxed">
                 Welcome to IntervueX! Complete your first mock interview to unlock personalized AI feedback and analytics on your performance.
               </p>
            )}
          </div>

          <div className="bg-[#0B0F19]/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Next Steps</h2>
             <div className="space-y-3">
               <Link to="/dashboard/resume" className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors group">
                 <div className="flex items-center gap-3">
                   <FileText size={16} className="text-fuchsia-400 group-hover:scale-110 transition-transform"/>
                   <span className="text-sm font-semibold text-slate-200">Update Resume PDF</span>
                 </div>
                 <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors"/>
               </Link>
               <Link to="/dashboard/leaderboard" className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors group">
                 <div className="flex items-center gap-3">
                   <Award size={16} className="text-amber-400 group-hover:scale-110 transition-transform"/>
                   <span className="text-sm font-semibold text-slate-200">Check Global Rank</span>
                 </div>
                 <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors"/>
               </Link>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;