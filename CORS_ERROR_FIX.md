# Correction CORS Error - forgot-password

## 🔍 Diagnostic

L'erreur "CORS error" dans le navigateur sur la requête XHR vers `/auth/forgot-password` signifie:
- ❌ Le navigateur a BLOQUÉ la requête avant de recevoir la réponse
- ❌ Le backend ne renvoie pas les headers CORS appropriés
- OU ❌ Le backend n'est pas accessible au port attendu

---

## ✅ Solutions implémentées côté Backend

### 1. Configuration CORS améliorée dans `main.ts`
- ✅ Ajout des headers `allowedHeaders`
- ✅ Ajout des headers `exposedHeaders`
- ✅ Support de la méthode `OPTIONS` (preflight)
- ✅ Augmentation du `maxAge` du cache (24h)
- ✅ Support de `http://127.0.0.1` en plus de `localhost`

### 2. Middleware CORS personnalisé
- ✅ Crée avec `cors-headers.middleware.ts`
- ✅ Gère TOUS les endpoints (même les erreurs)
- ✅ Appliqué globalement sur TOUTES les routes

### 3. Port d'écoute
- ✅ **Port: 3001** (configuré ou via `process.env.PORT`)
- ✅ Message de démarrage: `Application running on http://localhost:3001`

---

## 🔧 À faire côté Frontend

### ❌ Erreur frontend commune

```typescript
// ❌ MAUVAIS - Port incorrect
const response = await axios.post('http://localhost:3000/auth/forgot-password', {
  email,
  captchaToken,
});
```

### ✅ Correction

**Méthode 1: Utiliser le bon port**
```typescript
// ✅ BON - Port 3001
const response = await axios.post('http://localhost:3001/auth/forgot-password', {
  email,
  captchaToken,
});
```

**Méthode 2: Utiliser une variable d'environnement (Recommandé)**

Créez un fichier `.env` dans votre projet React:
```env
REACT_APP_API_URL=http://localhost:3001
```

Puis utilisez:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
  email,
  captchaToken,
});
```

**Méthode 3: Utiliser un client axios centralisé (Meilleure pratique)**

Voir le fichier `API_FRONTEND_CONFIG.ts` fourni dans le repo backend pour un exemple complet.

---

## 📋 Checklist debugging

### ✅ Côté Backend
- [x] Port configuré: **3001**
- [x] CORS activé avec `app.enableCors()`
- [x] Middleware CORS personnalisé appliqué
- [x] Headers CORS incluent: Origin, Credentials, Methods, AllowedHeaders
- [x] Support du preflight OPTIONS

### 📝 Côté Frontend - À vérifier

Ouvrez DevTools (F12) → Network → XHR, et cherchez la requête forgot-password:

1. **Vérifier l'URL**
   - Request URL doit être: `http://localhost:3001/auth/forgot-password`
   - ❌ PAS: `http://localhost:3000/...`

2. **Vérifier les headers de réponse**
   - `Access-Control-Allow-Origin: http://localhost:5173`
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Methods: GET, POST, ...`

3. **Vérifier la requête preflight**
   - Avant la requête POST, le navigateur envoie une requête OPTIONS
   - Cette requête OPTIONS doit retourner 200 OK avec les headers CORS
   - Vérifiez dans DevTools si OPTIONS est renvoyée correctement

---

## 🆘 Troubleshooting

### Erreur: "Network Error - Backend not reachable"
```
❌ Make sure backend is running on port 3001
```

**Solution:**
```bash
cd /path/to/AlgoArenaBackEnd-main
npm run start:dev  # Vérifie que le serveur démarre sur port 3001
```

Voyez le message: `✅ Application running on http://localhost:3001`

### Erreur: "CORS error" dans la console
1. Vérifiez que le frontend appelle le **port 3001** (pas 3000)
2. Vérifiez que l'origin du frontend (`http://localhost:5173`) est dans `allowedOrigins`
3. Redémarrez le backend après modification de `main.ts`

### Requête OPTIONS retourne 404
1. Vérifiez que le middleware CORS est bien appliqué
2. Vérifiez que le AppModule importe et applique `CorsHeadersMiddleware`
3. Redémarrez le backend

---

## 📐 Architecture CORS complète

```
Frontend (React)
http://localhost:5173
  │
  ├─→ OPTIONS /auth/forgot-password (preflight)
  │   Backend middleware reçoit → répond 200 OK avec headers CORS ✅
  │
  ├─→ POST /auth/forgot-password + captchaToken
  │   Backend traite → répond avec headers CORS + payload ✅
  │
Server Backend
http://localhost:3001
  │
  ├─ main.ts: enableCors() + middleware
  ├─ middleware: CorsHeadersMiddleware
  └─ auth/forgot-password: LogicEndpoint
```

---

## 📚 Fichiers pertinents

**Backend:**
- [src/main.ts](src/main.ts) - Configuration CORS
- [src/middleware/cors-headers.middleware.ts](src/middleware/cors-headers.middleware.ts) - Middleware
- [src/app.module.ts](src/app.module.ts) - Intégration middleware

**Frontend (À créer):**
- `API_FRONTEND_CONFIG.ts` - Client axios avec bonnes config

---

## ✨ Après correction

```
Frontend: requête POST vers http://localhost:3001/auth/forgot-password
Backend: reçoit → vérifie captcha → envoie email → répond
Frontend: reçoit réponse avec headers CORS ✅ → traite le succès
```

✅ **CORS Error résolu!**
