/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { 
  Users, 
  BadgeCheck, 
  Handshake, 
  TrendingUp, 
  Play, 
  Clock, 
  Share2, 
  Subtitles, 
  Settings, 
  Maximize, 
  ArrowRight,
  Facebook,
  Lock,
  Save,
  Plus,
  Trash2,
  X,
  Edit2,
  Globe,
  MapPin,
  Music2,
  Youtube as YoutubeIcon,
  LogIn,
  LogOut,
  Database
} from "lucide-react";
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc 
} from "firebase/firestore";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from "firebase/auth";
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from "./lib/firebase";

interface AppData {
  header: {
    title: string;
    description: string;
    subTitle: string;
    logoUrl: string;
  };
  features: { label: string }[];
  video: {
    title: string;
    subTitle: string;
    thumbnail: string;
    youtubeId: string;
  };
  contactLinks: { name: string; url: string; type: string }[];
}

const DEFAULT_DATA: AppData = {
  "header": {
    "title": "TÂN PHÁT TOTE & BUILDING",
    "description": "Chuyên thiết kế và thi công kiến trúc, nội thất cao cấp với hơn 15 năm kinh nghiệm, kiến tạo những không gian sống đẳng cấp và bền vững.",
    "subTitle": "TƯ VẤN – THIẾT KẾ – THI CÔNG – CUNG CẤP VẬT LIỆU",
    "logoUrl": "/logo_brand.png"
  },
  "features": [
    {"label": "Đội ngũ chuyên nghiệp"},
    {"label": "Chất lượng vượt trội"},
    {"label": "Cam kết uy tín"},
    {"label": "Giá trị bền vững"}
  ],
  "video": {
    "title": "KIẾN TẠO KHÔNG GIAN SỐNG",
    "subTitle": "Nâng tầm giá trị",
    "thumbnail": "https://lh3.googleusercontent.com/aida-public/AB6AXuB3wB8wIbzzhegra-X6n7KVcD8capy0-X0PJHc3_5lnDIC8h6lu8AfrQ7eoUBGOGmwryaNZlqb93q3i8xG6KJp2ja1B-3sglhWbC3NmUucmCIExpQO2PWnU57hMLTK1cjzxKxyNJGLZ85ZS0ldfAmvfRz8tFieVLpeGTRNPxrEsjdz2XtEQ2aVpcD9rRpRCzh8FZW4OyU8ob0rC2w1IKXjxX7GUvC5GKLjTPv436Hmn8XOgVd8vdtgz4Yma6G0ye1iicMpsT0uEb0CP",
    "youtubeId": "dQw4w9WgXcQ"
  },
  "contactLinks": [
    { "name": "Tân Phát Tote & Building", "url": "https://www.facebook.com/tanphattote", "type": "facebook" },
    { "name": "Tân Phát Luxury", "url": "https://www.facebook.com/tanphatluxury", "type": "facebook" },
    { "name": "Tân Phát Construction", "url": "https://www.facebook.com/tanphatconstruction", "type": "facebook" },
    { "name": "Tân Phát Furniture", "url": "https://www.facebook.com/tanphatfurniture", "type": "facebook" }
  ]
};

const featureIcons = {
  "Đội ngũ chuyên nghiệp": Users,
  "Chất lượng vượt trội": BadgeCheck,
  "Cam kết uy tín": Handshake,
  "Giá trị bền vững": TrendingUp,
};

