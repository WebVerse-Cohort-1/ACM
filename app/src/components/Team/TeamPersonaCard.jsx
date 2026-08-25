import { getDirectDriveUrl, getImageStyle } from '../../lib/utils';

const TeamPersonaCard = ({ member }) => (
  <div className="group relative w-[16rem] h-[24rem] bg-[#0A192F] rounded-xl overflow-hidden font-sans transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,0,0,0.8)]">
    <img
      src={getDirectDriveUrl(member.image)}
      alt={member.name}
      style={getImageStyle(member.image)}
      className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent group-hover:from-black/90 opacity-100 transition-all duration-500" />

    <section className="absolute inset-0 p-6 flex flex-col justify-end z-20 pointer-events-none">
      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
        <h2 className="text-xl font-bold text-white mb-0.5 uppercase tracking-tighter">{member.name}</h2>
        <p className="text-acm-cyan font-mono text-[9px] uppercase tracking-widest opacity-80">// {member.role}</p>
      </div>

      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:mt-4">
        <p className="overflow-hidden text-gray-300 text-[10px] leading-relaxed italic">{member.desc}</p>
      </div>

      <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 transform translate-y-2 group-hover:translate-y-0">
        <div className="text-[10px] text-white/40 font-mono flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-acm-cyan animate-pulse" />
          V.NODE
        </div>
        <a
          href={member.linkedin || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto py-2.5 px-6 rounded-full text-[9px] font-black tracking-widest transition-all duration-300 bg-white/10 text-white hover:bg-acm-cyan hover:text-black hover:scale-105"
        >
          CONNECT
        </a>
      </div>
    </section>

    <div className="absolute inset-0 border border-white/5 group-hover:border-white/15 rounded-xl pointer-events-none transition-colors duration-500" />
  </div>
);

export default TeamPersonaCard;
