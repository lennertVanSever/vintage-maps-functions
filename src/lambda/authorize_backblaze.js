import fetch from "node-fetch";

const {
  BACKBLAZE_USERNAME_PASSWORD,
  BACKBLAZE_BUCKET_ID: bucketId,
} = process.env;

const getAuthorization = async () => {
  const responseRaw = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: {
      "Authorization": `Basic ${BACKBLAZE_USERNAME_PASSWORD}`
    },
  });
  return responseRaw.json();
}
exports.handler = async () => {
  try {
    const { authorizationToken: Authorization, apiUrl } = await getAuthorization();
    const responseRaw = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization
      },
      body: JSON.stringify({ bucketId })
    });
    const response = await responseRaw.json();
    return {
      statusCode: responseRaw.status,
      body: JSON.stringify(response),
      headers: {
        /* Required for CORS support to work */
        'Access-Control-Allow-Origin': 'http://localhost:8080',
        /* Required for cookies, authorization headers with HTTPS */
        'Access-Control-Allow-Credentials': true
      },
    }
  }
  catch(error) {
    return { statusCode: 500, body: error };
  }
};
