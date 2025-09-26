jQuery(document).ready(function($){
    const $metaBox = $('#tass_post_box');
    if (!$metaBox.length) return;

    const $titleField = $('input[name="_tass_title"]');
    const $descField = $('textarea[name="_tass_description"]');
    const $focusField = $('input[name="_tass_focus_kw"]');
    const $btnGenerate = $('#tass-generate');
    const $btnQuality = $('#tass-quality');
    const $btnApplyYoast = $('#tass-apply-yoast');
    const $btnYoastDiag = $('#tass-yoast-diag');
    const $serpTitle = $('#tass-serp-title');
    const $serpDesc = $('#tass-serp-desc');
    const $titleMeter = $('#tass-title-meter');
    const $descMeter = $('#tass-desc-meter');

    function updateMeters() {
        const titleLen = $titleField.val().length;
        const descLen = $descField.val().length;
        $titleMeter.text(titleLen + ' ch. (consigliati 30-65)');
        $descMeter.text(descLen + ' ch. (consigliati 100-150)');
        $titleMeter.css('color', (titleLen >= TASS.titleMin && titleLen <= TASS.titleMax) ? 'green' : 'red');
        $descMeter.css('color', (descLen >= TASS.descMin && descLen <= TASS.descMax) ? 'green' : 'red');
        $serpTitle.text($titleField.val() || 'Anteprima titolo');
        $serpDesc.text($descField.val() || 'Anteprima descrizione');
    }
    updateMeters();
    $metaBox.on('keyup', '.tass-watch', updateMeters);

    function startLoader(btn) {
        btn.addClass('disabled').data('original-text', btn.text()).text('... in corso');
    }
    function stopLoader(btn, newText) {
        btn.removeClass('disabled').text(newText || btn.data('original-text'));
    }

    // GENERA META
    $btnGenerate.on('click', function(e) {
        e.preventDefault();
        const post_id = $(this).data('post');
        const focus_kw = $focusField.val();
        if (!post_id) return;
        startLoader($(this));
        $.post(TASS.ajax, {
            action: 'tass_generate_meta',
            post_id: post_id,
            focus_kw: focus_kw,
            nonce: TASS.nonce
        })
        .done(function(resp) {
            if (resp.success) {
                $titleField.val(resp.data.title);
                $descField.val(resp.data.description);
                $focusField.val(focus_kw);
                updateMeters();
                stopLoader($btnGenerate, 'Generato!');
                setTimeout(() => stopLoader($btnGenerate), 2000);
            } else {
                alert('Errore: ' + (resp.data.error || 'Generazione fallita. Controlla la console o le impostazioni.'));
                stopLoader($btnGenerate, 'Errore');
            }
        })
        .fail(function() {
            alert('Errore di connessione o del server.');
            stopLoader($btnGenerate, 'Errore');
        });
    });

    // CONTROLLO QUALITÀ
    $btnQuality.on('click', function(e) {
        e.preventDefault();
        const post_id = $(this).data('post');
        if (!post_id) return;
        startLoader($(this));
        $.post(TASS.ajax, {
            action: 'tass_quality_check',
            post_id: post_id,
            nonce: TASS.nonce
        })
        .done(function(resp) {
            if (resp.success) {
                alert('Punteggio SEO: ' + resp.data.score + '/100\n' +
                      'Dettagli:\n' +
                      '- Lunghezza titolo: ' + resp.data.details.title_length + ' caratteri\n' +
                      '- Lunghezza descrizione: ' + resp.data.details.description_length + ' caratteri\n' +
                      '- Conteggio parole: ' + resp.data.details.word_count + '\n' +
                      '- H1 presente: ' + (resp.data.details.has_h1 ? 'Sì' : 'No') + '\n' +
                      '- Immagini con ALT: ' + resp.data.details.images_with_alt + '/' + resp.data.details.images + '\n' +
                      '- Densità keyword (' + resp.data.details.focus_kw + '): ' + resp.data.details.focus_density_pct + '%\n' +
                      '- Leggibilità Flesch: ' + resp.data.details.flesch_estimate);
                stopLoader($btnQuality, 'Fatto!');
                setTimeout(() => stopLoader($btnQuality), 2000);
            } else {
                alert('Errore: ' + (resp.data.error || 'Controllo qualità fallito.'));
                stopLoader($btnQuality, 'Errore');
            }
        })
        .fail(function() {
            alert('Errore di connessione o del server.');
            stopLoader($btnQuality, 'Errore');
        });
    });

    // APPLICA A YOAST
    $btnApplyYoast.on('click', function(e) {
        e.preventDefault();
        const post_id = $(this).data('post');
        const title = $titleField.val();
        const description = $descField.val();
        const focus_kw = $focusField.val();
        if (!post_id) return;
        startLoader($(this));
        $.post(TASS.ajax, {
            action: 'tass_apply_yoast',
            post_id: post_id,
            title: title,
            description: description,
            focus_kw: focus_kw,
            nonce: TASS.nonce
        })
        .done(function(resp) {
            if (resp.success) {
                alert('Metadati applicati a Yoast SEO con successo.');
                stopLoader($btnApplyYoast, 'Applicato!');
                setTimeout(() => stopLoader($btnApplyYoast), 2000);
            } else {
                alert('Errore: ' + (resp.data.error || 'Applicazione fallita.'));
                stopLoader($btnApplyYoast, 'Errore');
            }
        })
        .fail(function() {
            alert('Errore di connessione o del server.');
            stopLoader($btnApplyYoast, 'Errore');
        });
    });

    // DIAGNOSTICA YOAST
    $btnYoastDiag.on('click', function(e) {
        e.preventDefault();
        const post_id = $(this).data('post');
        if (!post_id || !TASS.debug) return;
        startLoader($(this));
        $.post(TASS.ajax, {
            action: 'tass_yoast_diag',
            post_id: post_id,
            nonce: TASS.nonce
        })
        .done(function(resp) {
            if (resp.success) {
                const diag = resp.data;
                let msg = '=== Diagnostica Yoast ===\n\n';
                msg += 'TSK Meta:\n';
                msg += '  - Title: ' + (diag.tsk_meta.title || 'N/A') + '\n';
                msg += '  - Description: ' + (diag.tsk_meta.description || 'N/A') + '\n\n';
                msg += 'Yoast Meta (diretta):\n';
                msg += '  - Title: ' + (diag.yoast_meta_direct.title || 'N/A') + '\n';
                msg += '  - Description: ' + (diag.yoast_meta_direct.description || 'N/A') + '\n';
                msg += '  - Focus KW: ' + (diag.yoast_meta_direct.focuskw || 'N/A') + '\n\n';
                msg += 'Yoast Indexable:\n';
                msg += '  - Title: ' + (diag.yoast_indexable.title || 'N/A') + '\n';
                msg += '  - Description: ' + (diag.yoast_indexable.description || 'N/A') + '\n\n';
                msg += 'Versione Yoast: ' + diag.yoast_version + '\n';
                alert(msg);
                stopLoader($btnYoastDiag, 'Fatto!');
                setTimeout(() => stopLoader($btnYoastDiag), 2000);
            } else {
                alert('Errore diagnostica: ' + (resp.data.error || 'Sconosciuto'));
                stopLoader($btnYoastDiag, 'Errore');
            }
        })
        .fail(function() {
            alert('Errore di connessione o del server.');
            stopLoader($btnYoastDiag, 'Errore');
        });
    });
});