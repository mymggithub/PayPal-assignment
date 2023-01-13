import fetch from "node-fetch";
import items_file from "./items.json" assert { type: "json" };

// set some important variables
const { CLIENT_ID, APP_SECRET } = process.env;
const base = "https://api-m.sandbox.paypal.com";
export const currency = "USD";

// call the create order method
export async function createOrder(orders) {
  var total = 0;
  var pp_item_list = [];
  orders.forEach(item => {
    items_file.products.forEach(product => {
      if (product.name == item.name && item.price == product.price) {
        total+=item.price*item.count;
        pp_item_list.push({
          name: item.name, 
          unit_amount: {
            currency_code: currency, 
            value: item.price
          }, 
          quantity: item.count, 
          description: product.title
        });
      }
    });
  });
  const purchaseAmount = total; // TODO: pull prices from a database
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          shipping:{
            address: {
              address_line_1: "Main St",
              address_line_2: "123",
              admin_area_2: "San Jose",
              admin_area_1: "CA",
              postal_code: "95131",
              country_code: "US"
            }
          },
          amount: {
            currency_code: currency,
            value: purchaseAmount,
            amount_breakdown:{
              item_total:{
                currency_code: currency,
                value: purchaseAmount
              },
            },
          },
        },
      ],
    }),
  });

  return handleResponse(response);
}

// capture payment for an order
export async function capturePayment(orderId) {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderId}/capture`;
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response);
}

// generate access token
export async function generateAccessToken() {
  const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "post",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const jsonData = await handleResponse(response);
  return jsonData.access_token;
}

// generate client token
export async function generateClientToken() {
  const accessToken = await generateAccessToken();
  const response = await fetch(`${base}/v1/identity/generate-token`, {
    method: "post",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en_US",
      "Content-Type": "application/json",
    },
  });
  console.log('response', response.status)
  const jsonData = await handleResponse(response);
  return jsonData.client_token;
}

async function handleResponse(response) {
  if (response.status === 200 || response.status === 201) {
    return response.json();
  }

  const errorMessage = await response.text();
  throw new Error(errorMessage);
}