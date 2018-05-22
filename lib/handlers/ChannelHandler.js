const rfr = require('rfr');
const {EventEmitter, HashMap, Timers, Storage} = require('fizzyflow-utils');
const {NetworkChildClass, NetworkSettings} = rfr('lib/helpers');


class ChannelHandler extends NetworkChildClass {
    constructor(channelHandlerType, options) {
    	super(options);
    	options = options || {};
        this._channelHandlerType = channelHandlerType;
        this._peerChannel = options.peerChannel || null;
        this._peerConnection = options.peerConnection || null;
        this._localPeerAddress = options.localPeerAddress || null;
        this._knownPeerAddresses = options.knownPeerAddresses || null;

        if (!this._peerChannel) {
        	throw new Error("peerChannel is required for ChannelHandler");
        }
    }
}

module.exports = ChannelHandler;