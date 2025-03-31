import React, { useState } from 'react';

const { ipcRenderer } = window.require('electron');

const OAuthCodePrompt = () => {
  const [code, setCode] = useState('');

  const sendCode = () => {
    ipcRenderer.send('oauth-code', code);
  };

  ipcRenderer.once('oauth-success', () => {
    alert('Connexion réussie !');
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 space-y-4">
        <h2 className="text-lg font-bold">Authentification Google</h2>
        <p>Collez ici le code reçu après l'autorisation :</p>
        <input
          type="text"
          className="w-full border p-2"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <button
          onClick={sendCode}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Envoyer le code
        </button>
      </div>
    </div>
  );
};

export default OAuthCodePrompt;
