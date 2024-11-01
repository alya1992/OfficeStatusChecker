const axios = require('axios');
const https = require('https');

// Динамічна дата для реферера
const date = process.argv[2] || '2024-11-01';
const cookie = process.argv[3] || 'YOUR_COOKIE_HERE';
const offices = process.argv.slice(4).map(Number); // Офіси вказуються після дати та куків

const url = `https://eq.hsc.gov.ua/site/stepmap?question_id=49&chdate=${date}`;
const agent = new https.Agent({ rejectUnauthorized: false });

async function checkOffices(date, cookie, offices) {
    try {
        const response = await axios.get(url, {
            httpsAgent: agent,
            headers: {
                'cookie': cookie,
                'x-csrf-token': 'I_u5JQ7ku8M_bctVzgw5CwppCYEwUxXmEA8xGerqMcVgjsNHWqHyp008vg_3ZgA8PBk-2Hw6cK0mSHZdoI1Y_A==',
                'dnt': '1',
                'priority': 'u=1',
                'referer': `https://eq.hsc.gov.ua/site/step2?chdate=${date}&question_id=49&id_es=sec-ch-ua:"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"`,
                'Content-Type': 'application/json'
            }
        });

        const responseData = response.data;
        let output = '';

        if (Array.isArray(responseData)) {
            offices.forEach(id => {
                const office = responseData.find(office => office.id_offices === id);
                if (office) {
                    output += `Офіс знайдено: ${office.offices_name}\nSTS: ${office.sts}\n`;
                    if (office.sts === 3) {
                        output += `✔️ Офіс ${office.offices_name} має STS = 3\n\n`;
                    } else {
                        output += `❌ STS для офісу з id ${id} не дорівнює 3\n\n`;
                    }
                } else {
                    output += `❌ Офіс з id_offices ${id} не знайдено\n\n`;
                }
            });
        } else {
            output = 'Error: Очікувався масив даних, отримано інший формат';
        }

        console.log(output);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Викликаємо функцію перевірки
checkOffices(date, cookie, offices);