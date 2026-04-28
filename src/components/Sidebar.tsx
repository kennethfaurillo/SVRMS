import { useState } from "react";
import {ChartColumnIcon, ClipboardClockIcon, FileTextIcon, HomeIcon, MapPinCheckIcon, UserIcon, MenuIcon, XIcon, UsersIcon, CarIcon, BikeIcon, ClipboardIcon, DropletIcon, WrenchIcon } from "lucide-react";
import { Link, useRoute } from "wouter-preact";
import { useAuth } from "../contexts/AuthContext";

interface SidebarSubItem {
  label: string;
  path: string;
  icon: preact.JSX.Element;
}

interface SidebarItem {
  label: string;
  path: string;
  icon: preact.JSX.Element;
  subItems?: SidebarSubItem[];
  allowedRoles?: string[]; 
}

const sidebarItems: SidebarItem[] = [
  { label: "Request Form", path: "/request-form", icon: <FileTextIcon stroke="white" size={20} /> },
  { label: "Requests", path: "/requests", icon: <ClipboardClockIcon stroke="white" size={20} /> },
  { label: "Approved Trips", path: "/trips", icon: <MapPinCheckIcon stroke="white" size={20} /> },
  {
    label: "Maintenance",
    path: "/maintenance",
    icon: <ClipboardClockIcon stroke="white" size={20} />,
    subItems: [
      { label: "Automotive", path: "/maintenance/automotive", icon: <CarIcon stroke="white" size={16} /> },
      { label: "Motorcycle/Trimobile", path: "/maintenance/motorcycle", icon: <BikeIcon stroke="white" size={16} /> },
    ],
    allowedRoles: ["admin", "mechanic", "driver"]
  },
 {
    label: "Equipment Borrow",
    path: "/borrow-form",                    
    icon: <FileTextIcon stroke="white" size={20} />,
    subItems: [
      { 
        label: "Borrow Form", 
        path: "/borrow-form",                
        icon: <FileTextIcon stroke="white" size={16} /> 
      },
      { 
        label: "Borrow Requests", 
        path: "/borrow-requests",            
        icon: <ClipboardClockIcon stroke="white" size={16} /> 
      },
      { 
  label: "Checklist", 
  path: "/borrow-checklist", 
  icon: <ClipboardIcon stroke="white" size={16} /> 
},
    ],
  },
  { label: "Analytics", path: "/analytics", icon: <ChartColumnIcon stroke="white" size={20} /> },
    { label: "Management", path: "/management", icon: <UsersIcon stroke="white" size={20} /> },

  {
    label: "Reports",
    path: "/reports",
    icon: <ClipboardIcon stroke="white" size={20} />,
    allowedRoles: ["admin"],
    subItems: [
      { label: "Fuel Reports", path: "/fuel-reports", icon: <DropletIcon stroke="white" size={16} /> },
        { label: "Maintenance Reports", path: "/maintenance-reports", icon: <WrenchIcon stroke="white" size={16} /> },
      {
  label: "Borrow Report",
  path: "/borrow-report",
  icon: <ClipboardIcon stroke="white" size={16} />
}
    
    
    ],
  },
  
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
 const { user, isAdmin, userProfile } = useAuth();
  const username = userProfile?.name || user?.displayName || user?.email;

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderItem = (item: SidebarItem, isMobile = false) => {
    const [isActive] = useRoute(item.path);
    const hasSubItems = !!item.subItems?.length;

    // Check if any sub-item is active
    const isSubActive = hasSubItems && item.subItems!.some((sub) => useRoute(sub.path)[0]);

    // For items without subItems, just return a Link
    if (!hasSubItems) {
      return (
        <Link
          key={item.label}
          href={item.path}
          className={`flex items-center gap-x-2 p-2 sm:p-3 my-1 rounded text-white cursor-pointer ${
            isActive ? "bg-blue-800 font-semibold" : "hover:bg-blue-500 font-light"
          }`}
          onClick={() => isMobile && setMobileOpen(false)}
        >
          {item.icon}
          <span className="text-sm sm:text-base">{item.label}</span>
        </Link>
        
      );
    }
    const currentRole = (userProfile?.role || "").toLowerCase();
    const isAdminUser = isAdmin || currentRole === "admin";

    if (item.allowedRoles) {
      const hasAccess = item.allowedRoles.some(role => {
        if (role === "admin") return isAdminUser;
        return role === currentRole;
      });

      if (!hasAccess) {
        return null; // Huwag ipakita ang item
      }
    }

    // For items with subItems (dropdown)
    return (
      <div key={item.label} className="relative">
        <div
          className={`flex items-center justify-between w-full cursor-pointer p-2 sm:p-3 my-1 rounded ${
            isActive || isSubActive ? "bg-blue-800 font-semibold" : "hover:bg-blue-500 font-light"
          }`}
          onClick={() => toggleDropdown(item.label)}
        >
          <div className="flex items-center gap-x-2">
            {item.icon}
            <span className="text-white text-sm sm:text-base">{item.label}</span>
          </div>
          <span className="text-white">{openDropdowns[item.label] ? "▾" : "▸"}</span>
        </div>

        {openDropdowns[item.label] && (
          <div
            className={`ml-4 flex flex-col ${
              isMobile
                ? "bg-blue-700 rounded p-1 mt-1"
                : "absolute top-0 left-full mt-0 shadow-lg rounded-md bg-blue-700"
            }`}
          >
            {item.subItems!.map((sub) => {
              const [isSubItemActive] = useRoute(sub.path);
              return (
                <Link
                  key={sub.label}
                  href={sub.path}
                  className={`flex items-center gap-x-2 p-2 rounded text-white hover:bg-blue-600 ${
                    isSubItemActive ? "bg-blue-800 font-semibold" : ""
                  }`}
                  onClick={() => isMobile && setMobileOpen(false)}
                >
                  {sub.icon}
                  <span className="text-sm">{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="sm:hidden bg-blue-600 p-3 flex items-center justify-between">
        <Link href="/" aria-label="Home">
          <div className="flex items-center gap-x-2">
            <HomeIcon size={24} stroke="white" />
            <span className="text-white font-medium">Home</span>
          </div>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
          {mobileOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileOpen(false)}>
          <div className="bg-blue-600 w-64 h-full p-3" onClick={(e) => e.stopPropagation()}>
            {sidebarItems.map((item) => renderItem(item, true))}
                        <div className="absolute bottom-0 w-full border-t border-white/40 p-3 flex gap-x-2 bg-blue-700">
              <UserIcon className="bg-blue-400 rounded-full p-1.5" stroke="white" size={32} />
              <div>
                <div className="text-sm font-sans font-medium text-white">
                  {userProfile?.name || user?.email?.split("@")[0] || "User"}
                </div>
                <div className="text-xs text-gray-300/80">
                  {userProfile?.position || userProfile?.role || (isAdmin ? "Admin" : "User")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex relative w-50 min-h-screen flex-col bg-blue-600">
        <Link href="/" className="p-3 border-b border-blue-700 flex items-center gap-x-2 text-white">
          <HomeIcon size={24} stroke="white" /> Home
        </Link>
        <nav className="flex-1 p-2">{sidebarItems.map((item) => renderItem(item))}</nav>
                  <div className="absolute bottom-0 w-full border-t border-white/40 p-3 flex gap-x-2 bg-blue-700">
          <UserIcon className="bg-blue-400 rounded-full p-1.5" stroke="white" size={32} />
          <div>
            <div className="text-sm font-sans font-medium text-white">
              {userProfile?.name || user?.email?.split("@")[0] || "User"}
            </div>
            <div className="text-xs text-gray-300/80">
              {userProfile?.position || userProfile?.role || (isAdmin ? "Admin" : "User")}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}