// CSR TO DO OVERRIDE - Final authority for CSR users' To Do column
// Loads LAST to override all competing scripts (simplified-todo-logic, ultimate-callback-only,
// continuous-callback-monitor, emergency-callback-fix, final-profile-fix, etc.)
// CSR users see ONLY their csrTodo text. No stage-based actions, no "Reach out: CALL".
(function() {
    'use strict';

    var sess;
    try { sess = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}'); } catch(e) { return; }
    if ((sess.role || '') !== 'csr') return; // non-CSR: do nothing at all

    console.log('CSR-TODO-OVERRIDE: CSR user detected, installing overrides');

    // 1. Override getNextAction so ANY script calling it gets csrTodo for CSR
    window.getNextAction = function(stage, lead) {
        // If CSR marked it done, always return empty (green row)
        if (lead && lead.csrTodoDone) return '';
        if (lead && lead.csrTodo && lead.csrTodo.trim()) {
            return lead.csrTodo.trim();
        }
        return ''; // empty = no to-do = green row
    };

    // 2. Kill the continuous-callback-monitor so it stops injecting "Reach out: CALL"
    if (window.continuousCallbackMonitor && window.continuousCallbackMonitor.stop) {
        window.continuousCallbackMonitor.stop();
        console.log('CSR-TODO-OVERRIDE: Stopped continuousCallbackMonitor');
    }

    // 3. Protect To Do cells from DOM manipulation by other scripts
    //    The To Do column is at cell index 7 (0=checkbox, 1=name, 2=indicators,
    //    3=contact, 4=value level, 5=premium, 6=stage, 7=To Do)
    var TODO_CELL_INDEX = 7;

    function enforceCsrTodo() {
        var tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        var leads;
        try { leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]'); } catch(e) { return; }

        var rows = tableBody.querySelectorAll('tr');
        rows.forEach(function(row) {
            var checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            var leadId = checkbox.value;
            var lead = null;
            for (var i = 0; i < leads.length; i++) {
                if (String(leads[i].id) === String(leadId)) { lead = leads[i]; break; }
            }
            if (!lead) return;

            var cells = row.querySelectorAll('td');
            var todoCell = cells[TODO_CELL_INDEX];
            if (!todoCell) return;

            // If CSR marked done, always show empty (even if csrTodo got re-populated by server sync)
            var csrText = lead.csrTodoDone ? '' : (lead.csrTodo || '').trim();
            var expected = csrText
                ? '<div style="font-weight: bold; color: #0284c7;">' + csrText + '</div>'
                : '';

            var current = todoCell.innerHTML.trim();

            // If content matches, skip
            if (current === expected) return;
            if (!csrText && current === '') return;

            // Wrong content detected — fix it
            todoCell.innerHTML = expected;
        });
    }

    // 4. MutationObserver to catch table rebuilds
    var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                var node = added[j];
                if (node.nodeType === 1 && (node.id === 'leadsTableBody' || (node.querySelector && node.querySelector('#leadsTableBody')))) {
                    setTimeout(enforceCsrTodo, 10);
                    setTimeout(enforceCsrTodo, 100);
                    setTimeout(enforceCsrTodo, 500);
                    setTimeout(enforceCsrTodo, 1500);
                    setTimeout(enforceCsrTodo, 3000);
                    return;
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 5. Periodic enforcement every 2 seconds (beats continuous-callback-monitor's 15s)
    setInterval(enforceCsrTodo, 2000);

    // 6. Initial runs at various timings to catch all late-loading scripts
    setTimeout(enforceCsrTodo, 100);
    setTimeout(enforceCsrTodo, 500);
    setTimeout(enforceCsrTodo, 1000);
    setTimeout(enforceCsrTodo, 2000);
    setTimeout(enforceCsrTodo, 4000);
    setTimeout(enforceCsrTodo, 8000);

    // 7. Re-kill continuous monitor after it initializes (it has a 3s delayed init)
    setTimeout(function() {
        if (window.continuousCallbackMonitor && window.continuousCallbackMonitor.stop) {
            window.continuousCallbackMonitor.stop();
            console.log('CSR-TODO-OVERRIDE: Re-stopped continuousCallbackMonitor after delayed init');
        }
    }, 4000);

    console.log('CSR-TODO-OVERRIDE: All overrides installed (To Do cell index = ' + TODO_CELL_INDEX + ')');
})();
