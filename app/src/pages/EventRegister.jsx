import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSanityData } from '../hooks/useSanityData';
import { QUERIES } from '../lib/sanity';
import { API_BASE_URL } from '../lib/utils';
import SEO from '../components/ui/SEO';

const inputClass = 'w-full bg-[#060f1e] border border-white/10 p-3.5 text-white rounded-lg focus:border-acm-cyan outline-none transition-all placeholder:text-gray-600 text-sm';
const labelClass = 'block text-[10px] text-acm-cyan/70 font-mono uppercase tracking-[0.2em] mb-1.5';

const EventRegister = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: event, loading } = useSanityData(QUERIES.EVENT_BY_SLUG, { slug }, null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', team: '', year: '', branch: '', college: 'TSEC', message: '', members: [] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = {
      _type: 'registration',
      name: form.name,
      email: form.email,
      phone: form.phone,
      team: form.team,
      year: form.year,
      branch: form.branch,
      college: form.college,
      message: form.message,
      eventSlug: slug,
      members: form.members,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        alert(`Registration failed: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Failed to submit. Check if the API server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-acm-cyan font-mono animate-pulse">:: LOADING...</div>;

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-acm-cyan font-mono mb-4">EVENT_NOT_FOUND</p>
        <button onClick={() => navigate('/events')} className="border border-white/20 px-6 py-3 text-sm hover:bg-white/5">← Back to Events</button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 md:px-20 text-white">
      <SEO title={`Register — ${event.title} | ACM TSEC`} description={`Register for ${event.title} by ACM TSEC.`} url={`https://acm-tsec.com/events/${slug}/register`} />

      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <button onClick={() => navigate(`/events/${slug}`)} className="text-[10px] font-mono text-gray-500 hover:text-acm-cyan mb-6 flex items-center gap-2 transition-colors">
            ← BACK_TO_EVENT
          </button>
          <div className="border-l-4 border-acm-cyan pl-6 mb-8">
            <p className="text-acm-cyan font-mono text-[10px] tracking-[0.3em] mb-1">// EVENT_REGISTRATION</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter">{event.title}</h1>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-20 border border-acm-cyan/20 rounded-2xl bg-acm-cyan/5">
            <div className="text-6xl mb-6">✓</div>
            <h2 className="text-3xl font-heading font-bold text-acm-cyan mb-4 uppercase tracking-tighter">Registration_Logged</h2>
            <p className="text-gray-400 text-sm mb-2">Your entry has been recorded in the system.</p>
            <p className="text-gray-600 font-mono text-[10px] mb-10">:: Confirmation will be sent to {form.email}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => navigate(`/events/${slug}`)} className="border border-white/20 px-6 py-3 text-sm hover:bg-white/5 transition-all">← Event Page</button>
              <button onClick={() => navigate('/events')} className="bg-acm-cyan text-black px-6 py-3 text-sm font-bold hover:bg-white transition-all">Browse Events</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <fieldset className="p-6 border border-white/10 rounded-xl bg-[#0a192f] shadow-xl space-y-4">
              <div className="text-acm-cyan font-mono text-[10px] tracking-widest mb-2">// PERSONAL_INFO</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input type="text" required placeholder="John Doe" className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input type="tel" required placeholder="9876543210" maxLength="10" className={inputClass} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" required placeholder="you@example.com" className={inputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </fieldset>

            {/* Academic Info */}
            <fieldset className="p-6 border border-white/10 rounded-xl bg-[#0a192f] shadow-xl space-y-4">
              <div className="text-acm-cyan font-mono text-[10px] tracking-widest mb-2">// ACADEMIC_INFO</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Year *</label>
                  <select required className={inputClass} value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                    <option value="">Select Year</option>
                    <option>FY</option><option>SY</option><option>TY</option><option>LY</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Branch *</label>
                  <select required className={inputClass} value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                    <option value="">Select Branch</option>
                    <option>CS</option><option>IT</option><option>EXTC</option><option>MECH</option><option>CIVIL</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>College</label>
                  <input type="text" placeholder="TSEC" className={inputClass} value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
                </div>
              </div>
            </fieldset>

            {/* Team Info */}
            <fieldset className="p-6 border border-white/10 rounded-xl bg-[#0a192f] shadow-xl space-y-4">
              <div className="text-acm-cyan font-mono text-[10px] tracking-widest mb-2">// TEAM_INFO</div>
              <div>
                <label className={labelClass}>Team Name (leave blank if solo)</label>
                <input type="text" placeholder="Team Binary_Bards" className={inputClass} value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} />
              </div>

              {event.maxTeamSize > 1 && (
                <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">// TEAM_MATES ({form.members.length + 1} / {event.maxTeamSize})</p>
                    {form.members.length < event.maxTeamSize - 1 && (
                      <button type="button" onClick={() => setForm({ ...form, members: [...form.members, { name: '', email: '' }] })} className="text-[10px] text-acm-cyan font-mono border border-acm-cyan/30 px-3 py-1 rounded hover:bg-acm-cyan hover:text-black transition-all">
                        [+] ADD_MEMBER
                      </button>
                    )}
                  </div>
                  {form.members.map((member, idx) => (
                    <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-lg space-y-3 relative">
                      <button type="button" onClick={() => setForm({ ...form, members: form.members.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 text-red-500 font-bold p-1 hover:bg-red-500/10 rounded">✕</button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input required className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white" placeholder="Name" value={member.name} onChange={e => { const nm = form.members.map((m, i) => i === idx ? { ...m, name: e.target.value } : m); setForm({ ...form, members: nm }); }} />
                        <input required type="email" className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white" placeholder="Email" value={member.email} onChange={e => { const nm = form.members.map((m, i) => i === idx ? { ...m, email: e.target.value } : m); setForm({ ...form, members: nm }); }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className={labelClass}>Message / Query (optional)</label>
                <textarea placeholder="Any questions for the organizers..." rows="3" className={inputClass + ' resize-none'} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
            </fieldset>

            <button type="submit" disabled={submitting} className="w-full py-5 bg-acm-cyan text-black font-bold tracking-[0.3em] uppercase hover:bg-white transition-all text-sm shadow-[0_0_30px_rgba(100,255,218,0.15)] active:scale-[0.98] disabled:opacity-60">
              {submitting ? 'SUBMITTING...' : 'CONFIRM_REGISTRATION'}
            </button>
            <p className="text-[9px] font-mono text-gray-600 text-center">BY SUBMITTING, YOU AGREE TO THE PROTOCOLS OF TSEC ACM CHAPTER.</p>
          </form>
        )}
      </div>
    </main>
  );
};

export default EventRegister;
