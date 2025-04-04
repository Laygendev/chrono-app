import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User } from 'lucide-react';

const LoginModal = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('jimmy@lajungle.fr');
  const [password, setPassword] = useState('lajungle33');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      // 1. Appel à l'API pour récupérer le token
      const authResponse = await fetch('https://api.lajungle.net/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!authResponse.ok) throw new Error('Identifiants incorrects');

      const { token } = await authResponse.json();

      // 2. Appel à l'API pour récupérer les données utilisateur
      const userResponse = await fetch('https://api.lajungle.net/user/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.ok) throw new Error('Impossible de récupérer les infos');

      const user = await userResponse.json();

      // 3. Concaténer le token aux données utilisateur
      const userData = { ...user, token };

      // 4. Sauvegarder l'objet complet dans le storage (ici localStorage)
      await window.electron.store.set('userData', userData);

      // 5. Propager la donnée vers l'application (via un callback par exemple)
      onLoginSuccess(userData);
      onClose();
    } catch (e) {
      setError(e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        layout
        transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
        className="relative bg-white rounded-lg shadow-lg p-4 w-96 no-drag"
      >
        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <h2 className="font-medium text-center text-lg">Connexion</h2>
          <div className="ml-auto">
            {/* <button
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full p-1 transition"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button> */}
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full border mt-1 border-gray-300 rounded p-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@exemple.com"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700">Mot de passe</label>
          <input
            type="password"
            className="w-full border mt-1 border-gray-300 rounded p-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2">
          {/* <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-black transition"
          >
            Annuler
          </button> */}
          <button
            onClick={handleLogin}
            disabled={isSubmitting}
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <User size={16} />
                Connexion
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;
