module.exports.config = {
  name: "daily",
  version: "1.0",
  author: "NTkhang/SaAd",
  countDown: 5,
  role: 0,
  description: "Claim your daily reward (500$)",
  category: "game"
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { senderID, threadID, messageID } = event;
  const cooldown = 86400000; // ২৪ ঘণ্টা

  try {
    const userData = await usersData.get(senderID);
    const lastDaily = userData.data.lastDaily || 0;
    const currentMoney = userData.data.money || 0;

    if (Date.now() - lastDaily < cooldown) {
      const timeLeft = cooldown - (Date.now() - lastDaily);
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(`You've already claimed your reward! Come back in ${hours}h ${minutes}m.`, threadID, messageID);
    }

    const reward = 500;
    await usersData.set(senderID, {
      "data.money": currentMoney + reward,
      "data.lastDaily": Date.now()
    });

    return api.sendMessage(`Daily reward claimed! +${reward}$ added to your bank. Your new balance: ${currentMoney + reward}$`, threadID, messageID);
  } catch (e) {
    api.sendMessage("Error claiming daily reward!", threadID, messageID);
  }
};
