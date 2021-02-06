import fetch from "node-fetch";
import { responseHeaders } from '../utils';

const {
  PRINT_CLIENT_ID,
  PRINT_CLIENT_SECRET
} = process.env;

const fetchAuthorizationToken = async () => {
  const responseRaw = await fetch("https://test.printapi.nl/v2/oauth", {
    method: 'POST',
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': PRINT_CLIENT_ID,
      'client_secret': PRINT_CLIENT_SECRET
    }),
  });
  return responseRaw.json();
}

exports.handler = async (event) => {
  const token = await fetchAuthorizationToken();
  return { statusCode: 200, body: JSON.stringify(token), ...responseHeaders }; 
}