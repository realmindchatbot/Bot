const fs = require("fs");
const axios = require("axios");

const destinationTID = "9322675214482986"; // এখানে তোমার নির্দিষ্ট গ্রুপের Thread ID বসাও

module.exports = {
  config: {
    name: "resend",
    version: "1.2",
    author: "yamada | loufi | kshitiz | modified by Ullash",
    countDown: 5,
    role: 0, // ইচ্ছা করলে 2 করে শুধু admin এর জন্য রাখতে পারো
    shortDescription: "unsend ট্র্যাক করে গ্রুপে পাঠায়",
    longDescription: "কেউ মেসেজ unsend করলে, তার লেখা + attachment নির্দিষ্ট গ্রুপে পাঠিয়ে দেয়",
    category: "group",
  },

  onChat: async function ({ event, api, threadsData, usersData }) {
    const { createReadStream } = require("fs");
    const { messageID, senderID, threadID, body: content } = event;

    if (!global.logMessage) global.logMessage = new Map();
    if (!global.data) global.data = {};
    if (!global.data.botID) global.data.botID = api.getCurrentUserID();

    const threadData = (await threadsData.get(threadID)) || {};
    const resendEnabled =
      typeof threadData.resend !== "undefined" ? threadData.resend : true;

    if (!resendEnabled) return;

    if (senderID === global.data.botID) return;

    if (event.type !== "message_unsend") {
      global.logMessage.set(messageID, {
        msgBody: content || "",
        attachments: event.attachments || [],
      });
      return;
    }

    if (event.type === "message_unsend") {
      const getMsg = global.logMessage.get(messageID);
      if (!getMsg) return;

      const userData = await usersData.get(senderID);
      const senderName = userData?.name || "Unknown User";

      const msg = {
        body:
          `${senderName} just unsent a message.\n` +
          (getMsg.msgBody && getMsg.msgBody !== ""
            ? `Deleted content: ${getMsg.msgBody}\n`
            : "") +
          `Attachments: ${getMsg.attachments.length}`,
        attachment: [],
        mentions: [
          {
            tag: senderName,
            id: senderID,
          },
        ],
      };

      for (let i = 0; i < getMsg.attachments.length; i++) {
        const attachment = getMsg.attachments[i];

        try {
          const { data, headers } = await axios.get(attachment.url, {
            responseType: "arraybuffer",
          });
          const contentType = headers["content-type"] || "application/octet-stream";
          const extension = contentType.split("/")[1] || "dat";
          const path = `${__dirname}/cache/resend_${messageID}_${i + 1}.${extension}`;

          fs.writeFileSync(path, Buffer.from(data), "binary");
          const readStream = createReadStream(path);
          msg.attachment.push(readStream);

          readStream.on("end", function () {
            fs.unlink(path, function (err) {
              if (err) console.error(err);
            });
          });
        } catch (e) {
          console.error("Attachment download error:", e);
        }
      }

      api.sendMessage(msg, destinationTID);
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const { threadID } = event;
    const subCommand = (args && args[0]) ? args[0].toLowerCase() : "";

    let threadData = (await threadsData.get(threadID)) || {};


    if (subCommand === "off") {
      threadData.resend = false;
      await threadsData.set(threadID, threadData);

      return api.sendMessage(
        "❌ Resend mode এই গ্রুপে বন্ধ করা হয়েছে।\nআবার চালু করতে: resend on",
        threadID
      );
    }

    if (subCommand === "on") {
      threadData.resend = true;
      await threadsData.set(threadID, threadData);

      return api.sendMessage(
        "✅ Resend mode এই গ্রুপে চালু করা হয়েছে।",
        threadID
      );
    }

    const currentStatus =
      typeof threadData.resend !== "undefined" ? threadData.resend : true;

    return api.sendMessage(
      `ℹ️ Resend status: ${currentStatus ? "ON" : "OFF"}\n\nব্যবহার:\n• resend on  → চালু\n• resend off → বন্ধ`,
      threadID
    );
  },
};
