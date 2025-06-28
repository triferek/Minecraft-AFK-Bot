const mineflayer = require("mineflayer");
const config = require("./config.json");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot działa!"));
app.listen(PORT, () => console.log(`🌐 Web serwer działa na porcie ${PORT}`));

function startBot(username, goToIgrzyska = false) {
  const bot = mineflayer.createBot({
    host: config.serverHost,
    port: config.serverPort,
    username,
    auth: "offline",
    version: "1.18.2",
    viewDistance: config.botChunk,
  });

  let movementPhase = 0;
  const STEP_INTERVAL = 1500;
  const JUMP_DURATION = 500;

  bot.once("spawn", () => {
    console.log(`🤖 Bot ${username} połączony!`);

    bot.chat("/login Atrix123");

    if (goToIgrzyska) {
      setTimeout(() => {
        bot.chat("/server igrzyska");
        console.log(`➡️ Bot ${username} wysłał /server igrzyska`);

        // Po 8 sekundach od wysłania komendy zaczynamy ruch
        setTimeout(() => {
          movementCycle();
          console.log(`✅ Bot ${username} zaczął się ruszać na igrzyskach!`);
        }, 8000);
      }, 6000);
    } else {
      setTimeout(() => {
        bot.setControlState("sneak", true);
        movementCycle();
        console.log(`✅ Bot ${username} jest gotowy i się rusza!`);
      }, 6000);
    }
  });

  function movementCycle() {
    if (!bot.entity) return;

    switch (movementPhase) {
      case 0:
        bot.setControlState("forward", true);
        bot.setControlState("back", false);
        bot.setControlState("jump", false);
        break;
      case 1:
        bot.setControlState("forward", false);
        bot.setControlState("back", true);
        bot.setControlState("jump", false);
        break;
      case 2:
        bot.setControlState("forward", false);
        bot.setControlState("back", false);
        bot.setControlState("jump", true);
        setTimeout(() => {
          bot.setControlState("jump", false);
        }, JUMP_DURATION);
        break;
      case 3:
        bot.setControlState("forward", false);
        bot.setControlState("back", false);
        bot.setControlState("jump", false);
        break;
    }

    movementPhase = (movementPhase + 1) % 4;
    setTimeout(movementCycle, STEP_INTERVAL);
  }

  bot.on("error", (err) => {
    console.error(`⚠️ Błąd bota ${username}:`, err);
  });

  bot.on("kicked", (reason) => {
    console.log(`⛔️ Bot ${username} został wyrzucony:`, reason);
  });

  bot.on("end", () => {
    console.log(`🔁 Bot ${username} rozłączony — próbuję połączyć ponownie za 10 sekund...`);
    setTimeout(() => startBot(username, goToIgrzyska), 10000);
  });
}

// Uruchamiamy 3 boty:
startBot("dxafk1", true);  // ten idzie na igrzyska i rusza się tam
startBot("dxafk2", false); // te dwa zostają na lobby i ruszają się tam
startBot("dxafk3", false);

