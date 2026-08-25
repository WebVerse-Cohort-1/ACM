import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../../lib/sanity';

const QuizLogin = () => {
    const [form, setForm] = useState({ teamName: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Fetch registration from Sanity
            const query = `*[_type == "registration" && team == $teamName && email == $email][0]`;
            const registration = await client.fetch(query, { teamName: form.teamName, email: form.email });

            if (!registration) {
                setError('Team not found or email does not match.');
                setLoading(false);
                return;
            }

            if (!registration.isApprovedForExam) {
                setError('Your team is not approved to take the exam. Please contact an admin.');
                setLoading(false);
                return;
            }

            // Create or fetch the quizSession for this team via secure API
            const sessionQuery = `*[_type == "quizSession" && teamName == $teamName][0]`;
            let session = await client.fetch(sessionQuery, { teamName: form.teamName });

            if (!session) {
                // Securely call backend API to initialize session instead of using writeClient in frontend
                const res = await fetch('http://localhost:3001/quiz-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ registrationId: registration._id, team: registration.team, email: form.email })
                });
                
                if (!res.ok) {
                    throw new Error('Failed to initialize session');
                }
                const data = await res.json();
                session = { _id: data.sessionId };
            }

            // Generate secure token/session
            sessionStorage.setItem('quiz_session', JSON.stringify({ 
                team: registration.team, 
                email: form.email, 
                sessionId: session._id,
                memberName: registration.name 
            }));
            
            // Redirect to exam screen
            navigate('/quiz/exam');
        } catch (err) {
            console.error("Login Error:", err);
            setError('Failed to connect to the verification server. Ensure you are online.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-acm-dark text-white font-mono">
            <div className="w-full max-w-md p-8 border border-white/10 rounded-2xl bg-black/50 backdrop-blur-md shadow-[0_0_50px_rgba(100,255,218,0.1)]">
                <h2 className="text-3xl font-heading font-bold text-acm-cyan mb-2 uppercase text-center tracking-tighter">Event Portal</h2>
                <p className="text-center text-xs text-gray-500 mb-8 uppercase tracking-widest">:: SECURE_AUTHENTICATION</p>

                {error && <div className="p-3 mb-6 bg-red-900/30 border border-red-500/50 text-red-400 text-xs text-center rounded">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="group relative">
                        <input type="text" required className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 text-sm" placeholder=" " value={form.teamName} onChange={e => setForm({...form, teamName: e.target.value})} />
                        <label className="absolute left-0 top-6 text-gray-500 text-xs peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all uppercase tracking-widest">
                            TEAM_NAME
                        </label>
                    </div>

                    <div className="group relative">
                        <input type="email" required className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 text-sm" placeholder=" " value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                        <label className="absolute left-0 top-6 text-gray-500 text-xs peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all uppercase tracking-widest">
                            LEADER_EMAIL
                        </label>
                    </div>

                    <div className="group relative">
                        <input type="password" required className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 text-sm" placeholder=" " value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                        <label className="absolute left-0 top-6 text-gray-500 text-xs peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all uppercase tracking-widest">
                            SECRET_KEY
                        </label>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full py-4 bg-acm-cyan text-black font-bold tracking-widest rounded hover:bg-white transition-colors text-sm disabled:opacity-50">
                            {loading ? 'AUTHENTICATING...' : 'ENTER_PORTAL'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default QuizLogin;
