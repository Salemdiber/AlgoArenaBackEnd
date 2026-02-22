# Intégration reCAPTCHA v2 - AlgoArena

## Configuration Backend (NestJS)

### 1. Variables d'environnement (.env)
```dotenv
RECAPTCHA_SECRET=6LdKIHMsAAAAAMVX_6-yG6iNW1dcocjH-ktJZC2b
RECAPTCHA_SITE_KEY=6LdKIHMsAAAAACo6AkNg2KChjBhGcVCj2Rwj-rey
```

### 2. Installation des dépendances
```bash
npm install axios
```

### 3. Endpoints protégés par reCAPTCHA

#### **Sign Up (Register)**
```bash
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
  "captchaToken": "<token_from_recaptcha>"
}
```

**Réponse:**
```json
{
  "id": "user_id",
  "username": "john_doe",
  "email": "john@example.com"
}
```

---

#### **Sign In (Login)**
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123",
  "captchaToken": "<token_from_recaptcha>"
}
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### **Forgot Password**
```bash
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com",
  "captchaToken": "<token_from_recaptcha>"
}
```

**Réponse:**
```json
{
  "message": "Reset email sent successfully"
}
```

---

## Configuration Frontend (React)

### 1. Installation
```bash
npm install react-google-recaptcha
```

### 2. Configuration

Ajoutez la clé publique de reCAPTCHA dans vos composants :
```typescript
const RECAPTCHA_SITE_KEY = '6LdKIHMsAAAAACo6AkNg2KChjBhGcVCj2Rwj-rey';
```

### 3. Intégration dans les formulaires

**Voir le fichier `RECAPTCHA_FRONTEND_EXAMPLE.tsx` pour des exemples de composants React complets avec reCAPTCHA v2**

Points clés :
- Wrapper `<ReCAPTCHA>` dans le formulaire
- Récupérer le token : `recaptchaRef.current?.getValue()`
- Réinitialiser après chaque soumission : `recaptchaRef.current?.reset()`
- Envoyer le token au backend

---

## Architecture de sécurité

```
Frontend (React)
  ↓
  [Utilisateur remplit le formulaire]
  ↓
  [reCAPTCHA v2 - Captcha visuel]
  ↓
  [Récupération du token]
  ↓
Backend (NestJS)
  ↓
  [POST /auth/login avec captchaToken]
  ↓
  [Vérification du captcha auprès de Google]
  ↓
  [Validation de l'utilisateur/mot de passe]
  ↓
  [Création du JWT]
  ↓
  [Réponse au client]
```

---

## Bonnes pratiques de sécurité

✅ **Utilisé:**
- reCAPTCHA v2 sur Sign Up, Sign In, Forgot Password
- Vérification côté serveur (validation requise)
- Token reCAPTCHA validé auprès de Google
- Clés secrètes stockées en variables d'environnement
- Gestion d'erreurs appropriée

---

## Dépannage

### ❌ "Captcha validation failed"
- Vérifier que le token reCAPTCHA n'est pas expiré
- Vérifier que `RECAPTCHA_SECRET` est correct dans `.env`
- Vérifier la clé publique côté frontend

### ❌ "Captcha token is required"
- Assurez-vous que le frontend envoie bien le `captchaToken`
- Vérifier que reCAPTCHA v2 est bien chargé

### ❌ "Captcha verification error"
- Problème de connexion avec les serveurs Google
- Vérifier la connectivité réseau

---

## Structure des fichiers

```
src/
├── auth/
│   ├── auth.service.ts        ← Vérification reCAPTCHA intégrée
│   ├── auth.controller.ts      ← Endpoints protégés
│   └── ...
└── config/
    └── recaptcha.config.ts     ← Configuration reCAPTCHA

.env                            ← Clés secrètes
.env.example                    ← Template pour les variables

RECAPTCHA_FRONTEND_EXAMPLE.tsx  ← Exemples de composants React
```

---

## Documentation Google

- [reCAPTCHA v2 Documentation](https://developers.google.com/recaptcha/docs/v2/start)
- [reCAPTCHA v2 API Reference](https://developers.google.com/recaptcha/docs/v2/verify)
- [react-google-recaptcha](https://github.com/timothypage/react-google-recaptcha)
