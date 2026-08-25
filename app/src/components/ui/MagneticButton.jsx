import { useRef, useState } from 'react';

const MagneticButton = ({ children, className, onClick, as: Component = 'button', ...props }) => {
  const btnRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.3;
    const y = (clientY - (top + height / 2)) * 0.3;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  return (
    <Component
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className={`transition-transform duration-200 ease-out ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default MagneticButton;
