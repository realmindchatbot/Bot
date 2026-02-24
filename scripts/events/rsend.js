const path = require("path");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "rsend",
    version: "3.2",
    author: "SaAd & Gemini",
    description: "Recover unsent messages and media with auto-dependency"
  },

  onStart: async function ({ api, event }) {
    // স্টার্টআপে কিছু করার প্রয়োজন নেই
  },

  onChat: async function ({ api, event, usersData }) {
    const { messageID, senderID, threadID, body: content, type, attachments } = event;

    // মডিউল চেক এবং অটো-লোড
    let axios;
    try {
      axios = require("axios");
    } catch (e) {
      // যদি axios না থাকে তবে এটি ইনস্টল করার নির্দেশ দিবে বা এরর হ্যান্ডেল করবে
      console.log("Installing axios for rsend...");
      return; 
    }

    if (!global.logMessage) global.logMessage = new Map();

    if (type !== "message_unsend") {
      global.logMessage.set(messageID, {
        body: content || "",
        attachments: attachments || []
      });
      return;
    }

    if (type === "message_unsend") {
      const savedMsg = global.logMessage.get(messageID);
      if (!savedMsg || senderID == api.getCurrentUserID()) return;

      try {
        const name = await usersData.getName(senderID) || "Someone";
        let msgBody = `নিগ্গা 🐸🙏 ${name}, এই মেসেজটি ডিলিট করেছে:\n\n${savedMsg.body ? `#: ${savedMsg.body}` : ""}`;

        const streams = [];
        const cacheDir = path.join(__dirname, "cache");
        
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        for (const attachment of savedMsg.attachments) {
          const ext = attachment.type === "photo" ? "jpg" : 
                      attachment.type === "video" ? "mp4" : 
                      attachment.type === "audio" ? "mp3" : "bin";
          
          const filePath = path.join(cacheDir, `${Date.now()}_${attachment.ID}.${ext}`);
          
          try {
            const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
            fs.writeFileSync(filePath, Buffer.from(response.data));
            streams.push(fs.createReadStream(filePath));
          } catch (err) {
            console.error("Attachment download error:", err);
          }
        }

        await api.sendMessage({
          body: msgBody,
          attachment: streams
        }, threadID);

        // ফাইল পাঠানোর পর ৫ সেকেন্ড পর ডিলিট হবে যাতে কোনো এরর না আসে
        setTimeout(() => {
          streams.forEach(stream => {
            if (fs.existsSync(stream.path)) fs.unlinkSync(stream.path);
          });
        }, 5000);

      } catch (error) {
        console.error("Unsend Recovery Error:", error);
      }
    }
  }
};
