const host = window.location.protocol + "//" + window.location.host;

paypal
  .Buttons({
    // Sets up the transaction when a payment button is clicked
    createOrder: function (data, actions) {
      return fetch("/api/orders", {
        method: "post",
        headers: {
          'content-type': 'application/json'
        },
        // use the "body" param to optionally pass additional order information
        // like product ids or amount
        body: JSON.stringify({
          products: JSON.parse(sessionStorage.getItem('shoppingCart')),
          addr: {
            streetAddress: document.getElementById("shipping-address-street").value,
            extAddress: document.getElementById("shipping-address-unit").value,
            state: document.getElementById("shipping-address-state").value,
            city: document.getElementById("shipping-address-city").value,
            zip: document.getElementById("shipping-address-zip").value,
            countryCodeAlpha2: document.getElementById("shipping-address-country").value,// Country Code
          }
        })
      })
        .then((response) => response.json())
        .then((order) => order.id);
    },
    // Finalize the transaction after payer approval
    onApprove: function (data, actions) {
      return fetch(`/api/orders/${data.orderID}/capture`, {
        method: "post",
      })
        .then((response) => response.json())
        .then((orderData) => {
          // Successful capture! For dev/demo purposes:
          // console.log(
          //   "Capture result",
          //   orderData,
          //   JSON.stringify(orderData, null, 2)
          // );
          const transaction = orderData.purchase_units[0].payments.captures[0];
          if (transaction.status == "COMPLETED") {
            actions.redirect(host + "/thank_you/" + transaction.id); 
          }
        });
    },
  })
  .render("#paypal-button-container");

if (paypal.HostedFields.isEligible()) {
  let orderId;

  // Renders card fields
  paypal.HostedFields.render({
    // Call your server to set up the transaction
    createOrder: () => {
      return fetch("/api/orders", {
        method: "post",
        headers: {
          'content-type': 'application/json'
        },
        // use the "body" param to optionally pass additional order information like
        // product ids or amount.
        body: JSON.stringify({
          products: JSON.parse(sessionStorage.getItem('shoppingCart')),
          addr: {
            streetAddress: document.getElementById("shipping-address-street").value,
            extAddress: document.getElementById("shipping-address-unit").value,
            state: document.getElementById("shipping-address-state").value,
            city: document.getElementById("shipping-address-city").value,
            zip: document.getElementById("shipping-address-zip").value,
            countryCodeAlpha2: document.getElementById("shipping-address-country").value,// Country Code
          }
        })
      })
        .then((res) => res.json())
        .then((orderData) => {
          orderId = orderData.id; // needed later to complete capture
          return orderData.id;
        });
    },
    styles: {
      ".valid": {
        color: "green",
      },
      ".invalid": {
        color: "red",
      },
    },
    fields: {
      number: {
        selector: "#card-number",
        placeholder: "4111 1111 1111 1111",
      },
      cvv: {
        selector: "#cvv",
        placeholder: "123",
      },
      expirationDate: {
        selector: "#expiration-date",
        placeholder: "MM/YY",
      },
    },
  }).then((cardFields) => {
    document.querySelector("#card-form").addEventListener("submit", (event) => {
      snackbar_msg("Processing, Please Wait...");
      event.preventDefault();
      cardFields
        .submit({
          // Cardholder's first and last name
          cardholderName: document.getElementById("card-holder-name").value,
          billingAddress: {
            // Street address, line 1
            streetAddress: document.getElementById(
              "shipping-address-street"
            ).value,
            // Street address, line 2 (Ex: Unit, Apartment, etc.)
            extendedAddress: document.getElementById(
              "shipping-address-unit"
            ).value,
            // State
            region: document.getElementById("shipping-address-state").value,
            // City
            locality: document.getElementById("shipping-address-city")
              .value,
            // Postal Code
            postalCode: document.getElementById("shipping-address-zip")
              .value,
            // Country Code
            countryCodeAlpha2: document.getElementById(
              "shipping-address-country"
            ).value,
          },
        })
        .then(() => {
          fetch(`/api/orders/${orderId}/capture`, {
            method: "post",
          })
            .then((res) => res.json())
            .then((orderData) => {
              const errorDetail =
                Array.isArray(orderData.details) && orderData.details[0];
              if (errorDetail) {
                var msg = "Sorry, your transaction could not be processed.";
                if (errorDetail.description)
                  msg += "\n\n" + errorDetail.description;
                if (orderData.debug_id) msg += " (" + orderData.debug_id + ")";
                return alert(msg); // Show a failure message
              }
              // Show a success message or redirect
              const transaction = orderData.purchase_units[0].payments.captures[0];
              if (transaction.status == "COMPLETED") {
                window.location.href = host + "/thank_you/" + transaction.id;
              }
            });
        })
        .catch((err) => {
          alert("Payment could not be captured! " + JSON.stringify(err));
          console.log(JSON.stringify(err))
        });
    });
  });
} else {
  document.querySelector("#card-form").style = "display: none";
}
