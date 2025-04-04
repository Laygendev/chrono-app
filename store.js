const { join } = require('path');
const { app } = require('electron');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const file = join(app.getPath('userData'), 'data.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {
  auth: null,
  prefs: {}
}); // ✅ Ajoute les données par défaut ici

async function initStore() {
  await db.read();
  db.data ||= { auth: null, prefs: {} };
  await db.write();
}

async function setItem(key, value) {
  await db.read();
  db.data[key] = value;
  await db.write();
}

async function getItem(key) {
  await db.read();
  return db.data[key];
}

async function clearStore() {
  db.data = { auth: null, prefs: {} };
  await db.write();
}

module.exports = {
  initStore,
  setItem,
  getItem,
  clearStore
};
