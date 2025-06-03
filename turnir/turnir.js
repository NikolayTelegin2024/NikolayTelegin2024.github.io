const API_KEY = 'ba88cd2ed0084669ae127eecb33d58c9';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    
    // Загрузка данных при открытии вкладки
    document.querySelector('.tab-button[data-tab="laliga"]').addEventListener('click', fetchLaLigaTable);
    document.querySelector('.tab-button[data-tab="ucl"]').addEventListener('click', fetchUCLTables);
    
    // Загружаем данные для активной вкладки
    fetchLaLigaTable();
});

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'dark' ? '🌞' : '🌙';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = savedTheme === 'dark' ? '🌞' : '🌙';
    
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });
}

async function fetchLaLigaTable() {
    const container = document.getElementById('laliga-table-container');
    container.innerHTML = '<p class="loading">Загрузка данных Ла Лиги...</p>';
    
    try {
        const data = await fetchWithCache('laligaStandings', 'https://api.football-data.org/v4/competitions/PD/standings');
        displayLeagueTable(data, container, 'La Liga');
    } catch (error) {
        handleDataError(error, container, 'laligaStandings');
    }
}

async function fetchUCLTables() {
    const container = document.getElementById('ucl-table-container');
    container.innerHTML = '<p class="loading">Загрузка данных Лиги Чемпионов...</p>';
    
    try {
        const data = await fetchWithCache('uclStandings', 'https://api.football-data.org/v4/competitions/CL/standings');
        displayUCLTables(data, container);
    } catch (error) {
        handleDataError(error, container, 'uclStandings');
    }
}

async function fetchWithCache(cacheKey, url) {
    // Проверяем доступность localStorage
    const storageAvailable = isStorageAvailable();
    
    // Пытаемся получить данные из кэша
    if (storageAvailable) {
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        } catch (e) {
            console.error('Ошибка чтения кэша:', e);
        }
    }
    
    // Если в кэше нет данных - делаем запрос к API
    const response = await fetch(url, {
        headers: {
            'X-Auth-Token': API_KEY,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Ошибка HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Сохраняем в кэш
    if (storageAvailable) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка сохранения кэша:', e);
        }
    }
    
    return data;
}

function isStorageAvailable() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

function displayLeagueTable(data, container, leagueName) {
    if (!data?.standings?.[0]?.table) {
        container.innerHTML = '<p class="error">Данные таблицы не найдены</p>';
        return;
    }

    const season = data.season ? 
        `${data.season.startDate.slice(0,4)}/${data.season.endDate.slice(2,4)}` : 
        '2024/2025';

    let html = `
        <h2>${leagueName} ${season}</h2>
        <table>
            <thead>
                <tr>
                    <th>Поз.</th>
                    <th>Команда</th>
                    <th>И</th>
                    <th>В</th>
                    <th>Н</th>
                    <th>П</th>
                    <th>ГЗ</th>
                    <th>ГП</th>
                    <th>РМ</th>
                    <th>Очки</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.standings[0].table.forEach(team => {
        html += `
            <tr>
                <td>${team.position}</td>
                <td class="team-name">
                    <img src="${team.team.crest || 'https://via.placeholder.com/20'}" 
                         alt="${team.team.name}" 
                         height="20" 
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/20'">
                    ${team.team.shortName || team.team.name}
                </td>
                <td>${team.playedGames}</td>
                <td>${team.won}</td>
                <td>${team.draw}</td>
                <td>${team.lost}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDifference}</td>
                <td><strong>${team.points}</strong></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    html += `<p class="update-time">Обновлено: ${new Date().toLocaleString()}</p>`;
    container.innerHTML = html;
}

function displayUCLTables(data, container) {
    if (!data?.standings || data.standings.length === 0) {
        container.innerHTML = '<p class="error">Данные Лиги Чемпионов не найдены</p>';
        return;
    }

    const season = data.season ? 
        `${data.season.startDate.slice(0,4)}/${data.season.endDate.slice(2,4)}` : 
        '2024/2025';

    let html = `
        <h2>Лига Чемпионов УЕФА ${season}</h2>
    `;

    data.standings.forEach(group => {
        html += `
            <div class="group-table">
                <div class="group-name">Группа ${group.group.replace('GROUP_', '')}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Поз.</th>
                            <th>Команда</th>
                            <th>И</th>
                            <th>В</th>
                            <th>Н</th>
                            <th>П</th>
                            <th>ГЗ</th>
                            <th>ГП</th>
                            <th>РМ</th>
                            <th>Очки</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        group.table.forEach(team => {
            html += `
                <tr>
                    <td>${team.position}</td>
                    <td class="team-name">
                        <img src="${team.team.crest || 'https://via.placeholder.com/20'}" 
                             alt="${team.team.name}" 
                             height="20" 
                             onerror="this.onerror=null;this.src='https://via.placeholder.com/20'">
                        ${team.team.shortName || team.team.name}
                    </td>
                    <td>${team.playedGames}</td>
                    <td>${team.won}</td>
                    <td>${team.draw}</td>
                    <td>${team.lost}</td>
                    <td>${team.goalsFor}</td>
                    <td>${team.goalsAgainst}</td>
                    <td>${team.goalDifference}</td>
                    <td><strong>${team.points}</strong></td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
    });

    html += `<p class="update-time">Обновлено: ${new Date().toLocaleString()}</p>`;
    container.innerHTML = html;
}

function handleDataError(error, container, cacheKey) {
    console.error('Ошибка:', error);
    
    // Пытаемся показать кэшированные данные
    if (isStorageAvailable()) {
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                container.innerHTML = '<p class="error">Ошибка загрузки свежих данных. Показаны сохранённые данные.</p>';
                if (cacheKey === 'laligaStandings') {
                    displayLeagueTable(JSON.parse(cachedData), container, 'La Liga');
                } else {
                    displayUCLTables(JSON.parse(cachedData), container);
                }
                return;
            }
        } catch (e) {
            console.error('Ошибка доступа к кэшу:', e);
        }
    }
    
    container.innerHTML = `<p class="error">${error.message || 'Не удалось загрузить данные. Попробуйте позже.'}</p>`;
}
