const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "rsend",
    version: "4.0",
    author: "Saad",
    category: "events",
    description: "Recover unsent messages (text & media)"
  },

  onChat: async function ({ api, event, usersData }) {
    const { messageID, senderID, threadID, body, attachments, type } = event;

    if (!global.GoatBot.onDeleteStore)
      global.GoatBot.onDeleteStore = new Map();

    // Save normal messages
    if (type !== "message_unsend") {
      global.GoatBot.onDeleteStore.set(messageID, {
        body: body || "",
        attachments: attachments || []
      });

      // Auto cleanup after 5 minutes
      setTimeout(() => {
        global.GoatBot.onDeleteStore.delete(messageID);
      }, 5 * 60 * 1000);

      return;
    }

    // When message is unsent
    if (type === "message_unsend") {
      const savedData = global.GoatBot.onDeleteStore.get(event.messageID);

      if (!savedData || senderID == api.getCurrentUserID())
        return;

      try {
        const name = await usersData.getName(senderID) || "Someone";

        let msgBody = `⚠️ ${name} একটি মেসেজ ডিলিট করেছে.\n\n`;
        if (savedData.body)
          msgBody += `📩 Message:\n${savedData.body}`;

        const attachmentStreams = [];
        const cachePath = path.join(__dirname, "cache");

        if (!fs.existsSync(cachePath))
          fs.mkdirSync(cachePath);

        for (const file of savedData.attachments) {
          const ext =
            file.type === "photo" ? "jpg" :
            file.type === "video" ? "mp4" :
            file.type === "audio" ? "mp3" :
            file.type === "animated_image" ? "gif" :
            "bin";

          const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const filePath = path.join(cachePath, fileName);

          const response = await axios.get(file.url, {
            responseType: "arraybuffer"
          });

          fs.writeFileSync(filePath, Buffer.from(response.data));
          attachmentStreams.push(fs.createReadStream(filePath));

          // Auto delete file after send
          setTimeout(() => {
            if (fs.existsSync(filePath))
              fs.unlinkSync(filePath);
          }, 10000);
        }

        await api.sendMessage({
          body: msgBody,
          attachment: attachmentStreams
        }, threadID);

        global.GoatBot.onDeleteStore.delete(event.messageID);

      } catch (err) {
        console.error("RSEND ERROR:", err);
      }
    }
  }
};
