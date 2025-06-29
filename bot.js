const mineflayer = require("mineflayer");
const config = require("./config.json");
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot działa!"));
app.listen(PORT, () => console.log(`🌐 Web serwer działa na porcie ${PORT}`));

function startBot() {
  const bot = mineflayer.createBot({
    host: config.serverHost,
    port: config.serverPort,
    username: config.botUsername,
    auth: "offline",
    version: "1.18.2",
    viewDistance: config.botChunk,
  });

  // Zmienne do logowania
  let correctPassword = null;
  let passwordIndex = 0;
  let loggedIn = false;

  // Wczytaj zapisane hasło (jeśli istnieje)
  try {
    if (fs.existsSync("correct_password.json")) {
      const data = JSON.parse(fs.readFileSync("correct_password.json", "utf8"));
      correctPassword = data.password;
      console.log(`📂 Wczytano zapisane hasło: ${correctPassword}`);
    }
  } catch (err) {
    console.error("⚠️ Błąd odczytu zapisanego hasła:", err);
  }

  function saveCorrectPassword(password) {
    fs.writeFileSync("correct_password.json", JSON.stringify({ password }));
    console.log(`💾 Zapisano poprawne hasło: ${password}`);
  }

  let movementPhase = 0;
  const STEP_INTERVAL = 1500;
  const JUMP_DURATION = 500;

  bot.once("spawn", () => {
    console.log("🤖 Bot połączony!");

    // Logowanie
    if (correctPassword) {
      bot.chat(`/login ${correctPassword}`);
      console.log(`🔐 Logowanie z zapisanym hasłem: ${correctPassword}`);
    } else {
      setTimeout(() => {
        const tryPassword = config.botPasswords[passwordIndex];
        if (tryPassword) {
          bot.chat(`/login ${tryPassword}`);
          console.log(`🔐 Próba logowania z hasłem: ${tryPassword}`);
          passwordIndex++;
        }
      }, 2000);
    }

    // Przejście na serwer 'igrzyska'
    setTimeout(() => {
      bot.chat("/server igrzyska");
      console.log("➡️ Przełączam bota na serwer 'igrzyska'");
    }, 5000);

    setTimeout(() => {
      bot.setControlState("sneak", true);
      console.log(`✅ ${config.botUsername} jest gotowy!`);
    }, 6000);

    setTimeout(movementCycle, STEP_INTERVAL);
  });

  // Obsługa wiadomości serwera (szukanie logowania / sukcesu)
  bot.on("message", (message) => {
    const msg = message.toString().toLowerCase();

    if (!loggedIn && (msg.includes("/login") || msg.includes("zaloguj"))) {
      if (!correctPassword && passwordIndex < config.botPasswords.length) {
        const tryPassword = config.botPasswords[passwordIndex];
        setTimeout(() => {
          bot.chat(`/login ${tryPassword}`);
          console.log(`🔐 Próba logowania z hasłem: ${tryPassword}`);
          passwordIndex++;
        }, 2000);
      }
    }

    if (!loggedIn && (msg.includes("zalogowano") || msg.includes("witamy"))) {
      loggedIn = true;
      console.log("✅ Bot zalogowany pomyślnie!");

      if (!correctPassword && passwordIndex > 0) {
        const successfulPassword = config.botPasswords[passwordIndex - 1];
        saveCorrectPassword(successfulPassword);
      }
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
    console.error("⚠️ Błąd bota:", err);
  });

  bot.on("kicked", (reason) => {
    console.log("⛔️ Bot został wyrzucony:", reason);
  });

  bot.on("end", () => {
    console.log("🔁 Bot rozłączony — próbuję połączyć ponownie za 10 sekund...");
    setTimeout(startBot, 10000);
  });
}

startBot();

