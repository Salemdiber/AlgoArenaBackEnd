# Test reCAPTCHA v2 - Guide complet

## Configuration complétée ✅

### Clés reCAPTCHA
- **Site Key** (Public): `6LdKIHMsAAAAACo6AkNg2KChjBhGcVCj2Rwj-rey`
- **Secret Key** (Private): `6LdKIHMsAAAAAMVX_6-yG6iNW1dcocjH-ktJZC2b` ✅ Dans `.env`

### Backend (NestJS)
- ✅ `ConfigService` injecté dans `AuthService`
- ✅ Méthode `verifyCaptcha()` améliorée avec gestion d'erreurs
- ✅ Endpoints protégés: `/auth/register`, `/auth/login`, `/auth/forgot-password`
- ✅ Validation du token côté serveur auprès de Google

### Frontend (React)
- 📄 Exemples dans `RECAPTCHA_FRONTEND_EXAMPLES.md`
- ✅ 3 composants prêts à intégrer: Login, Register, ForgotPassword
- ✅ Gestion complète des erreurs et du chargement

---

## Test manuel

### 1. Test Login avec reCAPTCHA

**Requête:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "captchaToken": "<token_depuis_recaptcha>"
  }'
```

**Réponse attendue:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erreur si captcha manquant:**
```json
{
  "statusCode": 400,
  "message": "Captcha token is required"
}
```

---

### 2. Test Register avec reCAPTCHA

**Requête:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_user",
    "email": "user@example.com",
    "password": "SecurePass123",
    "captchaToken": "<token_depuis_recaptcha>"
  }'
```

---

### 3. Test Forgot Password avec reCAPTCHA

**Requête:**
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "captchaToken": "<token_depuis_recaptcha>"
  }'
```

---

### 4. Simuler un test sans reCAPTCHA (devrait échouer)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

**Réponse attendue:**
```json
{
  "statusCode": 400,
  "message": "Captcha token is required"
}
```

---

## Flux sécurité complète

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       │ 1. Utilisateur remplit formulaire
       │
       ↓
┌──────────────────┐
│  reCAPTCHA v2    │ ← Affiche captcha visuel à l'utilisateur
│    Challenge     │
└──────┬───────────┘
       │
       │ 2. Utilisateur résout le captcha
       │
       ↓
┌──────────────────┐
│  Token reCAPTCHA │ ← Token généré par Google
│    récupéré      │
└──────┬───────────┘
       │
       │ 3. POST /auth/login + token
       │
       ↓
┌─────────────┐
│   Backend   │
│  (NestJS)   │
└──────┬──────┘
       │
       │ 4. Vérification du token auprès de Google
       │
       ↓
┌──────────────────────────────┐
│ Google reCAPTCHA Server      │
│ /recaptcha/api/siteverify    │
└──────┬───────────────────────┘
       │
       │ 5. Réponse: success=true/false
       │
       ↓
┌─────────────────────┐
│ Validation complète │
│  + Validation user  │
└─────────┬───────────┘
          │
          ↓
    ✅ JWT Token retourné
    ❌ Erreur s'il y a problème
```

---

## Scénarios de test

### ✅ Scenario 1: Login valide avec captcha valide
1. Remplir username + password
2. Résoudre le captcha
3. Cliquer sur Login
4. **Résultat attendu**: JWT token reçu, redirection vers dashboard

### ❌ Scenario 2: Login sans captcha
1. Remplir username + password
2. **Ne pas** cliquer sur le captcha
3. Cliquer sur Login
4. **Résultat attendu**: Erreur "Captcha token is required"

### ⚠️ Scenario 3: Captcha mal résolu
1. Remplir username + password
2. Modifier le token reCAPTCHA (invalide)
3. Cliquer sur Login
4. **Résultat attendu**: Erreur "Captcha validation failed"

### ✅ Scenario 4: Register avec captcha
1. Remplir tous les champs
2. Résoudre le captcha
3. Cliquer sur Register
4. **Résultat attendu**: Utilisateur créé, JWT token reçu

### ✅ Scenario 5: Forgot Password avec captcha
1. Entrer l'email
2. Résoudre le captcha
3. Cliquer sur "Send Reset Email"
4. **Résultat attendu**: "Reset email sent successfully"

---

## Fichiers créés/modifiés

### Backend
- ✅ `src/auth/auth.service.ts` - Vérification reCAPTCHA améliorée
- ✅ `src/auth/auth.controller.ts` - Endpoints mis à jour
- ✅ `src/config/recaptcha.config.ts` - Configuration centralisée
- ✅ `.env` - Clés reCAPTCHA ajoutées
- ✅ `.env.example` - Template créé

### Documentation
- ✅ `RECAPTCHA_SETUP.md` - Guide d'intégration complet
- ✅ `RECAPTCHA_FRONTEND_EXAMPLES.md` - Exemples React
- ✅ `RECAPTCHA_TEST_GUIDE.md` - Ce fichier

---

## Prochaines étapes

1. **Intégrer React** : Copier les exemples de `RECAPTCHA_FRONTEND_EXAMPLES.md` dans votre projet React
2. **Installer dépendances** : `npm install react-google-recaptcha axios`
3. **Mettre à jour les composants** : Ajouter les formulaires avec reCAPTCHA
4. **Tester les flux** : Seguez les scénarios de test
5. **Améliorer la sécurité** :
   - Ajouter rate limiting
   - Ajouter logging des tentatives échouées
   - Configurer des alertes pour les tentatives suspectes

---

## Besoin d'aide ?

- 📚 [reCAPTCHA v2 Documentation](https://developers.google.com/recaptcha/docs/v2/start)
- 📚 [react-google-recaptcha](https://github.com/timothypage/react-google-recaptcha)
- 🔐 [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
