import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    // 1. Inicializar el hook de navegación dentro del componente
    const navigate = useNavigate();

    const handleLogout = () => {
        // 2. Limpiar credenciales y estado global de autenticación
        localStorage.removeItem('token');
        localStorage.removeItem('user');  
       
        // 3. Redirigir hacia la vista de login
        navigate('/login');
    }; 

    // (Opcional) Si manejas peticiones fetch/axios y quieres interceptar el 401 aquí:
    // const checkResponse = (response) => {
    //     if (response.status === 401) {
    //         handleLogout();
    //     }
    // };

    return (
        <div>
            <h1>Vista dashboard</h1>
            
            {/* El botón debe estar dentro del JSX que retorna el componente */}
            <button onClick={handleLogout} className="btn-logout">
                Cerrar sesión
            </button>
        </div>
    );
}