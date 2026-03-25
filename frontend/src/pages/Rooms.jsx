import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io.connect("http://localhost:5000");

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [profilePic, setProfilePic] = useState(localStorage.getItem('profilePic') || 'https://via.placeholder.com/40');
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!userId) return navigate('/login');
    fetchRooms();
  }, [userId, navigate]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rooms');
      setRooms(response.data);
    } catch (error) { console.error(error); }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/rooms', {
        name: newRoomName,
        admin_id: userId
      });
      setNewRoomName('');
      fetchRooms();
    } catch (error) { alert("Error creating room"); }
  };

  const handleJoinRequest = async (roomId, adminId) => {
    try {
      await axios.post('http://localhost:5000/api/rooms/join', {
        room_id: roomId,
        user_id: userId
      });

      socket.emit("send_join_request", {
        roomId: roomId,
        username: username,
        userId: userId,
        admin_id: adminId
      });

      alert("⏳ صيفطتي الطلب، تسنى الأدمين!");
    } catch (error) {
      alert("❌ مشكل فطلب الانضمام، يقدر تكون ديجا صيفطتي طلب");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId);

    try {
      const res = await axios.post('http://localhost:5000/api/upload-avatar', formData);
      const newUrl = res.data.imageUrl;
      setProfilePic(newUrl);
      localStorage.setItem('profilePic', newUrl);
    } catch (error) {
      alert("❌ فشل تحميل الصورة");
    }
  };

  return (
    <div className="flex h-screen bg-[#2f3136] text-white overflow-hidden font-sans">
      
      {/* --- Sidebar اليسار (Discord Style) --- */}
      <div className="w-64 bg-[#202225] flex flex-col shadow-2xl">
        <div className="p-4 shadow-md border-b border-black/20">
          <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <span className="bg-[#5865f2] p-1.5 rounded-lg text-sm">💬</span> AZOUGUAGH
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase px-2 mb-2 tracking-wider">القنوات</p>
            <div className="space-y-0.5">
              <button className="w-full text-left px-3 py-2 rounded-md bg-[#393c43] text-white text-sm font-medium"># عام</button>
              <button className="w-full text-left px-3 py-2 rounded-md text-gray-400 hover:bg-[#393c43] hover:text-gray-200 text-sm transition"># مساعدة</button>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="bg-[#292b2f] p-3 flex items-center gap-3 border-t border-black/10">
          <label className="relative group cursor-pointer h-10 w-10 shrink-0">
            <img 
              src={profilePic} 
              alt="avatar" 
              className="h-full w-full rounded-full object-cover border-2 border-[#5865f2] shadow-sm" 
            />
            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            <div className="absolute inset-0 bg-black/50 rounded-full items-center justify-center hidden group-hover:flex text-[9px] font-bold uppercase">تبديل</div>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-[#292b2f]"></div>
          </label>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate leading-tight">{username}</p>
            <p className="text-[10px] text-gray-400">متصل الآن</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="text-gray-400 hover:text-red-400 p-1.5 rounded transition hover:bg-red-500/10"
            title="خروج"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* --- Main Content اليمين --- */}
      <div className="flex-1 flex flex-col bg-[#36393f] overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full p-8">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">استكشف الرومات</h1>
              <p className="text-gray-400">انضم لمجتمعك المفضل وابدأ الدردشة الصوتية</p>
            </div>
            
            <form onSubmit={handleCreateRoom} className="flex bg-[#202225] p-1.5 rounded-xl shadow-inner w-full md:w-auto">
              <input 
                className="bg-transparent border-none px-4 py-2 outline-none text-sm w-full md:w-64 placeholder:text-gray-600"
                placeholder="سمية الروم الجديدة..." 
                value={newRoomName} 
                onChange={(e) => setNewRoomName(e.target.value)} 
                required 
              />
              <button type="submit" className="bg-[#248046] hover:bg-[#1a6334] text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95">
                إنشاء
              </button>
            </form>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div 
                key={room.id} 
                className="bg-[#2f3136] p-6 rounded-2xl border border-white/5 hover:border-[#5865f2]/50 transition-all duration-300 group shadow-md hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 bg-[#202225] rounded-xl flex items-center justify-center text-2xl group-hover:bg-[#5865f2] transition-colors">
                    🏠
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-black/30 px-2 py-1 rounded text-gray-400 border border-white/5">
                    Admin ID: {room.admin_id}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1 group-hover:text-[#5865f2] transition-colors">{room.name}</h3>
                <p className="text-xs text-gray-500 mb-6 font-medium">قناة تواصل رقم #{room.id}</p>

                <div className="flex gap-2">
                   <button 
                    onClick={() => navigate(`/room/${room.id}`)} 
                    className="flex-1 bg-[#4f545c] hover:bg-[#5865f2] text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                   >
                    دخول
                   </button>
                   {room.admin_id != userId && (
                     <button 
                      onClick={() => handleJoinRequest(room.id, room.admin_id)} 
                      className="px-4 border-2 border-[#4f545c] hover:border-[#5865f2] hover:text-[#5865f2] text-gray-400 rounded-xl font-bold text-xs transition-all active:scale-95"
                     >
                      طلب
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rooms;