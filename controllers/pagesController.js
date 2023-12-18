require("dotenv").config();
const axios = require("axios");

module.exports.checkBill = async (req, res) => {
  const invoiceNumber = req.body.InvoiceNumber;
  console.log(invoiceNumber);

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
    console.log(data.code);

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

    if (data.code === 0) {
      message = `Issuer: ${
        data.result.sender.businessName.length > 11
          ? data.result.sender.businessName.slice(0, 11)
          : data.result.sender.businessName
      },
      Payee: ${
        data.result.recipient.firstName.length > 10
          ? data.result.recipient.firstName.slice(0, 10)
          : data.result.recipient.firstName
      },
      Bill Type: ${data.result.category},
      Amount: ${data.result.amount},
      Status: ${data.result.status},
      Deadline: ${new Date(data.result.expiresOn).toLocaleDateString()}`;

      pageContent = {
        message: `${message}`, // Might not be needed
        // invoiceamount: `${data.result.amount}`,
        // InvoiceNumber: invoiceNumber,
        page: {
          // Might not be needed
          menu: "true",
          history: "true",
          navigation_keywords: "true",
        },
      };

      return res.json(pageContent);
    }
  } catch (error) {
    pageContent = {
      message: `${error.message}`,
      //message: `We were faced with an error while processing your request, please try again later`,
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
          Authorization: `Bearer ${process.env.checkBillToken}`,
          "Content-Type": "application/json",
          "X-Beversion": "4.0.0",
        },
      }
    );

    const postData = await response.data;
    console.log("postData", postData);
  };

  try {
    console.log("requestBody", req.body.InvoiceNumber);
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
    console.log("responseData", responseData);

    try {
      if (
        responseData.code === 0 &&
        responseData.result.status === "PENDING_PAYMENT"
      ) {
        setTimeout(async () => {
          await sendPaymentRequest();
        }, 1000);
        return res.json({
          page: {
            session_end: "true",
          },
          message:
            "Your request is being processed. To finalize your transaction, please dial *126# and enter your PIN code", // customize messages will be useful here.
        }); // Message to be customized based on the Telco....
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
    } catch (error) {
      return res.json({
        page: {
          session_end: "true",
        },
        message: `${error.message}`,
        //message: `We were faced with an error while processing your request, please try again later`,
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
