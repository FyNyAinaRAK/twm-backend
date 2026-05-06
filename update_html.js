const fs = require('fs');

let html = fs.readFileSync('c:/Users/FY NY AINA/Documents/Formation/twm/mobile/www/index.html', 'utf8');

html = html.replace(
    `<div class="section-header"><h2>Ma Bibliothèque</h2><div class="line"></div></div>`,
    `<div style="display:flex; gap:10px; margin-bottom: 20px;">
            <button class="btn-action" id="tab-all" style="flex:1; background:#1c2128; color:var(--text)" onclick="setTab('all')">🌍 Accueil (Tous)</button>
            <button class="btn-action" id="tab-mine" style="flex:1" onclick="setTab('mine')">📂 Ma Bibliothèque</button>
        </div>
        <div style="display:flex; gap:10px; margin-bottom: 20px; align-items:center;">
            <input type="text" id="search-input" placeholder="Rechercher une vidéo..." style="flex:2; padding:10px; border-radius:10px; background:#0d1117; border:1px solid var(--border); color:white;" oninput="loadVideos()">
            <select id="genre-filter" style="flex:1; padding:10px; border-radius:10px; background:#0d1117; border:1px solid var(--border); color:white;" onchange="loadVideos()">
                <option value="Tous">Tous les genres</option>
                <option value="Film">Film</option>
                <option value="Série">Série</option>
                <option value="Musique">Musique</option>
                <option value="Tuto">Tuto</option>
                <option value="Autre">Autre</option>
            </select>
        </div>
        <div class="section-header"><h2 id="grid-title">Ma Bibliothèque</h2><div class="line"></div></div>`
);

html = html.replace(
    `<button id="start-upload-btn" class="btn-action" style="display:none; max-width:280px; margin: -20px auto 30px" onclick="startUpload()">LANCER LE TRAITEMENT</button>`,
    `<div id="upload-form" style="display:none; max-width:400px; margin: -20px auto 30px; flex-direction:column; gap:10px;">
            <input type="text" id="upload-title" placeholder="Titre de la vidéo" style="padding:12px; border-radius:10px; background:#0d1117; border:1px solid var(--border); color:white;" required>
            <select id="upload-genre" style="padding:12px; border-radius:10px; background:#0d1117; border:1px solid var(--border); color:white;">
                <option value="Film">Film</option>
                <option value="Série">Série</option>
                <option value="Musique">Musique</option>
                <option value="Tuto">Tuto</option>
                <option value="Autre" selected>Autre</option>
            </select>
            <button id="start-upload-btn" class="btn-action" onclick="startUpload()">LANCER LE TRAITEMENT</button>
        </div>`
);

html = html.replace(
    `document.getElementById('start-upload-btn').style.display = 'block';`,
    `document.getElementById('upload-form').style.display = 'flex';
            document.getElementById('upload-title').value = file.name;`
);

html = html.replace(
    `document.getElementById('start-upload-btn').disabled = true;`,
    `document.getElementById('start-upload-btn').disabled = true; document.getElementById('upload-title').disabled = true; document.getElementById('upload-genre').disabled = true;`
);

html = html.replace(
    `formData.append('video', file);`,
    `formData.append('video', file);
        formData.append('title', document.getElementById('upload-title').value);
        formData.append('genre', document.getElementById('upload-genre').value);`
);

html = html.replace(
    `document.getElementById('start-upload-btn').style.display = 'none';`,
    `document.getElementById('upload-form').style.display = 'none';`
);

html = html.replace(
    `document.getElementById('start-upload-btn').disabled = false;`,
    `document.getElementById('start-upload-btn').disabled = false; document.getElementById('upload-title').disabled = false; document.getElementById('upload-genre').disabled = false;`
);

// Add currentTab and setTab function
html = html.replace(
    `let authToken = localStorage.getItem('token');`,
    `let authToken = localStorage.getItem('token');
    let currentTab = 'mine';
    function setTab(tab) {
        currentTab = tab;
        document.getElementById('tab-all').style.background = tab === 'all' ? 'var(--primary)' : '#1c2128';
        document.getElementById('tab-mine').style.background = tab === 'mine' ? 'var(--primary)' : '#1c2128';
        document.getElementById('grid-title').textContent = tab === 'all' ? 'Toutes les vidéos' : 'Ma Bibliothèque';
        loadVideos();
    }`
);

// Replace loadVideos to use params
html = html.replace(
    `const res = await fetch('/api/videos', { headers: { 'Authorization': 'Bearer ' + authToken } });`,
    `const search = document.getElementById('search-input').value;
        const genre = document.getElementById('genre-filter').value;
        const mine = currentTab === 'mine';
        const params = new URLSearchParams({ search, genre, mine });
        const res = await fetch('/api/videos?' + params.toString(), { headers: { 'Authorization': 'Bearer ' + authToken } });`
);

// Add Download button and Genre/Username to card
html = html.replace(
    `<div class="v-date">\${new Date(v.created_at).toLocaleDateString()}</div>
                    </div>
                    <button class="btn-delete-v" onclick="deleteVideoJS('\${v.video_id}')">🗑️</button>`,
    `<div class="v-date">\${v.genre || 'Autre'} · \${v.username || 'Moi'} · \${new Date(v.created_at).toLocaleDateString()}</div>
                    </div>
                    \${v.original_file ? \`<a href="\${v.original_file}" download class="btn-delete-v" title="Télécharger">⬇️</a>\` : ''}
                    \${currentTab === 'mine' ? \`<button class="btn-delete-v" title="Supprimer" onclick="deleteVideoJS('\${v.video_id}')">🗑️</button>\` : ''}`
);


fs.writeFileSync('c:/Users/FY NY AINA/Documents/Formation/twm/mobile/www/index.html', html, 'utf8');
console.log("HTML Updated");
