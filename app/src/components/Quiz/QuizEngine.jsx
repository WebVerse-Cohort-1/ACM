import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanityFetch } from '../../lib/sanity';

// Fallback questions used if Sanity is unavailable or quiz slug not found
const FALLBACK_QUESTIONS = [
    { id: 1, text: "What does ACM stand for?", options: ["Association for Computing Machinery", "Advanced Computer Mechanics", "Automated Coding Machine", "All Computers Matter"] },
    { id: 2, text: "What is the time complexity of binary search?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"] },
    { id: 3, text: "Which protocol is used for secure web traffic?", options: ["HTTP", "HTTPS", "FTP", "SSH"] },
    { id: 4, text: "What port does HTTP commonly use?", options: ["21", "22", "80", "443"] },
];

/** Normalise a Sanity quiz document into the flat array the engine expects */
function normaliseQuestions(sanityDoc) {
    if (!sanityDoc?.questions?.length) return null;
    return sanityDoc.questions.map((q, i) => ({
        id: q._key || String(i + 1),
        text: q.text,
        options: q.options || [],
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        durationMinutes: sanityDoc.durationMinutes || 60,
        marksPerQuestion: sanityDoc.marksPerQuestion || 1,
        negativeMarks: sanityDoc.negativeMarks || 0,
    }));
}

