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
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  ImagePlus,
  ScanText,
  Bookmark,
  Highlighter,
  Tag,
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
  deleteUser,
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
  runTransaction,
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

const isFirestoreConnectivityError = (error) => {
  const code = error?.code || "";
  const message = (error?.message || "").toLowerCase();

  return (
    code === "failed-precondition" ||
    code === "unavailable" ||
    code === "deadline-exceeded" ||
    message.includes("offline") ||
    message.includes("client is offline") ||
    message.includes("failed to get document")
  );
};

const getFriendlyAuthError = (error) => {
  if (error?.message === "USERNAME_TAKEN") {
    return "Username already taken. Try another.";
  }

  if (isFirestoreConnectivityError(error)) {
    return "Account setup could not reach Firestore. Check your Firebase config, Firestore rules, and network, then try again.";
  }

  if (error?.code === "auth/user-not-found") {
    return "No account found with this email.";
  }
  if (error?.code === "auth/wrong-password") {
    return "Incorrect password.";
  }
  if (error?.code === "auth/invalid-credential") {
    return "Incorrect email or password.";
  }
  if (error?.code === "auth/email-already-in-use") {
    return "Email already in use. Try signing in.";
  }
  if (error?.code === "auth/invalid-email") {
    return "Invalid email address.";
  }
  if (error?.code === "auth/too-many-requests") {
    return "Too many attempts. Try again later.";
  }

  return error?.message || "Something went wrong. Please try again.";
};

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

const GENRES = [
  { id: "adventure", name: "Adventure" },
  { id: "thriller", name: "Thriller" },
  { id: "romance", name: "Romance" },
  { id: "mystery", name: "Mystery" },
  { id: "fantasy", name: "Fantasy" },
  { id: "scifi", name: "Sci-Fi" },
  { id: "horror", name: "Horror" },
  { id: "drama", name: "Drama" },
  { id: "comedy", name: "Comedy" },
  { id: "historical", name: "Historical" },
];

const GENRE_STYLES = {
  adventure: {
    active: "border-sky-300 bg-[#eaf6ff] dark:bg-sky-900/20",
    inactive:
      "border-[#cfe7ff] dark:border-[#3a4264] hover:border-sky-300 bg-[#f4fbff] dark:bg-[#262b43]",
    title: "text-sky-700 dark:text-sky-200",
    meta: "text-sky-500 dark:text-sky-300",
  },
  thriller: {
    active: "border-violet-300 bg-[#f2edff] dark:bg-violet-900/20",
    inactive:
      "border-[#ddd6ff] dark:border-[#3a4264] hover:border-violet-300 bg-[#faf7ff] dark:bg-[#262b43]",
    title: "text-violet-700 dark:text-violet-200",
    meta: "text-violet-500 dark:text-violet-300",
  },
  romance: {
    active: "border-pink-300 bg-[#ffedf5] dark:bg-pink-900/20",
    inactive:
      "border-[#ffd7e8] dark:border-[#3a4264] hover:border-pink-300 bg-[#fff7fb] dark:bg-[#262b43]",
    title: "text-pink-700 dark:text-pink-200",
    meta: "text-pink-500 dark:text-pink-300",
  },
  mystery: {
    active: "border-indigo-300 bg-[#eef0ff] dark:bg-indigo-900/20",
    inactive:
      "border-[#d8deff] dark:border-[#3a4264] hover:border-indigo-300 bg-[#f8f9ff] dark:bg-[#262b43]",
    title: "text-indigo-700 dark:text-indigo-200",
    meta: "text-indigo-500 dark:text-indigo-300",
  },
  fantasy: {
    active: "border-fuchsia-300 bg-[#fbecff] dark:bg-fuchsia-900/20",
    inactive:
      "border-[#f1d4ff] dark:border-[#3a4264] hover:border-fuchsia-300 bg-[#fef7ff] dark:bg-[#262b43]",
    title: "text-fuchsia-700 dark:text-fuchsia-200",
    meta: "text-fuchsia-500 dark:text-fuchsia-300",
  },
  scifi: {
    active: "border-cyan-300 bg-[#eafcff] dark:bg-cyan-900/20",
    inactive:
      "border-[#ccefff] dark:border-[#3a4264] hover:border-cyan-300 bg-[#f4fdff] dark:bg-[#262b43]",
    title: "text-cyan-700 dark:text-cyan-200",
    meta: "text-cyan-500 dark:text-cyan-300",
  },
  horror: {
    active: "border-rose-300 bg-[#fff0f3] dark:bg-rose-900/20",
    inactive:
      "border-[#ffd6de] dark:border-[#3a4264] hover:border-rose-300 bg-[#fff8fa] dark:bg-[#262b43]",
    title: "text-rose-700 dark:text-rose-200",
    meta: "text-rose-500 dark:text-rose-300",
  },
  drama: {
    active: "border-violet-300 bg-[#f5efff] dark:bg-violet-900/20",
    inactive:
      "border-[#e4d5ff] dark:border-[#3a4264] hover:border-violet-300 bg-[#fbf8ff] dark:bg-[#262b43]",
    title: "text-violet-700 dark:text-violet-200",
    meta: "text-violet-500 dark:text-violet-300",
  },
  comedy: {
    active: "border-lime-300 bg-[#f7ffe8] dark:bg-lime-900/20",
    inactive:
      "border-[#e4f7b8] dark:border-[#3a4264] hover:border-lime-300 bg-[#fbfff4] dark:bg-[#262b43]",
    title: "text-lime-700 dark:text-lime-200",
    meta: "text-lime-500 dark:text-lime-300",
  },
  historical: {
    active: "border-purple-300 bg-[#f7efff] dark:bg-purple-900/20",
    inactive:
      "border-[#ead7ff] dark:border-[#3a4264] hover:border-purple-300 bg-[#fcf8ff] dark:bg-[#262b43]",
    title: "text-purple-700 dark:text-purple-200",
    meta: "text-purple-500 dark:text-purple-300",
  },
};

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
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");

  // --- BOOKMARKS, HIGHLIGHTS, TAGS STATES ---
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedHighlightColor, setSelectedHighlightColor] =
    useState("yellow");
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookGenres, setBookGenres] = useState({});
  const [draggedBook, setDraggedBook] = useState(null);
  const [newTagName, setNewTagName] = useState("");
  const [sourceCollectionMap, setSourceCollectionMap] = useState({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState(null);

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
      root.style.backgroundColor = "#181926";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#f5f7ff";
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

  // --- BOOKMARKS, HIGHLIGHTS, TAGS SYNC ---
  useEffect(() => {
    if (!user || !currentDocId) return;

    const unsubscribes = [];

    // Sync bookmarks - store with sourceId as a field
    const bookmarksRef = collection(db, "users", user.uid, "bookmarks");
    const bUnsub = onSnapshot(query(bookmarksRef), (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => d.sourceId === currentDocId);
      setBookmarks(
        docs.sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0)),
      );
    });
    unsubscribes.push(bUnsub);

    // Sync highlights - store with sourceId as a field
    const highlightsRef = collection(db, "users", user.uid, "highlights");
    const hUnsub = onSnapshot(query(highlightsRef), (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => d.sourceId === currentDocId);
      setHighlights(
        docs.sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0)),
      );
    });
    unsubscribes.push(hUnsub);

    // Sync tags
    const tagsRef = collection(db, "tags", user.uid, "collections");
    const tUnsub = onSnapshot(tagsRef, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTags(docs);
    });
    unsubscribes.push(tUnsub);

    // Sync source-collection mapping
    const sourceCollRef = doc(
      db,
      "tags",
      user.uid,
      "sourceCollections",
      currentDocId,
    );
    const scUnsub = onSnapshot(sourceCollRef, (snap) => {
      if (snap.exists()) {
        setSourceCollectionMap(snap.data());
      } else {
        setSourceCollectionMap({});
      }
    });
    unsubscribes.push(scUnsub);

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user, currentDocId]);

  // --- HIGHLIGHT RENDERING ---
  const renderHighlightedText = (pageContent, pageHighlights) => {
    if (!pageHighlights || pageHighlights.length === 0) {
      return pageContent;
    }

    // Handle positioned highlights (most reliable)
    const positionedHighlights = pageHighlights.filter(
      (h) => h.startOffset !== undefined && h.endOffset !== undefined,
    );

    if (positionedHighlights.length > 0) {
      // Sort highlights by start position
      const sortedHighlights = positionedHighlights.sort(
        (a, b) => a.startOffset - b.startOffset,
      );

      const result = [];
      let lastIndex = 0;

      sortedHighlights.forEach((highlight) => {
        // Add text before highlight
        if (highlight.startOffset > lastIndex) {
          result.push(pageContent.slice(lastIndex, highlight.startOffset));
        }

        // Add highlighted text with stable key based on highlight ID
        const highlightClass =
          {
            yellow: "bg-yellow-200 dark:bg-yellow-800/50",
            green: "bg-green-200 dark:bg-green-800/50",
            pink: "bg-pink-200 dark:bg-pink-800/50",
            blue: "bg-blue-200 dark:bg-blue-800/50",
          }[highlight.color] || "bg-yellow-200 dark:bg-yellow-800/50";

        result.push(
          <span
            key={highlight.id}
            className={`${highlightClass} px-1 rounded cursor-pointer transition-all hover:ring-2 hover:ring-violet-400`}
            title={highlight.note || highlight.text}
          >
            {pageContent.slice(highlight.startOffset, highlight.endOffset)}
          </span>,
        );

        lastIndex = highlight.endOffset;
      });

      // Add remaining text
      if (lastIndex < pageContent.length) {
        result.push(pageContent.slice(lastIndex));
      }

      return result;
    }

    // Fallback: return content as-is if no valid positioned highlights
    return pageContent;
  };

  // --- READING ENGINE ---
  const pages = useMemo(() => {
    const words = text.split(/\s+/).filter(Boolean);
    const res = [];
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
      res.push(words.slice(i, i + WORDS_PER_PAGE).join(" "));
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

  const filteredSources = useMemo(() => {
    if (!selectedGenreFilter) return sources;
    return sources.filter((s) => bookGenres[s.id] === selectedGenreFilter);
  }, [sources, bookGenres, selectedGenreFilter]);

  const selectedGenreName = useMemo(() => {
    if (!selectedGenreFilter) return "All Books";
    return (
      GENRES.find((genre) => genre.id === selectedGenreFilter)?.name ||
      "Selected Genre"
    );
  }, [selectedGenreFilter]);

  const highlightColorButtonStyles = {
    yellow: {
      active: "bg-yellow-500 text-white scale-105 shadow-lg",
      inactive: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700",
    },
    green: {
      active: "bg-green-500 text-white scale-105 shadow-lg",
      inactive: "bg-green-100 dark:bg-green-900/30 text-green-700",
    },
    pink: {
      active: "bg-pink-500 text-white scale-105 shadow-lg",
      inactive: "bg-pink-100 dark:bg-pink-900/30 text-pink-700",
    },
    blue: {
      active: "bg-blue-500 text-white scale-105 shadow-lg",
      inactive: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    },
  };

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
    if (!file || !user || !isPdfReady)
      return notify("PDF engine not ready", "error");
    setIsAiLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(" ") + "\n";
      }
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
      notify("Imported Successfully!", "success");
      trackEvent("book_upload", {
        method: "pdf",
        bookName: file.name,
        pages: pdf.numPages,
      });
    } catch (err) {
      console.error("PDF upload error:", err);
      notify("PDF processing failed", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- IMAGE OCR HANDLER ---
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !user) return notify("Please sign in first", "error");
    if (files.length > 10) return notify("Max 10 images at once", "error");

    setIsOcrLoading(true);
    setOcrProgress(`Processing ${files.length} image(s)...`);

    try {
      // Convert all images to base64
      const images = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result.split(",")[1];
                resolve({ base64, mimeType: file.type || "image/jpeg" });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
        ),
      );

      setOcrProgress(`Extracting text from ${files.length} image(s) via AI...`);

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      const extractedText = result.text;
      if (!extractedText.trim())
        return notify("No text found in images", "error");

      // Save to Firestore
      const name =
        files.length === 1
          ? files[0].name.replace(/\.[^/.]+$/, "") + " (Image)"
          : `Image Story (${files.length} pages)`;

      const docRef = await addDoc(
        collection(db, "artifacts", appId, "users", user.uid, "sources"),
        {
          name,
          content: extractedText,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          type: "image",
        },
      );

      setText(extractedText);
      setCurrentDocName(name);
      setCurrentDocId(docRef.id);
      setCurrentPage(0);
      notify(`Extracted text from ${files.length} image(s)!`, "success");
      trackEvent("book_upload", {
        method: "image",
        bookName: name,
        imageCount: files.length,
      });
    } catch (err) {
      console.error("OCR error:", err);
      notify("Image extraction failed: " + err.message, "error");
    } finally {
      setIsOcrLoading(false);
      setOcrProgress("");
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

  // --- BOOKMARKS HANDLERS ---
  const createBookmark = async () => {
    if (!user || !currentDocId) return;
    try {
      const bookmarkRef = collection(db, "users", user.uid, "bookmarks");
      await addDoc(bookmarkRef, {
        sourceId: currentDocId,
        pageIndex: currentPage,
        note: bookmarkNote,
        timestamp: Date.now(),
        createdAt: Date.now(),
      });
      setBookmarkNote("");
      setShowBookmarkModal(false);
      notify("Bookmark added!", "success");
      trackEvent("bookmark_created", { page: currentPage });
    } catch (err) {
      console.error("Error creating bookmark:", err);
      notify("Failed to create bookmark", "error");
    }
  };

  const deleteBookmark = async (bookmarkId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "bookmarks", bookmarkId));
      notify("Bookmark deleted!", "success");
    } catch (err) {
      console.error("Error deleting bookmark:", err);
    }
  };

  // --- HIGHLIGHTS HANDLERS ---
  const createHighlight = async () => {
    if (!user || !currentDocId) return;
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      notify("Select text to highlight", "info");
      return;
    }

    try {
      // Find the correct page by checking which page element contains the selection
      let selectedPageIndex = currentPage;
      const range = selection.getRangeAt(0);
      let node = range.commonAncestorContainer;

      // Traverse up to find the article element with data-page-index
      while (node && node.nodeType !== 9) {
        if (
          node.getAttribute &&
          node.getAttribute("data-page-index") !== null
        ) {
          selectedPageIndex = parseInt(node.getAttribute("data-page-index"));
          break;
        }
        node = node.parentNode;
      }

      // Get the page content element
      const pageElement = document.getElementById(`page-${selectedPageIndex}`);
      const textElement = pageElement?.querySelector(".whitespace-pre-wrap");
      if (!textElement) return;

      // Get selection range relative to the page content
      const pageRange = document.createRange();
      pageRange.selectNodeContents(textElement);
      pageRange.setEnd(range.startContainer, range.startOffset);

      const startOffset = pageRange.toString().length;
      const endOffset = startOffset + selectedText.length;

      const highlightRef = collection(db, "users", user.uid, "highlights");
      await addDoc(highlightRef, {
        sourceId: currentDocId,
        pageIndex: selectedPageIndex,
        text: selectedText.substring(0, 500),
        color: selectedHighlightColor,
        startOffset: startOffset,
        endOffset: endOffset,
        timestamp: Date.now(),
        note: "",
      });
      window.getSelection().removeAllRanges();
      notify(`Text highlighted in ${selectedHighlightColor}!`, "success");
      trackEvent("highlight_created", {
        color: selectedHighlightColor,
        page: selectedPageIndex,
      });
    } catch (err) {
      console.error("Error creating highlight:", err);
      notify("Failed to create highlight", "error");
    }
  };

  const deleteHighlight = async (highlightId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "highlights", highlightId));
      notify("Highlight deleted!", "success");
    } catch (err) {
      console.error("Error deleting highlight:", err);
    }
  };

  // --- TAGS/COLLECTIONS HANDLERS ---
  const createTag = async () => {
    if (!user || !newTagName.trim()) return;
    try {
      const tagsRef = collection(db, "tags", user.uid, "collections");
      await addDoc(tagsRef, {
        name: newTagName.trim(),
        color: "blue",
        description: "",
        createdAt: Date.now(),
      });
      setNewTagName("");
      notify("Collection created!", "success");
      trackEvent("collection_created", { name: newTagName });
    } catch (err) {
      console.error("Error creating tag:", err);
      notify("Failed to create collection", "error");
    }
  };

  const deleteTag = async (tagId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "tags", user.uid, "collections", tagId));
      notify("Collection deleted!", "success");
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  const addSourceToCollection = async (collectionId) => {
    if (!user || !currentDocId) return;
    try {
      const sourceCollRef = doc(
        db,
        "tags",
        user.uid,
        "sourceCollections",
        currentDocId,
      );
      const current = sourceCollectionMap.collectionIds || [];
      if (!current.includes(collectionId)) {
        current.push(collectionId);
      }
      await setDoc(sourceCollRef, { collectionIds: current });
      notify("Added to collection!", "success");
    } catch (err) {
      console.error("Error adding source to collection:", err);
    }
  };

  const removeSourceFromCollection = async (collectionId) => {
    if (!user || !currentDocId) return;
    try {
      const sourceCollRef = doc(
        db,
        "tags",
        user.uid,
        "sourceCollections",
        currentDocId,
      );
      const current = (sourceCollectionMap.collectionIds || []).filter(
        (id) => id !== collectionId,
      );
      await setDoc(sourceCollRef, { collectionIds: current });
      notify("Removed from collection!", "success");
    } catch (err) {
      console.error("Error removing source from collection:", err);
    }
  };

  // --- EMAIL AUTH HANDLERS ---
  const handleAuthSubmit = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        const fullName = authFullName.trim();
        const username = authUsername.trim().toLowerCase();
        const email = authEmail.trim();

        if (!fullName) {
          setAuthError("Please enter your full name.");
          return;
        }
        if (!username) {
          setAuthError("Please enter a username.");
          return;
        }
        if (username.includes(" ")) {
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

        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          authPassword,
        );

        // Update Firebase display name
        await updateProfile(userCred.user, { displayName: fullName });

        try {
          await runTransaction(db, async (transaction) => {
            const usernameRef = doc(db, "usernames", username);
            const userRef = doc(db, "users", userCred.user.uid);
            const usernameDoc = await transaction.get(usernameRef);

            if (usernameDoc.exists()) {
              throw new Error("USERNAME_TAKEN");
            }

            transaction.set(userRef, {
              uid: userCred.user.uid,
              fullName,
              username,
              email,
              createdAt: Date.now(),
              provider: "email",
            });

            transaction.set(usernameRef, {
              uid: userCred.user.uid,
            });
          });
        } catch (signupError) {
          try {
            await deleteUser(userCred.user);
          } catch (cleanupError) {
            console.error("Signup cleanup failed:", cleanupError);
          }
          throw signupError;
        }

        // Auto signed-in by Firebase — just close modal
        setShowAuthModal(false);
        notify(
          "Welcome to Novel Quest, " + fullName.split(" ")[0] + "!",
          "success",
        );
        trackEvent("signup", { method: "email", username });
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
      setAuthError(getFriendlyAuthError(err));
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create Firestore user profile if it doesn't exist yet.
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          fullName: user.displayName || "",
          email: user.email || "",
          provider: "google",
          createdAt: Date.now(),
        });
      }

      notify("Signed in with Google", "success");
      trackEvent("signin", { method: "google" });
    } catch (err) {
      console.error("Google sign-in error:", err);
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
          <Loader2 className="animate-spin text-violet-500" size={32} />
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
        ${activeTab === id && isSidebarOpen ? "text-sky-600 bg-[#eaf2ff] dark:bg-sky-900/20 shadow-inner" : "text-[#7b88b6] dark:text-[#aab4d6]"}`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-black uppercase tracking-tight">
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f5f7ff] dark:bg-[#181926] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 bg-[#f7f9ff]/90 dark:bg-[#202338]/90 backdrop-blur-md border-b border-[#dfe7ff] dark:border-[#313552] z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-hidden max-w-[60%]">
          <BookOpen size={16} className="text-violet-500 shrink-0" />
          <h1 className="text-xs font-black uppercase tracking-widest truncate">
            {currentDocName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-violet-500">
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
          className="absolute bottom-0 left-0 h-[2.5px] bg-violet-500 transition-all duration-700 shadow-[0_0_10px_rgba(139,92,246,0.45)]"
          style={{ width: `${readProgress}%` }}
        />
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <nav className="hidden md:flex w-20 border-r border-[#dfe7ff] dark:border-[#313552] flex-col items-center py-8 gap-8 bg-[#f7f9ff] dark:bg-[#202338] z-50 shadow-[8px_0_30px_rgba(86,119,214,0.08)] dark:shadow-none">
          <div className="p-3 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl text-white shadow-lg shadow-sky-500/25 transition-transform hover:scale-105">
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
          <NavItem id="bookmarks" icon={Bookmark} label="Bookmarks" />
          <NavItem id="highlights" icon={Highlighter} label="Highlights" />
          <div className="mt-auto flex flex-col gap-4">
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="p-3 text-zinc-400 hover:text-violet-500 transition-colors"
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

        <main className="flex-1 overflow-y-auto px-4 md:px-20 py-8 scroll-smooth relative custom-scrollbar bg-[radial-gradient(circle_at_top,_rgba(240,246,255,1),_rgba(245,247,255,1)_42%,_rgba(238,243,255,1)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(47,53,88,0.6),_rgba(24,25,38,1)_42%,_rgba(20,22,34,1)_100%)]">
          <div className="max-w-3xl mx-auto">
            <div className="hidden md:flex justify-between items-end border-b border-[#d8e2ff] dark:border-[#313552] pb-6 mb-12">
              <div className="flex-1">
                <h1 className="text-3xl font-serif font-bold text-[#2b3968] dark:text-[#eef2ff]">
                  {currentDocName}
                </h1>
                <p className="text-[10px] uppercase font-black tracking-widest text-[#7b88b6] dark:text-[#aab4d6] mt-2">
                  Progress: Page {currentPage + 1} of {pages.length} (
                  {readProgress}%)
                </p>
              </div>
            </div>

            <div className="space-y-12 pb-32">
              {pages.map((p, i) => {
                // Get highlights for this page
                const pageHighlights = highlights.filter(
                  (h) => h.pageIndex === i,
                );
                return (
                  <article
                    key={i}
                    id={`page-${i}`}
                    data-page-index={i}
                    className="bg-[#fcfdff] dark:bg-[#21253a] p-8 md:p-16 rounded-[2rem] border border-[#dfe7ff] dark:border-[#353a58] shadow-[0_20px_45px_rgba(100,126,214,0.08)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-all hover:shadow-[0_24px_52px_rgba(100,126,214,0.14)] relative group selection:bg-sky-100 dark:selection:bg-sky-900/40"
                  >
                    <span className="absolute top-6 right-8 text-[10px] font-black text-[#d5def7] dark:text-[#49507a] uppercase tracking-widest transition-colors group-hover:text-sky-500">
                      Page {i + 1}
                    </span>
                    <div className="font-serif text-lg md:text-xl leading-relaxed text-[#334155] dark:text-[#e6eaff] whitespace-pre-wrap select-text">
                      {renderHighlightedText(p, pageHighlights)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>

        <aside
          className={`fixed inset-0 md:relative md:inset-auto z-[100] md:z-auto transition-all duration-300 overflow-hidden flex
          ${isSidebarOpen ? "w-full md:w-[420px]" : "w-0"}`}
        >
          <div className="flex-1 bg-[#f7f9ff] dark:bg-[#202338] border-l border-[#dfe7ff] dark:border-[#313552] flex flex-col shadow-2xl md:shadow-none h-full">
            <div className="p-4 border-b border-[#e8eeff] dark:border-[#313552] flex justify-between items-center bg-[#f4f7ff]/80 dark:bg-[#1b1e31]/70">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#7b88b6] dark:text-[#aab4d6]">
                {activeTab}
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-[#eaf0ff] dark:hover:bg-[#2b2f49] rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-28 md:pb-6 relative custom-scrollbar">
              {activeTab === "library" && (
                <div className="space-y-6">
                  {!user || user.isAnonymous ? (
                    <div className="space-y-4 py-8 text-center">
                      <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mx-auto text-sky-500 mb-2">
                        <User size={32} />
                      </div>
                      <p className="text-sm text-zinc-500 px-4">
                        Sign in to sync manuscripts.
                      </p>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                        className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-sky-500/25 transition-transform flex items-center justify-center gap-2"
                      >
                        {isSigningIn ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <LogIn size={16} />
                        )}
                        Continue with Google
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                        <span className="text-[10px] font-black uppercase text-zinc-400">
                          or
                        </span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                      </div>
                      <button
                        onClick={() => openAuthModal("signin")}
                        className="w-full py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-black text-xs uppercase shadow-sm flex items-center justify-center gap-2"
                      >
                        <Mail size={16} /> Sign In with Email
                      </button>
                      <button
                        onClick={() => openAuthModal("signup")}
                        className="w-full py-3 text-[10px] font-black uppercase text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-colors"
                      >
                        Create New Account
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <button
                          onClick={() => setShowProfileMenu((prev) => !prev)}
                          className="w-full rounded-3xl border border-[#dfe7ff] dark:border-[#353a58] bg-[#fcfdff] dark:bg-[#252942] p-4 text-left shadow-[0_12px_30px_rgba(100,126,214,0.08)] transition-all hover:border-sky-300 hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-black text-white shadow-lg shadow-sky-500/25 shrink-0">
                              {(user?.displayName || user?.email || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-black uppercase tracking-wide text-[#31406f] dark:text-[#eef2ff]">
                                {user?.displayName || "Reader"}
                              </p>
                              <p className="mt-1 truncate text-[10px] text-[#7b88b6] dark:text-[#aab4d6]">
                                {user?.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-green-700 dark:text-green-400">
                                <Check size={10} /> Synced
                              </span>
                            </div>
                          </div>
                        </button>

                        {showProfileMenu && (
                          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-[#dfe7ff] dark:border-[#353a58] bg-[#fcfdff] dark:bg-[#252942] p-2 shadow-xl">
                            <button
                              onClick={async () => {
                                setShowProfileMenu(false);
                                await handleGoogleSignIn();
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-wide text-[#56658f] dark:text-[#e6eaff] hover:bg-[#eef4ff] dark:hover:bg-[#2d3150]"
                            >
                              <LogIn size={14} />
                              Add another account
                            </button>
                            <button
                              onClick={async () => {
                                setShowProfileMenu(false);
                                await signOut(auth);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-wide text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <LogOut size={14} />
                              Sign out
                            </button>
                          </div>
                        )}
                      </div>

                      {/* UPLOAD OPTIONS */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* PDF Upload */}
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-violet-500 cursor-pointer transition-all group">
                          <FileUp
                            size={26}
                            className="text-zinc-300 group-hover:text-violet-500 mb-2 transition-colors"
                          />
                          <span className="text-[9px] font-black uppercase text-zinc-500 text-center">
                            Upload PDF
                          </span>
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf"
                          />
                        </label>

                        {/* Image Upload */}
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-purple-500 cursor-pointer transition-all group">
                          <ImagePlus
                            size={26}
                            className="text-zinc-300 group-hover:text-purple-500 mb-2 transition-colors"
                          />
                          <span className="text-[9px] font-black uppercase text-zinc-500 text-center">
                            Story Images
                          </span>
                          <input
                            type="file"
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                            multiple
                          />
                        </label>
                      </div>

                      {/* OCR Loading State */}
                      {(isOcrLoading || isAiLoading) && ocrProgress && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 flex items-center gap-3">
                          <ScanText
                            size={18}
                            className="text-purple-500 shrink-0 animate-pulse"
                          />
                          <div>
                            <p className="text-[10px] font-black uppercase text-purple-600">
                              {ocrProgress}
                            </p>
                            <p className="text-[9px] text-purple-400 mt-0.5">
                              AI is reading your images...
                            </p>
                          </div>
                          <Loader2
                            size={16}
                            className="animate-spin text-purple-400 ml-auto shrink-0"
                          />
                        </div>
                      )}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                          Organize by Genre
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {GENRES.map((genre) => {
                            const booksInGenre = sources.filter(
                              (s) => bookGenres[s.id] === genre.id,
                            ).length;
                            const isSelectedGenre =
                              selectedGenreFilter === genre.id;
                            const genreStyles =
                              GENRE_STYLES[genre.id] || GENRE_STYLES.adventure;
                            return (
                              <div
                                key={genre.id}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (draggedBook) {
                                    setBookGenres((prev) => ({
                                      ...prev,
                                      [draggedBook]: genre.id,
                                    }));
                                    setDraggedBook(null);
                                  }
                                }}
                                onClick={() => setSelectedGenreFilter(genre.id)}
                                className={`p-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                                  isSelectedGenre
                                    ? genreStyles.active
                                    : genreStyles.inactive
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-black uppercase ${genreStyles.title}`}
                                >
                                  {genre.name}
                                </p>
                                <p
                                  className={`text-[8px] mt-1 ${genreStyles.meta}`}
                                >
                                  {booksInGenre}{" "}
                                  {booksInGenre === 1 ? "book" : "books"}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mt-6">
                          {selectedGenreName}
                        </h3>
                        {selectedGenreFilter && (
                          <button
                            onClick={() => setSelectedGenreFilter(null)}
                            className="text-[9px] font-black uppercase tracking-wide text-violet-600 hover:text-violet-700"
                          >
                            Show all books
                          </button>
                        )}
                        <div className="space-y-2">
                          {filteredSources.length === 0 ? (
                            <p className="text-[9px] text-zinc-400 text-center py-4">
                              {selectedGenreFilter
                                ? `No books in ${selectedGenreName} yet`
                                : "Upload a book to get started"}
                            </p>
                          ) : (
                            filteredSources.map((s) => (
                              <div
                                key={s.id}
                                draggable
                                onDragStart={() => setDraggedBook(s.id)}
                                onDragEnd={() => setDraggedBook(null)}
                                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all cursor-move ${
                                  currentDocId === s.id
                                    ? "border-sky-400 bg-[#eef5ff] dark:bg-sky-900/20 shadow-[0_10px_24px_rgba(100,126,214,0.12)]"
                                    : draggedBook === s.id
                                      ? "border-sky-300 bg-[#e4efff] dark:bg-sky-900/25 opacity-50"
                                      : "border-[#d7e3ff] dark:border-[#3a4264] bg-[#f9fbff] dark:bg-[#252942] hover:border-sky-300"
                                }`}
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
                                  <p className="text-xs font-bold truncate text-[#31406f] dark:text-[#eef2ff]">
                                    {s.name}
                                  </p>
                                  <p className="text-[8px] text-[#8a97bf] dark:text-[#aab4d6] mt-0.5">
                                    {bookGenres[s.id]
                                      ? GENRES.find(
                                          (g) => g.id === bookGenres[s.id],
                                        )?.name
                                      : "Unorganized"}
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
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        </div>
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
                        className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-[10px] font-black uppercase shadow-md shadow-violet-500/20"
                      >
                        Translate
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleInsight("summary")}
                      className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex flex-col items-center gap-2 border border-violet-100"
                    >
                      <BrainCircuit size={24} className="text-violet-500" />
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
                        className="mt-4 w-full py-2.5 text-[9px] font-black uppercase text-violet-600 border border-violet-200 rounded-xl"
                      >
                        Add to Chat
                      </button>
                    </div>
                  )}
                  {isAiLoading && (
                    <div className="py-20 text-center">
                      <Loader2 className="animate-spin text-violet-500 mx-auto mb-2" />
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
                            ? "text-violet-500"
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
                      className="text-[9px] font-black uppercase bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-3 py-1 rounded-lg shadow-sm shadow-violet-500/20 active:scale-95 transition-transform"
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
                            <summary className="text-[10px] font-black uppercase text-[#8190bc] cursor-pointer hover:text-sky-500 flex items-center gap-2 list-none bg-[#f7faff] dark:bg-[#262b43] px-3 py-1 rounded-full border border-[#dbe5ff] dark:border-[#3a4264] transition-all">
                              <BrainCircuit size={12} />
                              <span>AI Logic Process</span>
                            </summary>
                            <div className="mt-2 p-4 bg-[#eef4ff] dark:bg-[#232845] border-l-2 border-sky-400 text-[11px] leading-relaxed text-[#64739d] dark:text-[#b9c4e8] font-serif italic rounded-r-2xl">
                              {m.thought}
                            </div>
                          </details>
                        )}
                        <div
                          className={`max-w-[90%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                            m.role === "user"
                              ? "bg-violet-500 text-white rounded-tr-none shadow-lg"
                              : "bg-[linear-gradient(135deg,_#f7faff_0%,_#eef3ff_100%)] dark:bg-[linear-gradient(135deg,_#252942_0%,_#2c3150_100%)] rounded-tl-none border border-[#dbe5ff] dark:border-[#3a4264] shadow-sm text-[#40507d] dark:text-[#e6eaff]"
                          }`}
                        >
                          {m.content}
                          {m.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-violet-500 animate-pulse rounded-sm" />
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
                        className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none shadow-inner"
                      />
                      <button
                        onClick={handleChat}
                        disabled={isAiLoading || !userInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-500/20 active:scale-90 transition-all"
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
                      className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-xs font-black transition-all ${currentPage === i ? "bg-violet-500 text-white border-violet-500 shadow-xl scale-110" : "border-zinc-100 dark:border-zinc-800"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "bookmarks" && (
                <div className="flex flex-col h-full space-y-4">
                  <button
                    onClick={() => setShowBookmarkModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-violet-500/20 active:scale-95"
                  >
                    + Add Bookmark
                  </button>

                  {showBookmarkModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-end z-[150]">
                      <div className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-6 space-y-4">
                        <h3 className="text-sm font-black">
                          Add Bookmark on Page {currentPage + 1}
                        </h3>
                        <textarea
                          value={bookmarkNote}
                          onChange={(e) => setBookmarkNote(e.target.value)}
                          placeholder="Optional note..."
                          className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm resize-none"
                          rows="3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowBookmarkModal(false)}
                            className="flex-1 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-xs font-black"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={createBookmark}
                            className="flex-1 py-2 bg-violet-500 text-white rounded-xl text-xs font-black"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {bookmarks.length === 0 ? (
                      <div className="py-20 text-center opacity-50">
                        <Bookmark
                          size={32}
                          className="mx-auto mb-2 opacity-30"
                        />
                        <p className="text-[10px] font-black uppercase">
                          No bookmarks yet
                        </p>
                      </div>
                    ) : (
                      bookmarks.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-900"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-violet-600">
                              Page {b.pageIndex + 1}
                            </span>
                            <button
                              onClick={() => deleteBookmark(b.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {b.note && (
                            <p className="text-[9px] text-zinc-600 dark:text-zinc-300">
                              {b.note}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "highlights" && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex gap-2">
                    {["yellow", "green", "pink", "blue"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedHighlightColor(color)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                          selectedHighlightColor === color
                            ? highlightColorButtonStyles[color].active
                            : highlightColorButtonStyles[color].inactive
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={createHighlight}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-violet-500/20 active:scale-95"
                  >
                    Select & Highlight
                  </button>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {highlights.length === 0 ? (
                      <div className="py-20 text-center opacity-50">
                        <Highlighter
                          size={32}
                          className="mx-auto mb-2 opacity-30"
                        />
                        <p className="text-[10px] font-black uppercase">
                          No highlights yet
                        </p>
                      </div>
                    ) : (
                      highlights.map((h) => (
                        <div
                          key={h.id}
                          className={`p-3 rounded-xl border-l-4 ${
                            h.color === "yellow"
                              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400"
                              : h.color === "green"
                                ? "bg-green-50 dark:bg-green-900/20 border-green-400"
                                : h.color === "pink"
                                  ? "bg-pink-50 dark:bg-pink-900/20 border-pink-400"
                                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-400"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-violet-600">
                              Page {h.pageIndex + 1}
                            </span>
                            <button
                              onClick={() => deleteHighlight(h.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-[9px] italic text-zinc-600 dark:text-zinc-300 line-clamp-2">
                            "{h.text}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center z-[110] px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] overflow-x-auto">
        <NavItem id="library" icon={Library} label="Library" />
        <NavItem id="insights" icon={Sparkles} label="Magic" />
        <NavItem id="chat" icon={MessageSquare} label="Chat" />
        <NavItem id="navigator" icon={Layers} label="Pages" />
        <NavItem id="bookmarks" icon={Bookmark} label="Bookmarks" />
        <NavItem id="highlights" icon={Highlighter} label="Highlights" />
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
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20">
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
                    className="w-full pl-9 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
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
                    className="w-full pl-8 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
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
                  className="w-full pl-9 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
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
                    className="w-full pl-9 pr-10 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
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
                    className="w-full pl-9 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
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
              className="mt-4 w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95 transition-transform"
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
                    className="text-[11px] text-zinc-400 hover:text-sky-500 transition-colors"
                  >
                    Forgot password?
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className="text-[11px] text-zinc-400 hover:text-sky-500 transition-colors"
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
                  className="text-[11px] text-zinc-400 hover:text-sky-500 transition-colors"
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
                  className="text-[11px] text-zinc-400 hover:text-sky-500 transition-colors"
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
