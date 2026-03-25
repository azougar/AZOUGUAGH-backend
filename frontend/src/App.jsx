import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Rooms from './pages/Rooms'; // زدنا هاد السطر باش نجيبو الصفحة
import RoomDetail from './pages/RoomDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* حيدنا داك الميساج المؤقت وحطينا الصفحة ديالنا */}
        <Route path="/rooms" element={<Rooms />} /> 
        
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/room/:id" element={<RoomDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;