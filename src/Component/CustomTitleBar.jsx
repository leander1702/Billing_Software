// components/CustomTitleBar.jsx
import { useEffect } from 'react';

const CustomTitleBar = () => {
  useEffect(() => {
    const { ipcRenderer } = window.require('electron');
  }, []);

  return (
    <div className="w-full bg-gray-800 text-white h-10 flex items-center justify-between px-4 select-none drag">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <img src="logo.png" alt="Logo" className="h-6" />
        <span className="text-sm font-semibold">My Company</span>
        <button className="text-sm hover:underline">Help</button>
        <button className="text-sm hover:underline">Refresh</button>
      </div>

      {/* Center Section */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-sm">
        📞 Customer Support: 1800-123-456
      </div>

      {/* Right Empty Section to balance flex */}
      <div style={{ width: 100 }} />
    </div>
  );
};

export default CustomTitleBar;
