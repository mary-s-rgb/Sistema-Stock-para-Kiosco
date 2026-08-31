# Sistema-Stock-para-Kiosco
## 🚀 Funcionalidades Principales

### 🔐 Autenticación y Seguridad
* **Acceso Restringido:** Sistema de inicio de sesión exclusivo para el administrador / dueño del local.
* **Seguridad de Credenciales:** Encriptación y almacenamiento seguro de contraseñas mediante hashing (`bcrypt`).
* **Protección de Rutas:** Navegación protegida en el frontend para evitar accesos no autorizados al panel de control.

---

### 📦 Gestión de Inventario y Catálogo Base
* **Control CRUD:** Alta, baja, modificación y lectura de productos, categorías y proveedores.
* **Seguimiento de Stock:** Registro en tiempo real del stock físico disponible para cada producto.
* **Búsqueda Rápida:** Filtrado e identificación de artículos por nombre o categoría.

---

### ☀️❄️ Control de Stock Estacional (Diferencial)
* **Categorización por Temporada:** Clasificación de productos según su período de mayor demanda (`Verano`, `Invierno` o `Todo el año`).
* **Umbrales Dinámicos:** Configuración de **stock mínimo** y **stock deseado** diferenciados según la estación activa (ej. mayores límites para bebidas en verano y para infusiones en invierno).
* **Alertas Inteligentes:** Notificaciones de reposición ajustadas automáticamente a la temporada actual.

---

### 💻 Stack Tecnológico
* **Frontend:** React (Vite) + React Router DOM
* **Backend / Base de Datos:** Node.js + SQLite3
* **Seguridad:** Bcryptjs (hashing de contraseñas)
