var mysql = require('promise-mysql');

// Create pool connection db mysql
pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'yourpassword',
  database: 'chatbots',
  port: 3306,
  connectionLimit: 10,
  debug: false
});

// Declare function to connection mysql pool
function getSqlConnection() {
  return pool.getConnection().disposer(function(connection) {
    pool.releaseConnection(connection);
  });
}

module.exports = getSqlConnection;
