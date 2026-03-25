import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // هادي باش نصيفطو اليوزر لصفحة خرى ملي يدخل

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email: email,
        password: password
      });
      
      setMessage(response.data.message);
      
      // هنا كنخزنو الرقم ديال اليوزر فالمتصفح باش نعقلو عليه
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('username', response.data.user.username);
      
      // من بعد ثانية، غنصيفطوه لصفحة الرومات (اللي غنصاوبوها من بعد)
      setTimeout(() => {
        navigate('/rooms');
      }, 1000);
      
    } catch (error) {
      setMessage(error.response?.data?.error || "❌ وقع شي مشكل");
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2 className="text-5xl font-bold text-red-500">تسجيل الدخول</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: '0 auto' }}>
        <input 
          type="email" 
          placeholder="الإيميل" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        <input 
          type="password" 
          placeholder="المودباس" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ marginBottom: '15px', padding: '8px' }}
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>دخول</button>
      </form>
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
      
      <p style={{ marginTop: '20px' }}>
        ماعندكش كونط؟ <button onClick={() => navigate('/register')}>تسجل من هنا</button>
      </p>
    </div>
  );
}

export default Login;