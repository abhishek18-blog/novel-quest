import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
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
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  ImagePlus,
  ScanText,
} from "lucide-react";

// Firebase Imports
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  query,
} from "firebase/firestore";

/**
 * --- ENVIRONMENT CONFIGURATION ---
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const appId = String(import.meta.env.VITE_APP_ID || "novel-quest-v1").replace(
  /[^a-zA-Z0-9]/g,
  "_",
);

// Initialize Firebase services
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

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

  // --- AUTH MODAL STATES ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // signin | signup | forgot
  const [authEmail, setAuthEmail] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

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

  // --- PDF ENGINE REMOVED (now handled perfectly in backend) ---

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
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
    // Split by blocks/paragraphs so we don't break markdown elements mid-tag
    const blocks = text.split(/\n+/).filter(Boolean);
    const res = [];
    let currentChunk = [];
    let currentLen = 0;
    
    for (let i = 0; i < blocks.length; i++) {
       const block = blocks[i];
       const wordsInBlock = block.split(/\s+/).length + 1;
       if (currentLen + wordsInBlock > WORDS_PER_PAGE && currentChunk.length > 0) {
           res.push(currentChunk.join("\n\n"));
           currentChunk = [block];
           currentLen = wordsInBlock;
       } else {
           currentChunk.push(block);
           currentLen += wordsInBlock;
       }
    }
    if (currentChunk.length > 0) {
        res.push(currentChunk.join("\n\n"));
    }
    return res.length > 0
      ? res
      : ["No manuscript loaded. Use the Library to upload a PDF or start writing."];
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
            if (!isNaN(idx)) {
              setCurrentPage(idx);
              trackEvent("page_read", { page: idx + 1 });
            }
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
    systemPrompt = "You are a helpful scholarly assistant.",
    contextOverride = null,
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
          context:
            contextOverride !== null
              ? contextOverride
              : pages[currentPage] || "",
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
    if (!file || !user) return notify("Please sign in first", "error");
    
    setIsAiLoading(true);
    notify("Parsing PDF Structure... this may take a moment", "info");
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse_pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      const fullText = result.text;
      
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
      notify("Import Completed Beautifully!", "success");
      trackEvent("book_upload", {
        method: "pdf_pymupdf",
        bookName: file.name,
      });
    } catch (err) {
      console.error("PDF upload error:", err);
      notify("PDF processing failed", "error");
    } finally {
      setIsAiLoading(false);
      e.target.value = "";
    }
  };

  const handleInsight = async (type) => {
    if (!user) return notify("Sign in for insights", "error");
    if (!text.trim()) return notify("Load a manuscript first", "error");
    setInsightResult("");
    setInsightType(type);
    let p = "";
    let s = "You are a literary analyst scholar.";

    // For image imports, use larger context (up to 8000 chars)
    // For PDFs/regular docs, use current page only
    const isShortDoc = pages.length === 1;
    const context = isShortDoc ? text.substring(0, 8000) : null; // null = use current page

    if (type === "summary")
      p = isShortDoc
        ? "Summarize all the key content from this text concisely."
        : "Summarize the key events on this page concisely.";
    if (type === "characters")
      p = "Identify characters mentioned and their motivations.";
    if (type === "weaver")
      p = "Suggest 3 creative plot directions based on the current scene.";

    const resultText = await callAi(p, s, context);
    setInsightResult(resultText);
    trackEvent("insight_used", { insightType: type });
  };

  const notify = (msg, type = "info") => {
    setNotification({ text: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- SILENT ANALYTICS TRACKER ---
  const trackEvent = async (type, metadata = {}) => {
    if (!user || user.isAnonymous) return; // only track signed-in users
    try {
      await addDoc(collection(db, "analytics", user.uid, "events"), {
        type,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString(),
        hour: new Date().getHours(),
        bookId: currentDocId || null,
        bookName: currentDocName || null,
        ...metadata,
      });
    } catch (e) {
      // silent fail — never interrupt user experience
    }
  };

  // --- SMART CHAT HANDLER ---
  const handleChat = async () => {
    if (!userInput.trim() || isAiLoading || !user) return;
    if (!text.trim()) return notify("Load a manuscript first", "info");
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
    trackEvent("chat_message", { query: q.substring(0, 100), mode: chatMode });
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
    trackEvent("translation_used", { targetLang: selectedLang });
  };

  // --- EMAIL AUTH HANDLERS ---
  const handleAuthSubmit = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        if (!authFullName.trim()) {
          setAuthError("Please enter your full name.");
          return;
        }
        if (!authUsername.trim()) {
          setAuthError("Please enter a username.");
          return;
        }
        if (authUsername.includes(" ")) {
          setAuthError("Username cannot have spaces.");
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setAuthError("Passwords do not match.");
          return;
        }
        if (authPassword.length < 6) {
          setAuthError("Password must be at least 6 characters.");
          return;
        }

        // Check if username already taken in Firestore
        const usernameDoc = await getDoc(
          doc(db, "usernames", authUsername.toLowerCase()),
        );
        if (usernameDoc.exists()) {
          setAuthError("Username already taken. Try another.");
          return;
        }

        // Create Firebase auth user
        const userCred = await createUserWithEmailAndPassword(
          auth,
          authEmail,
          authPassword,
        );

        // Update Firebase display name
        await updateProfile(userCred.user, { displayName: authFullName });

        // Store user profile in Firestore
        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          fullName: authFullName,
          username: authUsername.toLowerCase(),
          email: authEmail,
          createdAt: Date.now(),
          provider: "email",
        });

        // Reserve username
        await setDoc(doc(db, "usernames", authUsername.toLowerCase()), {
          uid: userCred.user.uid,
        });

        // Auto signed-in by Firebase — just close modal
        setShowAuthModal(false);
        notify(
          "Welcome to Novel Quest, " + authFullName.split(" ")[0] + "!",
          "success",
        );
        trackEvent("signup", { method: "email", username: authUsername });
      } else if (authMode === "signin") {
        const userCred = await signInWithEmailAndPassword(
          auth,
          authEmail,
          authPassword,
        );

        // Fetch user profile from Firestore
        const profileDoc = await getDoc(doc(db, "users", userCred.user.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          notify(
            "Welcome back, " + profile.fullName.split(" ")[0] + "!",
            "success",
          );
        } else {
          notify("Signed in successfully!", "success");
        }
        setShowAuthModal(false);
        trackEvent("signin", { method: "email" });
      } else if (authMode === "forgot") {
        if (!authEmail.trim()) {
          setAuthError("Please enter your email address.");
          return;
        }
        await sendPasswordResetEmail(auth, authEmail, {
          url: window.location.origin, // redirect back to app after reset
        });
        setAuthSuccess("Reset email sent! Check your inbox (and spam folder).");
      }
    } catch (err) {
      const msg =
        err.code === "auth/user-not-found"
          ? "No account found with this email."
          : err.code === "auth/wrong-password"
            ? "Incorrect password."
            : err.code === "auth/invalid-credential"
              ? "Incorrect email or password."
              : err.code === "auth/email-already-in-use"
                ? "Email already in use. Try signing in."
                : err.code === "auth/invalid-email"
                  ? "Invalid email address."
                  : err.code === "auth/too-many-requests"
                    ? "Too many attempts. Try again later."
                    : err.message;
      setAuthError(msg);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthFullName("");
    setAuthUsername("");
    setAuthError("");
    setAuthSuccess("");
    setShowPassword(false);
    setShowAuthModal(true);
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      notify("Signed in with Google", "success");
      trackEvent("signin", { method: "google" });
    } catch (err) {
      notify("Authentication failed", "error");
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

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(true);
      }}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all
        ${activeTab === id && isSidebarOpen ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-inner" : "text-zinc-400"}`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-black uppercase tracking-tight">
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-hidden max-w-[60%]">
          <BookOpen size={16} className="text-amber-500 shrink-0" />
          <h1 className="text-xs font-black uppercase tracking-widest truncate">
            {currentDocName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-amber-500">
            {readProgress}%
          </span>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="p-1 text-zinc-400"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div
          className="absolute bottom-0 left-0 h-[2.5px] bg-amber-500 transition-all duration-700 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          style={{ width: `${readProgress}%` }}
        />
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <nav className="hidden md:flex w-20 border-r border-zinc-200 dark:border-zinc-800 flex-col items-center py-8 gap-8 bg-white dark:bg-zinc-900 z-50">
          <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/20 transition-transform hover:scale-105">
            <BookOpen size={24} />
          </div>
          <div className="relative">
            <NavItem id="library" icon={Library} label="Library" />
            {user && !user.isAnonymous && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
            )}
          </div>
          <NavItem id="insights" icon={Sparkles} label="Magic" />
          <NavItem id="chat" icon={MessageSquare} label="Chat" />
          <NavItem id="navigator" icon={Layers} label="Pages" />
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
                  <div className="font-serif text-lg md:text-xl leading-relaxed text-zinc-800 dark:text-zinc-300 select-text prose prose-zinc dark:prose-invert prose-lg max-w-none">
                    <ReactMarkdown>{p}</ReactMarkdown>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>

        <aside
          className={`fixed inset-y-0 right-0 md:relative md:inset-auto z-[100] md:z-auto transition-all duration-300 overflow-hidden flex shadow-2xl md:shadow-none shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900
          ${isSidebarOpen ? "w-full md:w-[400px]" : "w-0"}`}
        >
          <div className="flex-1 flex flex-col h-full min-w-[100vw] md:min-w-[400px]">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {activeTab}
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-28 md:pb-6 relative custom-scrollbar">
              {activeTab === "library" && (
                <div className="space-y-6">
                  {/* UPLOAD OPTIONS ALWAYS VISIBLE */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* PDF Upload */}
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-amber-500 cursor-pointer transition-all group">
                      <FileUp
                        size={26}
                        className="text-zinc-300 group-hover:text-amber-500 mb-2 transition-colors"
                      />
                      <span className="text-[9px] font-black uppercase text-zinc-500 text-center">
                        Upload Structured PDF
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf"
                      />
                    </label>
                  </div>
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
                            trackEvent("book_open", {
                              bookName: s.name,
                              bookId: s.id,
                            });
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
                          className="text-zinc-300 hover:text-red-500 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {sources.length === 0 && (
                      <p className="text-xs text-zinc-400 text-center py-4">No collections yet.</p>
                    )}
                  </div>

                  {/* USER ACCOUNT / SIGN IN */}
                  {!user || user.isAnonymous ? (
                    <div className="mt-8 space-y-4 py-6 px-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl text-center">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-2">
                        <User size={20} />
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 px-2 font-medium">
                        Sign in to sync your library across devices
                      </p>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                        className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase shadow-md transition-transform flex items-center justify-center gap-2"
                      >
                        {isSigningIn ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <LogIn size={16} />
                        )}
                        Sign In with Google
                      </button>
                      <button
                        onClick={() => openAuthModal("signin")}
                        className="w-full py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-xl font-black text-[10px] uppercase shadow-sm flex items-center justify-center gap-2"
                      >
                        <Mail size={14} /> Sign In with Email
                      </button>
                    </div>
                  ) : (
                    <div className="mt-8 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-amber-500/20">
                          {(user?.displayName ||
                            user?.email ||
                            "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black truncate text-zinc-800 dark:text-zinc-100">
                            {user?.displayName || "Reader"}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <div
                          className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                          title="Signed in"
                        />
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase flex items-center gap-1">
                          <Check size={11} /> Synced
                        </span>
                        <button
                          onClick={() => signOut(auth)}
                          className="text-[10px] font-black uppercase text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                          <LogOut size={12} /> Sign Out
                        </button>
                      </div>
                    </div>
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
                              content: `**✨ Magic Insight (${insightType}):**\n${insightResult}`,
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
                    <button
                      onClick={() =>
                        setChatMode((m) =>
                          m === "strict" ? "global" : "strict",
                        )
                      }
                      className="text-[9px] font-black uppercase bg-amber-500 text-white px-3 py-1 rounded-lg shadow-sm active:scale-95 transition-transform"
                    >
                      Switch to {chatMode === "strict" ? "Global" : "Strict"}
                    </button>
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
                        placeholder="Ask AI scholarly questions..."
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
        <NavItem id="library" icon={Library} label="Library" />
        <NavItem id="insights" icon={Sparkles} label="Magic" />
        <NavItem id="chat" icon={MessageSquare} label="Chat" />
        <NavItem id="navigator" icon={Layers} label="Pages" />
        <button
          onClick={hardReset}
          className="flex flex-col items-center p-2 text-zinc-400"
        >
          <RefreshCw size={20} />
          <span className="text-[9px] font-black uppercase">Reset</span>
        </button>
      </nav>

      {notification && (
        <div
          className={`fixed bottom-20 md:bottom-10 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xs p-4 rounded-3xl shadow-2xl z-[200] flex items-center gap-3 animate-in border ${notification.type === "error" ? "bg-red-600 text-white" : "bg-zinc-900 text-white"}`}
        >
          {notification.type === "error" ? (
            <AlertCircle size={20} />
          ) : (
            <Check size={20} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {notification.text}
          </span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto opacity-50"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-xl"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                <BookOpen size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100">
                {authMode === "signup"
                  ? "Create Account"
                  : authMode === "forgot"
                    ? "Reset Password"
                    : "Welcome Back"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {authMode === "signup"
                  ? "Start your reading journey"
                  : authMode === "forgot"
                    ? "We will send a reset link to your email"
                    : "Sign in to your account"}
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {/* Full Name - signup only */}
              {authMode === "signup" && (
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Username - signup only */}
              {authMode === "signup" && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="Username (no spaces)"
                    value={authUsername}
                    onChange={(e) =>
                      setAuthUsername(
                        e.target.value.toLowerCase().replace(/\s/g, ""),
                      )
                    }
                    className="w-full pl-8 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Password */}
              {authMode !== "forgot" && (
                <div className="relative">
                  <KeyRound
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAuthSubmit()}
                    className="w-full pl-9 pr-10 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              )}

              {/* Confirm Password - signup only */}
              {authMode === "signup" && (
                <div className="relative">
                  <KeyRound
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAuthSubmit()}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Error / Success */}
            {authError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-[11px] text-red-600 dark:text-red-400">
                  {authError}
                </p>
              </div>
            )}
            {authSuccess && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl flex items-center gap-2">
                <Check size={14} className="text-green-500 shrink-0" />
                <p className="text-[11px] text-green-600 dark:text-green-400">
                  {authSuccess}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleAuthSubmit}
              disabled={isAuthSubmitting}
              className="mt-4 w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {isAuthSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {authMode === "signup"
                ? "Create Account"
                : authMode === "forgot"
                  ? "Send Reset Email"
                  : "Sign In"}
            </button>

            {/* Footer links */}
            <div className="mt-4 flex flex-col items-center gap-2">
              {authMode === "signin" && (
                <>
                  <button
                    onClick={() => {
                      setAuthMode("forgot");
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className="text-[11px] text-zinc-400 hover:text-amber-500 transition-colors"
                  >
                    Forgot password?
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className="text-[11px] text-zinc-400 hover:text-amber-500 transition-colors"
                  >
                    Don't have an account?{" "}
                    <span className="font-black">Sign Up</span>
                  </button>
                </>
              )}
              {authMode === "signup" && (
                <button
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-[11px] text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  Already have an account?{" "}
                  <span className="font-black">Sign In</span>
                </button>
              )}
              {authMode === "forgot" && (
                <button
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-[11px] text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  Back to Sign In
                </button>
              )}
            </div>

            {/* Divider + Google */}
            {authMode !== "forgot" && (
              <>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                  <span className="text-[10px] font-black uppercase text-zinc-400">
                    or
                  </span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    handleGoogleSignIn();
                  }}
                  className="mt-3 w-full py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-black text-xs uppercase text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-2"
                >
                  <LogIn size={14} /> Continue with Google
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
