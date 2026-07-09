import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { 
  FaCloudUploadAlt, FaFilePdf, FaSpinner, FaCheckCircle, 
  FaExclamationTriangle, FaChartLine, FaTimes, FaMagic, FaBrain 
} from "react-icons/fa";

const ResumeAnalyser = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchExistingResume = async () => {
      try {
        const token = localStorage.getItem("token"); 
        
        const { data } = await axios.get("https://intervuex-paxn.onrender.com/api/resume", {
          headers: {
            Authorization: `Bearer ${token}` 
          },
          withCredentials: true 
        });
        
        if (data.success && data.resume.status === "parsed") {
          setResults(data.resume.parsedData);
        }
      } catch (err) {
      } finally{
        setLoading(false);
      }
    };
    fetchExistingResume();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
    }
  };


  const handleAnalyze = async () => {
    if (!file) return;
    
    setAnalyzing(true);
    setError("");
    
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const token = localStorage.getItem("token"); 
      
      const { data } = await axios.post("https://intervuex-paxn.onrender.com/api/resume/upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        },
        withCredentials: true 
      });

      if (data.success) {
        setResults(data.resume.parsedData);
      }
    } catch (err) {
      console.error(err);
      
      const errorMessage = err.response?.data?.message || err.message || "";

      if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("GoogleGenerative")) {
        setError(" AI Interviewer is experiencing high traffic. Please wait 30 seconds and try again!");
      } 
      else if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("exhausted")) {
        setError("Our daily AI limit is maxed out for today! Please check back tomorrow.");
      } 
      else {
        setError(err.response?.data?.message || "Failed to analyze resume. Please try again.");
      }
      
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalyzer = async () => {
    setFile(null);
    setResults(null);
    setError("");
  };


   if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] text-indigo-400 space-y-4">
        <FaSpinner className="animate-spin text-4xl" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Loading AI analysis......</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-0 sm:px-6 lg:px-8 text-slate-200">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 flex items-center justify-center gap-3">
          <FaMagic className="text-indigo-500" /> AI Resume Analyzer
        </h1>
        <p className="text-slate-400">
          Upload your resume to get an instant ATS score. AI will review your resume, calculate your ATS score, and generate mock interview questions customized to your background.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-center max-w-3xl mx-auto">
          {error}
        </div>
      )}

      {!results ? (
        <div className="max-w-3xl mx-auto">
          <div 
            className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 backdrop-blur-md cursor-pointer ${
              isDragging 
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" 
                : "border-slate-800/80 bg-[#0B0F19]/60 hover:border-indigo-500/50 hover:bg-[#0B0F19]/80"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !analyzing && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            
            {analyzing ? (
              <div className="flex flex-col items-center space-y-4 py-8">
                <FaSpinner className="animate-spin text-5xl text-indigo-500" />
                <h3 className="text-xl font-semibold text-white">AI is reading your resume...</h3>
                <p className="text-slate-400">This usually takes about 10-15 seconds. Hold tight!</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center space-y-4 py-8 w-full">
                <FaFilePdf className="text-6xl text-red-500" />
                <h3 className="text-xl font-semibold text-white">{file.name}</h3>
                <p className="text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex gap-4 mt-6" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); resetAnalyzer(); }} className="px-6 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    Remove
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2">
                    <FaBrain /> Analyze Resume
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="w-20 h-20 bg-[#050812] border border-slate-800/80 rounded-full flex items-center justify-center mb-2 shadow-inner transition-colors group-hover:border-indigo-500/50">
                  <FaCloudUploadAlt className="text-4xl text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Click or drag your resume here</h3>
                <p className="text-slate-400">PDF formats only, up to 5MB.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Results Dashboard */
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
            <button onClick={resetAnalyzer} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-[#0B0F19]/80 border border-slate-800/80 backdrop-blur-md px-4 py-2 rounded-lg hover:bg-slate-800">
              <FaTimes /> Upload New
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${results.atsScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-indigo-500' : 'bg-gradient-to-r from-amber-500 to-red-500'}`}></div>
              <h3 className="text-slate-400 text-sm font-medium mb-4">ATS Compatibility Score</h3>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#050812" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke={results.atsScore >= 75 ? "#10b981" : "#f59e0b"} 
                    strokeWidth="8" 
                    strokeDasharray={`${(results.atsScore / 100) * 283} 283`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-3xl font-bold text-white">{results.atsScore}%</span>
              </div>
              <p className={`font-medium mt-4 flex items-center gap-2 ${results.atsScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                <FaChartLine /> {results.atsScore >= 75 ? "Looking Good!" : "Needs Improvement"}
              </p>
            </div>

            <div className="md:col-span-2 bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
               <h3 className="text-lg font-semibold text-white mb-2">AI Summary</h3>
               <p className="text-indigo-400 font-medium mb-4">Detected Role: {results.roleMatch}</p>
               <p className="text-slate-300 leading-relaxed mb-6">
                 {results.feedback}
               </p>
               <div className="bg-[#050812] border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
                 <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                 <p className="text-sm text-slate-400">
                    Upload the same resume to your profile to unlock personalized resume-based interview questions tailored to your experience and skills.
                 </p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" /> Detected Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.strengths?.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-amber-500" /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.weaknesses?.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F19]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden mt-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500"></div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaBrain className="text-fuchsia-400" /> Predicted AI Interview Questions
            </h3>
            <p className="text-slate-400 mb-4 text-sm">Based on your experience and missing gaps, expect the AI Interviewer to ask you these questions during your next session:</p>
            <ul className="space-y-3">
              {results.predictedQuestions?.map((q, i) => (
                <li key={i} className="flex gap-3 text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-fuchsia-500 font-bold">Q{i+1}:</span> {q}
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
};

export default ResumeAnalyser;