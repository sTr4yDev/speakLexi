# 📚 SpeakLexi - Plataforma de Aprendizaje de Idiomas


## 📋 Descripción del Proyecto

SpeakLexi es una plataforma web educativa inspirada en Duolingo, diseñada para el aprendizaje interactivo de idiomas. El sistema incluye gestión de usuarios, lecciones interactivas, gamificación con logros y clasificaciones, y paneles administrativos para diferentes roles.

### 🎯 Objetivo

Proporcionar una experiencia de aprendizaje de idiomas gamificada y personalizada, permitiendo a los estudiantes progresar a su propio ritmo mientras los profesores y administradores pueden gestionar contenido y monitorear el progreso.

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Lenguaje:** Python 3.9+
- **Framework:** Flask 2.3.0
- **Base de Datos:** MySQL 8.0
- **ORM:** SQLAlchemy
- **Autenticación:** Flask-JWT-Extended
- **Validación:** Flask-WTF
- **Email:** Flask-Mail
- **Encriptación:** Werkzeug Security (bcrypt)

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** Shadcn/ui
- **Estado:** React Hooks
- **Iconos:** Lucide React
- **Gráficos:** Recharts

### Herramientas de Desarrollo
- **Control de Versiones:** Git/GitHub
- **Gestión de Dependencias:** pip (Python), npm (Node.js)
- **Variables de Entorno:** python-dotenv

---

## 📁 Estructura del Proyecto

```
speakLexi/
├── back-end/
│   ├── app.py                    # Archivo principal de la aplicación Flask
│   ├── extensions.py             # Inicialización de extensiones
│   ├── config/
│   │   ├── database.py          # Configuración de base de datos
│   │   └── settings.py          # Configuración general
│   ├── models/
│   │   └── usuario.py           # Modelo de Usuario
│   ├── routes/
│   │   ├── auth.py              # Rutas de autenticación
│   │   └── usuario_routes.py   # Rutas de gestión de usuarios
│   ├── services/
│   │   ├── correo_service.py   # Servicio de envío de correos
│   │   └── gestor_usuarios.py  # Lógica de negocio de usuarios
│   └── .env                     # Variables de entorno (NO INCLUIR EN GIT)
│
├── front-end/
│   ├── app/                     # Páginas de Next.js
│   │   ├── admin/              # Panel administrativo
│   │   ├── profesor/           # Panel de profesores
│   │   ├── dashboard/          # Dashboard de estudiantes
│   │   └── lecciones/          # Sistema de lecciones
│   ├── components/             # Componentes reutilizables
│   ├── hooks/                  # Custom hooks
│   └── styles/                 # Estilos globales
│
└── README.md
```

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:
- Python 3.9 o superior
- Node.js 18 o superior
- MySQL 8.0
- Git

### 1. Copiar los archivos



### 2. Configuración del Backend

#### 2.1 Crear entorno virtual

```bash
cd back-end
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 2.2 Instalar dependencias

```bash
pip install flask flask-sqlalchemy flask-jwt-extended flask-mail flask-cors python-dotenv werkzeug
```

#### 2.3 Configurar variables de entorno

Crea un archivo `.env` en la carpeta `back-end/` con el siguiente contenido:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=speaklexi_db

# Aplicación
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=clave_secreta_super_segura_123
PORT=5000
DEBUG=True

# Correo Electrónico
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=tu_correo@gmail.com
MAIL_PASSWORD=tu_contraseña_de_aplicacion
MAIL_DEFAULT_SENDER=tu_correo@gmail.com

# JWT
JWT_SECRET_KEY=clave_jwt_secreta_456
JWT_ACCESS_TOKEN_EXPIRES=3600
```

**Variables principales explicadas:**
- `DB_HOST`: Dirección del servidor MySQL (localhost para desarrollo local)
- `DB_NAME`: Nombre de la base de datos
- `SECRET_KEY`: Clave para encriptar sesiones de Flask
- `MAIL_USERNAME/PASSWORD`: Credenciales de Gmail (usar contraseña de aplicación)
- `JWT_SECRET_KEY`: Clave para generar tokens de autenticación

#### 2.4 Crear la base de datos

```bash
# Conectarse a MySQL
mysql -u root -p

# Crear la base de datos
CREATE DATABASE speaklexi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE speaklexi_db;
exit;
```

#### 2.5 Ejecutar el backend

```bash
flask run
# O
python app.py
```

El servidor backend estará corriendo en: `http://localhost:5000`

### 3. Configuración del Frontend

#### 3.1 Instalar dependencias

```bash
cd ../front-end
npm install
```

#### 3.2 Configurar variables de entorno

Crea un archivo `.env.local` en la carpeta `front-end/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### 3.3 Ejecutar el frontend

```bash
npm run dev
```

El frontend estará corriendo en: `http://localhost:3000`

---

## 🚀 Funcionalidades Implementadas

### 👤 Gestión de Usuarios (CRUD Completo)

