const rfr = require('rfr');
const {EventEmitter, HashMap, Timers, Storage} = require('fizzyflow-utils');
const {NetworkChildClass, NetworkSettings} = rfr('lib/helpers');

const MessageFactory = rfr('lib/messages/MessageFactory.js');
const ChannelHandlerFactory = rfr('lib/handlers/ChannelHandlerFactory.js');

class PeerChannel extends NetworkChildClass {
    constructor(params = {}) {
        super(params);

        this._peerConnection = params.peerConnection || null;
        this._localPeerAddress = params.localPeerAddress || null;
        this._knownPeerAddresses = params.knownPeerAddresses || null;

        this._networkSettings = params.networkSettings || {};

        /// helper for network _awaitingForHandshakeCount count calculation
        this._awaitingForHandshake = params.awaitingForHandshake || false;

        this._peerConnection.on('message', msg => this._onMessage(msg));

        this._toBeClosed = false;

        // Forward specified events on the connection to listeners of this EventEmitter
        this.bubble(this._peerConnection, 'close', 'error', 'ban');

        this.handshaker = ChannelHandlerFactory.factory('Handshaker', {
            peerChannel: this,
            peerConnection: this._peerConnection,
            localPeerAddress: this._localPeerAddress,
            network: this.network
        });
        
        this.handshaker.on('success', msg => this._onHandshakeSuccess(msg));
        this.handshaker.on('error', msg => this._onHandshakeError(msg));
        this.handshaker.handle();
    }

    get networkSettings() {
        return this._networkSettings;
    }

    awaitForDiscoveryAndClose() {
        this._toBeClosed = true;
        this.on('askedforpeers', ()=>{
            this.close();
        });
    }

    // log(str) {
    //     this.log('debug', this._localPeerAddress+' >> '+this._peerConnection.peerAddress+':', str);
    // }

    updateRemotePeerAddress(peerAddress) {
        if (this._peerConnection._peerAddress.ipEquals(peerAddress) || peerAddress.host) {
            this.log('debug', 'Updating '+this._peerConnection+' remote port from: ' + this._peerConnection._peerAddress.port + ' to: ' +  peerAddress.port);
            /// only allow remote connection to update port, not ip
            /// @todo: move this to some nice method of peerAddress or peerConnection
            this._peerConnection._peerAddress.port = peerAddress.port;
            this._peerConnection._peerAddress.host = peerAddress.host;
            if (peerAddress.isSSL()) {
                this._peerConnection._peerAddress.ssl = true;
            } else {
                this._peerConnection._peerAddress.ssl = false;                
            }
        } else {
            this.log('error', ''+this._peerConnection+' got different IP as part of handshake proccess. Current: ', this._peerConnection._peerAddress, 'Received: ', peerAddress);
            //// @todo? What to do?
        }
    }

    _onHandshakeSuccess() {
        this.updateRemotePeerAddress(this.handshaker._peerAddress);
        this.log('debug', ''+this._peerConnection+' handshaked successfuly. Adding more handlers to channel...');

        this._awaitingForHandshake = false;
        
        this.pingponger = ChannelHandlerFactory.factory('PingPonger', {
            peerChannel: this,
            peerConnection: this._peerConnection,
            localPeerAddress: this._localPeerAddress,
            network: this.network
        });
        this.bubble(this.pingponger, 'ping', 'pong');
        this.pingponger.handle();

        this.peersDiscoverer = ChannelHandlerFactory.factory('PeersDiscoverer', {
            peerChannel: this,
            peerConnection: this._peerConnection,
            knownPeerAddresses: this._knownPeerAddresses,
            localPeerAddress: this._localPeerAddress,
            network: this.network
        });
        this.bubble(this.peersDiscoverer, 'askedforpeers', 'peersdiscovered');
        this.peersDiscoverer.handle();

        this.fire('handshake:success', this._peerConnection._peerAddress);
    }

    _onHandshakeError() {
        this.fire('handshake:error', this);
    }

    _onMessage(rawMsg) {
        let msg;
        try {
            msg = MessageFactory.fromBinary(rawMsg);
        } catch(e) {
            this.log('error', ''+this, 'Failed to parse', e);
            this.ban();
        }

        this.log('info', ''+this, 'message received...', ''+msg);

        if (!msg) return;

        try {
            this.log('info', msg.type);
            this.log('info', ''+this, 'firing event', msg.type);

            /// update activity timestamp of this knownPeerAddress
            this._knownPeerAddresses.bumpActivity(this.peerAddress);

            this.fire(msg.type, msg, this);
            this.fire('message', msg, this);
        } catch (e) {
            this.log('error', e);
        }
    }

    _send(msg) {
        return this._peerConnection.send(msg.toBinary());
    }

    close(reason) {
        this._peerConnection.close(reason);
    }

    ban(reason) {
        this._peerConnection.ban(reason);
    }

    ping(nonce) {
        return this.pingponger.ping(nonce);
    }

    askForMorePeers() {
        return this.peersDiscoverer.askForPeers();
    }

    toString() {
        return 'PeerChannel{conn=' + this._peerConnection + '}';
    }

    get awaitingForHandshake() {
        return this._awaitingForHandshake;
    }

    get peerConnection() {
        return this._peerConnection;
    }

    get inbound() {
        return this.peerConnection.inbound;
    }

    get outbound() {
        return !this.peerConnection.inbound;
    }

    get id() {
        return this._peerConnection.id;
    }

    get peerAddress() {
        return this._peerConnection.peerAddress;
    }

    set peerAddress(value) {
        this._peerConnection.peerAddress = value;
    }

    get closed() {
        return this._peerConnection.closed;
    }
}

module.exports = PeerChannel;