const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const https = require('https');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        }
    });
    win.loadFile('index.html');
}

// Завантажуємо офіси з файлу
function loadOffices() {
    const officesPath = path.join(__dirname, 'filtered_offices.json');
    const officesData = fs.readFileSync(officesPath);
    return JSON.parse(officesData);
}

const officesList = loadOffices();

// Шляхи до звукових файлів
const successSoundPath = path.join(__dirname, 'audio', 'Glass.aiff');
const errorSoundPath = path.join(__dirname, 'audio', 'Ping.aiff');

app.whenReady().then(() => {
    createWindow();

    // Відправляємо список офісів до рендерера
    ipcMain.on('request-offices', (event) => {
        event.sender.send('send-offices', officesList);
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('run-check', async (event, args) => {
    const { date, cookie, offices } = args;
    const url = `https://eq.hsc.gov.ua/site/stepmap?question_id=49&chdate=${date}`;
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        const response = await axios.get(url, {
            httpsAgent: agent,
            headers: {
                'cookie': cookie,
                'referer': `https://eq.hsc.gov.ua/site/step2?chdate=${date}&question_id=49&id_es=sec-ch-ua:"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"`,
                'Content-Type': 'application/json'
            }
        });

        const responseData = response.data;
        let output = '';

        if (Array.isArray(responseData)) {
            offices.forEach(id => {
                const office = responseData.find(office => office.id_offices === parseInt(id));
                if (office) {
                    output += `Офіс знайдено: ${office.offices_name}\nSTS: ${office.sts}\n`;
                    if (office.sts === 3) {
                        output += `✔️ Офіс ${office.offices_name} має талони доступні онлайн\n\n`;
                        event.reply('play-sound', successSoundPath); // Відтворюємо звук успіху
                    } else {
                        output += `❌ Офіс ${office.offices_name} не має доступних талонів\n\n`;
                        event.reply('play-sound', errorSoundPath); // Відтворюємо звук невдачі
                    }
                } else {
                    output += `❌ Офіс з id_offices ${id} не знайдено\n\n`;
                    event.reply('play-sound', errorSoundPath); // Відтворюємо звук невдачі
                }
            });
        } else {
            output = 'Error: Очікувався масив даних, отримано інший формат';
        }

        event.reply('script-output', output);
    } catch (error) {
        event.reply('script-output', `Error: ${error.message}`);
        event.reply('play-sound', errorSoundPath); // Відтворюємо звук невдачі при помилці
    }
});

// Обробник для відтворення звуку
ipcMain.on('play-sound', (event, soundPath) => {
    event.reply('play-sound', soundPath); // Надсилаємо шлях до аудіофайлу
});