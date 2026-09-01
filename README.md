# 🏪 Sistema de Control de Stock para Kiosco

## 📌 Planteamiento del Problema
El negocio necesita mejorar el control de sus productos, ya que llevar el stock de forma manual genera errores, faltantes de mercadería y desorganización operativa.

## 🎯 Objetivo General
Desarrollar un sistema web con base de datos integrada que permita administrar los productos, categorías y movimientos del negocio de forma rápida, ordenada e intuitiva.

### Objetivos Específicos
* Organizar los productos mediante un catálogo estructurado por categorías.
* Registrar las entradas y salidas de mercadería para mantener el stock actualizado en tiempo real.
* Implementar alertas proactivas para prevenir el desabastecimiento.
* Optimizar la compra de mercadería según el comportamiento de la demanda estacional.

---

## 👥 Sistema de Usuarios y Acceso
El sistema cuenta con control de acceso mediante credenciales fijando niveles de permiso:
* **Admin (Dueño del local):** Acceso total a la gestión del negocio, reportes, cambios de temporada y catálogo.
* **Supra Usuario (Programador/Soporte):** Acceso técnico a configuraciones avanzadas, logs y mantenimiento del sistema.

---

## 🚀 Funcionalidades del Sistema

### 🔒 Autenticación y Seguridad
* **Inicio de Sesión:** Pantalla de login segura con validación de credenciales.
* **Pantalla de Registro de Usuario:** Formulario de alta para la creación de perfiles autorizados.
* **Recuperación de Cuenta:** Flujo para restablecer o recuperar el usuario/contraseña en caso de olvido.

### 📦 Gestión Base de Inventario (CRUD y Movimientos)
* **Gestión de Catálogo:** Registro, edición y eliminación de productos, categorías y proveedores.
* **Entradas y Salidas:** Control detallado de movimientos de mercadería (reposiciones, ventas o mermas).
* **Búsqueda Avanzada:** Filtro rápido por nombre, categoría, proveedor o escáner de código de barras.
* **Alertas de Bajo Stock:** Notificaciones visuales automáticas cuando un producto alcanza su límite mínimo.

### ☀️❄️ Módulo de Gestión Estacional de Stock (Lógica Inteligente)
* **Categorización Estacional:** Etiquetas de comportamiento por producto (`Alta - Verano`, `Alta - Invierno`, `Atemporal` para golosinas/cigarrillos).
* **Parámetros Dinámicos por Temporada:** Configuración independiente de stock mínimo, máximo y punto de reorden según la estación activa.
* **Control de Temporada (Modo Calendario / Manual):** Cambios automáticos por fecha predefinida o activación manual inmediata ante variaciones del clima.
* **Sugeridor Inteligente de Órdenes de Compra:** Generación automática de listas de pedido ajustadas multiplicando el promedio de venta diaria por el tiempo de entrega e incrementado por el factor estacional (1.5x - 2x).
* **Alertas Proactivas de Transición:** Avisos previos al cambio de estación para rematar stock saliente (evitar stock reposado) o anticipar la compra de la temporada entrante.
* **Reportes Históricos Comparativos:** Gráficos interanuales (ej. *Enero 2025 vs. Enero 2026*) para tomar decisiones comerciales basadas en datos reales.

---

## 🗄️ Modelo de Base de Datos
El sistema utiliza una base de datos relacional integrada con las siguientes entidades principales:
* **`Productos`** (Datos generales, código de barras, precios y etiquetado estacional)
* **`Categorias`** (Clasificación del catálogo)
* **`Stock`** (Cantidades disponibles físicas y umbrales dinámicos)
* **`Proveedores`** (Información de contacto y tiempos de entrega)
* **`Atributos_Estacionales`** (Límites de reorden específicos por temporada)
* **`Movimientos`** (Historial de entradas y salidas de mercadería)
