import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'peerjs';
import axios from 'axios';

const socket = io.connect("http://localhost:5000");

function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const myAudioRef = useRef();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) return navigate('/login');
    const peer = new Peer();

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (myAudioRef.current) myAudioRef.current.srcObject = stream;
      peer.on('open', (peerId) => {
        socket.emit("join_room", { roomId: id, peerId: peerId });
      });
      socket.on('user-connected', (newPeerId) => {
        const call = peer.call(newPeerId, stream);
        call.on('stream', (userStream) => addRemoteStream(userStream));
      });
      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (userStream) => addRemoteStream(userStream));
      });
    });

    axios.get(`http://localhost:5000/api/rooms`).then(res => {
      const room = res.data.find(r => r.id == id);
      if (room && room.admin_id == userId) {
        setIsAdmin(true);
        axios.get(`http://localhost:5000/api/rooms/${id}/requests`).then(r => setRequests(r.data));
      }
    });

    socket.on("receive_message", (data) => setMessageList((list) => [...list, data]));
    socket.on("receive_join_request", (data) => {
        if (isAdmin) setRequests((prev) => [...prev, data]);
    });

    return () => {
        socket.off("receive_message");
        socket.off("user-connected");
        socket.off("receive_join_request");
    };
  }, [id, isAdmin]);

  const addRemoteStream = (stream) => {
    setRemoteStreams(prev => prev.some(s => s.id === stream.id) ? prev : [...prev, stream]);
  };

  const handleResponse = async (uId, status) => {
    await axios.post('http://localhost:5000/api/rooms/requests/respond', { room_id: id, user_id: uId, status });
    setRequests(prev => prev.filter(req => req.user_id !== uId));
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const msgData = { room: id, author: username, message: currentMessage, time: new Date().getHours() + ":" + (new Date().getMinutes() < 10 ? '0' : '') + new Date().getMinutes() };
      socket.emit("send_message", msgData);
      setMessageList((list) => [...list, msgData]);
      setCurrentMessage("");
    }
  };

  return (
    <div className="flex h-screen bg-discord_grey text-white">
      {/* Sidebar الصغير ديال الصوت */}
      <div className="w-20 bg-[#202225] flex flex-col items-center py-4 space-y-4 shadow-xl">
        <div className="w-12 h-12 bg-discord_blue rounded-2xl flex items-center justify-center text-2xl font-bold cursor-pointer hover:rounded-xl transition-all">
          {id}
        </div>
        <div className="w-12 h-12 bg-discord_grey rounded-full flex items-center justify-center cursor-pointer hover:bg-green-500 transition">🎙️</div>
      </div>

      <div className="flex-1 flex flex-col bg-discord_black relative">
        {/* Header */}
        <div className="h-12 border-b border-[#202225] flex items-center px-4 shadow-sm">
          <span className="text-gray-400 font-bold mr-2">#</span>
          <span className="font-bold">روم الشات الصوتي - {id}</span>
          <div className="ml-auto flex gap-4">
              <audio ref={myAudioRef} autoPlay muted className="hidden"></audio>
              {remoteStreams.map((s, i) => <AudioPlayer key={i} stream={s} />)}
              <span className="text-green-400 text-sm flex items-center gap-1">🟢 متصل بالصوت</span>
          </div>
        </div>

        {/* لوحة الأدمين - Floating Notification */}
        {isAdmin && requests.length > 0 && (
          <div className="absolute top-14 right-4 z-50 w-72 bg-[#f9a825] p-4 rounded-lg shadow-2xl text-black">
            <h4 className="font-bold mb-2 flex items-center gap-2">🔔 طلبات دخول ({requests.length})</h4>
            <div className="space-y-2">
              {requests.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-white/20 p-2 rounded">
                  <span className="font-medium truncate">{r.username}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleResponse(r.user_id, 'approved')} className="bg-green-600 text-white px-2 py-1 rounded text-xs">قبول</button>
                    <button onClick={() => handleResponse(r.user_id, 'rejected')} className="bg-red-600 text-white px-2 py-1 rounded text-xs">رفض</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Box */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messageList.map((m, i) => (
            <div key={i} className={`flex ${m.author === username ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl shadow-md ${m.author === username ? 'bg-discord_blue text-white rounded-br-none' : 'bg-[#40444b] text-gray-100 rounded-bl-none'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold opacity-80">{m.author}</span>
                  <span className="text-[10px] opacity-60">{m.time}</span>
                </div>
                <p className="text-sm leading-relaxed">{m.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-4 bg-discord_black">
          <div className="flex items-center bg-[#40444b] rounded-lg px-4 py-2">
            <button className="text-gray-400 hover:text-white mr-3 text-xl">+</button>
            <input 
              className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 py-1"
              value={currentMessage} 
              onChange={(e) => setCurrentMessage(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`صيفط ميساج لـ #${id}`} 
            />
            <button onClick={sendMessage} className="ml-2 bg-discord_blue hover:bg-[#4752c4] px-4 py-1 rounded font-bold text-sm transition">صيفط</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const AudioPlayer = ({ stream }) => {
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <audio ref={ref} autoPlay className="hidden"></audio>;
};

export default RoomDetail;