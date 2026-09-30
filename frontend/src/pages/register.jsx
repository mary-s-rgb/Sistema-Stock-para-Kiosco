 import { useState }  from  'react'  ; 
 import { useNavigate }  from  'react-router-dom'  ; 
 
 export  default  function  Register  () { 
   const  [form, setForm] = useState({ nombre:  ''  , email:  ''  , password:  ''  , 
 rol:  'ADMIN'  }); 
   const  navigate = useNavigate();
   
  const  handleSubmit =  async  (e) => { 
   e.preventDefault(); 
   const  res =  await  fetch(  'http://localhost:3001/api/register'  ,  { 
    method:  'POST'  , 
    headers: {  'Content-Type'  :  'application/json'  }, 
    body: JSON.stringify(form) 
   }); 
   if  (res.ok) { 
     alert(  'Usuario registrado con éxito'  ); 
     navigate(  '/login'  ); 
   }  else  { 
     alert(  'Error al registrar usuario'  ); 
   } 
 }; 

return  ( 
  <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
   <h2>Registro de Usuario</h2> 
   <form onSubmit={handleSubmit}> 
     <input placeholder=  "Nombre"  onChange={e =>  setForm({...form, nombre: 
 e.target.  value  })} required style={{ display: 'block',  width: '100%', 
 marginBottom: '1rem' }} /> 
     <input placeholder=  "Email"  type=  "email"  onChange={e  => 
 setForm({...form, email: e.target.  value  })} required  style={{ display: 
 'block', width: '100%', marginBottom: '1rem' }} /> 
     <input placeholder=  "Contraseña"  type=  "password"  onChange={e => 
 setForm({...form, password: e.target.  value  })} required  style={{ display: 
 'block', width: '100%', marginBottom: '1rem' }} /> 
     <  select  onChange={e => setForm({...form, rol:  e.target.  value  })} 
 style={{ display: 'block', width: '100%', marginBottom: '1rem' }}> 
       <option  value  =  "ADMIN"  >ADMIN (Dueño)</option> 
       <option  value  =  "SUPRA"  >SUPRA (Programador)</option> 
      </  select  > 
      <button type=  "submit"  >Registrar</button> 
     </form> 
   </div> 
  ); 
 }