const GlitchText = ({ text, className }) => (
  <div className={`relative inline-block group ${className}`}>
    <span className="relative z-10">{text}</span>
    <span className="absolute top-0 left-0 -z-10 w-full h-full text-acm-blue opacity-0 group-hover:opacity-70 group-hover:translate-x-[2px] transition-all duration-100 animate-pulse">
      {text}
    </span>
    <span className="absolute top-0 left-0 -z-10 w-full h-full text-acm-cyan opacity-0 group-hover:opacity-70 group-hover:-translate-x-[2px] transition-all duration-100 delay-75 animate-pulse">
      {text}
    </span>
  </div>
);

export default GlitchText;
