import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FaUser, FaBriefcase, FaGraduationCap, FaBuilding, FaSave, 
  FaSpinner, FaExclamationCircle, FaCheckCircle, FaCog, 
  FaTimes, FaBullseye, FaTrophy, FaLink, 
  FaMapMarkerAlt, FaEnvelope, FaGlobe, FaGithub, FaLinkedin, FaTwitter,
  FaCode, FaClock, FaIndustry, FaFilePdf, FaCalendarAlt,
  FaAward, FaCamera, FaUpload //
} from "react-icons/fa";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  
  // 🔥 New Upload States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // References for hidden file inputs
  const avatarInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    avatar: "",
    location: "",
    college: "",
    graduationYear: "",
    targetRole: "fullstack",
    targetCompanies: "", 
    github: "",
    linkedin: "",
    twitter: "",
    portfolio: "",
    experience: "",
    industry: "",
    techStack: "",
    resumeFile: ""
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://intervuex-paxn.onrender.com/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const user = res.data.user;

      let finalAvgScore = user.averageScore || 0;
      if (!finalAvgScore && user.totalScore && user.totalInterviews > 0) {
        finalAvgScore = Math.round(user.totalScore / user.totalInterviews);
      }

      setUserData({ 
        ...user, 
        averageScore: finalAvgScore,
        globalRank: res.data.globalRank || 0 
      });
      
      setFormData({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        location: user.location || "",
        college: user.college || "",
        graduationYear: user.graduationYear || "",
        targetRole: user.targetRole || "fullstack",
        targetCompanies: user.targetCompanies ? user.targetCompanies.join(", ") : "",
        github: user.github || "",
        linkedin: user.linkedin || "",
        twitter: user.twitter || "",
        portfolio: user.portfolio || "",
        experience: user.experience || "",
        industry: user.industry || "",
        techStack: user.techStack ? user.techStack.join(", ") : "",
        resumeFile: user.resumeFile || ""
      });
    } catch (error) {
      setStatus({ type: "error", message: "Failed to load profile data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cloudinary Upload Logic
 // REAL API CALL TO BACKEND (Just like ResumeAnalyser)
 
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'avatar') setUploadingAvatar(true);
    if (type === 'resume') setUploadingResume(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("file", file); 

    try {
      const token = localStorage.getItem("token");
      
      const { data } = await axios.post("https://intervuex-paxn.onrender.com/api/user/upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        },
      });

      if (data.success) {
        if (type === 'avatar') {
          setFormData(prev => ({ ...prev, avatar: data.url }));
          setStatus({ type: "success", message: "Avatar uploaded! Click Save Changes to keep it." });
        }
        if (type === 'resume') {
          setFormData(prev => ({ ...prev, resumeFile: data.url }));
          setStatus({ type: "success", message: "Resume uploaded! Click Save Changes to keep it." });
        }
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Failed to upload file to backend." });
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      if (type === 'resume') setUploadingResume(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        ...formData,
        targetCompanies: formData.targetCompanies.split(",").map(c => c.trim()).filter(c => c !== ""),
        techStack: formData.techStack.split(",").map(t => t.trim()).filter(t => t !== "")
      };

      await axios.put("https://intervuex-paxn.onrender.com/api/user/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatus({ type: "success", message: "Profile updated successfully!" });
      setIsEditing(false); 
      fetchProfile(); 
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] text-indigo-400 space-y-4">
        <FaSpinner className="animate-spin text-4xl" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Loading Profile...</p>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-0 sm:px-6 lg:px-8 text-slate-200">
        
        {/* Banner & Avatar Section */}
        <div className="bg-[#0B0F19]/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden mb-8 relative">
          <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600"></div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-white/10"
          >
            <FaCog size={16} />
            Edit Profile
          </button>

          <div className="px-6 sm:px-10 pb-8">
            <div className="relative flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-[#050810] bg-[#0B0F19] overflow-hidden shadow-2xl flex items-center justify-center">
                {userData?.avatar ? (
                  <img src={userData.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <FaUser size={64} className="text-slate-500" />
                )}
              </div>
              
              <div className="flex gap-3 mb-2">
                {userData?.github && (
                  <a href={userData.github} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[#050812] hover:bg-slate-800 hover:text-white text-slate-400 rounded-full transition-all border border-slate-800/80 flex items-center justify-center w-10 h-10">
                    <FaGithub size={20} />
                  </a>
                )}
                {userData?.linkedin && (
                  <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[#050812] hover:bg-blue-500/20 hover:text-blue-400 text-slate-400 rounded-full transition-all border border-slate-800/80 flex items-center justify-center w-10 h-10">
                    <FaLinkedin size={20} />
                  </a>
                )}
                {userData?.twitter && (
                  <a href={userData.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[#050812] hover:bg-sky-500/20 hover:text-sky-400 text-slate-400 rounded-full transition-all border border-slate-800/80 flex items-center justify-center w-10 h-10">
                    <FaTwitter size={20} />
                  </a>
                )}
                {userData?.portfolio && (
                  <a href={userData.portfolio} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[#050812] hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 rounded-full transition-all border border-slate-800/80 flex items-center justify-center w-10 h-10">
                    <FaGlobe size={20} />
                  </a>
                )}
              </div>
            </div>
            
            <div className="mt-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">{userData?.name}</h1>
              <div className="flex flex-wrap flex-col items-left gap-4 mt-2 text-sm font-medium">
                <span className="text-indigo-400">@{userData?.username || "user"}</span>
                {userData?.email && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <FaEnvelope size={14}/> {userData.email}
                  </span>
                )}
                {userData?.location && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <FaMapMarkerAlt size={14}/> {userData.location}
                  </span>
                )}
              </div>
              <p className="text-slate-400 mt-4 max-w-2xl leading-relaxed">
                {userData?.bio || "No bio added yet. Click edit to complete your developer profile."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-4 bg-indigo-500/10 rounded-xl text-indigo-400"><FaBullseye size={28} /></div>
            <div>
              <p className="text-slate-400 text-sm">Total Interviews</p>
              <p className="text-2xl font-bold text-white">{userData?.totalInterviews || 0}</p>
            </div>
          </div>
          <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400"><FaTrophy size={28} /></div>
            <div>
              <p className="text-slate-400 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-white">{userData?.averageScore || 0}/100</p>
            </div>
          </div>
          <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 rounded-xl text-amber-400"><FaAward size={28} /></div>
            <div>
              <p className="text-slate-400 text-sm">Global Rank</p>
              <p className="text-2xl font-bold text-white">
                {userData?.globalRank > 0 ? `#${userData.globalRank}` : "Unranked"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0B0F19]/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500 opacity-50"></div>
          
          <div className="p-6 sm:px-8 sm:pt-8 sm:pb-6 border-b border-slate-800/80">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaBriefcase size={20} className="text-fuchsia-400" />
              AI Calibration Profile
            </h2>
            <p className="text-slate-400 text-sm mt-1">This data is actively used to customize your AI interview sessions.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-base border-collapse">
              <tbody className="divide-y divide-slate-800/80">
                
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-3 w-1/3 min-w-[160px]">
                    <FaUser className="text-indigo-400" /> Target Role
                  </td>
                  <td className="py-4 px-6 text-slate-200 capitalize font-medium">
                    {userData?.targetRole || "—"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-3 w-1/3 min-w-[160px]">
                    <FaClock className="text-orange-400" /> Experience
                  </td>
                  <td className="py-4 px-6 text-slate-200">
                    {userData?.experience || "—"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-3 w-1/3 min-w-[160px]">
                    <FaIndustry className="text-teal-400" /> Industry Focus
                  </td>
                  <td className="py-4 px-6 text-slate-200">
                    {userData?.industry || "—"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-3 w-1/3 min-w-[160px]">
                    <FaCode className="text-emerald-400" /> Tech Stack
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-2">
                      {userData?.techStack?.length > 0 ? (
                        userData.techStack.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-[#050812] border border-slate-800/80 rounded-lg text-sm text-emerald-300">
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Not specified</span>
                      )}
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-3 w-1/3 min-w-[160px]">
                    <FaBuilding className="text-blue-400" /> Target Companies
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-2">
                      {userData?.targetCompanies?.length > 0 ? (
                        userData.targetCompanies.map((company, i) => (
                          <span key={i} className="px-3 py-1 bg-[#050812] border border-slate-800/80 rounded-full text-sm text-blue-300">
                            {company}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Not specified</span>
                      )}
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-3 w-1/3 min-w-[160px]">
                    <FaGraduationCap className="text-fuchsia-400" /> Education
                  </td>
                  <td className="py-4 px-6 text-slate-200">
                    {userData?.college ? (
                      <div>
                        <span className="block">{userData.college}</span>
                        {userData?.graduationYear && (
                          <span className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <FaCalendarAlt size={12}/> Class of {userData.graduationYear}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Not specified</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-3 w-1/3 min-w-[160px]">
                    <FaFilePdf className="text-red-400" /> Source Resume
                  </td>
                  <td className="py-4 px-6">
                    {userData?.resumeFile ? (
                      <a href={userData.resumeFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-500/20">
                        <FaLink size={12}/> View Uploaded Resume
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">No resume uploaded</span>
                    )}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // EDIT SETTINGS MODE (WITH FILE UPLOADS)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Edit Profile</h1>
          <p className="text-slate-400 mt-2">Update your details to calibrate the AI interviewer.</p>
        </div>
        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <FaTimes size={24} />
        </button>
      </div>

      {status.message && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {status.type === 'success' ? <FaCheckCircle size={20} /> : <FaExclamationCircle size={20} />}
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Info & Avatar Upload */}
        <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-50"></div>
          
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FaUser size={24} className="text-indigo-400" />
            Public Identity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 flex items-center gap-6 mb-4">
              <div className="h-24 w-24 rounded-full border-2 border-indigo-500/50 bg-[#050812] overflow-hidden flex items-center justify-center relative group">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <FaUser size={32} className="text-slate-600" />
                )}
                
                <div 
                  onClick={() => avatarInputRef.current.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                >
                  {uploadingAvatar ? <FaSpinner className="animate-spin text-white" /> : <FaCamera className="text-white" />}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-white mb-1">Profile Picture</p>
                <p className="text-xs text-slate-400 mb-3">JPG, GIF or PNG. 1MB max.</p>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={avatarInputRef}
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                />
                
                <button 
                  type="button"
                  onClick={() => avatarInputRef.current.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {uploadingAvatar ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  {uploadingAvatar ? "Uploading..." : "Upload New Picture"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaMapMarkerAlt size={14} /> Location
              </label>
              <input type="text" name="location" placeholder="e.g. Bangalore, India" value={formData.location} onChange={handleChange} className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Bio</label>
              <textarea name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder="I'm a fullstack developer looking for roles in..." className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"></textarea>
            </div>
          </div>
        </div>

        <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50"></div>
          
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FaGlobe size={24} className="text-emerald-400" />
            Social Links
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaGithub size={14} /> GitHub URL
              </label>
              <input type="url" name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/yourusername" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaLinkedin size={14} /> LinkedIn URL
              </label>
              <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/yourusername" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaTwitter size={14} /> Twitter/X URL
              </label>
              <input type="url" name="twitter" value={formData.twitter} onChange={handleChange} placeholder="https://twitter.com/yourusername" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaGlobe size={14} /> Personal Portfolio
              </label>
              <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://yourportfolio.com" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>
        </div>

        <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500 opacity-50"></div>
          
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FaBriefcase size={24} className="text-fuchsia-400" />
            AI Calibration Profile
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Target Role</label>
              <select name="targetRole" value={formData.targetRole} onChange={handleChange} className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors">
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="fullstack">Fullstack</option>
                <option value="devops">DevOps / Cloud</option>
                <option value="data">Data Engineer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaBuilding size={16} /> Target Companies
              </label>
              <input type="text" name="targetCompanies" value={formData.targetCompanies} onChange={handleChange} placeholder="Google, Amazon, Netflix" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">College / University</label>
              <input type="text" name="college" value={formData.college} onChange={handleChange} className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Graduation Year</label>
              <input type="number" name="graduationYear" value={formData.graduationYear} onChange={handleChange} placeholder="e.g., 2026" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaClock size={14}/> Experience
              </label>
              <input type="text" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. Fresher, 2+ Years" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaIndustry size={14}/> Industry
              </label>
              <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. FAANG, SaaS, Fintech" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <FaCode size={14}/> Tech Stack
              </label>
              <input type="text" name="techStack" value={formData.techStack} onChange={handleChange} placeholder="React, Node.js, Python, AWS" className="w-full bg-[#050812] border border-slate-800/80 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
            </div>
            
            {/* RESUME UPLOAD UI */}
            <div className="md:col-span-2 mt-4 pt-6 border-t border-white/5">
              <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                <FaFilePdf size={16} className="text-red-400" /> Source Resume Document
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  className="hidden" 
                  ref={resumeInputRef}
                  onChange={(e) => handleFileUpload(e, 'resume')}
                />
                
                <button 
                  type="button"
                  onClick={() => resumeInputRef.current.click()}
                  disabled={uploadingResume}
                  className="w-full sm:w-auto px-6 py-3 bg-[#050812] hover:bg-slate-800 border border-slate-800/80 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {uploadingResume ? <FaSpinner className="animate-spin text-red-400" /> : <FaUpload className="text-red-400" />}
                  {uploadingResume ? "Uploading PDF..." : "Upload Resume (PDF/DOC)"}
                </button>
                
                {formData.resumeFile && (
                  <a href={formData.resumeFile} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 flex items-center gap-1 hover:underline">
                    <FaCheckCircle /> Resume successfully attached
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">This file will be used to calibrate your AI Interview questions.</p>
            </div>
            
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploadingAvatar || uploadingResume} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50">
            {saving ? <FaSpinner size={20} className="animate-spin" /> : <FaSave size={20} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;