export default function QuizEngine() {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quizMeta, setQuizMeta] = useState({ durationMinutes: 60, marksPerQuestion: 1, negativeMarks: 0 });

    // Quiz State
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [bookmarks, setBookmarks] = useState({});
    const [timeLeft, setTimeLeft] = useState(3600);
    const [violations, setViolations] = useState(0);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Engine State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // ─── Load session & questions ────────────────────────────────────────────
    useEffect(() => {
        const storedSession = sessionStorage.getItem('quiz_session');
        if (!storedSession) { navigate('/quiz/login'); return; }
        const parsed = JSON.parse(storedSession);
        setSession(parsed);

        // Restore saved progress first so timer is correct
        const savedState = localStorage.getItem('quiz_backup');
        if (savedState) {
            const snap = JSON.parse(savedState);
            setAnswers(snap.answers || {});
            setBookmarks(snap.bookmarks || {});
            setViolations(snap.violations || 0);
            if (snap.timeLeft) setTimeLeft(snap.timeLeft);
        }

        // Fetch questions from Sanity (keyed by eventSlug stored in session)
        const quizSlug = parsed?.eventSlug || parsed?.quizSlug;
        (async () => {
            let qs = null;
            if (quizSlug) {
                const doc = await sanityFetch(
                    `*[_type == "quiz" && eventSlug == $slug][0]`,
                    { slug: quizSlug }
                );
                qs = normaliseQuestions(doc);
                if (doc) {
                    setQuizMeta({
                        durationMinutes: doc.durationMinutes || 60,
                        marksPerQuestion: doc.marksPerQuestion || 1,
                        negativeMarks: doc.negativeMarks || 0,
                    });
                    // Only set timer from Sanity if no saved state
                    if (!savedState) setTimeLeft((doc.durationMinutes || 60) * 60);
                }
            }
            setQuestions(qs || FALLBACK_QUESTIONS);
            setLoading(false);
        })();
    }, [navigate]);

    // ─── Auto-save to localStorage ──────────────────────────────────────────
    useEffect(() => {
        if (loading) return;
        const snap = { answers, bookmarks, violations, timeLeft, savedAt: Date.now() };
        localStorage.setItem('quiz_backup', JSON.stringify(snap));
    }, [answers, bookmarks, violations, timeLeft, loading]);

    // ─── Timer ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isSubmitted || !isFullscreen || loading) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); autoSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isFullscreen, isSubmitted, loading]);

    // ─── Network status ─────────────────────────────────────────────────────
    useEffect(() => {
        const on = () => setIsOffline(false);
        const off = () => setIsOffline(true);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    }, []);

    // ─── Proctoring: tab switch ──────────────────────────────────────────────
    useEffect(() => {
        if (!isFullscreen || isSubmitted) return;
        const handler = () => {
            if (document.hidden) {
                setViolations(v => v + 1);
                alert('WARNING: Tab switching detected! This violation has been recorded and marks may be deducted.');
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [isFullscreen, isSubmitted]);

    // ─── Fullscreen lock ─────────────────────────────────────────────────────
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const requestFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } catch (e) {
            alert('Please allow fullscreen to begin the exam.');
        }
    };

    const handleOptionSelect = (qId, idx) => setAnswers(prev => ({ ...prev, [qId]: idx }));
    const toggleBookmark = (qId) => setBookmarks(prev => ({ ...prev, [qId]: !prev[qId] }));
    const autoSubmit = () => submitExam(true);

    const submitExam = async (isAuto = false) => {
        if (!isAuto && !window.confirm('Are you sure you want to submit? You cannot return to the exam.')) return;
        setIsSubmitted(true);

        // Calculate score
        let score = 0;
        questions.forEach(q => {
            const ans = answers[q.id];
            if (ans === undefined) return;
            if (ans === q.correctIndex) score += (quizMeta.marksPerQuestion || 1);
            else score -= (quizMeta.negativeMarks || 0);
        });

        const payload = {
            team: session?.team,
            email: session?.email,
            eventSlug: session?.eventSlug,
            answers,
            violations,
            score,
            totalQuestions: questions.length,
            timeSpent: (quizMeta.durationMinutes * 60) - timeLeft,
            submittedAt: new Date().toISOString(),
            isAutoSubmit: isAuto,
        };

        // Try cloud push (GAS)
        const gasUrl = localStorage.getItem('acm_gas_url');
        if (gasUrl && !isOffline) {
            try {
                await fetch(gasUrl, {
                    method: 'POST', mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'submit_quiz', data: payload }),
                });
            } catch (e) {
                console.warn('[quiz] Cloud submit failed — stored locally.', e);
            }
        }

        // Queue locally for resilience
        const queue = JSON.parse(localStorage.getItem('quiz_completed') || '[]');
        localStorage.setItem('quiz_completed', JSON.stringify([...queue, payload]));
        localStorage.removeItem('quiz_backup');

        if (document.fullscreenElement) document.exitFullscreen();
    };

    // ─── Loading screen ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-acm-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-mono text-xs text-gray-400 tracking-widest animate-pulse">LOADING_EXAM_QUESTIONS...</p>
                </div>
            </div>
        );
    }

    // ─── Submitted screen ────────────────────────────────────────────────────
    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
                <div className="max-w-md">
                    <div className="text-6xl mb-6">✓</div>
                    <h1 className="text-4xl font-bold text-acm-cyan mb-4 tracking-widest">EXAM_SUBMITTED</h1>
                    <p className="text-gray-400 mb-8 font-mono">Your responses have been recorded successfully. You may now close this window.</p>
                    {isOffline && (
                        <div className="p-4 border border-yellow-500/50 bg-yellow-900/20 text-yellow-500 text-xs rounded-xl font-mono">
                            :: NOTICE: You are offline. Data is saved locally and will sync when reconnected.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Fullscreen gate ─────────────────────────────────────────────────────
    if (!isFullscreen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <div className="text-center max-w-lg p-8 border border-white/10 bg-white/5 rounded-2xl backdrop-blur-md shadow-2xl">
                    <h2 className="text-3xl font-bold text-red-500 mb-2 tracking-tighter uppercase">Strict Proctoring Active</h2>
                    <p className="text-xs text-gray-500 font-mono mb-8">
                        Quiz: {questions.length} questions · {quizMeta.durationMinutes} min · {quizMeta.marksPerQuestion} mark/Q
                        {quizMeta.negativeMarks > 0 && ` · -${quizMeta.negativeMarks} negative`}
                    </p>
                    <ul className="text-sm text-gray-400 font-mono text-left list-disc list-inside space-y-2 mb-8 leading-relaxed">
                        <li>Do not exit fullscreen mode.</li>
                        <li>Do not switch tabs or applications.</li>
                        <li>All violations are recorded and will lead to point deductions or disqualification.</li>
                        <li>Your progress is auto-saved continuously.</li>
                    </ul>
                    <button onClick={requestFullscreen} className="w-full py-4 bg-acm-cyan text-black font-bold tracking-widest hover:bg-white transition-all rounded">
                        ENTER_FULLSCREEN &amp; START
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-acm-dark text-white flex flex-col font-mono select-none">
            {/* Top Bar */}
            <header className="h-16 border-b border-white/10 bg-black/50 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-acm-cyan tracking-widest uppercase text-xl">ACM_EXAM</div>
                    {isOffline && <span className="bg-red-500/20 text-red-500 px-2 py-0.5 text-[10px] rounded animate-pulse tracking-widest">OFFLINE_MODE_ACTIVE</span>}
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-xs text-gray-400 tracking-widest">
                        VIOLATIONS: <span className={violations > 0 ? 'text-red-500 font-bold' : 'text-acm-cyan'}>{violations}</span>
                    </div>
                    <div className={`text-2xl font-bold tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-colors ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-72 border-r border-white/10 bg-black/30 flex flex-col shrink-0">
                    {/* Legend */}
                    <div className="px-4 py-3 border-b border-white/10 bg-black/50 flex gap-3 text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-acm-cyan/60 inline-block" />Answered</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500/60 inline-block" />Bookmarked</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" />Unanswered</span>
                    </div>
                    <div className="p-3 border-b border-white/10 text-xs text-gray-500 tracking-widest uppercase text-center bg-black/50">
                        {answeredCount} / {questions.length} Completed
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, i) => {
                                const isAns = answers[q.id] !== undefined;
                                const isMarked = bookmarks[q.id];
                                const isCurr = currentIdx === i;
                                let cls = 'h-9 border rounded flex items-center justify-center text-xs font-bold transition-all relative ';
                                if (isCurr) cls += 'border-white bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]';
                                else if (isMarked) cls += 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500';
                                else if (isAns) cls += 'border-acm-cyan/50 bg-acm-cyan/10 text-acm-cyan';
                                else cls += 'border-white/10 text-gray-600 hover:border-white/30 hover:text-gray-400';
                                return (
                                    <button key={q.id} onClick={() => setCurrentIdx(i)} className={cls}>
                                        {i + 1}
                                        {isMarked && <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Bookmarked quick-list */}
                    {Object.values(bookmarks).some(Boolean) && (
                        <div className="border-t border-white/10 p-3">
                            <p className="text-[9px] text-yellow-500 font-mono mb-2 tracking-wider uppercase">★ Bookmarked</p>
                            <div className="flex flex-wrap gap-1">
                                {questions.map((q, i) => bookmarks[q.id] && (
                                    <button key={q.id} onClick={() => setCurrentIdx(i)}
                                        className={`text-[10px] px-2 py-1 rounded border font-mono transition-all ${answers[q.id] !== undefined ? 'border-acm-cyan/50 text-acm-cyan bg-acm-cyan/10' : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10'}`}>
                                        Q{i + 1}{answers[q.id] !== undefined ? ' ✓' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="p-4 border-t border-white/10">
                        <button onClick={() => submitExam()} className="w-full py-3 bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all font-bold tracking-widest text-xs rounded uppercase">
                            FINAL_SUBMIT
                        </button>
                    </div>
                </aside>

                {/* Main Question Area */}
                <main className="flex-1 p-8 md:p-12 overflow-y-auto relative bg-[#020C1B]">
                    <div className="max-w-4xl mx-auto w-full">
                        <div className="flex justify-between items-start mb-8 pb-4 border-b border-white/10">
                            <div className="text-sm text-gray-500 tracking-widest">QUESTION {currentIdx + 1} OF {questions.length}</div>
                            <button
                                onClick={() => toggleBookmark(currentQ.id)}
                                className={`text-xs px-4 py-1.5 border rounded tracking-widest transition-all ${bookmarks[currentQ.id] ? 'bg-yellow-500 text-black border-yellow-500' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/50'}`}
                            >
                                {bookmarks[currentQ.id] ? '★ BOOKMARKED' : '☆ BOOKMARK'}
                            </button>
                        </div>

                        <div className="text-xl md:text-2xl text-white mb-10 leading-relaxed min-h-[100px] font-sans">
                            {currentQ.text}
                        </div>

                        <div className="space-y-4">
                            {currentQ.options.map((opt, idx) => {
                                const isSelected = answers[currentQ.id] === idx;
                                return (
                                    <div key={idx} onClick={() => handleOptionSelect(currentQ.id, idx)}
                                        className={`p-5 rounded-lg border cursor-pointer transition-all flex items-center gap-4 text-sm md:text-base ${isSelected ? 'border-acm-cyan bg-acm-cyan/10 shadow-[0_0_20px_rgba(100,255,218,0.1)]' : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-acm-cyan bg-acm-cyan' : 'border-gray-500'}`}>
                                            {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                                        </div>
                                        <span className={isSelected ? 'text-white font-bold' : 'text-gray-300'}>{opt}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Navigation Footer */}
                        <div className="mt-16 flex justify-between items-center pt-6 border-t border-white/10">
                            <button
                                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                                disabled={currentIdx === 0}
                                className="px-6 py-3 border border-white/20 rounded text-xs tracking-widest disabled:opacity-30 hover:bg-white/5 transition-all uppercase">
                                ← PREV
                            </button>
                            <button
                                onClick={() => {
                                    if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
                                    else submitExam();
                                }}
                                className="px-8 py-3 bg-white text-black border border-white rounded text-xs tracking-widest font-bold hover:bg-acm-cyan hover:border-acm-cyan transition-all uppercase">
                                {currentIdx === questions.length - 1 ? 'FINISH' : 'NEXT →'}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
