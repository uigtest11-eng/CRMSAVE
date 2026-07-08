const Imap = require('imap');

console.log('Testing GoDaddy IMAP connection...');

const imap = new Imap({
    user: 'contact@vigagency.com',
    password: process.env.GODADDY_VIG_PASSWORD || '',
    host: 'imap.secureserver.net',
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

            // Try to fetch last 5 emails
            if (box.messages.total > 0) {
                const fetchRange = Math.max(1, box.messages.total - 4) + ':*';
                console.log(`  Fetching emails ${fetchRange}...`);

                const f = imap.seq.fetch(fetchRange, {
                    envelope: true
                });

                let count = 0;
                f.on('message', (msg, seqno) => {
                    msg.once('attributes', (attrs) => {
                        const envelope = attrs.envelope;
                        if (envelope) {
                            count++;
                            console.log(`  Email ${count}:`);
                            console.log(`    From: ${envelope.from ? envelope.from[0].mailbox + '@' + envelope.from[0].host : 'Unknown'}`);
                            console.log(`    Subject: ${envelope.subject || '(No Subject)'}`);
                            console.log(`    Date: ${envelope.date}`);
                        }
                    });
                });

                f.once('end', () => {
                    console.log(`✓ Fetched ${count} emails`);
                    imap.end();
                });
            } else {
                imap.end();
            }
        }
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

console.log('Connecting to imap.secureserver.net...');
imap.connect();

// Force timeout after 15 seconds
setTimeout(() => {
    console.error('Test timed out after 15 seconds');
    process.exit(1);
}, 15000);