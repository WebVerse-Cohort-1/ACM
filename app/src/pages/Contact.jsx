import { useState } from 'react';
import { API_BASE_URL } from '../lib/utils';
import SEO from '../components/ui/SEO';
import TiltCard from '../components/ui/TiltCard';
import MagneticButton from '../components/ui/MagneticButton';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _type: 'contactMessage',
          ...form,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: '', email: '', message: '' });
      } else {
        alert('Failed to send. Please try again.');
      }
    } catch {
      alert('Network error — check if the API is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-3 md:p-6 pt-16 relative overflow-hidden bg-black">
      <SEO
        title="Contact | ACM TSEC"
        description="Get in touch with ACM TSEC for collaborations, queries, or to join our community."
        url="https://acm-tsec.com/contact"
      />

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.02)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%] pointer-events-none z-0" />

      <div className="w-full max-w-4xl relative z-10 mt-8">
        <TiltCard className="bg-black/95 md:bg-black/90 md:border md:border-acm-cyan/30 backdrop-blur-2xl rounded-2xl md:rounded-xl shadow-[0_0_80px_rgba(0,255,136,0.08)] overflow-hidden relative group p-0 border border-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-acm-cyan to-transparent opacity-40" />

          {/* Mobile Terminal Header */}
          <div className="md:hidden flex justify-between items-center p-3.5 border-b border-white/10 bg-white/5 font-mono text-[9px] tracking-widest text-acm-cyan">
            <span>:: SESSION_TERMINAL_v4.2</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-acm-cyan rounded-full animate-ping" />
              UPLINK_LIVE
            </span>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left: Info Panel */}
            <div className="w-full md:w-5/12 p-5 md:p-8 border-b md:border-b-0 md:border-r border-white/10 bg-white/2 relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <h1 className="text-3xl font-heading font-bold text-white mb-4 uppercase tracking-tighter">UPLINK</h1>

                <div className="space-y-3 font-mono text-xs relative z-10 mb-4">
                  <div className="group cursor-pointer">
                    <label className="text-[9px] text-gray-500 block mb-1 ml-1"># TARGET_HQ</label>
                    <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg group-hover:border-acm-cyan/40 transition-all flex flex-col gap-0.5 text-gray-400 group-hover:text-white group-hover:bg-acm-cyan/5">
                      <div className="flex items-center space-x-2">
                        <span className="text-acm-cyan text-sm">⊕</span>
                        <span className="text-[11px]">Thakur Complex, Kandivali (E), Mumbai</span>
                      </div>
                      <div className="ml-6 text-[8px] text-gray-500 italic">TSEC • 1st Floor • CO Staffroom</div>
                      <div className="ml-6 text-[9px] font-mono text-acm-cyan/40 group-hover:text-acm-cyan/80 transition-colors">
                        LAT: 19.213683 | LON: 72.864668
                      </div>
                    </div>
                  </div>
                  <div className="group cursor-pointer">
                    <label className="text-[9px] text-gray-500 block mb-1 ml-1"># EMAIL</label>
                    <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg group-hover:border-acm-cyan/40 transition-all flex items-center space-x-2 text-gray-400 group-hover:text-white group-hover:bg-acm-cyan/5">
                      <span className="text-acm-cyan text-sm">@</span>
                      <span className="text-[11px] uppercase">ACMCO@TSECMUMBAI.IN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="relative group/map mt-4">
                <label className="text-[9px] text-gray-500 block mb-1.5 font-mono uppercase tracking-widest px-1 flex justify-between">
                  <span>[ SCANNING_COORDINATES ]</span>
                  <span className="text-acm-cyan animate-pulse">HQ_LOCKED</span>
                </label>
                <div className="w-full h-32 md:h-44 rounded-lg overflow-hidden border border-white/10 relative grayscale brightness-75 contrast-125 group-hover/map:grayscale-0 group-hover/map:brightness-100 transition-all duration-700">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3767.8927005470253!2d72.86247937466826!3d19.213038647312154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b0e5faf7047b%3A0x696803713d2f2b3b!2sThakur%20Shyamnarayan%20Engineering%20College!5e0!3m2!1sen!2sin!4v1716900000000"
                    className="w-full h-full border-0 invert-[.9] hue-rotate-[160deg]"
                    allowFullScreen=""
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-acm-cyan/5 pointer-events-none group-hover/map:opacity-0 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Right: Message Form */}
            <div className="w-full md:w-7/12 p-5 md:p-8 bg-black/40 md:bg-black/20 relative flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">[ ]</div>
              <div className="absolute bottom-0 left-0 p-2 opacity-20 pointer-events-none">[_]</div>

              {submitted ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">✓</div>
                  <h2 className="text-xl font-heading font-bold text-acm-cyan uppercase tracking-tighter mb-2">SIGNAL_SENT</h2>
                  <p className="text-gray-400 text-xs mb-4">Your message has been logged in our system.</p>
                  <button onClick={() => setSubmitted(false)} className="border border-white/20 px-5 py-2.5 text-xs font-mono text-acm-cyan hover:bg-acm-cyan hover:text-black transition-all">
                    [NEW_MESSAGE]
                  </button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="group relative">
                    <input
                      type="text"
                      required
                      placeholder=" "
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 py-2.5 text-white focus:border-acm-cyan outline-none transition-all peer pt-5 font-mono text-xs"
                    />
                    <label className="absolute left-0 top-5 text-gray-500 text-[10px] peer-focus:text-acm-cyan peer-focus:-translate-y-5 peer-[:not(:placeholder-shown)]:-translate-y-5 transition-all font-mono uppercase tracking-widest">
                      // USER_ID
                    </label>
                    <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300" />
                  </div>

                  <div className="group relative">
                    <input
                      type="email"
                      required
                      placeholder=" "
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 py-2.5 text-white focus:border-acm-cyan outline-none transition-all peer pt-5 font-mono text-xs"
                    />
                    <label className="absolute left-0 top-5 text-gray-500 text-[10px] peer-focus:text-acm-cyan peer-focus:-translate-y-5 peer-[:not(:placeholder-shown)]:-translate-y-5 transition-all font-mono uppercase tracking-widest">
                      // EMAIL
                    </label>
                    <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300" />
                  </div>

                  <div className="group relative">
                    <textarea
                      rows="2"
                      required
                      placeholder=" "
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 py-2.5 text-white focus:border-acm-cyan outline-none transition-all peer pt-5 resize-none font-mono text-xs leading-relaxed"
                    />
                    <label className="absolute left-0 top-5 text-gray-500 text-[10px] peer-focus:text-acm-cyan peer-focus:-translate-y-5 peer-[:not(:placeholder-shown)]:-translate-y-5 transition-all font-mono uppercase tracking-widest">
                      // MESSAGE
                    </label>
                    <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300" />
                  </div>

                  <div className="pt-4">
                    <MagneticButton
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-acm-cyan/10 border border-acm-cyan/30 text-acm-cyan font-bold tracking-[0.25em] hover:bg-acm-cyan hover:text-black transition-all duration-500 group relative overflow-hidden rounded-lg disabled:opacity-60"
                    >
                      <span className="relative z-10 text-xs">
                        {submitting ? 'TRANSMITTING...' : 'INITIATE_HANDSHAKE'}
                      </span>
                      <div className="absolute inset-0 bg-acm-cyan transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 origin-bottom" />
                    </MagneticButton>
                    <p className="text-[7.5px] font-mono text-gray-600 mt-3 text-center md:text-left opacity-40">
                      SIGNAL_WILL_BE_LOGGED_IN_SANITY_STUDIO...
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </TiltCard>
      </div>
    </main>
  );
};

export default Contact;
