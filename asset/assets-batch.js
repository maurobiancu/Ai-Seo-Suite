jQuery(document).ready(function($) {
    const getSelectedPostIds = () => { return $('input[name="tass_batch_ids[]"]:checked').map(function() { return $(this).val(); }).get(); };
    const renderTableRows = (rows) => {
        const tbody = $('#tass-tbody');
        tbody.empty();
        if (rows.length === 0) { tbody.append('<tr><td colspan="5">Nessun contenuto trovato con i filtri selezionati.</td></tr>'); return; }
        rows.forEach(row => {
            const scoreClass = row.score > 80 ? 'green' : (row.score > 50 ? 'orange' : 'red');
            tbody.append(`<tr><td><input type="checkbox" name="tass_batch_ids[]" value="${row.id}"></td><td><a href="${TASS.ajax.replace('/admin-ajax.php', `/post.php?post=${row.id}&action=edit`)}" target="_blank">${row.title}</a></td><td>${row.type}</td><td>${row.date}</td><td><span style="color:${scoreClass};font-weight:bold;">${row.score}/100</span></td></tr>`);
        });
        $('#tass-batch-results').show();
    };
    $('#tass-batch-load').on('click', function() {
        const postType = $('#tass-post-type').val();
        const category = $('#tass-category').val();
        const dateFrom = $('#tass-date-from').val();
        const dateTo = $('#tass-date-to').val();
        const button = $(this);
        const originalText = button.text();
        button.text('Caricamento...').prop('disabled', true);
        $.ajax({
            url: TASS.ajax, method: 'POST',
            data: { action: 'tass_batch_list_posts', nonce: TASS.nonce, type: postType, cat: category, from: dateFrom, to: dateTo },
            success: function(response) {
                if (response.success) { renderTableRows(response.data.rows); } else { alert('Errore nel caricamento: ' + response.data.error); }
            },
            error: function() { alert('Errore di comunicazione con il server.'); },
            complete: function() { button.text(originalText).prop('disabled', false); }
        });
    });
    $('#tass-check-all').on('change', function() {
        const isChecked = $(this).is(':checked');
        $('input[name="tass_batch_ids[]"]').prop('checked', isChecked);
    });
    $('#tass-select-all').on('click', function(e) {
        e.preventDefault();
        $('input[name="tass_batch_ids[]"]').prop('checked', true);
    });
    $('#tass-select-none').on('click', function(e) {
        e.preventDefault();
        $('input[name="tass_batch_ids[]"]').prop('checked', false);
    });
    $('#tass-batch-generate').on('click', async function(e) {
        e.preventDefault();
        const ids = getSelectedPostIds();
        const focusKw = $('#tass-batch-focus').val();
        const button = $(this);
        const originalText = button.text();
        if (!ids.length) { alert('Seleziona almeno un post da elaborare.'); return; }
        button.text('Generando...').prop('disabled', true);
        const progressDiv = $('#tass-batch-progress').show().text('Inizio generazione...');
        let completed = 0;
        const total = ids.length;
        for (const id of ids) {
            try {
                progressDiv.text(`Generazione per ID ${id} (${completed}/${total})...`);
                const response = await fetch(TASS.ajax, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ action: 'tass_batch_generate', nonce: TASS.nonce, ids: [id], focus: focusKw }) });
                const data = await response.json();
                if (!data.success) { console.error(`Errore nella generazione del post ID ${id}:`, data.data.error); }
            } catch (error) { console.error(`Errore di rete per il post ID ${id}:`, error); }
            completed++;
        }
        progressDiv.text('Generazione batch completata. Aggiornamento lista...');
        $('#tass-batch-load').click();
        button.text(originalText).prop('disabled', false);
        progressDiv.hide();
    });
    $('#tass-batch-quality').on('click', async function(e) {
        e.preventDefault();
        const ids = getSelectedPostIds();
        const button = $(this);
        const originalText = button.text();
        if (!ids.length) { alert('Seleziona almeno un post da elaborare.'); return; }
        button.text('Analizzando...').prop('disabled', true);
        const progressDiv = $('#tass-batch-progress').show().text('Inizio controllo qualità...');
        let completed = 0;
        const total = ids.length;
        for (const id of ids) {
            try {
                progressDiv.text(`Analisi per ID ${id} (${completed}/${total})...`);
                const response = await fetch(TASS.ajax, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ action: 'tass_batch_quality', nonce: TASS.nonce, ids: [id] }) });
                const data = await response.json();
                if (!data.success) { console.error(`Errore nel controllo qualità per il post ID ${id}:`, data.data.error); }
            } catch (error) { console.error(`Errore di rete per il post ID ${id}:`, error); }
            completed++;
        }
        progressDiv.text('Controllo qualità batch completato. Aggiornamento lista...');
        $('#tass-batch-load').click();
        button.text(originalText).prop('disabled', false);
        progressDiv.hide();
    });
});