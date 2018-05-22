const expect = require('unexpected');
const rfr = require('rfr');
const Network = rfr('lib/Network.js');


const PeerChannel = rfr('lib/PeerChannel.js');


beforeEach(async function() {
});

describe('Flow network peers discover', function() {

    var network1 = null;
    var network2 = null;
    var network3 = null;

    it('Network initialization is ok', async function() {
        network1 = await Network.getNetwork();
        network2 = await Network.getNetwork();
        network3 = await Network.getNetwork();
    });

    it('Lets connect from network2 to network1', function(done) {
        var promises = [];

        promises.push(  new Promise((resolve, reject) => 
            network2.on('handshake:success',() => resolve()) )  );
        promises.push(  new Promise((resolve, reject) =>   
            network1.on('handshake:success',() => resolve()) )  );

        var peerAddress = network1.getLocalPeerAddress();
        network2._connect(peerAddress);

        Promise.all(promises).then( () => done() );
    });

    it('Lets connect from network3 to network1', function(done) {
        var promises = [];

        promises.push(  new Promise((resolve, reject) => 
            network3.on('handshake:success',() => resolve()) )  );
        promises.push(  new Promise((resolve, reject) =>   
            network1.on('handshake:success',() => resolve()) )  );

        var peerAddress = network1.getLocalPeerAddress();
        network3._connect(peerAddress);

        Promise.all(promises).then( () => done() );
    });

    //// on this poing, network1 knows about #2 and #3, while #2 knows only about #1, #3 knows only about #1

    it('Lets network3 ask network1 for more peers and check that it connects to discovered', function(done) {
        var promises = [];

        var peerChannel3 = null;
        var peerChannels = network3.getPeerChannels();
        expect(peerChannels.length, 'to be', 1);

        peerChannels.forEach(function(peerChannel){
            peerChannel3 = peerChannel;
        });

        expect(network1.knownPeerAddresses.knownCount, 'to be', 2);

        promises.push(  new Promise((resolve, reject) =>   
            network1.on('askedforpeers',() => resolve()) )  );

        promises.push(  new Promise((resolve, reject) => 
            network3.on('peersdiscovered',() => { 
                network3.knownPeerAddresses.logDebug();
                expect(network3.knownPeerAddresses.knownCount, 'to be', 2);
                resolve();
             }) )  );

        promises.push(  new Promise((resolve, reject) => 
            network3.on('newChannel',() => { 
                network3.knownPeerAddresses.logDebug();
                expect(network3.knownPeerAddresses.knownCount, 'to be', 2);
                resolve();
             }) )  );

        promises.push(  new Promise((resolve, reject) => 
            //// note that we didn't ask network3 to connect to network2. It was discovered
            network2.on('newChannel',() => { 
                expect(network1.knownPeerAddresses.knownCount, 'to be', 2);
                resolve();
             }) )  );

        // peerChannel3.askForMorePeers();

        Promise.all(promises).then( () => done() );
    });


    it('Check for max connected peers limit', async function() {
        let testPeersCount = 1;

        network1.settings.limits.peers = testPeersCount;
        network2.settings.limits.peers = testPeersCount;
        network3.settings.limits.peers = testPeersCount;

        let expectedNodesCount = testPeersCount + 3;

        let networks = [];
        for (let i = 0; i <= testPeersCount + 2; i++) { /// create maxPeers + 2 peers
            let network = await Network.getNetwork();
            network.settings.limits.peers = testPeersCount;
            networks.push(network);

            // network.on('peer:status', ()=>{ exporter.setTimeframe(); });

            network.on('message', (msg, peerChannel)=>{ 
                // exporter.addMessage(peerChannel._peerConnection.peerAddress, peerChannel._localPeerAddress, msg); 
            });
        }

        expect(networks.length, 'to be', expectedNodesCount);

        var peerAddress = networks[0].getLocalPeerAddress();
        //// connect all peers to 1st one
        for (let i = 1; i <= testPeersCount + 2; i++) {
            // exporter.setTimeframe();
            networks[i]._connect(peerAddress);
        }

        //// Settings.network.limits.peers should be connected to network[0]
        var waitForConnectionsPromise = new Promise((res, rej) => {
            var connectedCount = 0;
            networks[0].on('handshake:success', ()=>{
                connectedCount++;
                if (connectedCount == testPeersCount) {
                    expect(networks[0].knownPeerAddresses.activeCount, 'to be', testPeersCount);
                    expect(networks[0].knownPeerAddresses.activeInboundCount, 'to be', testPeersCount);
                    expect(networks[0].knownPeerAddresses.activeOutboundCount, 'to be', 0);
                    res();
                }
            });
        });

        //// But the last one should be discarded
        var waitForDiscardPromise = new Promise((res, rej) => {
            // res();
            var discardedCount = 0;
            networks[0].on('closed', (peerChannel, peerAddress)=>{
                // exporter.setTimeframe();
                discardedCount++;
                if (discardedCount == 1) {
                    // networks[0].knownPeerAddresses.activeCount + networks[0]._awaitingForHandshakeCount
                    expect(networks[0].knownPeerAddresses.activeOutboundCount, 'to be', 0);
                    res();
                }
            });
        });

        var waitForTheLastOneToBeDiscovered =  new Promise((res, rej) => {
            // res();
            var count = 0;
            networks[networks.length-1].on('handshake:success', (peerChannel, peerAddress)=>{
                // exporter.setTimeframe();
                count++;
                if (count == testPeersCount) {
                    res();
                }
            });
        });

        await Promise.all([waitForDiscardPromise, waitForConnectionsPromise, waitForTheLastOneToBeDiscovered]);




        // await new Promise((res,rej)=>{ setTimeout(res, 15000); });
        // exporter.finishBroadcast();
        // exporter.save('tmp/handshake_limits.json');
    });

});