// src/components/GradientButton.js
export default function GradientButton({ children, className="", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 
      bg-gradient-to-r from-[#6a5cff] via-[#7a43ff] to-[#19b6ff]
      hover:opacity-95 active:opacity-90 shadow-[0_8px_30px_rgba(80,56,240,.35)]
      text-white font-semibold ${className}`}
    >
      {children}
    </button>
  );
}
