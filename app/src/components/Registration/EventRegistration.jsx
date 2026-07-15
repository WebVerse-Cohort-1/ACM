import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventRegistration() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    
    // Configurable by admin (mocked here, ideally fetched from Sanity)
    const MAX_TEAM_SIZE = 4;
    const MIN_TEAM_SIZE = 1;

    const [numMembers, setNumMembers] = useState(1);
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState([{
        name: '', email: '', password: '', 
        enrollmentNo: '', rollNo: '', year: '', 
        class: '', div: '', academicYear: '2026-27'
    }]);

    const event = useMemo(() => {
        try {
            const storedRaw = localStorage.getItem('acm_events');
            if (!storedRaw) return null;
            const stored = JSON.parse(storedRaw);
            const found = stored.find(e => e.slug === slug);
            return found || null;
        } catch (e) { 
            return null; 
        }
    }, [slug]);

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const updateMemberCount = (count) => {
        const newCount = Math.max(MIN_TEAM_SIZE, Math.min(MAX_TEAM_SIZE, parseInt(count) || 1));
        setNumMembers(newCount);
        
        const newMembers = [...members];
        while (newMembers.length < newCount) {
            newMembers.push({
                name: '', email: '', password: '', 
                enrollmentNo: '', rollNo: '', year: '', 
                class: '', div: '', academicYear: '2026-27'
            });
        }
        setMembers(newMembers.slice(0, newCount));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            id: Date.now(),
            eventSlug: slug,
            eventTitle: event?.title || slug,
            teamName,
            members,
            timestamp: new Date().toISOString()
        };

        const existing = JSON.parse(localStorage.getItem('acm_registrations') || '[]');
        localStorage.setItem('acm_registrations', JSON.stringify([payload, ...existing]));
        
        const gasUrl = localStorage.getItem('acm_gas_url');
        if (gasUrl) {
            try {
                await fetch(gasUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'register_team', data: payload })
                });
            } catch (err) {
                console.error("Cloud sync failed for registration.");
            }
        }

        setSubmitted(true);
    };

    if (!event) return (
        <div className="min-h-screen flex items-center justify-center text-white bg-black font-mono">
            <div className="text-center">
                <p className="text-acm-cyan mb-4">EVENT_NOT_FOUND</p>
                <button onClick={() => navigate('/events')} className="border border-white/20 px-6 py-3 text-sm hover:bg-white/5">← Back to Events</button>
            </div>
        </div>
    );

    const inputClass = "w-full bg-white/5 border border-white/10 p-3 text-white rounded focus:border-acm-cyan outline-none transition-all placeholder:text-gray-600 text-xs";
    const labelClass = "block text-[10px] text-gray-400 font-mono uppercase tracking-[0.1em] mb-1.5";

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24 pb-20 px-4 text-white bg-black font-mono">
                <div className="text-center p-12 border border-acm-cyan/30 rounded-2xl bg-acm-cyan/5 max-w-lg">
                    <div className="text-5xl mb-6 text-acm-cyan animate-pulse">✓</div>
                    <h2 className="text-2xl font-bold text-white mb-2 uppercase">Registration Confirmed</h2>
                    <p className="text-gray-400 text-xs mb-8">Team <span className="text-acm-cyan font-bold">{teamName}</span> has been successfully registered for {event.title}.</p>
                    <p className="text-gray-600 text-[10px] mb-8">Login credentials have been secured. Use them to access the exam portal on the event day.</p>
                    <button onClick={() => navigate(`/events/${slug}`)} className="bg-acm-cyan text-black px-6 py-3 text-xs font-bold hover:bg-white transition-all rounded w-full">
                        RETURN TO EVENT
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-20 text-white bg-acm-dark font-mono">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <button onClick={() => navigate(`/events/${slug}`)} className="text-[10px] text-gray-500 hover:text-acm-cyan mb-6 transition-colors">
                        ← BACK_TO_EVENT
                    </button>
                    <div className="border-l-4 border-acm-cyan pl-6">
                        <p className="text-acm-cyan text-[10px] tracking-[0.3em] mb-1">// SECURE_REGISTRATION</p>
                        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">{event.title}</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Team Setup */}
                    <fieldset className="p-6 md:p-8 border border-white/10 rounded-xl bg-white/5 space-y-6">
                        <legend className="text-acm-cyan text-[10px] tracking-widest px-2">// TEAM_CONFIGURATION</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Team Name *</label>
                                <input type="text" required placeholder="e.g. Neural Ninjas" className={inputClass} value={teamName} onChange={e => setTeamName(e.target.value)}/>
                            </div>
                            <div>
                                <label className={labelClass}>Number of Members ({MIN_TEAM_SIZE}-{MAX_TEAM_SIZE}) *</label>
                                <input type="number" min={MIN_TEAM_SIZE} max={MAX_TEAM_SIZE} required className={inputClass} value={numMembers} onChange={e => updateMemberCount(e.target.value)}/>
                            </div>
                        </div>
                    </fieldset>

                    {/* Member Details */}
                    {members.map((member, idx) => (
                        <fieldset key={idx} className="p-6 md:p-8 border border-white/10 rounded-xl bg-black/40 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-black italic">0{idx + 1}</div>
                            <legend className="text-white text-[10px] tracking-widest px-2 bg-black py-1 border border-white/10 rounded">
                                {idx === 0 ? 'TEAM_LEADER' : `MEMBER_0${idx + 1}`}
                            </legend>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <h3 className="text-acm-cyan text-xs border-b border-white/10 pb-2 mb-4">Credentials (Used for Exam Login)</h3>
                                </div>
                                <div>
                                    <label className={labelClass}>Full Name *</label>
                                    <input type="text" required className={inputClass} value={member.name} onChange={e => handleMemberChange(idx, 'name', e.target.value)}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Email Address *</label>
                                    <input type="email" required className={inputClass} value={member.email} onChange={e => handleMemberChange(idx, 'email', e.target.value)}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Exam Password *</label>
                                    <input type="password" required className={inputClass} value={member.password} onChange={e => handleMemberChange(idx, 'password', e.target.value)}/>
                                </div>

                                <div className="md:col-span-3 mt-4">
                                    <h3 className="text-acm-cyan text-xs border-b border-white/10 pb-2 mb-4">Academic Details</h3>
                                </div>
                                <div>
                                    <label className={labelClass}>Enrollment No *</label>
                                    <input type="text" required className={inputClass} value={member.enrollmentNo} onChange={e => handleMemberChange(idx, 'enrollmentNo', e.target.value)}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Roll No *</label>
                                    <input type="text" required className={inputClass} value={member.rollNo} onChange={e => handleMemberChange(idx, 'rollNo', e.target.value)}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Year *</label>
                                    <select required className={inputClass} value={member.year} onChange={e => handleMemberChange(idx, 'year', e.target.value)}>
                                        <option value="">Select Year</option>
                                        <option>FE</option><option>SE</option><option>TE</option><option>BE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Class *</label>
                                    <input type="text" required placeholder="e.g. IT, COMPS" className={inputClass} value={member.class} onChange={e => handleMemberChange(idx, 'class', e.target.value)}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Division *</label>
                                    <input type="text" required placeholder="e.g. A, B" className={inputClass} value={member.div} onChange={e => handleMemberChange(idx, 'div', e.target.value)}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Academic Year</label>
                                    <input type="text" required className={inputClass} value={member.academicYear} onChange={e => handleMemberChange(idx, 'academicYear', e.target.value)}/>
                                </div>
                            </div>
                        </fieldset>
                    ))}

                    <div className="pt-8">
                        <button type="submit" className="w-full py-5 bg-acm-cyan text-black font-bold tracking-widest hover:bg-white transition-all rounded shadow-[0_0_20px_rgba(100,255,218,0.2)]">
                            SUBMIT_REGISTRATION
                        </button>
                        <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest">
                            By registering, you agree to the event code of conduct.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
