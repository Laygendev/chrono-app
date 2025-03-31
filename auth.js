// auth.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { app, shell, ipcMain } = require('electron');
const Store = require('electron-store');

const store = new Store();

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets'
];

const CREDENTIALS = {
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uris: ['http://localhost'] // Pour Electron
};

const oAuth2Client = new google.auth.OAuth2(
  CREDENTIALS.client_id,
  CREDENTIALS.client_secret,
  CREDENTIALS.redirect_uris[0]
);

// 🔐 Fonction de connexion OAuth2
const authenticate = async () => {
  const tokens = store.get('tokens');
  if (tokens) {
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  // Ouvrir le navigateur externe
  shell.openExternal(authUrl);

  ipcMain.once('oauth-code', async (event, code) => {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    store.set('tokens', tokens);
    event.sender.send('oauth-success');
  });

  return null;
};

module.exports = {
  authenticate,
  getOAuthClient: () => oAuth2Client
};
