# Exemples d'intégration reCAPTCHA v2 - Frontend React

## Installation des dépendances

```bash
npm install react-google-recaptcha axios
```

---

## 1. Composant Login

```typescript
// src/pages/Login.tsx
import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';

const RECAPTCHA_SITE_KEY = '6LdKIHMsAAAAACo6AkNg2KChjBhGcVCj2Rwj-rey';

export const LoginComponent: React.FC = () => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const captchaToken = recaptchaRef.current?.getValue();

      if (!captchaToken) {
        setError('Please complete the reCAPTCHA');
        setLoading(false);
        return;
      }

      const response = await axios.post('/auth/login', {
        username: formData.username,
        password: formData.password,
        captchaToken: captchaToken,
      });

      localStorage.setItem('access_token', response.data.access_token);
      console.log('Login successful!');
      // Rediriger vers le dashboard
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Password:</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div style={{ margin: '20px 0' }}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

---

## 2. Composant Register

```typescript
// src/pages/Register.tsx
import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';

const RECAPTCHA_SITE_KEY = '6LdKIHMsAAAAACo6AkNg2KChjBhGcVCj2Rwj-rey';

export const RegisterComponent: React.FC = () => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const captchaToken = recaptchaRef.current?.getValue();

      if (!captchaToken) {
        setError('Please complete the reCAPTCHA');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const response = await axios.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        captchaToken: captchaToken,
      });

      console.log('Registration successful!');
      // Rediriger vers login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Password:</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Confirm Password:</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
      </div>

      <div style={{ margin: '20px 0' }}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};
```

---

## 3. Composant Forgot Password

```typescript
// src/pages/ForgotPassword.tsx
import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';

const RECAPTCHA_SITE_KEY = '6LdKIHMsAAAAACo6AkNg2KChjBhGcVCj2Rwj-rey';

export const ForgotPasswordComponent: React.FC = () => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const captchaToken = recaptchaRef.current?.getValue();

      if (!captchaToken) {
        setError('Please complete the reCAPTCHA');
        setLoading(false);
        return;
      }

      await axios.post('/auth/forgot-password', {
        email: email,
        captchaToken: captchaToken,
      });

      setSuccess(true);
      setEmail('');
      recaptchaRef.current?.reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleForgotPassword}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div style={{ margin: '20px 0' }}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Reset email sent successfully!</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>
    </form>
  );
};
```

---

## Points clés

✅ **Obligatoire**
- Ajouter le ref `recaptchaRef` au composant `<ReCAPTCHA>`
- Récupérer le token : `recaptchaRef.current?.getValue()`
- Envoyer le token au backend dans les paramètres
- Réinitialiser après chaque soumission : `recaptchaRef.current?.reset()`

✅ **Gestion des erreurs**
- Vérifier que le token existe avant d'envoyer
- Gérer les erreurs du serveur
- Afficher des messages clair à l'utilisateur

✅ **UX**
- Désactiver le bouton pendant le chargement
- Afficher des messages de succès/erreur
- Réinitialiser le captcha après erreur
