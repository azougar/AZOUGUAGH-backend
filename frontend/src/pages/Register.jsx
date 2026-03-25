import { useState } from 'react';
import axios from 'axios';

function Register() {
  // هادو باش نخزنو المعلومات اللي كيكتب اليوزر
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // هاد الفانكشن كتخدم فاش اليوزر كيورك على بوطونة "تسجيل"
  const handleRegister = async (e) => {
    e.preventDefault(); // باش الصفحة ماتعاودش تشارجا
    try {
      // كنصيفطو الطلب للباكاند ديالنا
      const response = await axios.post('http://localhost:5000/api/register', {
        username: username,
        email: email,
        password: password
      });
      setMessage(response.data.message); // كنوريو الميساج ديال النجاح
    } catch (error) {
      setMessage("❌ وقع شي مشكل، يقدر يكون هاد اليوزر ديجا كاين");
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>تسجيل حساب جديد</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: '0 auto' }}>
        
        <input 
          type="text" 
          placeholder="السمية (Username)" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        
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
        
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>تسجيل</button>
      
      </form>
      
      {/* هنا كيبان الميساج واش تسجل ولا كاين مشكل */}
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}

export default Register;