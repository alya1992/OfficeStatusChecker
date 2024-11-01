const fs = require('fs');

// Читання даних з файлу offices.json
fs.readFile('offices.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Помилка при читанні файлу:', err);
        return;
    }

    try {
        // Парсинг JSON даних
        const offices = JSON.parse(data);

        // Фільтрація даних
        const filteredOffices = offices.map(office => ({
            id_offices: office.id_offices,
            offices_name: office.offices_name,
            offices_addr: office.offices_addr
        }));

        // Запис відфільтрованих даних у новий файл filtered_offices.json
        fs.writeFile('filtered_offices.json', JSON.stringify(filteredOffices, null, 4), 'utf8', err => {
            if (err) {
                console.error('Помилка при записі файлу:', err);
            } else {
                console.log('Файл успішно збережений як filtered_offices.json');
            }
        });
    } catch (parseErr) {
        console.error('Помилка при парсингу JSON:', parseErr);
    }
});