**Endpoints Backend:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/usuarios` | Listar todos los usuarios (Admin) |
| GET | `/api/usuarios/<id>` | Obtener usuario específico |
| PUT | `/api/usuarios/<id>` | Actualizar información del usuario |
| DELETE | `/api/usuarios/<id>` | Eliminar usuario |
| POST | `/api/auth/verificar-email` | Verificar correo electrónico |
| POST | `/api/auth/recuperar-contrasena` | Solicitar recuperación de contraseña |
| POST | `/api/auth/restablecer-contrasena` | Restablecer contraseña |

**Validaciones implementadas:**
- ✅ Correo electrónico único
- ✅ Formato válido de email
- ✅ Contraseña mínima de 8 caracteres
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Verificación por correo electrónico
- ✅ Tokens JWT para autenticación
- ✅ Roles de usuario (estudiante, profesor, admin, mantenimiento)

### 📖 Sistema de Lecciones

**Páginas Frontend:**
- `/lecciones` - Lista de lecciones disponibles
- `/lecciones/[id]` - Visualizador de lección interactiva
- `/admin/lecciones` - Gestión de lecciones (Admin)
- `/admin/lecciones/crear` - Crear nueva lección
- `/admin/lecciones/[id]/editar` - Editar lección existente

**Tipos de actividades:**
1. **Multiple Choice** - Selección múltiple
2. **Fill in the Blank** - Completar espacios
3. **Translation** - Traducción de frases
4. **Matching** - Emparejar palabras
5. **Listen & Repeat** - Escuchar y repetir
6. **Word Order** - Ordenar palabras
7. **True/False** - Verdadero o falso

### 🎮 Sistema de Gamificación

- **Logros y medallas** (`/logros`)
- **Tabla de clasificación** (`/clasificacion`)
- **Sistema de puntos (XP)**
- **Niveles de progreso**
- **Rachas de estudio**

### 👨‍🏫 Panel de Profesores

- **Dashboard** (`/profesor/dashboard`)
- **Estadísticas de estudiantes** (`/profesor/estadisticas`)
- **Planificación de clases** (`/profesor/planificacion`)
- **Retroalimentación** (`/profesor/retroalimentacion`)

### 👨‍💼 Panel Administrativo

- **Dashboard** (`/admin/dashboard`)
- **Gestión de usuarios** (`/admin/usuarios`)
- **Gestión de lecciones** (`/admin/lecciones`)
- **Estadísticas generales**

### 🔧 Panel de Mantenimiento

- **Dashboard** (`/mantenimiento/dashboard`)
- **Gestión de reportes** (`/mantenimiento/reportes`)
- **Tareas de mantenimiento** (`/mantenimiento/tareas`)

---

## 🧪 Pruebas y Validaciones

### Pruebas Realizadas

1. **Registro de usuarios:**
   - ✅ Validación de correo duplicado
   - ✅ Validación de formato de email
   - ✅ Validación de contraseña segura
   - ✅ Envío de correo de verificación

2. **Inicio de sesión:**
   - ✅ Validación de credenciales
   - ✅ Generación de token JWT
   - ✅ Redirección según rol de usuario

3. **Recuperación de contraseña:**
   - ✅ Generación de token de recuperación
   - ✅ Envío de correo con enlace
   - ✅ Validación de token y actualización

4. **Gestión de lecciones:**
   - ✅ CRUD completo de lecciones
   - ✅ Filtrado por nivel y categoría
   - ✅ Guardado de progreso del usuario

### Archivos de Prueba

- `back-end/test_password.py` - Pruebas de encriptación
- `back-end/test_routes.py` - Pruebas de endpoints

---

## 📸 Evidencias

### Capturas de Pantalla
TODO: Agregar links de las capturas
#### 1. Pantalla de Inicio de Sesión
![Login](https://via.placeholder.com/800x400?text=Login+Screen)

#### 2. Dashboard de Estudiante
![Dashboard](https://via.placeholder.com/800x400?text=Student+Dashboard)

#### 3. Sistema de Lecciones
![Lecciones](https://via.placeholder.com/800x400?text=Lessons+System)

#### 4. Panel Administrativo
![Admin](https://via.placeholder.com/800x400?text=Admin+Panel)

### Conexión a la Base de Datos

![DB Connection](https://via.placeholder.com/600x300?text=Database+Connection+Success)

**Salida de consola:**
```
 * Running on http://127.0.0.1:5000
 * Connected to database: speaklexi_db
 * Environment: development
 * Debug mode: on
```

### Video Demostrativo

🎥 [Ver video de funcionamiento completo](Poner video demostrativo aqui)

---

## 📚 Documentación Adicional

### Modelo de Base de Datos

**Tabla: usuarios**

TODO: Agregar la tabla cuando ya este finalizado.

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Estudiante** | Ver lecciones, completar actividades, ver progreso, participar en clasificación |
| **Profesor** | Todo lo de estudiante + ver estadísticas de alumnos, crear planificaciones, dar retroalimentación |
| **Admin** | Todo + gestionar usuarios, crear/editar/eliminar lecciones, ver estadísticas globales |
| **Mantenimiento** | Gestionar reportes técnicos, crear tareas de mantenimiento, revisar logs del sistema |

---

## 🔒 Seguridad

- **Contraseñas:** Encriptadas con bcrypt (Werkzeug Security)
- **Autenticación:** JWT (JSON Web Tokens) con expiración
- **CORS:** Configurado para permitir solo orígenes confiables
- **SQL Injection:** Protegido con SQLAlchemy ORM
- **XSS:** Sanitización de inputs en frontend
- **Variables sensibles:** Almacenadas en archivos .env (no versionados)

---

## 🐛 Solución de Problemas Comunes

### Error: "No se puede conectar a la base de datos"
**Solución:** Verifica que MySQL esté corriendo y las credenciales en `.env` sean correctas.

### Error: "Port 5000 already in use"
**Solución:** 
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID [número] /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Error: "Module not found"
**Solución:** 
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

---

## 📝 Próximas Mejoras


---

## 👥 Autores

Sergio Olivares Sotelo

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos para el Instituto Tecnologico de Zacatepec - [2025].

---




**Última actualización:** Octubre 2025
**Versión:** 1.0.0