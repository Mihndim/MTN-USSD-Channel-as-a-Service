require("dotenv").config();
const axios = require("axios");

module.exports.checkBill = async (req, res) => {
  // const userEntry = req.headers["user-entry"]; // You know how this value will be passed from their system to ours. We assume it will passed as header parameter.
  const invoiceNumber = req.body.InvoiceNumber;

  try {
    const response = await axios.get(
      `https://core.diool.me/core/onlinepayment/v1/payment/${invoiceNumber}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.checkBillToken}`,
          "Content-Type": "application/json",
          "X-Beversion": "4.0.0",
        },
      }
    );

    const data = await response.data;

    if (data.code === 404) {
      message = "The bill reference is incorrect, please verify and try again";

      pageContent = {
        message: `${message}`, // Should this be replaced by another variable ?
        page: {
          // Will be remove if not needed.
          session_end: "true",
          // menu: "true",
          // history: "true",
          // navigation_keywords: "true",
        },
      };

      return res.json(pageContent);
    }

    // if (
    //   data.code === 0 &&
    //   data.result.status === "PENDING_PAYMENT" &&
    //   data.result.amount > 1000000
    // ) {
    //   message = `Amount is not authorized by this payment method. Please call 650 774 040 for instructions on how to pay`;

    //   pageContent = {
    //     page: {
    //       session_end: "true",
    //     },
    //     message: `${message}`,
    //   };

    //   xmlResponse = convert.json2xml(pageContent, options);

    //   return res.send(xmlResponse);
    // }

    // to be updated: && data.result.status === "PENDING_PAYMENT"

    if (data.code === 0) {
      message = `Issuer: ${data.result.sender.businessName}, \n Payee: ${
        data.result.recipient.firstName
      }, \n Bill Type: ${data.result.category}, \n Amount: ${
        data.result.amount
      }, \n Status: ${data.result.status}, \n Deadline: ${new Date(
        data.result.expiresOn
      ).toLocaleDateString()}`;

      pageContent = {
        message: `${message}`, // Might not be needed
        invoiceamount: `${data.result.amount}`,
        InvoiceNumber: invoiceNumber,
        page: {
          // Might not be needed
          menu: "true",
          history: "true",
          navigation_keywords: "true",
        },
      };

      return res.json(pageContent);
    }

    // Expired bill
    //     if (
    //       data.code === 0 &&
    //       (data.result.status === "PAID" || data.result.status === "EXPIRED")
    //     ) {
    //       message = `The bill with reference ${data.result.referenceId} of amount: ${data.result.amount} is already ${data.result.status}. Thank you very much for using Diool Bills Payment`;

    //       pageContent = {
    //         page: {
    //           session_end: "true",
    //         },
    //         message: `${message}`, // customize messages will be useful here.
    //       };

    //       xmlResponse = convert.json2xml(pageContent, options);

    //       return res.send(xmlResponse);
    //     }
  } catch (error) {
    pageContent = {
      //message: `${error.message}`,
      message: `We were faced with an error while processing your request, please try again later`,
      page: {
        session_end: "true",
      },
    };
  }
  return res.json(pageContent);
};

module.exports.settleRfp = async (req, res) => {
  const sendPaymentRequest = async () => {
    const response = await axios.post(
      `https://core.diool.me/core/onlinepayment/v1/payRfp`,
      {
        providerAccountID: req.body.PhoneNumber, // We assume the user will be entering the values manually and will be sent to us in the request body.
        providerCode: "62401", // It will be MTN for all the requests.
        requestPaymentReference: req.body.InvoiceNumber,
      },
      {
        headers: {
          Authorization: `${process.env.checkBillToken}`,
          "Content-Type": "application/json",
          "X-Beversion": "4.0.0",
        },
      }
    );

    const data = await response.data;
    console.log(data);
  };

  try {
    const response = await axios.get(
      `https://core.diool.me/core/onlinepayment/v1/payment/${req.body.InvoiceNumber}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.checkBillToken}`,
          "Content-Type": "application/json",
          "X-Beversion": "4.0.0",
        },
      }
    );

    let responseData = await response.data;

    try {
      if (
        responseData.code === 0 &&
        responseData.result.status === "PENDING_PAYMENT" &&
        responseData.result.amount > 1000000
      ) {
        message = `Get a MoMo merchant account to make payments about 1 million. Dial 8787 for support`;
        pageContent = {
          page: {
            session_end: "true",
          },
          message: `${message}`,
        };
        return res.json(pageContent);
      }
      if (
        responseData.code === 0 &&
        responseData.result.status === "PENDING_PAYMENT"
      ) {
        setTimeout(() => {
          console.log("The sendPaymentRequest function was called ! ");
          sendPaymentRequest();
        }, 1000);
      } else {
        message = `The bill with reference: ${req.body.InvoiceNumber} can not be paid because it is ${responseData.result.status} `;
        pageContent = {
          page: {
            session_end: "true",
          },
          message: `${message}`,
        };
        return res.json(pageContent);
      }

      return res.json({
        page: {
          session_end: "true",
        },
        message:
          "Your request is being processed. To finalize your transaction, please dial *126# and enter your PIN code", // customize messages will be useful here.
      }); // Message to be customized based on the Telco....
    } catch (error) {
      return res.json({
        page: {
          session_end: "true",
        },
        //"message": `${error.message}`
        message: `We were faced with an error while processing your request, please try again later`,
      });
    }
  } catch (error) {
    pageContent = {
      //message: `${error.message}`,
      message: `We were faced with an error while processing your request, please try again later`,
      page: {
        session_end: "true",
      },
    };
  }
};
