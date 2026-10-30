import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { 
  Mic, Send, SquareSquare, Play, TerminalSquare, 
  Bot, Loader2, StopCircle, Clock, Code2, MessageSquare, Video
} from "lucide-react";
import { toast } from "react-hot-toast";

const AIInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State Management 
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [code, setCode] = useState("// Write your solution here...\n");
  const [language, setLanguage] = useState("javascript");
  
  // UI & Layout States
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("Waiting for execution...");
  const [mobileTab, setMobileTab] = useState("chat"); 
  
  // Strict Countdown Timer State
  const [timeLeft, setTimeLeft] = useState(null); 
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // Voice & Audio States 
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Store the raw hardware stream so React doesn't lose it on loading screen
  const streamRef = useRef(null); 

  // ULTIMATE HARDWARE KILL SWITCH
  const stopHardware = () => {
    // 1. Kill Webcam and Audio using the raw stream ref
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    //Kill Speech Recognition (Mic)
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    // Kill AI Voice
    window.speechSynthesis.cancel();
  };

  // Fetch Interview Data & Start Webcam
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/interview/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.interview.status === "completed") {
          alert("This interview is already completed!");
          return navigate(`/report/${id}`, { replace: true });
        }

        setInterview(res.data.interview);
        setMessages(res.data.interview.messages);
        
        // Persistent Timer against Page Refreshes
        const durationInMinutes = res.data.interview.duration || 30;
        const startedAt = new Date(res.data.interview.startedAt).getTime();
        const endTime = startedAt + (durationInMinutes * 60 * 1000); // Target end time in ms
        const now = new Date().getTime();
        
        const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
        
        if (remainingSeconds === 0 && res.data.interview.status !== "completed") {
          setIsTimeUp(true);
          autoSubmitInterview(); 
        } else {
          setTimeLeft(remainingSeconds);
        }

        setIsLoading(false);

        const lastMsg = res.data.interview.messages[res.data.interview.messages.length - 1];
        if (lastMsg && lastMsg.role === "ai") speakText(lastMsg.content);

      } catch (error) {
        console.error("Failed to load interview", error);
        alert("Interview not found or unauthorized");
        navigate("/dashboard/home");
      }
    };

    fetchInterview();

    // Start Webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream; // Save pure stream to memory
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Webcam error:", err));

    return () => {
      // Trigger the kill switch if the user hits back or closes tab
      stopHardware();
    };
  }, [id, navigate]);

  // STRICT COUNTDOWN TIMER LOGIC
  useEffect(() => {
    if (isLoading || timeLeft === null || isTimeUp) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          autoSubmitInterview(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, timeLeft, isTimeUp]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Auto-scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Web Speech API
  function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/```[\s\S]*?```/g, 'Code block submitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Your browser does not support Voice Recognition. Please use Chrome.");
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true; 
    recognition.interimResults = true; 

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      setUserInput(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!userInput.trim() && !code.trim()) return;

    if (isRecording) toggleRecording();
    window.speechSynthesis.cancel(); 

    const userMsgObj = { role: "user", content: userInput || "Submitted code." };
    setMessages((prev) => [...prev, userMsgObj]);
    
    const payload = {
      userMessage: userInput,
      codeSubmitted: language !== "text" ? code : "",
      languageUsed: language
    };
    
    setUserInput("");
    setIsSending(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/interview/${id}/message`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const aiMsgObj = { role: "ai", content: res.data.aiMessage };
      setMessages((prev) => [...prev, aiMsgObj]);
      speakText(res.data.aiMessage);
    } catch (error) {
      console.error("Message Error:", error);
      
      const errorMessage = error.response?.data?.message || error.message || "";
      if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("GoogleGenerative")) {
        toast.error("AI is thinking too hard! High traffic, please click send again in 10 seconds.", { duration: 5000 });
      } else if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("exhausted")) {
        toast.error("AI limit maxed out for today! We are experiencing viral traffic.");
      } else {
        toast.error("Failed to send message. Please check your connection.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setTerminalOutput("Compiling...");
    try {
      const token = localStorage.getItem("token");
      const languageId = language === "javascript" ? 63 : language === "python" ? 71 : language === "java" ? 62 : language === "cpp" ? 54 : 63;
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/interview/compile`, 
        { sourceCode: code, languageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTerminalOutput(res.data.output || "Execution completed with no output.");
    } catch (error) {
      setTerminalOutput("Error compiling code. Server returned an error.");
    } finally {
      setIsCompiling(false);
    }
  };

  async function autoSubmitInterview()  {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      stopHardware(); 

      await axios.put(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/interview/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` }});
      await axios.post(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/report/generate/${id}`, {}, { headers: { Authorization: `Bearer ${token}` }});
      
      navigate(`/report/${id}`, { replace: true });
    } catch (error) {
      toast.error("Failed to auto-submit interview.");
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    if(!window.confirm("Are you sure you want to end the interview early?")) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      stopHardware(); 

      await axios.put(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/interview/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` }});
      await axios.post(`${import.meta.env.VITE_API_URL || 'https://intervuex-paxn.onrender.com'}/api/report/generate/${id}`, {}, { headers: { Authorization: `Bearer ${token}` }});
      
      navigate(`/report/${id}`, { replace: true });
    } catch (error) {

      const errorMessage = error.response?.data?.message || error.message || "";
      
      if (errorMessage.includes("503") || errorMessage.includes("high demand")) {
         toast.error(" AI Server is currently busy! Keep trying to end the session in a few seconds.", { duration: 6000 });
      } else if (errorMessage.includes("429") || errorMessage.includes("quota")) {
         toast.error(" Limit reached! Cannot generate report right now.", { duration: 6000 });
      } else {
         toast.error("Failed to end interview and generate report.");
      }
      setIsLoading(false);
    }
  };

  if (isLoading || isTimeUp) {
    return (
      <div className="h-screen bg-[#060810] flex flex-col items-center justify-center text-indigo-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-mono text-sm tracking-widest uppercase">
          {isTimeUp ? "Time's up! Generating your Report Card..." : "Connecting to AI Server..."}
        </p>
      </div>
    );
  }

  const isTimeCritical = timeLeft <= 120;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="h-screen bg-[#060810] text-white flex flex-col overflow-hidden">
      
      <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 bg-[#0B0F19]/80 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          <h1 className="font-bold text-sm sm:text-base hidden sm:block truncate max-w-[200px] lg:max-w-md">
            {interview?.topic.toUpperCase()}
          </h1>
          <span className="px-2.5 py-1 bg-white/5 rounded-md text-[10px] sm:text-xs font-bold text-slate-400 border border-white/10 uppercase tracking-widest hidden sm:block">
            {interview?.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
            isTimeCritical 
              ? "text-red-400 bg-red-500/10 border-red-500/30 animate-pulse" 
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}>
            <Clock size={16} />
            <span className="font-mono font-bold text-sm">
              {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
            </span>
          </div>
          
          <button onClick={handleEndInterview} className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
            <SquareSquare size={14} /> <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </header>

      <div className="flex md:hidden bg-[#0B0F19] border-b border-slate-800 shrink-0">
        <button onClick={() => setMobileTab("chat")} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500'}`}>
          <MessageSquare size={16}/> Interview Chat
        </button>
        <button onClick={() => setMobileTab("code")} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === 'code' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500'}`}>
          <Code2 size={16}/> Code Editor
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ── LEFT PANEL: CODE EDITOR ── */}
        <div className={`w-full md:w-1/2 flex-col border-r border-slate-800/80 bg-[#050812] ${mobileTab === 'code' ? 'flex' : 'hidden md:flex'}`}>
          <div className="h-12 border-b border-slate-800/80 bg-[#0B0F19] flex items-center justify-between px-4 shrink-0">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-black/50 border border-slate-700 text-xs sm:text-sm text-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="javascript">JavaScript (Node)</option>
              <option value="python">Python 3</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            
            <button 
              onClick={handleCompile} 
              disabled={isCompiling}
              className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 font-bold shadow-sm"
            >
              {isCompiling ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Run Code
            </button>
          </div>
          
          <div className="flex-1 relative w-full">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{ 
                minimap: { enabled: false }, 
                fontSize: 14, 
                padding: { top: 16 },
                wordWrap: "on",
                scrollBeyondLastLine: false
              }}
            />
          </div>

          <div className="h-40 sm:h-48 border-t border-slate-800/80 bg-[#0B0F19] flex flex-col shrink-0">
            <div className="h-8 border-b border-slate-800/80 flex items-center px-4 gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-black/20">
              <TerminalSquare size={14} /> Output Console
            </div>
            <div className="flex-1 p-4 font-mono text-xs sm:text-sm overflow-y-auto whitespace-pre-wrap text-emerald-400 bg-[#050812]">
              {terminalOutput}
            </div>
          </div>
        </div>

        <div className={`w-full md:w-1/2 flex-col bg-[#0B0F19]/40 relative ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* USER WEBCAM */}
          <div className="absolute top-4 right-4 w-24 h-32 sm:w-32 sm:h-40 bg-[#050812] rounded-xl border border-slate-700 shadow-2xl z-30 overflow-hidden flex items-center justify-center group">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
            <div className="absolute bottom-2 right-2 bg-black/50 p-1 rounded backdrop-blur-sm">
              <Video size={12} className="text-white/70" />
            </div>
          </div>

          <div className="h-20 sm:h-24 border-b border-slate-800/80 flex items-center px-6 bg-[#050812] shadow-sm z-10 shrink-0">
            <div className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all duration-300 bg-[#0B0F19] ${isSpeaking ? 'border-indigo-500 shadow-[0_0_20px_-2px_rgba(79,70,229,0.8)] scale-105' : 'border-slate-700'}`}>
              {isSpeaking && <div className="absolute inset-0 rounded-full border border-indigo-500 animate-ping opacity-50" />}
              <Bot size={24} className={isSpeaking ? "text-indigo-400" : "text-slate-400"} />
            </div>
            <div className="ml-4 flex flex-col">
              <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">IntervueX Engine</span>
              <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5 font-medium mt-0.5">
                {isSpeaking ? (
                   <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"/> Speaking...</>
                ) : (
                   <><span className="w-2 h-2 rounded-full bg-indigo-500/50"/> Listening...</>
                )}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white rounded-br-sm" 
                    : "bg-[#050812] text-slate-300 rounded-bl-sm border border-slate-800/80"
                }`}>
                  {msg.role === "ai" 
                    ? msg.content.replace(/\[SCORE\]:.*?(\n|$)/g, '').replace(/\[TIME\]:.*?(\n|$)/g, '').replace(/\[SPACE\]:.*?(\n|$)/g, '') 
                    : msg.content
                  }
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-[#050812] border border-slate-800/80 rounded-2xl rounded-bl-sm p-4 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>

          <div className="p-4 bg-[#050812] border-t border-slate-800/80 shrink-0">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 sm:gap-3">
              <button 
                type="button"
                onClick={toggleRecording}
                className={`p-3 sm:p-3.5 rounded-xl transition-all shadow-sm ${isRecording ? 'bg-red-500/10 text-red-400 animate-pulse border border-red-500/30' : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600'}`}
              >
                {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
              </button>
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isRecording ? "Listening... speak now" : "Type your logic or click run to submit code..."}
                className="flex-1 bg-[#0B0F19] border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                disabled={isSending}
              />
              <button 
                type="submit"
                disabled={isSending || (!userInput.trim() && !code.trim())}
                className="p-3 sm:p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] flex items-center justify-center"
              >
                {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInterview;