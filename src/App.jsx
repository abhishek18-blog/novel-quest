import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BookOpen,
  MessageSquare,
  Languages,
  FileUp,
  Link as LinkIcon,
  Trash2,
  Send,
  Loader2,
  User,
  Clock,
  Cloud,
  CloudOff,
  Check,
  LogOut,
  LogIn,
  Info,
  X,
  Layers,
  AlertCircle,
  Sun,
  Moon,
  Library,
  RefreshCw,
  Sparkles,
  BrainCircuit,
  Quote,
  Wand2,
} from "lucide-react";

import {
  signInAnonymously,
  signInWithCustomToken,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

import { auth, db, appId } from "./lib/firebase";
import LandingPage from "./components/LandingPage";
import MobileHeader from "./components/MobileHeader";
import Notification from "./components/Notification";
import NavItem from "./components/NavItem";
import ReactMarkdown from "react-markdown";

const WORDS_PER_PAGE = 275;

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "mr", name: "Marathi" },
  { code: "es", name: "Spanish" },
  { code: "ja", name: "Japanese" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // --- PERSISTENT STATES ---
  const [text, setText] = useState(() => localStorage.getItem("nq_text") || "");
  const [currentDocId, setCurrentDocId] = useState(
    () => localStorage.getItem("nq_doc_id") || null,
  );
  const [currentDocName, setCurrentDocName] = useState(
    () => localStorage.getItem("nq_doc_name") || "Untitled Manuscript",
  );
  const [currentPage, setCurrentPage] = useState(
    () => Number(localStorage.getItem("nq_page")) || 0,
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nq_theme") || "light",
  );
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("nq_chat");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI States
  const [hasStarted, setHasStarted] = useState(() => localStorage.getItem("nq_started") === "true");
  const [activeTab, setActiveTab] = useState("library");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [notification, setNotification] = useState(null);
  const [insightResult, setInsightResult] = useState("");
  const [insightType, setInsightType] = useState(null);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [selectedLang, setSelectedLang] = useState("hi");
  const [chatMode, setChatMode] = useState("strict");

  const isInitialLoad = useRef(true);

  // --- THEME ENGINE ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.backgroundColor = "#09090b";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#fafafa";
    }
    localStorage.setItem("nq_theme", theme);
  }, [theme]);

  // --- PERSISTENCE SYNC ---
  useEffect(() => {
    localStorage.setItem("nq_text", text);
    localStorage.setItem("nq_doc_id", currentDocId || "");
    localStorage.setItem("nq_doc_name", currentDocName);
    localStorage.setItem("nq_chat", JSON.stringify(chatHistory));
    localStorage.setItem("nq_page", currentPage.toString());
  }, [text, currentDocId, currentDocName, chatHistory, currentPage]);

  // --- PDF ENGINE LOADER ---
  useEffect(() => {
    if (window.pdfjsLib) {
      setIsPdfReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      setIsPdfReady(true);
    };
    document.head.appendChild(script);
  }, []);

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (err) {
        console.error("Authentication Error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FIRESTORE SYNC ---
  useEffect(() => {
    if (!user) return;
    const sourcesRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sources",
    );
    const unsubscribe = onSnapshot(
      sourcesRef,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSources(
          docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
        );
      },
      (error) => {
        console.error("Firestore sync error:", error);
      },
    );
    return () => unsubscribe();
  }, [user]);

  // --- READING ENGINE ---
  const pages = useMemo(() => {
    // Split by paragraphs instead of words to preserve markdown/formatting
    // A paragraph is generally split by \n
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    const res = [];
    let currentPage = [];
    let currentLength = 0;
    
    // Roughly 1500 characters per page to keep it readable and preserve structure
    const MAX_PAGE_CHARS = 1500;

    for (let p of paragraphs) {
      if (currentLength + p.length > MAX_PAGE_CHARS && currentPage.length > 0) {
        res.push(currentPage.join('\n\n'));
        currentPage = [p];
        currentLength = p.length;
      } else {
        currentPage.push(p);
        currentLength += p.length;
      }
    }
    if (currentPage.length > 0) {
      res.push(currentPage.join('\n\n'));
    }

    return res.length > 0
      ? res
      : [
          "No manuscript loaded. Use the Library to upload a PDF or start writing.",
        ];
  }, [text]);

  const readProgress = useMemo(() => {
    if (pages.length <= 1 || !text) return 0;
    return Math.round(((currentPage + 1) / pages.length) * 100);
  }, [currentPage, pages.length, text]);

  // Progress Tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isInitialLoad.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              entry.target.getAttribute("data-page-index") || "0",
            );
            if (!isNaN(idx)) setCurrentPage(idx);
          }
        });
      },
      { threshold: 0.5 },
    );

    document
      .querySelectorAll("[data-page-index]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages]);

  // Restore Last Visited Page
  useEffect(() => {
    if (pages.length > 0 && isInitialLoad.current) {
      const savedPage = Number(localStorage.getItem("nq_page")) || 0;
      const safePage = Math.min(savedPage, pages.length - 1);
      setTimeout(() => {
        scrollToPage(safePage);
        isInitialLoad.current = false;
      }, 800);
    }
  }, [pages]);

  // --- INTEGRATED: FIXED STREAMING AI ENGINE ---
  const callAi = async (
    prompt,
    systemPrompt = "You are a helpful novel reading assistant.",
  ) => {
    setIsAiLoading(true);
    const botMsgId = Date.now();

    // Add streaming placeholder
    setChatHistory((prev) => [
      ...prev,
      {
        id: botMsgId,
        role: "bot",
        content: "",
        thought: "",
        isStreaming: true,
      },
    ]);

    let finalAnswer = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          context: pages[currentPage] || "",
          mode: chatMode,
        }),
      });

      // Handle 404 or 504 errors before parsing JSON
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Server connection failed. ${errText.substring(0, 30)}...`,
        );
      }

      // Simple JSON response (non-streaming for Vercel compatibility)
      const resData = await response.json();
      if (resData.error) throw new Error(resData.error);

      const answer = resData.answer || "";
      const thought = resData.thought || "";
      finalAnswer = answer;

      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, content: answer, thought: thought }
            : msg,
        ),
      );
      return finalAnswer;
    } catch (err) {
      console.error("AI Proxy Error:", err);
      notify("AI connection timed out.", "error");
      setChatHistory((prev) => prev.filter((m) => m.id !== botMsgId));
      return "";
    } finally {
      setIsAiLoading(false);
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId ? { ...msg, isStreaming: false } : msg,
        ),
      );
    }
  };

  // --- UI HANDLERS ---
  const scrollToPage = (index) => {
    const el = document.getElementById(`page-${index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return notify("No file selected", "error");
    setIsAiLoading(true);
    notify("Extracting document layout with AI...", "info");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse_pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const textErr = await response.text();
        throw new Error(`Parse failed: ${textErr}`);
      }

      const resData = await response.json();
      if (resData.error) throw new Error(resData.error);

      const fullText = resData.text;

      const docRef = await addDoc(
        collection(db, "artifacts", appId, "users", user.uid, "sources"),
        {
          name: file.name,
          content: fullText,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
        },
      );
      setText(fullText);
      setCurrentDocName(file.name);
      setCurrentDocId(docRef.id);
      setCurrentPage(0);
      notify("Import completed perfectly!", "success");
    } catch (err) {
      console.error("PDF upload error:", err);
      notify("PDF processing failed. Is the server running?", "error");
    } finally {
      setIsAiLoading(false);
      e.target.value = null; // reset input
    }
  };

  const handleInsight = async (type) => {
    if (!user) return notify("Sign in for insights", "error");
    setInsightResult("");
    setInsightType(type);
    let p = "";
    let s = "You are an expert novel analyst and storyteller.";
    if (type === "summary")
      p = "Summarize the key events on this page concisely.";
    if (type === "characters")
      p = "Identify characters on this page and their current motivations.";
    if (type === "weaver")
      p = "Suggest 3 creative plot directions based on the current scene.";

    const resultText = await callAi(p, s);
    setInsightResult(resultText);
  };

  const notify = (msg, type = "info") => {
    setNotification({ text: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- SMART CHAT HANDLER ---
  const handleChat = async () => {
    if (!userInput.trim() || isAiLoading || !user) return;
    if (chatMode === "strict" && !text.trim()) {
      notify("Please upload a PDF first to use Strict mode.", "info");
      return;
    }
    const q = userInput.trim();
    setUserInput("");
    setChatHistory((prev) => [...prev, { role: "user", content: q }]);

    const lowerQ = q.toLowerCase().replace(/\s/g, "");

    // Handle Greetings Locally
    const social = [
      "hi",
      "hello",
      "hey",
      "namaste",
      "thanks",
      "thankyou",
      "great",
      "awesome",
    ];
    if (social.some((s) => lowerQ.startsWith(s))) {
      const reply = lowerQ.includes("thank")
        ? "You're very welcome!"
        : "Hello! I'm ready. Ask me anything about the manuscript!";
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", content: reply, thought: "Handled locally." },
      ]);
      return;
    }

    await callAi(q);
  };

  const handleTranslate = async () => {
    const selection = window.getSelection().toString().trim();
    if (!selection) return notify("Select text to translate", "info");
    const targetLangName =
      LANGUAGES.find((l) => l.code === selectedLang)?.name || selectedLang;
    await callAi(
      `Translate this text to ${targetLangName}:\n\n${selection.substring(0, 500)}`,
      `You are a professional literary translator. Reply ONLY with the translation.`,
    );
    setActiveTab("chat");
    setIsSidebarOpen(true);
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      localStorage.setItem("nq_started", "true");
      setHasStarted(true);
      notify("Signed in with Google", "success");
    } catch (err) {
      notify("Authentication failed", "error");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInAnonymously(auth);
      localStorage.setItem("nq_started", "true");
      setHasStarted(true);
      notify("Continuing as Guest", "success");
    } catch(err) {
      notify("Guest Sign In Failed", "error");
    } finally {
      setIsSigningIn(false);
    }
  };

  const hardReset = () => {
    if (confirm("Factory reset app?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (isAuthLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-amber-500" size={32} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Syncing Novel Quest
          </span>
        </div>
      </div>
    );
  if (!user || (!hasStarted && user.isAnonymous)) {
    return (
      <LandingPage 
        handleGoogleSignIn={handleGoogleSignIn}
        handleGuestSignIn={handleGuestSignIn}
        isSigningIn={isSigningIn}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      <MobileHeader 
        currentDocName={currentDocName}
        readProgress={readProgress}
        theme={theme}
        setTheme={setTheme}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <nav className="hidden md:flex w-20 border-r border-zinc-200 dark:border-zinc-800 flex-col items-center py-8 gap-8 bg-white dark:bg-zinc-900 z-50">
          <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/20 transition-transform hover:scale-105">
            <BookOpen size={24} />
          </div>
          <NavItem id="library" icon={Library} label="Library" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
          <NavItem id="insights" icon={Sparkles} label="Magic" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
          <NavItem id="chat" icon={MessageSquare} label="Chat" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
          <NavItem id="navigator" icon={Layers} label="Pages" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
          <div className="mt-auto flex flex-col gap-4">
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="p-3 text-zinc-400 hover:text-amber-500 transition-colors"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={hardReset}
              className="p-3 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto px-4 md:px-20 py-8 scroll-smooth relative custom-scrollbar bg-zinc-50 dark:bg-zinc-950">
          <div className="max-w-3xl mx-auto">
            <div className="hidden md:flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-12">
              <div className="max-w-[70%]">
                <h1 className="text-3xl font-serif font-bold text-zinc-800 dark:text-zinc-100">
                  {currentDocName}
                </h1>
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mt-2">
                  Progress: Page {currentPage + 1} of {pages.length} (
                  {readProgress}%)
                </p>
              </div>
            </div>

            <div className="space-y-12 pb-32">
              {pages.map((p, i) => (
                <article
                  key={i}
                  id={`page-${i}`}
                  data-page-index={i}
                  className="bg-white dark:bg-zinc-900 p-8 md:p-16 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md relative group selection:bg-amber-100 dark:selection:bg-amber-900/50"
                >
                  <span className="absolute top-6 right-8 text-[10px] font-black text-zinc-200 dark:text-zinc-800 uppercase tracking-widest transition-colors group-hover:text-amber-500">
                    Page {i + 1}
                  </span>
                  <div className="font-serif text-lg md:text-xl leading-relaxed text-zinc-800 dark:text-zinc-300 select-text w-full">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-black mb-6 mt-1 text-zinc-900 dark:text-white" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-4 mt-8 text-zinc-900 dark:text-white" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-bold mb-3 mt-6 text-zinc-900 dark:text-white" {...props} />,
                        p: ({node, ...props}) => <p className="mb-6 whitespace-pre-wrap leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-amber-600 dark:text-amber-400" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-zinc-600 dark:text-zinc-400" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-amber-500/50 pl-4 italic text-zinc-600 dark:text-zinc-400 my-6" {...props} />,
                      }}
                    >
                      {p}
                    </ReactMarkdown>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>

        <aside
          className={`fixed inset-0 md:relative md:inset-auto z-[100] md:z-auto transition-all duration-300 overflow-hidden flex
          ${isSidebarOpen ? "w-full md:w-[420px]" : "w-0"}`}
        >
          <div className="flex-1 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl md:shadow-none h-full">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {activeTab}
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-28 md:pb-6 relative custom-scrollbar">
              {activeTab === "library" && (
                <div className="space-y-6">
                  {!user || user.isAnonymous ? (
                    <div className="space-y-4 py-8 text-center">
                      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-2">
                        <User size={32} />
                      </div>
                      <p className="text-sm text-zinc-500 px-4">
                        Sign in to sync manuscripts.
                      </p>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg transition-transform flex items-center justify-center gap-2"
                      >
                        {isSigningIn ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <LogIn size={16} />
                        )}
                        Continue with Google
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-amber-500 cursor-pointer transition-all group">
                        <FileUp
                          size={32}
                          className="text-zinc-300 group-hover:text-amber-500 mb-2 transition-colors"
                        />
                        <span className="text-[10px] font-black uppercase text-zinc-500">
                          Upload PDF
                        </span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf"
                        />
                      </label>
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                          Collections
                        </h3>
                        {sources.map((s) => (
                          <div
                            key={s.id}
                            className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${currentDocId === s.id ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10" : "border-zinc-100 dark:hover:bg-zinc-800"}`}
                          >
                            <button
                              onClick={() => {
                                setText(s.content);
                                setCurrentDocName(s.name);
                                setCurrentDocId(s.id);
                                setIsSidebarOpen(false);
                                isInitialLoad.current = true;
                              }}
                              className="flex-1 text-left min-w-0"
                            >
                              <p className="text-xs font-bold truncate">
                                {s.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-1">
                                {s.date}
                              </p>
                            </button>
                            <button
                              onClick={() =>
                                deleteDoc(
                                  doc(
                                    db,
                                    "artifacts",
                                    appId,
                                    "users",
                                    user.uid,
                                    "sources",
                                    s.id,
                                  ),
                                )
                              }
                              className="text-zinc-300 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => signOut(auth)}
                        className="w-full py-3 text-[10px] font-black uppercase text-zinc-400 border border-zinc-100 rounded-xl mt-8"
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              )}

              {activeTab === "insights" && (
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100">
                    <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">
                      Translate Selection
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-900 border rounded-xl px-3 py-2 text-xs"
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleTranslate}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase shadow-md"
                      >
                        Translate
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleInsight("summary")}
                      className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex flex-col items-center gap-2 border border-amber-100"
                    >
                      <BrainCircuit size={24} className="text-amber-500" />
                      <span className="text-[9px] font-black uppercase">
                        Summary
                      </span>
                    </button>
                    <button
                      onClick={() => handleInsight("characters")}
                      className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex flex-col items-center gap-2 border border-blue-100"
                    >
                      <User size={24} className="text-blue-500" />
                      <span className="text-[9px] font-black uppercase">
                        Characters
                      </span>
                    </button>
                    <button
                      onClick={() => handleInsight("weaver")}
                      className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl flex flex-col items-center gap-2 border border-purple-100 col-span-2"
                    >
                      <Wand2 size={24} className="text-purple-500" />
                      <span className="text-[9px] font-black uppercase">
                        Story Weaver
                      </span>
                    </button>
                  </div>
                  {insightResult && (
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 shadow-sm animate-in">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif text-zinc-800 dark:text-zinc-200">
                        {insightResult}
                      </div>
                      <button
                        onClick={() => {
                          setChatHistory((prev) => [
                            ...prev,
                            {
                              role: "bot",
                              content: `✨ Magic Insight (${insightType}):\n${insightResult}`,
                            },
                          ]);
                          setActiveTab("chat");
                        }}
                        className="mt-4 w-full py-2.5 text-[9px] font-black uppercase text-amber-600 border border-amber-200 rounded-xl"
                      >
                        Add to Chat
                      </button>
                    </div>
                  )}
                  {isAiLoading && (
                    <div className="py-20 text-center">
                      <Loader2 className="animate-spin text-amber-500 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-zinc-400 uppercase">
                        Consulting AI...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "chat" && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between p-2 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2 px-2">
                       <BrainCircuit
                        size={14}
                        className={
                          chatMode === "strict"
                            ? "text-amber-500"
                            : "text-zinc-400"
                        }
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Mode: {chatMode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button
                        onClick={() => {
                           if(confirm("Clear conversation?")) setChatHistory([]);
                        }}
                        className="text-[9px] text-zinc-500 hover:text-red-500 font-black uppercase p-1 rounded-lg transition-colors"
                        title="Clear Conversation"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setChatMode((m) =>
                            m === "strict" ? "global" : "strict",
                          )
                        }
                        className="text-[9px] font-black uppercase bg-amber-500 text-white px-3 py-1 rounded-lg shadow-sm active:scale-95 transition-transform"
                      >
                        {chatMode === "strict" ? "Global" : "Strict"}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto pb-24 custom-scrollbar">
                    {chatHistory.length === 0 && (
                      <div className="py-20 text-center opacity-30">
                        <MessageSquare size={48} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase">
                          Ask AI about the plot...
                        </p>
                      </div>
                    )}

                    {chatHistory.map((m, i) => (
                      <div
                        key={i}
                        className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} space-y-2`}
                      >
                        {m.role === "bot" && m.thought && (
                          <details className="max-w-[85%] group">
                            <summary className="text-[10px] font-black uppercase text-zinc-400 cursor-pointer hover:text-amber-500 flex items-center gap-2 list-none bg-zinc-50 dark:bg-zinc-800/30 px-3 py-1 rounded-full border border-zinc-100 dark:border-zinc-800 transition-all">
                              <BrainCircuit size={12} />
                              <span>AI Logic Process</span>
                            </summary>
                            <div className="mt-2 p-4 bg-amber-50/30 dark:bg-amber-900/10 border-l-2 border-amber-500 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-serif italic rounded-r-2xl">
                              {m.thought}
                            </div>
                          </details>
                        )}
                        <div
                          className={`max-w-[90%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                            m.role === "user"
                              ? "bg-amber-500 text-white rounded-tr-none shadow-lg"
                              : "bg-white dark:bg-zinc-900 rounded-tl-none border border-zinc-200 dark:border-zinc-800 shadow-sm"
                          }`}
                        >
                          {m.content}
                          {m.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-pulse rounded-sm" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="fixed md:absolute bottom-[72px] md:bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-900 border-t md:border-none z-10">
                    <div className="relative">
                      <input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleChat()}
                        placeholder="Ask about the plot, characters, or lore..."
                        className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none shadow-inner"
                      />
                      <button
                        onClick={handleChat}
                        disabled={isAiLoading || !userInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                      >
                        {isAiLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "navigator" && (
                <div className="grid grid-cols-4 gap-3">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToPage(i)}
                      className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-xs font-black transition-all ${currentPage === i ? "bg-amber-500 text-white border-amber-500 shadow-xl scale-110" : "border-zinc-100 dark:border-zinc-800"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center z-[110] px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
        <NavItem id="library" icon={Library} label="Library" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
        <NavItem id="insights" icon={Sparkles} label="Magic" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
        <NavItem id="chat" icon={MessageSquare} label="Chat" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
        <NavItem id="navigator" icon={Layers} label="Pages" activeTab={activeTab} isSidebarOpen={isSidebarOpen} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
        <button
          onClick={hardReset}
          className="flex flex-col items-center p-2 text-zinc-400"
        >
          <RefreshCw size={20} />
          <span className="text-[9px] font-black uppercase">Reset</span>
        </button>
      </nav>

      <Notification notification={notification} setNotification={setNotification} />

      <style>{`
        .animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        body { margin: 0; padding: 0; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
