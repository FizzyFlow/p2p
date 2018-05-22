const rfr = require('rfr');
const {EventEmitter, HashMap, Timers, Storage} = require('fizzyflow-utils');
const _ = require('lodash');
const Message = rfr('lib/messages/Message.js');
const PeerAddress = rfr('lib/PeerAddress.js');

const BinaryVector = rfr('lib/vectors/BinaryVector.js');

class GiveMorePeers extends Message {
    constructor(options) {
        super('GiveMorePeers');
        
        this._typeId = 3;

        options = options || {};

        this._discoveredSinceTimestamp = Timers.anythingToTimestamp(options.discoveredSince, false);
        if (this._discoveredSinceTimestamp) {
            this.addVector(BinaryVector.factory('TimestampVector', this._discoveredSinceTimestamp));
        }
    }

    toString() {
        return 'Message[type='+this._type+']';
    }

    get discoveredSinceTimestamp() {
        return this._discoveredSinceTimestamp;
    }

    get vector() {
        return this._vectors[0];
    }

    decodeVectors() {
        if (this._vectors[0]) {
            this._discoveredSinceTimestamp = this._vectors[0].toValue();            
        }
        return this;
    }
}

module.exports = GiveMorePeers;