import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../../lib/sanity';

// Fallback questions
const FALLBACK_QUESTIONS = [
    { id: 1, text: "What does ACM stand for?", options: ["Association for Computing Machinery", "Advanced Computer Mechanics", "Automated Coding Machine", "All Computers Matter"] },
];

function normaliseQuestions(sanityDoc) {
    if (!sanityDoc?.questions?.length) return null;
    return sanityDoc.questions.map((q, i) => ({
        id: q._key || String(i + 1),
        text: q.text,
        options: q.options || [],
        correctIndex: q.correctIndex,
        type: q.type || 'multiple_choice'
    }));
}

export default function QuizEngine() {
    const navigate = useNavigate();
    const [sessionMeta, setSessionMeta] = useState(null);
    const [memberKey, setMemberKey] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Member State
    const [isLocked, setIsLocked] = useState(false);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(1800);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    // UI State
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const answersRef = useRef(answers);
    const timeLeftRef = useRef(timeLeft);

    useEffect(() => {
        answersRef.current = answers;
        timeLeftRef.current = timeLeft;
    }, [answers, timeLeft]);

    // 1. Initialization and Real-Time Sync
    useEffect(() => {
        const storedSession = sessionStorage.getItem('quiz_session');
        if (!storedSession) { navigate('/quiz/login'); return; }
        const parsed = JSON.parse(storedSession);
        setSessionMeta(parsed);

        let subscription;
        let activeMemberKey = null;

        const initialize = async () => {
            // Fetch Quiz Questions
            const qsDoc = await client.fetch(`*[_type == "quiz" && eventSlug == $slug][0]`, { slug: parsed.eventSlug || '' });
            setQuestions(normaliseQuestions(qsDoc) || FALLBACK_QUESTIONS);

            // Fetch Session
            const sDoc = await client.fetch(`*[_type == "quizSession" && _id == $id][0]`, { id: parsed.sessionId });
            if (!sDoc) {
                alert("Session invalid"); navigate('/quiz/login'); return;
            }

            const member = sDoc.members?.find(m => m.name === parsed.memberName) || sDoc.members?.[0];
            if (!member) {
                alert("Member not found in session"); navigate('/quiz/login'); return;
            }
            activeMemberKey = member._key;
            setMemberKey(member._key);
            
            // Restore state
            if (member.isLocked) setIsLocked(true);
            if (member.answers) setAnswers(JSON.parse(member.answers));
            if (member.timeRemaining) setTimeLeft(member.timeRemaining);
            
            setLoading(false);

            // Listen for Admin Unlocks
            subscription = client.listen(
                `*[_type == "quizSession" && _id == $id]`, 
                { id: parsed.sessionId }
            ).subscribe(update => {
                const updatedDoc = update.result;
                if (updatedDoc) {
                    const updatedMember = updatedDoc.members?.find(m => m._key === activeMemberKey);
                    if (updatedMember) {
                        setIsLocked(updatedMember.isLocked || false);
                    }
                }
            });
        };

        initialize();
        return () => subscription?.unsubscribe();
    }, [navigate]);

    // 2. Proctoring Engine (Tab Switch / Blur)
    useEffect(() => {
        if (loading || isLocked || isSubmitted) return;

        const handleViolation = (reason) => {
            if (isLocked) return;
            setIsLocked(true);
            
            if (sessionMeta?.sessionId && memberKey) {
                // writeClient.patch(sessionMeta.sessionId)
                //     .set({
                //         [`members[_key=="${memberKey}"].isLocked`]: true,
                //         [`members[_key=="${memberKey}"].timeRemaining`]: timeLeftRef.current,
                //         [`members[_key=="${memberKey}"].answers`]: JSON.stringify(answersRef.current)
                //     })
                //     .insert('after', 'proctorLogs[-1]', [{
                //         _key: Math.random().toString(36).substring(7),
                //         memberName: sessionMeta.memberName,
                //         action: reason,
                //         timestamp: new Date().toISOString(),
                //         details: `User locked due to ${reason}`
                //     }])
                //     .commit()
                //     .catch(console.error);
                console.log('Mock patch for proctoring violation');
            }
        };

        const onVisibilityChange = () => { if (document.hidden) handleViolation('TAB_SWITCHED'); };
        const onBlur = () => { handleViolation('WINDOW_BLURRED'); };
        const onFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                handleViolation('EXITED_FULLSCREEN');
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, [loading, isLocked, isSubmitted, sessionMeta, memberKey]);

    // 3. Timer Engine
    useEffect(() => {
        if (loading || isLocked || isSubmitted || !isFullscreen) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); autoSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, isLocked, isSubmitted, isFullscreen]);

    // 4. Auto-save Engine
    useEffect(() => {
        if (loading || !sessionMeta?.sessionId || !memberKey || isLocked) return;
        
        const saveTimer = setTimeout(() => {
            // writeClient.patch(sessionMeta.sessionId)
            //     .set({
            //         [`members[_key=="${memberKey}"].answers`]: JSON.stringify(answers),
            //         [`members[_key=="${memberKey}"].timeRemaining`]: timeLeft
            //     })
            //     .commit()
            //     .catch(console.error);
            console.log('Mock autosave');
        }, 3000); // Debounce 3s

        return () => clearTimeout(saveTimer);
    }, [answers, timeLeft, loading, sessionMeta, memberKey, isLocked]);

    const requestFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } catch (e) {
            alert('Please allow fullscreen to begin the exam.');
        }
    };

    const handleOptionSelect = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const autoSubmit = () => submitExam(true);

    const submitExam = async (force = false) => {
        if (!force && !window.confirm('Are you sure you want to submit?')) return;
        setIsSubmitted(true);
        
        if (sessionMeta?.sessionId && memberKey) {
            // await writeClient.patch(sessionMeta.sessionId)
            //     .set({
            //         [`members[_key=="${memberKey}"].status`]: 'completed',
            //         [`members[_key=="${memberKey}"].answers`]: JSON.stringify(answersRef.current),
            //         [`members[_key=="${memberKey}"].timeRemaining`]: timeLeftRef.current
            //     })
            //     .commit();
            console.log('Mock exam submission');
        }
    };

    if (loading) return <div className="text-white text-center mt-20">Loading Secure Exam Environment...</div>;

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-acm-dark text-white flex flex-col items-center justify-center">
                <h1 className="text-4xl text-acm-cyan font-bold mb-4">Exam Submitted Successfully</h1>
                <p>You may now close this window.</p>
            </div>
        );
    }

    if (!isFullscreen) {
        return (
            <div className="min-h-screen bg-acm-dark text-white flex flex-col items-center justify-center p-4">
                <div className="max-w-md text-center bg-white/5 p-8 border border-white/10 rounded-xl">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Fullscreen Required</h2>
                    <p className="mb-6 text-sm text-gray-300">This is a proctored exam. Switching tabs or exiting fullscreen will instantly lock your exam.</p>
                    <button onClick={requestFullscreen} className="px-6 py-3 bg-acm-cyan text-black font-bold tracking-widest rounded hover:bg-white transition-colors">
                        ENTER FULLSCREEN TO BEGIN
                    </button>
                </div>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 text-white backdrop-blur-sm p-4">
                <div className="max-w-lg text-center p-8 bg-black border-2 border-red-500 rounded-xl shadow-[0_0_100px_rgba(255,0,0,0.3)]">
                    <h1 className="text-4xl font-bold mb-4 uppercase">Exam Locked</h1>
                    <p className="text-xl text-gray-300 mb-6">Suspicious activity was detected (Tab Switch or Focus Loss).</p>
                    <p className="text-sm text-red-400 font-mono">Your activity has been logged to the proctoring dashboard. Please raise your hand and wait for an admin to unlock your session.</p>
                    <div className="mt-8 animate-pulse text-xs uppercase tracking-widest">Awaiting Remote Unlock...</div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIdx];

    return (
        <div className="min-h-screen bg-acm-dark text-white font-mono flex flex-col h-screen select-none">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50">
                <div className="font-bold text-acm-cyan tracking-widest uppercase">
                    {sessionMeta?.memberName} | {sessionMeta?.team}
                </div>
                <div className={`font-bold text-xl ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <button onClick={() => submitExam()} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500 hover:text-white transition-colors text-xs tracking-widest">
                    FINISH EXAM
                </button>
            </header>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/10 p-4 bg-black/30 overflow-y-auto">
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-4">Navigator</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {questions.map((q, i) => (
                            <button 
                                key={q.id}
                                onClick={() => setCurrentIdx(i)}
                                className={`h-10 w-10 flex items-center justify-center rounded border ${
                                    currentIdx === i ? 'border-acm-cyan text-acm-cyan' : 
                                    answers[q.id] !== undefined ? 'bg-white/20 border-white/20' : 'border-white/10 hover:border-white/30'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
                            <h2 className="text-2xl font-bold mt-2 font-sans">{currentQ?.text}</h2>
                        </div>

                        <div className="space-y-3">
                            {currentQ?.type === 'multiple_choice' ? (
                                currentQ.options?.map((opt, i) => (
                                    <label key={i} className={`block p-4 border rounded cursor-pointer transition-all ${
                                        answers[currentQ.id] === i 
                                        ? 'border-acm-cyan bg-acm-cyan/10' 
                                        : 'border-white/10 hover:border-white/30 bg-black/20'
                                    }`}>
                                        <div className="flex items-center">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 ${
                                                answers[currentQ.id] === i ? 'border-acm-cyan' : 'border-gray-500'
                                            }`}>
                                                {answers[currentQ.id] === i && <div className="w-2 h-2 rounded-full bg-acm-cyan" />}
                                            </div>
                                            <span className="font-sans">{opt}</span>
                                        </div>
                                    </label>
                                ))
                            ) : (
                                <textarea
                                    className="w-full bg-black/20 border border-white/20 rounded p-4 text-white focus:border-acm-cyan outline-none font-sans"
                                    rows={5}
                                    placeholder="Type your answer here..."
                                    value={answers[currentQ.id] || ''}
                                    onChange={(e) => handleOptionSelect(currentQ.id, e.target.value)}
                                />
                            )}
                        </div>

                        <div className="mt-12 flex justify-between">
                            <button 
                                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                                disabled={currentIdx === 0}
                                className="px-6 py-2 border border-white/20 rounded disabled:opacity-30 hover:bg-white/5"
                            >
                                PREVIOUS
                            </button>
                            <button 
                                onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                                disabled={currentIdx === questions.length - 1}
                                className="px-6 py-2 bg-white/10 border border-white/20 rounded disabled:opacity-30 hover:bg-white/20"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
