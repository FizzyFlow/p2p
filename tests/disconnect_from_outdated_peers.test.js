const expect = require('unexpected');
const rfr = require('rfr');
const Network = rfr('lib/Network.js');

const PeerChannel = rfr('lib/PeerChannel.js');

describe('Flow network disconnect from outdated', function() {

    var network1 = null;
    var network2 = null;
    var network3 = null;

    it('Initialize 3 network instances', async function() {
        network1 = await Network.getNetwork();
        network2 = await Network.getNetwork();
        network3 = await Network.getNetwork();
    });

    it('Connect peers to each other', async function() {
        let testPeersCount = 2;

        network1.settings.limits.peers = testPeersCount;
        network2.settings.limits.peers = testPeersCount;
        network3.settings.limits.peers = testPeersCount;


        var peerAddress = network1.getLocalPeerAddress();
        network2._connect(peerAddress);
        network3._connect(peerAddress);

        /// wait till network3 connects network2 by peers discover procceess
        await new Promise((res, rej) => {
            var connected1Count = 0;
            var connected2Count = 0;
            var connected3Count = 0;
            network1.on('handshake:success', ()=>{
                connected1Count++;
                if (connected1Count == 2 && connected2Count == 2 && connected3Count == 2) {
                    res();
                }
            });
            network2.on('handshake:success', ()=>{
                connected2Count++;
                if (connected1Count == 2 && connected2Count == 2 && connected3Count == 2) {
                    res();
                }
            });
            network3.on('handshake:success', ()=>{
                connected3Count++;
                if (connected1Count == 2 && connected2Count == 2 && connected3Count == 2) {
                    res();
                }
            });
        });

        expect(network3.getPeerChannels().length, 'to be', 2);

        expect(network1.knownPeerAddresses.knownCount, 'to be', 2);
        expect(network3.knownPeerAddresses.knownCount, 'to be', 2);
        expect(network2.knownPeerAddresses.knownCount, 'to be', 2);

        expect(network1.knownPeerAddresses.activeCount, 'to be', 2);
        expect(network3.knownPeerAddresses.activeCount, 'to be', 2);
        expect(network2.knownPeerAddresses.activeCount, 'to be', 2);

        //// now pause peersDiscoverer handlers on network3, so it's not sending messages to their channels anymore.
        network3.getPeerChannels().forEach(function(peerChannel){
            peerChannel.peersDiscoverer.pause();
        });

        /// wait for network2 and network1 to close connections to network3 (as it's not active anymore)
        await new Promise((res, rej) => {
            var closed = 0;
            network3.on('closed', ()=>{
                closed++;
                if (closed == 2) {
                    res();
                }
            });
        });

        expect(network1.knownPeerAddresses.activeCount, 'to be', 1);
        expect(network2.knownPeerAddresses.activeCount, 'to be', 1);
        expect(network3.knownPeerAddresses.activeCount, 'to be', 0);
    });
});