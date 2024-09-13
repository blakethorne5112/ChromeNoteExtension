require('dotenv').config();
const apiKey = process.env.API_KEY;
const searchId = process.env.SEARCH_ENGINE_ID;

async function searchGoogle(query) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchId}:omuauf_lfve&q=${query}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}