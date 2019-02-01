var dotenv = require('dotenv');
dotenv.load();

module.exports = {
  development: {
    client: 'mysql',
    connection: {
      host     : process.env.MYSQL_HOST,
      port     : process.env.MYSQL_PORT,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASS,
      database : 'musicfix_dev'
    },
    debug: false,
    pool: {
	    max: 10,
	    min: 1
	  },
    seeds: {
        directory: './seeds'
    }
  },
  test: {
    client: 'mysql',
    connection: {
      host     : process.env.MYSQL_HOST,
      port     : process.env.MYSQL_PORT,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASS,
      database : 'musicfix_test'
    },
    pool: {
      max: 1,
      min: 1
    },
    seeds: {
        directory: './seeds'
    }
  },
  production: {
    client: 'mysql',
    connection: {
      host     : process.env.MYSQL_HOST,
      port     : process.env.MYSQL_PORT,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASS,
      database : 'musicfix'
    },
    pool: {
      max: 1,
      min: 1
    },
    seeds: {
        directory: './seeds'
    }
  }
}
