'use strict';

const { MongoClient } = require('mongodb');
const mongoUri = process.env.MONGO_URI;

module.exports = async function () {
  const client = new MongoClient(mongoUri);
  let conn;
  try {
    conn = await client.connect();
  } catch (err) {
    console.error(err);
  }
  return conn.db("issue-tracker");
}
