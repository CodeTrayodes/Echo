// src/components/PermissionsModal.js
"use client";
import { useEffect, useState } from "react";

export default function PermissionsModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Ask once per browser (simple localStorage flag)
    if (!localStorage.getItem("mi_permissions_prompted")) setShow(true);
  }, []);

  async function requestPerms() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStorage.setItem("mi_permissions_prompted", "1");
      setShow(false);
    } catch (e) { /* user will see browser prompt again on start */ setShow(false); }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101528] p-6">
        <h3 className="text-xl font-bold mb-2">Enable Camera & Microphone</h3>
        <p className="text-white/70 text-sm">
          We use your mic for speech and the camera for a realistic experience. We don’t record your video.
        </p>
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80">Not now</button>
          <button onClick={requestPerms} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6a5cff] via-[#7a43ff] to-[#19b6ff] font-semibold">Allow</button>
        </div>
      </div>
    </div>
  );
}
