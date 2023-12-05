import { redirect } from "@remix-run/node";
import {
  deleteImage,
  getImage,
  getImgs,
  deleteImages,
} from "../mongo/controllers";

export const action = async ({ request, params }) => {
  const body = await request.json();
  const ids = body.selectedIds;
  if (ids.length > 1) {
    let shopifyIds = [];
    const images = await getImgs(ids);
    console.log("Selected Images in Delete", images);
    images.map((image) => {
      shopifyIds.push(image.shopifyId);
    });
    console.log("Selected ShopifyIds in Delete", shopifyIds);
    const deleteQuery = `mutation fileDelete($fileIds: [ID!]!) {
      fileDelete(fileIds: $fileIds) {
        deletedFileIds
        userErrors {
          field
          message
        }
      }
    }`;
    const variables = {
      fileIds: shopifyIds,
    };
    const response = await fetch(process.env.SHOPIFY_ADMIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": `${process.env.ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        query: deleteQuery,
        variables: variables,
      }),
    });

    const {
      data: { fileDelete: { deletedFileIds } = {} },
    } = await response.json();

    const deletedImages = await deleteImages(ids);

    return {
      shopifyRes: deletedFileIds,
      mongoDBRes: deletedImages,
    };
  }
  ////////////////////////////
  else {
    const mongoId = ids[0];
    const dbImage = await getImage(mongoId);
    const shopifyId = dbImage[0].shopifyId;

    const getQuery = `{
    node(id: "${shopifyId}") {
      id
      }
    }`;
    const res = await fetch(process.env.SHOPIFY_ADMIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": `${process.env.ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        query: getQuery,
      }),
    });
    const {
      data: { node: { id } = {} },
    } = await res.json();

    const deleteQuery = `mutation fileDelete($fileIds: [ID!]!) {
    fileDelete(fileIds: $fileIds) {
      deletedFileIds
      userErrors {
        field
        message
      }
    }
  }`;
    const variables = {
      fileIds: [`${shopifyId}`],
    };
    let response;
    if (id && id == shopifyId) {
      response = await fetch(process.env.SHOPIFY_ADMIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": `${process.env.ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          query: deleteQuery,
          variables: variables,
        }),
      });
    }

    const {
      data: { fileDelete: { deletedFileIds } = {} },
    } = await response.json();

    const del = await deleteImage(mongoId);

    return {
      shopifyRes: deletedFileIds,
      mongoRes: del,
    };
  }
};

export const loader = () => {
  return redirect("/app");
};
