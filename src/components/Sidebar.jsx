import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { MdDashboard, MdOutlineFeedback } from "react-icons/md";
import { PiFlagBannerFill, PiCity } from "react-icons/pi";
import { IoMdSettings } from "react-icons/io";
import { FaCar, FaQuestion, FaUserShield, FaUsers } from "react-icons/fa";
import { IoIosVideocam } from "react-icons/io";
import { TbAffiliate, TbBuildingEstate, TbBoxModel } from "react-icons/tb";
import { BiSupport } from "react-icons/bi";
import { HiMenu, HiX } from "react-icons/hi";
import { BsCameraReels } from "react-icons/bs";
import logo from "../assets/carspar-logo.png";
import useAuth from "../context/useAuth";

export default function Sidebar() {
  const { admin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = () => setIsOpen((current) => !current);

  const linkStyle = ({ isActive }) =>
    isActive
      ? "flex w-full gap-2 rounded-md bg-blue-500 py-2 pl-3 text-sm font-medium text-white transition-all duration-200"
      : "flex w-full gap-2 rounded-md py-2 pl-3 text-sm text-primary transition-all duration-200 hover:bg-yellow-400 hover:pl-4 hover:text-black";
  const iconClass = "mt-1 shrink-0 text-sm text-inherit";

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const NavigationLinks = () => (
    <div className="hide-scrollbar flex-1 overflow-y-auto pb-6">
      <div className="flex flex-col pt-1">
        <p className="text-xs font-semibold text-primary">Dashboard</p>
        <div className="flex flex-col gap-2 pt-1">
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/dashboard"><MdDashboard className={iconClass} />Dashboard</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/banner"><PiFlagBannerFill className={iconClass} />Banner</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/car"><FaCar className={iconClass} />Car</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/faqs"><FaQuestion className={iconClass} />FAQ</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/videos"><IoIosVideocam className={iconClass} />Video</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/user"><FaUsers className={iconClass} />Users</NavLink>
        </div>
      </div>

      <div className="flex flex-col pt-3">
        <p className="text-xs font-semibold text-primary">Car Specs</p>
        <div className="flex flex-col gap-2 pt-1">
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/brands"><TbBoxModel className={iconClass} />Brand-Model-Variant</NavLink>
        </div>
      </div>

      <div className="flex flex-col pt-3">
        <p className="text-xs font-semibold text-primary">Location</p>
        <div className="flex flex-col gap-2 pt-1">
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/state"><TbBuildingEstate className="mt-0.5 shrink-0 text-lg" />State</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/city"><PiCity className="mt-0.5 shrink-0 text-lg" />City</NavLink>
        </div>
      </div>

      <div className="flex flex-col pt-4">
        <p className="text-xs font-semibold text-primary">Others</p>
        <div className="flex flex-col gap-2 pt-2">
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/support"><BiSupport className={iconClass} />Support</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/setting"><IoMdSettings className={iconClass} />Settings</NavLink>
          {admin?.role === "super_admin" && (
            <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/admins"><FaUserShield className={iconClass} />Admin Management</NavLink>
          )}
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/affiliates"><TbAffiliate className={iconClass} />Affiliates</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/feedback"><MdOutlineFeedback className={iconClass} />Feedback</NavLink>
          <NavLink onClick={() => setIsOpen(false)} className={linkStyle} to="/reels"><BsCameraReels className={iconClass} />Reel Videos</NavLink>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-56 flex-col bg-primary p-3 pt-5 text-primary shadow-xl lg:flex">
  <div className="mb-5 flex h-10 items-center px-1">
    <img
      src={logo}
      alt="Carspar"
      className="h-8 w-auto object-contain"
    />
  </div>

  <NavigationLinks />
</aside>

      <div className="fixed left-4 top-4 z-[100] lg:hidden">
 <button 
  type="button" 
  aria-label="Open navigation" 
  onClick={toggleDrawer} 
  className="rounded-lg p-2 text-primary hover:bg-black/5 dark:hover:bg-white/10"
>
  <HiMenu className="h-6 w-6" />
</button>
</div>

<div
  aria-hidden="true"
  className={`fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm transition-all duration-300 lg:hidden ${
    isOpen ? "visible opacity-100" : "invisible opacity-0"
  }`}
  onClick={toggleDrawer}
/>

<aside
  className={`fixed inset-y-0 left-0 z-[120] flex w-72 transform flex-col bg-primary p-5 text-primary shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
    isOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
  <div className="mb-8 flex items-center justify-between">
    <img
      className="h-8 w-auto object-contain"
      src={logo}
      alt="Carspar"
    />

    <button
      type="button"
      aria-label="Close navigation"
      onClick={() => setIsOpen(false)}
      className="shrink-0 p-1 text-4xl text-primary"
    >
      <HiX className="h-5 w-5" />
    </button>
  </div>

  <NavigationLinks />
</aside>
    </>
  );
}
