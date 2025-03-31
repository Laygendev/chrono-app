import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'http://localhost'
);

export const listGoogleSheets = async () => {
  const drive = google.drive({ version: 'v3', auth: oAuth2Client });
  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: 'files(id, name)'
  });
  return res.data.files;
};

export const listSheetTabs = async (fileId) => {
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const res = await sheets.spreadsheets.get({ spreadsheetId: fileId });
  return res.data.sheets.map(s => s.properties.title);
};

export const appendToSheet = async (fileId, sheetName, values) => {
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  await sheets.spreadsheets.values.append({
    spreadsheetId: fileId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
};
