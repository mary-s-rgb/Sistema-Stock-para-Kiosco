 import  { useState } from  'react'  ; 
 import  { useNavigate } from  'react-router-dom'  ; 
 
 
 export  default  function Login() { 
   const  [form, setForm] = useState({ email:  ''  , password:  ''  }); 
   const  navigate = useNavigate(); 
 
 
   const  handleSubmit =  async  (e) => { 
    e.preventDefault(); 
    const  res =  await  fetch(  'http://localhost:3001/api/login'  ,  { 
     method:  'POST'  , 
     headers: {  'Content-Type'  :  'application/json'  },

     body: JSON.stringify(form) 
   }); 
   const  data =  await  res.json(); 
   if  (res.ok) { 
    localStorage.setItem(  'token'  , data.token); 
    localStorage.setItem(  'usuario'  , JSON.stringify(data.usuario)); 
    navigate(  '/dashboard'  ); 
  }  else  { 
    alert(data.error); 
  } 
 }; 
 
 return  ( 
   <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}> 
    <h2>Iniciar Sesión</h2> 
    <form onSubmit={handleSubmit}> 
      <input placeholder=  "Email"  type=  "email"  onChange={e  => 
 setForm({...form, email: e.target.value})} required style={{ display: 
 'block', width: '100%', marginBottom: '1rem' }} /> 
      <input placeholder=  "Contraseña"  type=  "password"  onChange={e => 
 setForm({...form, password: e.target.value})} required style={{ display: 
 'block', width: '100%', marginBottom: '1rem' }} /> 
      <button type=  "submit"  >Ingresar</button> 
    </form> 
   </div> 
  ); 
 } 
 