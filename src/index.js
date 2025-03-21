import express from "express";
import axios from "axios";

const SERVER = express();
const PORT_NUM = 9876;
const CACHE_LIMIT = 10;
let dataCache = [];
let tokenCache = null;
let tokenExpiry = 0;

const API_LINKS = {
  p: "http://20.244.56.144/test/primes",
  f: "http://20.244.56.144/test/fibo",
  e: "http://20.244.56.144/test/even",
  r: "http://20.244.56.144/test/rand"
};

const AUTH_URL = "http://20.244.56.144/test/auth";
const AUTH_CREDENTIALS = {
  "companyName": "goMart",
  "clientID": "94ee3cca-2fe0-48ff-9b9d-8db042cdd167",
  "clientSecret": "vMEjNBoRhXiBCiad",
  "ownerName": "surya pratap singh",
  "ownerEmail": "surya.2201254cs@iiitbh.ac.in",
  "rollNo": "2201254cs"
};

async function retrieveToken() {
  try {
    const reply = await axios.post(AUTH_URL, AUTH_CREDENTIALS);
    tokenCache = reply.data.access_token;
    tokenExpiry = Date.now() + reply.data.expires_in * 1000;
    return tokenCache;
  } catch (err) {
    throw new Error("Token Fetch Failed");
  }
}

async function getToken() {
  if (!tokenCache || Date.now() >= tokenExpiry) {
    return await retrieveToken();
  }
  return tokenCache;
}

async function acquireNumbers(code) {
  try {
    const token = await getToken();
    const reply = await axios.get(API_LINKS[code], {
      timeout: 500,
      headers: { Authorization: `Bearer ${ token }` }
        });
return reply.data.numbers || [];
    } catch (err) {
  return [];
}
}

SERVER.get("/numbers/:code", async (req, res) => {
  const code = req.params.code;
  if (!["p", "f", "r", "e"].includes(code)) {
    return res.status(400).json({ error: "Invalid Code" });
  }

  const previousState = [...dataCache];
  const freshData = await acquireNumbers(code);

  freshData.forEach(num => {
    if (!dataCache.includes(num)) {
      dataCache.push(num);
    }
  });

  while (dataCache.length > CACHE_LIMIT) {
    dataCache.shift();
  }

  const average = dataCache.length ? (dataCache.reduce((x, y) => x + y, 0) / dataCache.length).toFixed(2) : 0;

  res.json({
    pastData: previousState,
    currentData: dataCache,
    fetchedNumbers: freshData,
    meanValue: parseFloat(average)
  });
});

SERVER.listen(PORT_NUM, () => console.log(`Running at http://localhost:${PORT_NUM}`));