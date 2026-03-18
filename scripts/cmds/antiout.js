module.exports = {
  config: {
    name: "antiout",
    aliases: ["antiout"],
    version: "1.0",
    author: "SaAd / gemini",
    category: "admin",
    role: 1, // Only admins can use
    guide: { en: "{pn} on/off" }
  },

  onStart: async ({ api, message, event, args, threadsData }) => {
    const { threadID } = event;
    const status = args[0] ? args[0].toLowerCase() : null;

    if (status === "on") {
      await threadsData.set(threadID, { autoinvite: true }, "settings");
      return message.reply("✅ Auto-invite feature has been enabled for this group.");
    } else if (status === "off") {
      await threadsData.set(threadID, { autoinvite: false }, "settings");
      return message.reply("❌ Auto-invite feature has been disabled for this group.");
    } else {
      return message.reply("❗ Please use 'on' or 'off'.\nExample: !autoinvite on");
    }
  }
};
