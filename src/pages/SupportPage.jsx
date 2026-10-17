import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { message } from "antd";
import LoadingOverlay from "../components/LoadingOverlay"; 
import { 
  MessageCircle, 
  Mail, 
  Video, 
  Globe, 
  Share2, 
  AtSign, 
  Save,
  Send
} from "lucide-react";

const API_SUPPORT = "/support";

// Fallback inline SVG for LinkedIn to prevent lucide-react version export errors
const LinkedinIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [form, setForm] = useState({
    whatsappLink: "",
    email: "",
    youtube: "",
    youtube2: "",
    instagram: "",
    facebook: "",
    threads: "",
    telegram: "",
    linkedin: "",
  });

  useEffect(() => {
    fetchSupport();
  }, []);

  const fetchSupport = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_SUPPORT);
      if (res.data?.data) {
        const support = res.data.data;
        setForm({
          whatsappLink: support.whatsappLink || "",
          email: support.email || "",
          youtube: support.youtube || "",
          youtube2: support.youtube2 || "",
          instagram: support.instagram || "",
          facebook: support.facebook || "",
          threads: support.thread || support.threads || "",
          telegram: support.telegram || "",
          linkedin: support.linkedin || "",
        });
      }
    } catch (err) {
      console.error("Error fetching support info:", err);
      message.error("Failed to load support information");
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (key) => {
    setSavingKey(key);
    
    // Map internal key to backend key if different
    const backendKey = key === "threads" ? "thread" : key;
    const payload = { [backendKey]: form[key] };

    try {
      await api.put(API_SUPPORT, payload);
      message.success(`${key.charAt(0).toUpperCase() + key.slice(1)} updated successfully`);
    } catch (err) {
      console.error(`Error saving ${key}:`, err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to save";
      message.error(errorMsg);
    } finally {
      setSavingKey(null);
    }
  };

  const getFieldMeta = (key) => {
    switch (key) {
      case "whatsappLink": 
        return { icon: <MessageCircle className="w-4 h-4 text-emerald-500" />, label: "WhatsApp Channel", placeholder: "https://whatsapp.com/channel/..." };
      case "email": 
        return { icon: <Mail className="w-4 h-4 text-blue-500" />, label: "Email Address", placeholder: "Enter support email" };
      case "youtube": 
        return { icon: <Video className="w-4 h-4 text-red-500" />, label: "YouTube Main", placeholder: "https://youtube.com/..." };
      case "youtube2": 
        return { icon: <Video className="w-4 h-4 text-rose-400" />, label: "YouTube Secondary", placeholder: "https://youtube.com/..." };
      case "instagram": 
        return { icon: <Globe className="w-4 h-4 text-pink-500" />, label: "Instagram Link", placeholder: "https://instagram.com/..." };
      case "facebook": 
        return { icon: <Share2 className="w-4 h-4 text-indigo-500" />, label: "Facebook Link", placeholder: "https://facebook.com/..." };
      case "threads": 
        return { icon: <AtSign className="w-4 h-4 text-purple-500" />, label: "Threads Link", placeholder: "https://threads.net/..." };
      case "telegram": 
        return { icon: <Send className="w-4 h-4 text-sky-500" />, label: "Telegram Link", placeholder: "https://t.me/..." };
      case "linkedin": 
        return { icon: <LinkedinIcon className="w-4 h-4 text-blue-600" />, label: "LinkedIn Link", placeholder: "https://linkedin.com/in/..." };
      default: 
        return { icon: null, label: key, placeholder: "" };
    }
  };

  const renderCard = (key) => {
    const meta = getFieldMeta(key);
    const isSaving = savingKey === key;

    return (
      <div key={key} className="bg-secondary p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between transition-all duration-200 hover:shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800/60">{meta.icon}</span>
            <h2 className="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {meta.label}
            </h2>
          </div>

          <input
            type="text"
            value={form[key] || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={meta.placeholder}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl mb-1 bg-primary text-primary focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <span className="text-xs text-gray-400 mt-4"> </span>

        <button
          onClick={() => saveField(key)}
          disabled={isSaving}
          className="mt-4 w-full !text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] py-2 px-4 rounded-xl transition-all duration-150 font-medium text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-70"
        >
          {isSaving ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? "Saving..." : `Save ${meta.label.split(' ')[0]}`}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="bg-primary text-primary min-h-[85vh] p-4 sm:p-6 rounded-2xl card-shadow shadow-sm relative overflow-y-auto">
      {loading && <LoadingOverlay />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-blue-500">
            Support & Social Links
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your organization's support channels and official social handles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.keys(form).map((key) => renderCard(key))}
      </div>
    </div>
  );
}