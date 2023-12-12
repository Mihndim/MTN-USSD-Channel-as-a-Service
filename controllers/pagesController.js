require("dotenv").config();
const axios = require("axios");

module.exports.checkBill = async (req, res) => {
  const userEntry = req.headers["user-entry"]; // You know how this value will be passed from their system to ours. We assume it will passed as header parameter.

  try {
    const response = await axios.get(
      `https://core.diool.me/core/onlinepayment/v1/payment/${userEntry}`,
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
      message =
        "Oups, the bill number entered is incorrect. Please check the bill number and try again";

      pageContent = {
        title: `${process.env.pageTitle}`,
        name: "Diool Bill payments",
        message: `${message}`,
        form: {
          url: `${process.env.baseUrl}`,
          type: "text",
          method: "get",
        },
        page: {
          menu: "true",
          history: "true",
          navigation_keywords: "true",
        },
      };

      xmlResponse = convert.json2xml(pageContent, options);

      return res.send(xmlResponse);
    }

    if (
      data.code === 0 &&
      data.result.status === "PENDING_PAYMENT" &&
      data.result.amount > 1000000
    ) {
      message = `Amount is not authorized by this payment method. Please call 650 774 040 for instructions on how to pay`;

      pageContent = {
        page: {
          session_end: "true",
        },
        message: `${message}`,
      };

      xmlResponse = convert.json2xml(pageContent, options);

      return res.send(xmlResponse);
    }

    if (data.code === 0 && data.result.status === "PENDING_PAYMENT") {
      message = `Bill From: ${data.result.sender.businessName}, \n Bill To: ${
        data.result.recipient.firstName
      }, \n Amount: ${data.result.amount}, \n For: ${
        data.result.paymentFor
      }, \n Pay before: ${new Date(
        data.result.expiresOn
      ).toLocaleDateString()}`;

      pageContent = {
        title: `${process.env.pageTitle}`,
        name: "Diool Bill payments",
        message: `${message}`,
        links: [
          {
            content: " Pay my Bill",
            url: `${process.env.baseUrl}/settleRfp`, // We assume mtn will give us access to numbers.
          },
          {
            content: " To Quit",
            url: `${process.env.baseUrl}/quit`,
          },
        ],
        page: {
          menu: "true",
          history: "true",
          navigation_keywords: "true",
        },
      };

      xmlResponse = convert.json2xml(pageContent, options);

      return res.send(xmlResponse);
    }

    if (
      data.code === 0 &&
      (data.result.status === "PAID" || data.result.status === "EXPIRED")
    ) {
      message = `The bill with reference ${data.result.referenceId} of amount: ${data.result.amount} is already ${data.result.status}. Thank you very much for using Diool Bills Payment`;

      pageContent = {
        page: {
          session_end: "true",
        },
        message: `${message}`, // customize messages will be useful here.
      };

      xmlResponse = convert.json2xml(pageContent, options);

      return res.send(xmlResponse);
    }
  } catch (error) {
    pageContent = {
      page: {
        session_end: "true",
      },
      message: `${error.message}`,
      //message: `We were faced with an error while processing your request, please try again later`,
    };
  }
  xmlResponse = convert.json2xml(pageContent, options);

  return res.send(xmlResponse);
};

module.exports.settleRfp = async (req, res) => {
  const phoneNumber = `237${req.headers["user-entry"]}`; // Value to be used in later implementations, using aliases as unique identifiers..

  console.log("phoneNumber", phoneNumber);

  //const rfpReference = refCache.get("uniqueReference");
  //console.log("The rfp referene is:",  refCache.get("uniqueReference"));

  const sendPaymentRequest = async () => {
    const response = await axios.post(
      `https://core.diool.me/core/onlinepayment/v1/payRfp`,
      {
        providerAccountID: phoneNumber,
        providerCode: `${ussdCache.get(paymentMethod)}`, // Checking the telco still to be implemented.
        requestPaymentReference: rfpReference,
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
    setTimeout(() => {
      console.log("The sendPaymentRequest function was called ! ");
      sendPaymentRequest();
    }, 1000);

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
};
