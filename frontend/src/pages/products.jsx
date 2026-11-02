import { useState, useEffect } from 'react' ; 
import { useNavigate } from 'react-router-dom' ; 
import './products.css' ; 
export default function Products () { 
 const [products, setProducts] = useState([]); 
 const [searchTerm, setSearchTerm] = useState(''); 
 const [form, setForm] = useState({ 
   categoria : '' , 
   nombre : '' , 
   codigo_barras : '' , 
   estacion : '' , 
   observacion : '' , 
   stock : 0 
}); 
const [error, setError] = useState( '' ); 
const [success, setSuccess] = useState( '' ); 
const navigate = useNavigate(); 


// Cargar productos al iniciar 
useEffect( () => { 

const fetchProducts = async () => { 
 try { 
  const res = await fetch( 'http://localhost:3001/api/products' ); 
   if (res.ok) { 
    const data = await res.json(); 
     setProducts(data); 
}

} catch { 
 setError( 'Error al conectar con el servidor para cargar productos.' ); 
 }  
}; 

const handleInputChange = (e) => { 
 setForm({ ...form, [e.target.name]: e.target.value }); 
}; 
const handleSubmit = async (e) => { 
 e.preventDefault(); 
 setError( ' ' ); 
 setSuccess( ''); 

try { 
 const res = await fetch( 'http://localhost:3001/api/products' , { 
  method : 'POST' , 
  headers : { 'Content-Type' : 'application/json' }, 
  body : JSON .stringify(form) 
}); 
 const data = await res.json(); 

if (res.ok) { 
 setSuccess( '¡Producto añadido con éxito!' ); 
 setForm({ categoria : ' ', nombre : ' ' , codigo_barras : '' , estacion :  '', observacion :   '' , stock : 
0 }); 
  fetchProducts(); 
} else { 
  setError(data.message || 'Error al registrar el producto.' ); 
} 
} catch { 
setError( 'Error de conexión con el servidor.' ); 
} 
}; 
// Filtrado dinámico en tiempo real (SCRUM-60) 
const filteredProducts = products.filter( (p) => { 
const term = searchTerm.toLowerCase(); 
return ( 
p.nombre.toLowerCase().includes(term) || 
p.categoria.toLowerCase().includes(term) || 
p.codigo_barras.toLowerCase().includes(term) 
);
}); 

return ( 
 < div className = "products-container" > 
  < div className = "products-main-card" > 

   {/* Sidebar Lateral */} 
   < aside className = "products-sidebar" > 
    < h3 >PRODUCTOS</ h3 > 
     < button onClick = {() => navigate('/dashboard')} className="sidebar-btn">Volver al 
Dashboard</ button > 
    </ aside > 

{/* Contenido Principal */} 
< main className = "products-content-area" > 
 < h2 >Añadir Nuevo Producto</ h2 > 


{error && < p className = "error-message" >{error}</ p >} 
{success && < p className = "success-message" >{success}</ p >} 

{/* Formulario de Alta (SCRUM-51) */} 
< form onSubmit = {handleSubmit} className = "product-form" > 
 < div className = "form-grid" > 
  < input type = "text" name = "categoria" placeholder = "Categoría" 
value = {form.categoria} onChange = {handleInputChange} required /> 
  < input type = "text" name = "nombre" placeholder = "Nombre Producto" 
value = {form.nombre} onChange = {handleInputChange} required /> 
  < input type = "text" name = "codigo_barras" placeholder = "Código de Barras" 
value = {form.codigo_barras} onChange = {handleInputChange} required /> 
  < input type = "text" name = "estacion" placeholder = "Estación" value = {form.estacion} 
onChange = {handleInputChange} /> 
  < input type = "text" name = "observacion" placeholder = "Observación" 
value = {form.observacion} onChange = {handleInputChange} /> 
  < input type = "number" name = "stock" placeholder = "Stock inicial" value = {form.stock} 
onChange = {handleInputChange} required /> 
 </ div > 
 < button type = "submit" className = "btn-guardar" >Guardar Producto</ button > 
 </ form > 

{/* Buscador Dinámico (SCRUM-60) */} 
< div className = "search-section" > 
< input 
type = "text"
placeholder = "Buscar por nombre, categoría o código de barras..." 
value = {searchTerm} 
onChange = {(e) => setSearchTerm(e.target.value)} 
className="search-input" 
/> 
</ div > 

{/* Tabla de Productos y Alertas de Stock (SCRUM-62) */} 
< table className = "products-table" > 
 < thead > 
  < tr > 
   < th >Producto</ th > 
   < th >Stock</ th > 
   < th >Estación</ th > 
  < th >Código de Barras</ th > 
 < th >Observación</ th > 
</ tr > 
</ thead > 
< tbody > 
{filteredProducts.map((p) => { 
// Condicional para resaltar Stock Bajo (SCRUM-62) 
const isLowStock = p.stock <= 5; 
return ( 
< tr key = {p.id} > 
 < td >{p.nombre}</ td > 
 < td style = {{ color: isLowStock ? '# e74c3c ' : ' inherit ', fontWeight: isLowStock ? 
' bold ' : ' normal ' }}> 
{p.stock} {isLowStock && '⚠(Stock Bajo)'} 
</ td > 
< td >{p.estacion}</ td > 
< td >{p.codigo_barras}</ td > 
< td >{p.observacion}</ td > 
</ tr > 
); 
})} 
</ tbody > 
</ table > 
</ main > 
</ div > 
</ div > 
); 
}