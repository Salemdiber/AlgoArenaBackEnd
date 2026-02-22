# 🔧 Configuration CORS - Checklist Finale

## ✅ Backend (NestJS) - Fait

### 1. Configuration CORS dans `main.ts`
- ✅ `app.enableCors()` avec:
  - Origins: `http://localhost:5173`, `http://localhost:5180`, et variants `127.0.0.1`
  - Methods: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
  - Credentials: `true`
  - Headers autorisés: `Content-Type, Authorization, X-Requested-With, Accept`
  - Headers exposés: `Content-Type, Authorization, X-Total-Count`

### 2. Middleware CORS personnalisé
- ✅ `src/middleware/cors-headers.middleware.ts` créé
- ✅ Appliqué sur TOUTES les routes dans `app.module.ts`
- ✅ Gère les requêtes preflight OPTIONS
- ✅ Retourne les headers CORS même pour les erreurs

### 3. Port d'écoute
- ✅ **Port: 3001** (configuré dans `main.ts`)
- ✅ Message au démarrage: `✅ Application running on http://localhost:3001`

---

## 🔧 Frontend (React) - À faire

### 1. Variables d'environnement `.env`

Créez un fichier `.env` à la racine du projet React:

```env
# URL du backend
REACT_APP_API_URL=http://localhost:3001

# reCAPTCHA
REACT_APP_RECAPTCHA_SITE_KEY=6LdKIHMsAAAAACo6AkNg2KChjBhGcVCj2Rwj-rey
```

### 2. Client Axios

Utilisez le client axios fourni dans `API_FRONTEND_CONFIG.ts`:

```typescript
import apiClient from '@/services/api.config';

// Forgot Password
const response = await apiClient.post('/auth/forgot-password', {
  email: 'user@example.com',
  captchaToken: token,
});
```

### 3. Vérifier les URLs d'API

**❌ À éviter:**
```typescript
// Mauvais port
axios.post('http://localhost:3000/auth/forgot-password', ...)
// Pas de baseURL
axios.post('/auth/forgot-password', ...)
```

**✅ À utiliser:**
```typescript
// Correct avec baseURL
const client = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,
});

await client.post('/auth/forgot-password', ...)
```

---

## 🧪 Vérification - DevTools (F12)

### Network → XHR

Cherchez la requête `forgot-password`:

✅ **Avant la requête POST, vérifiez la requête OPTIONS:**
- Method: `OPTIONS`
- Status: `200` ✅
- Response Headers incluent:
  - `access-control-allow-origin: http://localhost:5173`
  - `access-control-allow-credentials: true`
  - `access-control-allow-methods: GET, POST, ...`

✅ **Puis la requête POST:**
- Method: `POST`
- URL: `http://localhost:3001/auth/forgot-password`
- Status: `200` ✅ (si succès) ou `400`/`404` (si erreur)
- Request Headers incluent:
  - `content-type: application/json`
  - (optionnel) `authorization: Bearer ...`
- Response Headers incluent:
  - `access-control-allow-origin: http://localhost:5173`

---

## 🚀 Commandes de redémarrage

### Backend
```bash
cd AlgoArenaBackEnd-main
npm run start:dev
# Vérifie le message: ✅ Application running on http://localhost:3001
```

### Frontend (React)
```bash
cd AlgoArenaFrontEnd  # ou votre répertoire frontend
npm run dev
# Vérifier que REACT_APP_API_URL=http://localhost:3001 est bien chargé
```

---

## 📞 Debugging CORS Error

Si vous recevez toujours "CORS error":

### Étape 1: Vérifier le port backend
```bash
netstat -ano | findstr 3001  # Windows
# Ou
lsof -i :3001  # Mac/Linux

# Tuer le processus s'il existe
taskkill /PID <PID> /F  # Windows
```

### Étape 2: Redémarrer backend
```bash
npm run start:dev
```

### Étape 3: Vérifier DevTools Console
```javascript
// Dans la console du navigateur:
fetch('http://localhost:3001/auth/login', {
  method: 'OPTIONS',
  headers: {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
  },
})
  .then(r => {
    console.log('Status:', r.status);
    console.log('CORS Headers:', r.headers);
  })
  .catch(e => console.error('Error:', e));
```

### Étape 4: Vérifier origin du frontend
```javascript
// Dans la console du navigateur:
console.log('Origin:', window.location.origin);
// Doit être: http://localhost:5173
```

---

## 📝 Résumé des changements

| Fichier | Changement | Raison |
|---------|-----------|--------|
| `src/main.ts` | CORS amélioré + middleware | Headers CORS corrects |
| `src/middleware/cors-headers.middleware.ts` | Créé | Gère CORS globalement |
| `src/app.module.ts` | Middleware appliqué | Intégration middleware |
| `.env` | Port documenté | Clarté |

---

## ✨ Résultat attendu

```
✅ Backend: http://localhost:3001
✅ Frontend: http://localhost:5173
✅ CORS Headers: présents sur toutes les réponses
✅ Forgot Password: fonctionne sans "CORS error"
```

---

## 🆘 Questions fréquentes

**Q: Pourquoi 3001 et pas 3000?**
A: C'est défini dans `main.ts`. Vous pouvez le changer en mettant `await app.listen(3000);`

**Q: Comment changer le port?**
A: Modifiez `await app.listen(3001);` dans `main.ts` ou définissez une variable d'env `PORT=3000`

**Q: Les headers CORS ne sont pas envoyés sur les erreurs?**
A: Le middleware `CorsHeadersMiddleware` est appliqué avant les routes, donc il gère aussi les erreurs.

**Q: Dois-je redémarrer le frontend après changer le backend?**
A: Non pour les changements de code backend. Oui si vous changez les variables d'env (.env) frontend.
