import React, { useState, useEffect, useRef } from "react";
import { FiMaximize, FiMinimize, FiCamera } from "react-icons/fi";
import { 
  MdOutlineGavel, 
  MdOutlineHelpOutline, 
  MdLogout, 
  MdOutlineEdit 
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { Input, message } from "antd";
import api from "../utils/axiosInstance";
import useAuth from "../context/useAuth";

export default function Navbar({ darkMode, setDarkMode }) {
  const { admin: authAdmin, logout, updateAdmin } = useAuth();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ New States for Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const admin = authAdmin || { name: "Admin", email: "" };
  
  const [form, setForm] = useState({
    name: admin.name,
    password: "", 
    file: null,
    preview: admin.image?.path || "",
    removeImage: false
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ✅ Updated Handle Update Logic supporting explicit null/removal
  const handleUpdate = async () => {
    setLoading(true);
    try {
      let imageId = admin.image?._id;

      // If user opted to remove image
      if (form.removeImage) {
        imageId = null;
      } 
      // 1. Upload File first if changed
      else if (form.file) {
        const fd = new FormData();
        fd.append("file", form.file);
        fd.append("folder", "admin");
        const res = await api.post(`/files`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageId = res.data.data._id;
      }

      // 2. Update Admin with body including imageId (can be null)
      const body = {
        name: form.name,
        ...(form.password ? { password: form.password } : {}),
        imageId
      };

      const updateRes = await api.patch(`/admins/me`, body);

      if (updateRes.data.success) {
        const updated = { 
          ...admin, 
          name: form.name, 
          image: form.removeImage ? null : (updateRes.data.data.image || admin.image) 
        };
        if (form.password) {
          message.success("Password updated. Please sign in again.");
          logout();
          navigate("/login", { replace: true });
          return;
        }
        updateAdmin(updated);
        message.success("Profile updated successfully");
        setShowEditModal(false);
        setForm((current) => ({ ...current, password: "", removeImage: false }));
      }
    } catch (err) {
      message.error("Update failed " + (err.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  };

//Theme persistence
useEffect(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setDarkMode(savedTheme === "dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);
  }
}, [setDarkMode]);

useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}, [darkMode]);

  return (
    <header className="sticky -mt-1 top-0 z-50 ml-0 flex min-h-18 items-center justify-between border-b border-slate-200 bg-primary px-4 py-2 text-primary shadow-sm lg:ml-[225px] dark:border-slate-700">
    <h1 className="flex ms-12 pt-3 items-center text-xl font-bold tracking-tight lg:ml-0">
  <span className="text-red-400">Admin&nbsp;</span> Panel
</h1>

      <div className="flex items-center gap-4">
        {/* Fullscreen Button - Hidden on Mobile, Block on Desktop */}
        <button 
          onClick={toggleFullscreen} 
          className="hidden lg:block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {isFullscreen ? <FiMinimize className="text-2xl" /> : <FiMaximize className="text-2xl" />}
        </button>

        {/* Dark Mode Toggle */}
        <div
          onClick={() => setDarkMode(!darkMode)}
          className="h-12 w-12 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {!darkMode ? (
            <svg className="fill-violet-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
          ) : (
            <svg className="fill-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path></svg>
          )}
        </div>

        {/* --- Avatar Dropdown --- */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center ml-2 border-l border-gray-300 dark:border-gray-600 pl-4 cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {admin.image?.path ? (
                <img src={admin.image.path} alt="Admin" className="w-10 h-10 rounded-full border-2 border-red-400 object-cover" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold border-2 border-red-400">
                  {admin.name?.charAt(0).toUpperCase()}
                </div>
            )}
          </div>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-64 bg-primary text-primary rounded-2xl shadow-2xl p-6 z-50">
              <div className="flex flex-col items-center mb-4">
                {admin.image?.path ? (
                    <img src={admin.image.path} alt="Profile" className="w-16 h-16 rounded-full border-2 border-orange-500 p-0.5 object-cover mb-3" />
                ) : (
                    <div className="w-16 h-16 bg-orange-500 rounded-full text-white flex items-center justify-center text-2xl font-bold mb-3 shadow-lg">
                      {admin.name?.charAt(0).toUpperCase()}
                    </div>
                )}
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {admin.name}
                </h3>
                <p className=" text-sm">{admin.email}</p>
              </div>

              <div className="border-t border-gray-700/50 my-4"></div>

              <div className="space-y-1">
                <button 
                  onClick={() => { 
                    setForm({
                      name: admin.name,
                      password: "",
                      file: null,
                      preview: admin.image?.path || "",
                      removeImage: false
                    });
                    setShowEditModal(true); 
                    setShowDropdown(false); 
                  }}
                  className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition text-gray-200 text-left"
                >
                  <MdOutlineEdit className="text-xl text-primary" />
                  <span className="text-sm font-medium text-primary">Edit Profile</span>
                </button>

                <button 
                  onClick={() => { navigate("/faqs"); setShowDropdown(false); }}
                  className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition text-gray-200 text-left"
                >
                  <MdOutlineHelpOutline className="text-xl text-primary" />
                  <span className="text-sm font-medium text-primary">FAQ</span>
                </button>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-red-500/10 transition text-red-400 text-left"
                >
                  <MdLogout className="text-xl" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex justify-center items-center p-4">
          <div className="bg-primary text-primary w-full max-w-md rounded-3xl p-8 border border-gray-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-center">Edit Admin Profile</h2>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-3">
                {form.preview ? (
                  <img src={form.preview} className="w-24 h-24 rounded-full object-cover border-2 border-red-400" alt="pfp" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold border-2 border-red-400">
                    {form.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer">
                  <FiCamera className="!text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setForm({...form, file, preview: URL.createObjectURL(file), removeImage: false});
                  }} />
                </label>
              </div>

              {form.preview && (
                <button 
                  type="button" 
                  onClick={() => setForm({...form, file: null, preview: "", removeImage: true})}
                  className="text-red-400 text-xs font-semibold hover:underline"
                >
                  Remove Picture
                </button>
              )}
            </div>

            <div className="space-y-4 bg-primary">
              <Input 
                className="bg-primary !border-gray-700 !h-12 rounded-xl" 
                placeholder="Name"
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
              />
              <Input.Password 
                className="bg-primary !border-gray-700 !h-12 rounded-xl mt-5" 
                placeholder="New password (optional)"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowEditModal(false)} className="cursor-pointer flex-1 py-3 rounded-xl border border-gray-700 hover:bg-slate-100 dark:hover:bg-white/10 transition">Cancel</button>
              <button onClick={handleUpdate} className="cursor-pointer flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg">
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .ant-input::placeholder, .ant-input-password input::placeholder {
          color: #9ca3af !important;
        }
      `}</style>
    </header>
  );
}
