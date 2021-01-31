import fetch from "node-fetch";
import sha1 from 'js-sha1';
import { v4 as uuid } from 'uuid';

const responseHeaders = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Credentials': true
  }
};

const {
  BACKBLAZE_USERNAME_PASSWORD,
  BACKBLAZE_BUCKET_ID: bucketId,
  SEJDA_API_KEY
} = process.env;

const getAuthorization = async () => {
  const responseRaw = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: {
      "Authorization": `Basic ${BACKBLAZE_USERNAME_PASSWORD}`
    },
  });
  return responseRaw.json();
}

const validateEvent = (event, callback) => {
  console.log(event);
  try {
    console.log(event.body);
    const body = JSON.parse(event.body);
    if (!body.htmlCode) {
      return { statusCode: 400, body: 'provide a correct body', ...responseHeaders };
    }
    return callback(body)
  } catch (error) {
    return { statusCode: 400, body: 'provide a body', ...responseHeaders }; 
  }
}

const getPdfCode = async (sejdaParameters) => {
  const responseRaw = await fetch(`https://api.sejda.com/v2/html-pdf`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token: ${SEJDA_API_KEY}`
    },
    body: JSON.stringify({
      ...sejdaParameters
    })
  });
  const response = await responseRaw.arrayBuffer();
  return response;
}

const getUploadUrl = async () => {
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
  return response;

}

const uploadFile = async ({ content }) => {
  const { authorizationToken: Authorization, uploadUrl } = await getUploadUrl();

  const responseRaw = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization,
      'X-Bz-File-Name': `map-${uuid()}.pdf`,
      'X-Bz-Content-Sha1': sha1(content),
      'Content-Type': 'application/pdf',
    },
    body: content,
  });

  const response = await responseRaw.json();
  if (response.fileName) {
    return `https://f000.backblazeb2.com/file/map-prints/${response.fileName}`;
  }
  // throw error here
  return response;
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    console.log(body.sejdaParameters);
    if (!body.sejdaParameters) {
      return { statusCode: 200, body: JSON.stringify({ error: 'provide a body' }), ...responseHeaders };
    }
    const {
      sejdaParameters
    } = body;
    const content = await getPdfCode(sejdaParameters);
    const fileLink = await uploadFile({ content });
    return { 
      statusCode: 200,
      body: JSON.stringify({
        fileLink
      }),
      ...responseHeaders
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 200, body: JSON.stringify({ error: error }), ...responseHeaders }; 
  }
};
