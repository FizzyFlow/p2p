const rfr = require('rfr');
const {EventEmitter, HashMap, Timers, Storage} = require('fizzyflow-utils');

const ChannelHandler = rfr('lib/handlers/ChannelHandler.js');
const MessageFactory = rfr('lib/messages/MessageFactory.js');


class PeersDiscoverer extends ChannelHandler {
    constructor(options) {
        super('PeersDiscoverer', options);
        // this._peerChannel
        // this._peerChannel.connection
        //

        this._peerChannel.on('GiveMorePeers', msg => this._onPeersAsked(msg));
        this._peerChannel.on('HereArePeers', msg => this._onPeersReceived(msg));

        this._timers = new Timers();

        this._discoveredSince = 0;

        this._active = true;
    }

    handle() {
        this.askForPeers();
        this._timers.setInterval('askForMore', () => {
                if (this._active) {
                    this.askForPeers();
                }
            }, 
            this.networkSettings.discovery.askMoreInterval);
    }

    /**
     * Pause handler, so it's NOT asking for peers anymore. Primarly for testing
     * @return {[type]} [description]
     */
    pause() {
        this._active = false;
    }

    /**
     * Resume handler, so it will ask for more peers again.
     * @return {[type]} [description]
     */
    resume() {
        this._active = true;
    }

    askForPeers() {
        let msg = MessageFactory.factory('GiveMorePeers', {
            discoveredSince: this._discoveredSince
        });

        //// @todo: need to verify response timeouts? 

        this._peerConnection.send(msg.toBinary());
    }

    _onPeersAsked(msg) {
        this.log('debug', 'PeersDiscoverer | We have been asked for peers');

        const data = this._knownPeerAddresses.getDiscoveryResponse(msg.discoveredSinceTimestamp);
        if (data.addresses.length) {
            let respMsg = MessageFactory.factory('HereArePeers', {
                peers: data.addresses,
                timestamp: data.timestamp
            });

            this._peerConnection.send(respMsg.toBinary());            
        }

        this.fire('askedforpeers', this._peerChannel);
    }

    _onPeersReceived(msg) {
        this.log('debug', 'PeersDiscoverer | We have received new portion of peerAddresses ('+msg.peerAddresses.length+')');

        this._discoveredSince = msg.timestamp;
        this.fire('peersdiscovered', this._peerChannel, msg.peerAddresses);
    }
}

module.exports = PeersDiscoverer;