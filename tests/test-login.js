import fetch from 'node-fetch';

const testLogin = async () => {
  try {
    console.log('🧪 Testing login API...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'felippe@chatbot.com',
        password: '2025@chatbot'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data.user.email);
      console.log('Token:', data.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testLogin(); 