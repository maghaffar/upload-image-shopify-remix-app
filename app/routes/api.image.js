import { createImage } from "../mongo/controllers";
import { redirect } from "@remix-run/node";

export const action = async ({ request }) => {
  const shopifyApiEndpoint = process.env.SHOPIFY_ADMIN_URL;
  const body = await request.formData();

  const name = body.get("file").name;
  const type = body.get("file").type;
  const size = body.get("file").size;
  const file = body.get("file");
  const stagedUploadsQuery = `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        resourceUrl
        url
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

  // Variables
  const stagedUploadsVariables = {
    input: {
      filename: name,
      httpMethod: "POST",
      mimeType: type,
      resource: "IMAGE",
    },
  };

  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": `${process.env.ACCESS_TOKEN}`,
  });

  const fetchbody = JSON.stringify({
    query: stagedUploadsQuery,
    variables: stagedUploadsVariables,
  });

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: fetchbody,
  };

  const stagedUploadsQueryResult = await fetch(
    shopifyApiEndpoint,
    requestOptions
  );
  const {
    data: {
      stagedUploadsCreate: { stagedTargets },
    },
  } = await stagedUploadsQueryResult.json();

  const target = stagedTargets[0];
  const params = target.parameters;
  const url = target.url;
  const resourceUrl = target.resourceUrl;

  const form = new FormData();

  const arr = [];
  params.forEach(({ name, value }) => {
    arr.push({ name, value });
    form.append(name, value);
  });

  form.append("file", file);

  const requestOptions1 = {
    method: "POST",
    headers: {
      "Content-Length": size,
      ...arr,
    },
    body: form,
  };

  await fetch(url, requestOptions1);

  const createFileQuery = `
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        createdAt

      }
      userErrors{
       field
       message
     }
    }
  }
  `;

  // Variables
  const createFileVariables = {
    files: {
      alt: "Uploaded by Abdul",
      contentType: "IMAGE",
      originalSource: resourceUrl,
    },
  };

  const response = await fetch(shopifyApiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": `${process.env.ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: createFileQuery,
      variables: createFileVariables,
    }),
  });

  const {
    data: {
      fileCreate: { files },
    },
  } = await response.json();
  console.log("===============>>> Upload Response: ", files[0]?.createdAt);
  const getImageQuery = `{
    node(id: "${files[0].id}") {
      ... on MediaImage {
        image {
          url
        }
      }
    }
  }`;

  const imageRes = await fetch(shopifyApiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": `${process.env.ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: getImageQuery,
    }),
  });
  let {
    data: { node: { image = null } = {} },
  } = await imageRes.json();
  let img_present = image;

  while (img_present == null) {
    const res = await fetch(shopifyApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": `${process.env.ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        query: getImageQuery,
      }),
    });

    const {
      data: { node: { image = null } = {} },
    } = await res.json();
    img_present = image;
  }
  const shopifyImageUrl = img_present.url;
  const dbImage = await createImage(name, shopifyImageUrl, files[0].id);
  return {
    response: { id: files[0].id, dbImage },
  };
};

export const loader = () => {
  return redirect("/app");
};