const socialIcons = {
  facebook: { 
    icon: Facebook, 
    gradient: "linear-gradient(135deg, #1877F2 0%, #0052D4 100%)",
    shadow: "rgba(24, 119, 242, 0.3)"
  },
  youtube: { 
    icon: YoutubeIcon, 
    gradient: "linear-gradient(135deg, #FF0000 0%, #CB0000 100%)",
    shadow: "rgba(255, 0, 0, 0.3)"
  },
  tiktok: { 
    icon: Music2, 
    gradient: "linear-gradient(135deg, #000000 0%, #333333 100%)",
    shadow: "rgba(0, 0, 0, 0.3)"
  },
  maps: { 
    icon: MapPin, 
    gradient: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
    shadow: "rgba(66, 133, 244, 0.3)"
  },
  website: { 
    icon: Globe, 
    gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
    shadow: "rgba(99, 102, 241, 0.3)"
  },
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [isAdminPanel, setIsAdminPanel] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editData, setEditData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  // Sync content from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "content"), (snap) => {
      if (snap.exists()) {
        const d = snap.data() as AppData;
        setData(d);
        setEditData(JSON.parse(JSON.stringify(d)));
      } else {
        // Document doesn't exist yet
        setData(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/content");
    });

    return () => unsub();
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if user is an authorized admin
        // Hardcoded check for the bootstrapping admin
        if (u.email === "showroomvatlieutanphat@gmail.com") {
          setIsAuthorized(true);
        } else {
          // Check admins collection
          try {
            const adminDoc = await getDoc(doc(db, "admins", u.uid));
            setIsAuthorized(adminDoc.exists());
          } catch (e) {
            setIsAuthorized(false);
          }
        }
      } else {
        setIsAuthorized(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdminPanel(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    try {
      await setDoc(doc(db, "settings", "content"), editData);
      alert("Đã lưu thành công!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "settings/content");
      alert("Lỗi khi lưu dữ liệu: Bạn không có quyền hoặc dữ liệu không hợp lệ.");
    }
  };

  const handleSeed = async () => {
    try {
      await setDoc(doc(db, "settings", "content"), DEFAULT_DATA);
      alert("Đã khởi tạo dữ liệu mẫu!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "settings/content");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no data exists yet and not in admin panel, show a helpful message
  if (!data && !isAdminPanel) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-8 text-center text-white">
        <Database className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Chưa có dữ liệu</h2>
        <p className="opacity-70 mb-6">Trang web chưa được thiết lập dữ liệu ban đầu.</p>
        <button 
          onClick={() => setIsAdminPanel(true)}
          className="bg-brand-gold text-white px-8 py-3 rounded-xl font-bold"
        >
          Đến trang quản trị
        </button>
      </div>
    );
  }

  if (isAdminPanel) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              QUẢN TRỊ VIÊN
            </h2>
            <div className="flex items-center gap-2">
              {user && (
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-500 mr-4"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              )}
              <button 
                onClick={() => setIsAdminPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {!user ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm mx-auto mt-20 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-6 italic">Xác thực quyền truy cập</h3>
              <p className="text-sm text-gray-500 mb-6">Vui lòng đăng nhập bằng Google để tiếp tục.</p>
              <button 
                onClick={handleLogin}
                className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Đăng nhập Google
              </button>
            </div>
          ) : !isAuthorized ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm mx-auto mt-20 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Từ chối truy cập</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tài khoản <b>{user.email}</b> không có quyền quản trị.
              </p>
              <button 
                onClick={handleLogout}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!data && (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex flex-col items-center text-center">
                  <Database className="w-10 h-10 text-yellow-500 mb-3" />
                  <h3 className="font-bold text-yellow-800">Cơ sở dữ liệu trống</h3>
                  <p className="text-sm text-yellow-700 mb-4">Bạn cần khởi tạo dữ liệu ban đầu cho trang web.</p>
                  <button 
                    onClick={handleSeed}
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-600"
                  >
                    Khởi tạo dữ liệu mẫu
                  </button>
                </div>
              )}

              {/* Edit Header */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Thông tin chung
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tiêu đề chính</label>
                    <input 
                      value={editData?.header.title || ""}
                      onChange={(e) => setEditData(prev => prev ? {...prev, header: {...prev.header, title: e.target.value}} : null)}
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Mô tả</label>
                    <textarea 
                      value={editData?.header.description || ""}
                      onChange={(e) => setEditData(prev => prev ? {...prev, header: {...prev.header, description: e.target.value}} : null)}
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-primary h-24"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Khẩu hiệu</label>
                    <input 
                      value={editData?.header.subTitle || ""}
                      onChange={(e) => setEditData(prev => prev ? {...prev, header: {...prev.header, subTitle: e.target.value}} : null)}
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Logo URL</label>
                    <input 
                      value={editData?.header.logoUrl || ""}
                      onChange={(e) => setEditData(prev => prev ? {...prev, header: {...prev.header, logoUrl: e.target.value}} : null)}
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-primary"
                      placeholder="/logo_brand.png"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">YouTube Video ID</label>
                    <input 
                      value={editData?.video.youtubeId || ""}
                      onChange={(e) => setEditData(prev => prev ? {...prev, video: {...prev.video, youtubeId: e.target.value}} : null)}
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-primary"
                      placeholder="dQw4w9WgXcQ"
                    />
                  </div>
                </div>
              </section>

              {/* Edit Features */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Dịch vụ/Đặc điểm
                </h3>
                <div className="space-y-3">
                  {editData?.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        value={f.label || ""}
                        onChange={(e) => {
                          const newFeatures = [...(editData?.features || [])];
                          newFeatures[i].label = e.target.value;
                          setEditData(prev => prev ? {...prev, features: newFeatures} : null);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-primary"
                      />
                      <button 
                        onClick={() => {
                          const newFeatures = (editData?.features || []).filter((_, idx) => idx !== i);
                          setEditData(prev => prev ? {...prev, features: newFeatures} : null);
                        }}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditData(prev => prev ? {...prev, features: [...(prev?.features || []), {label: "Dịch vụ mới"}]} : null)}
                    className="flex items-center gap-2 text-primary font-bold text-sm hover:underline mt-2"
                  >
                    <Plus className="w-4 h-4" /> Thêm dịch vụ
                  </button>
                </div>
              </section>

              {/* Edit Contact Links */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
                  <Facebook className="w-4 h-4" /> Liên kết mạng xã hội
                </h3>
                <div className="space-y-4">
                  {editData?.contactLinks.map((link, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-3 relative">
                      <button 
                        onClick={() => {
                          const newLinks = (editData?.contactLinks || []).filter((_, idx) => idx !== i);
                          setEditData(prev => prev ? {...prev, contactLinks: newLinks} : null);
                        }}
                        className="absolute top-2 right-2 p-1 text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Tên hiển thị</label>
                        <input 
                          value={link.name || ""}
                          onChange={(e) => {
                            const newLinks = [...(editData?.contactLinks || [])];
                            newLinks[i].name = e.target.value;
                            setEditData(prev => prev ? {...prev, contactLinks: newLinks} : null);
                          }}
                          className="w-full px-4 py-2 bg-white border-none rounded-lg focus:ring-1 focus:ring-primary mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Loại liên kết</label>
                        <select 
                          value={link.type || ""}
                          onChange={(e) => {
                            const newLinks = [...(editData?.contactLinks || [])];
                            newLinks[i].type = e.target.value;
                            setEditData(prev => prev ? {...prev, contactLinks: newLinks} : null);
                          }}
                          className="w-full px-4 py-2 bg-white border-none rounded-lg focus:ring-1 focus:ring-primary mt-1"
                        >
                          {Object.keys(socialIcons).map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Đường dẫn (URL)</label>
                        <input 
                          value={link.url || ""}
                          onChange={(e) => {
                            const newLinks = [...(editData?.contactLinks || [])];
                            newLinks[i].url = e.target.value;
                            setEditData(prev => prev ? {...prev, contactLinks: newLinks} : null);
                          }}
                          className="w-full px-4 py-2 bg-white border-none rounded-lg focus:ring-1 focus:ring-primary mt-1"
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditData(prev => prev ? {...prev, contactLinks: [...(prev?.contactLinks || []), {name: "Tên mạng xã hội", url: "#", type: "facebook"}]} : null)}
                    className="flex items-center gap-2 text-primary font-bold text-sm hover:underline mt-2"
                  >
                    <Plus className="w-4 h-4" /> Thêm liên kết
                  </button>
                </div>
              </section>

              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
                <button 
                  onClick={handleSave}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-2 hover:bg-brand-red transition-all scale-105 active:scale-95"
                >
                  <Save className="w-5 h-5" /> LƯU THAY ĐỔI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Safety check for data rendering
  if (!data) return null;

  return (
    <div className="min-h-screen bg-background-light">
      {/* Admin Quick Entry (Hidden but accessible) */}
      <div 
        className="fixed top-0 right-0 w-12 h-12 z-50 cursor-default opacity-0 hover:opacity-10"
        onDoubleClick={() => setIsAdminPanel(true)}
      />

      {/* Header Section */}
      <header className="header-gradient text-white pt-3 pb-12 relative text-shadow-none">
        <div className="max-w-md mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-primary/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-5 border-2 border-brand-gold shadow-xl"
            >
              <img 
                alt="Tan Phat Logo" 
                className="rounded-full w-full h-full object-contain" 
                src={data.header.logoUrl || "/logo_brand.png"}
              />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg font-extrabold tracking-[0.05em] mb-3 text-shadow uppercase font-display whitespace-nowrap w-full text-center"
            >
              {data.header.title}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm sm:text-base font-medium leading-relaxed mb-6 text-white/95"
            >
              {data.header.description}
            </motion.p>

            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-px w-20 bg-brand-gold/50 mb-6"
            />

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs sm:text-sm font-bold tracking-[0.15em] mb-8 uppercase text-brand-gold border-y border-brand-gold/20 py-2 w-full"
            >
              {data.header.subTitle}
            </motion.p>

            <div className="grid grid-cols-2 gap-4 w-full">
              {data.features.map((item, id) => {
                const Icon = featureIcons[item.label as keyof typeof featureIcons] || Users;
                return (
                  <motion.div 
                    key={id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + id * 0.1 }}
                    className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-2xl border border-brand-gold/30 flex items-center justify-center mb-3 bg-gradient-to-br from-brand-gold/20 to-transparent shadow-lg" >
                      <Icon className="text-brand-gold w-7 h-7" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold uppercase leading-tight tracking-[0.1em] text-center text-white/95">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 -mt-10 relative z-20 pb-16">
        {/* Video Card */}
        <div className="mb-12">
          <AnimatePresence mode="wait">
            {!showVideo ? (
              <motion.div 
                key="thumbnail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="rounded-2xl overflow-hidden border-4 border-primary shadow-2xl relative bg-black aspect-video group cursor-pointer"
                onClick={() => setShowVideo(true)}
              >
                <img 
                  alt="Modern House Design" 
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" 
                  src={`https://img.youtube.com/vi/${data.video.youtubeId}/maxresdefault.jpg`}
                />
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/20">
                  <div className="flex justify-between items-start text-white">
                    <div className="flex items-center gap-1 opacity-90">
                      <div className="bg-red-600 px-1 rounded text-[8px] font-bold">YouTube</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAdminPanel(true);
                      }}
                      className="flex flex-col items-center opacity-0 group-hover:opacity-60 transition-opacity"
                    >
                      <Settings className="w-4 h-4 mb-0.5" />
                      <span className="text-[8px]">Admin</span>
                    </button>
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-brand-red text-white rounded-2xl w-16 h-12 flex items-center justify-center shadow-lg mb-4"
                    >
                      <Play className="w-8 h-8 fill-current" />
                    </motion.button>
                    <h2 className="text-white text-xl font-bold leading-tight drop-shadow-md font-display uppercase tracking-wider">
                      {data.video.title}
                    </h2>
                    <p className="text-white text-lg italic opacity-90 font-serif mt-1">{data.video.subTitle}</p>
                  </div>

                  <div className="flex justify-between items-center text-white/90 text-[10px]">
                    <div className="flex items-center gap-3">
                      <span>Phát video</span>
                      <div className="w-24 h-1 bg-white/30 rounded-full relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-0 bg-red-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="iframe"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl overflow-hidden border-4 border-primary shadow-2xl relative bg-black aspect-video group"
              >
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${data.video.youtubeId}?autoplay=1`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
                <button 
                  onClick={() => setShowVideo(false)}
                  className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors z-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contact Links Section */}
        <div className="space-y-4">
          {data.contactLinks.map((item, id) => (
            <motion.div 
              key={id}
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: id * 0.1 }}
              className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all border border-gray-100 group cursor-pointer"
              onClick={() => window.open(item.url, "_blank")}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg transition-transform group-hover:scale-110"
                  style={{ 
                    background: socialIcons[item.type as keyof typeof socialIcons]?.gradient || "#1877F2",
                    boxShadow: `0 8px 16px -4px ${socialIcons[item.type as keyof typeof socialIcons]?.shadow || "rgba(0,0,0,0.2)"}`
                  }}
                >
                  {(() => {
                    const Icon = socialIcons[item.type as keyof typeof socialIcons]?.icon || Facebook;
                    return <Icon className="w-6 h-6 stroke-[2.5]" />;
                  })()}
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-primary text-sm group-hover:text-brand-red transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    {item.type}
                  </span>
                </div>
              </div>
              <button className="bg-primary hover:bg-brand-red text-white w-24 h-8 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shrink-0">
                Lượt xem
                <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-10 text-white/40 text-[10px] tracking-widest uppercase">
        <p>© {new Date().getFullYear()} Tân Phát Tote & Building. All rights reserved.</p>
        <button 
          onClick={() => setIsAdminPanel(true)}
          className="mt-4 text-brand-gold/60 hover:text-brand-gold transition-colors font-bold"
        >
          TRÌNH QUẢN LÝ
        </button>
      </footer>
    </div>
  );
}

