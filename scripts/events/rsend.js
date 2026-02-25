module.exports = {
  config: {
    name: "rsend",
    version: "6.0",
    author: "Saad",
    role: 0,
    category: "events",
    description: "Recover unsent messages"
  },

  onStart: async function () {
    global.rsendStore = new Map();
    console.log("RSEND EVENT LOADED");
  },

  onChat: async function ({ api, event, usersData }) {
    const { messageID, senderID, threadID, body, type } = event;

    if (!global.rsendStore)
      global.rsendStore = new Map();

    if (type !== "message_unsend") {
      global.rsendStore.set(messageID, { body: body || "" });
      return;
    }

    const saved = global.rsendStore.get(messageID);
    if (!saved || senderID == api.getCurrentUserID()) return;

    const name = await usersData.getName(senderID) || "Someone";

    await api.sendMessage(
      `⚠️ sir unsend করে লাভ নাই 😁 ${name} deleted a message:\n\n${saved.body}`,
      threadID
    );

    global.rsendStore.delete(messageID);
  }
};
