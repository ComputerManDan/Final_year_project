const mysql = require('mysql2/promise');
const credentials = {
 host: 'di68.brighton.domains',
 user: 'di68_oas_admin',
 password: 'Manutd0103!',
 database: 'di68_oas'
};
async function query(sql, params) {
 const connection = await mysql.createConnection(credentials);
 const [results, ] = await connection.execute(sql, params);
 return results;
}
module.exports = {
 query
}
