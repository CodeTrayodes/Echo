// src/components/SectionCard.js
export default function SectionCard({ children, className="" }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,.05)] ${className}`}>
      {children}
    </div>
  );
}
