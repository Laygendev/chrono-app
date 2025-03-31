const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const open = (...args) => import('open').then(mod => mod.default(...args));
require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
];

function getOAuthClient() {
  const client_id = process.env.CLIENT_ID;
  const client_secret = process.env.CLIENT_SECRET;
  const redirect_uri = 'http://localhost';
  return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
}

async function getAccessToken() {
  const oAuth2Client = getOAuthClient();

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('🔗 Autorise l’application via ce lien :\n', authUrl);
  await open(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\n🔑 Colle le code ici : ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('❌ Erreur lors de l’échange du code :', err);
      oAuth2Client.setCredentials(token);
      fs.writeFileSync('token.json', JSON.stringify(token, null, 2));
      console.log('✅ Token enregistré dans token.json');
    });
  });
}

getAccessToken();
