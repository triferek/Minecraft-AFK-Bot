const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10-million-password-list-top-100000.txt', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n').map(l => l.trim()).filter(l => l);
    const top = lines.slice(0, 100000);
    const config = {
      serverHost: "mc.twojserwer.pl",
      serverPort: 25565,
      botUsername: "BotAtrix",
      botPasswords: top,
      botChunk: "far"
    };
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
    console.log(`Utworzono config.json z ${top.length} haseł.`);
  });
});
