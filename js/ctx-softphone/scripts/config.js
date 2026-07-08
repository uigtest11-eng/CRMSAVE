// SIP config is loaded from the server at runtime via /api/sip-config
// These are placeholder values that get overwritten on init
var user = {
    "User" : "",
    "Pass" : "",
    "Realm"   : "",
    "Display" : "Vanguard Agent",
    "WSServer"  : ""
};

// Load real config from server
(async function loadSipConfig() {
    try {
        var jwt = sessionStorage.getItem('vanguard_jwt');
        var resp = await fetch('/api/sip-config', { headers: { Authorization: 'Bearer ' + jwt } });
        if (resp.ok) {
            var cfg = await resp.json();
            user.User = cfg.username;
            user.Pass = cfg.password;
            user.Realm = cfg.domain;
            user.WSServer = 'wss://' + cfg.domain + ':443';
        }
    } catch (e) { console.warn('Could not load SIP config'); }
})();
