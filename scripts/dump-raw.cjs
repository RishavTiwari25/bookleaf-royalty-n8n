const sqlite3 = require('C:/Users/risha/AppData/Roaming/npm/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('C:/Users/risha/.n8n/database.sqlite', sqlite3.OPEN_READONLY);
db.all('SELECT e.id, d.data FROM execution_entity e JOIN execution_data d ON d.executionId=e.id ORDER BY e.id DESC LIMIT 1', (e, r) => {
  console.log('exec id:', r[0].id);
  console.log(r[0].data.slice(0, 4000));
});
