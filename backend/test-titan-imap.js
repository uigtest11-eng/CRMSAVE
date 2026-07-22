const Imap = require('imap');

console.log('Testing Titan IMAP connection...');

const imap = new Imap({
    user: 'contact@vigagency.com',
    password: process.env.GODADDY_VIG_PASSWORD || '',
    host: 'imap.titan.email',
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    },
    debug: function(msg) {
        console.log('IMAP Debug:', msg);
    }
});

imap.once('ready', function() {
    console.log('✓ Connected successfully!');

    imap.openBox('INBOX', true, function(err, box) {
        if (err) {
            console.error('Error opening inbox:', err);
        } else {
            console.log('✓ Inbox opened successfully');
            console.log(`  Total messages: ${box.messages.total}`);
            console.log(`  New messages: ${box.messages.new}`);
        }
        imap.end();
    });
});

imap.once('error', function(err) {
    console.error('Connection error:', err.message);
    if (err.source) console.error('Error source:', err.source);
    if (err.textCode) console.error('Error code:', err.textCode);
});

imap.once('end', function() {
    console.log('Connection ended');
    process.exit(0);
});

console.log('Connecting to imap.titan.email...');
imap.connect();

// Force timeout after 15 seconds
setTimeout(() => {
    console.error('Test timed out after 15 seconds');
    process.exit(1);
}, 15000);