# Despliegue en Vercel

La app se publica como **dos proyectos de Vercel** conectados al mismo repositorio de GitHub:

| Proyecto | Root Directory | Framework |
|---|---|---|
| Backend (API FastAPI) | `backend` | FastAPI (lo detecta solo por `app.py`) |
| Frontend (Next.js) | `frontend` | Next.js |

El navegador llama a la API directamente (`NEXT_PUBLIC_API_URL`). Así Vercel le pasa al backend
la IP real del visitante en `x-real-ip`, que usa el límite de envíos del formulario de contacto.

## Variables de entorno

Se cargan en **Project Settings → Environment Variables** de cada proyecto. Nunca en el código.

### Backend
| Variable | Valor |
|---|---|
| `ENTORNO` | `produccion` (oculta `/docs` y `/openapi.json`) |
| `FRONTEND_ORIGINS` | URL del frontend, por ejemplo `https://prognosis.vercel.app` (varias separadas por coma) |
| `MAIL_USERNAME`, `MAIL_FROM`, `MAIL_TO` | La cuenta de Gmail del formulario de contacto |
| `MAIL_PASSWORD` | Contraseña de aplicación de Google, marcada como **Sensitive** |

### Frontend
| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend, por ejemplo `https://prognosis-api.vercel.app` |
| `BACKEND_URL` | La misma URL del backend |

`NEXT_PUBLIC_API_URL` se incrusta al compilar: si la cambiás, volvé a desplegar el frontend.

## Orden
1. Crear el proyecto del backend y cargar sus variables (`FRONTEND_ORIGINS` puede completarse después).
2. Crear el proyecto del frontend con `NEXT_PUBLIC_API_URL` apuntando al backend.
3. Completar `FRONTEND_ORIGINS` en el backend con la URL final del frontend y volver a desplegarlo.

## Limitaciones conocidas
- La caché de series y el límite de envíos viven en memoria: en Vercel cada instancia tiene los suyos,
  así que el límite de envíos es aproximado.
