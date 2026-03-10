const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

module.exports.config = {
  name: "bet",
  version: "2.0",
  author: "MOHAMMAD AKASH",
  countDown: 5,
  role: 0,
  shortDescription: "Casino-style bet with image result",
  category: "game",
  guide: { en: "{p}bet <amount> — e.g. bet 1k" }
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;

  try {
    const userData = await usersData.get(senderID);
    let balance = userData.data.money || 0;

    function parseAmount(str) {
      str = str.toLowerCase().replace(/\s+/g, '');
      const match = str.match(/^([\d.]+)([kmbt]?)$/);
      if (!match) return NaN;
      let num = parseFloat(match[1]);
      const unit = match[2];
      switch (unit) {
        case 'k': num *= 1e3; break;
        case 'm': num *= 1e6; break;
        case 'b': num *= 1e9; break;
        case 't': num *= 1e12; break;
      }
      return Math.floor(num);
    }

    if (!args[0])
      return api.sendMessage("Please enter amount: bet 500 / bet 1k", threadID, messageID);

    const betAmount = parseAmount(args[0]);
    if (isNaN(betAmount) || betAmount <= 0)
      return api.sendMessage("Invalid amount!", threadID, messageID);

    if (betAmount > balance)
      return api.sendMessage(`Not enough coins!`, threadID, messageID);

    const multipliers = [3, 4, 8, 20, 50];
    const chosenMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    const win = Math.random() < 0.5;

    let newBalance = win ? (balance + betAmount * (chosenMultiplier - 1)) : (balance - betAmount);
    if (newBalance < 0) newBalance = 0;

    await usersData.set(senderID, { "data.money": newBalance });

    const userName = await usersData.getName(senderID);
    const avatarUrl = `https://graph.facebook.com/${senderID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    let avatar = null;
    try {
      const res = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      avatar = await loadImage(res.data);
    } catch (e) {}

    const resultText = win ? `JACKPOT! ${chosenMultiplier}x` : "TRY AGAIN";
    const filePath = await generateCasinoCard({
      userName, avatar, betAmount, resultText, 
      multiplier: win ? chosenMultiplier : null,
      profit: win ? (betAmount * chosenMultiplier) : betAmount,
      oldBalance: balance, newBalance, win
    });

    await api.sendMessage({ body: "", attachment: fs.createReadStream(filePath) }, threadID, messageID);
    setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 10000);

  } catch (error) {
    api.sendMessage("Error in bet command.", threadID, messageID);
  }
};

async function generateCasinoCard(data) {
  const width = 900;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0f0f23');
  bgGrad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 8;
  roundRect(ctx, 20, 20, width - 40, height - 40, 30, false, true);

  ctx.font = 'bold 60px "Arial Black"';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff4500';
  ctx.shadowBlur = 20;
  ctx.fillText('GOAT CASINO', width / 2, 100);
  ctx.shadowColor = 'transparent';

  if (data.avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 200, 70, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(data.avatar, 50, 130, 140, 140);
    ctx.restore();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 35px Arial';
  ctx.fillText(data.userName.toUpperCase(), 210, 210);

  ctx.fillStyle = data.win ? '#00ff88' : '#ff4b2b';
  ctx.font = 'bold 70px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(data.resultText, width / 2, height / 2 + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '25px Arial';
  ctx.fillText(`BET: ${data.betAmount}$`, width / 2, height / 2 + 110);
  ctx.fillText(`NEW BALANCE: ${data.newBalance}$`, width / 2, height / 2 + 150);

  const filePath = path.join(__dirname, 'cache', `bet_${Date.now()}.png`);
  if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'));
  fs.writeFileSync(filePath, canvas.toBuffer());
  return filePath;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
  
