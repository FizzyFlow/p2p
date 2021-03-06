const rfr = require('rfr');
const {EventEmitter, HashMap, Timers, Storage} = require('fizzyflow-utils');
const Message = rfr('lib/messages/Message.js');
const PeerAddress = rfr('lib/PeerAddress.js');

const BinaryVector = rfr('lib/vectors/BinaryVector.js');

class Ping extends Message {
    constructor(options) {
        super('Ping');
        
        this._typeId = 1;

        options = options || {};

        if (options.nonce) {
            this._nonce = ''+options.nonce;
            this.addVector(BinaryVector.factory('StringVector', this._nonce));
        } else {
            this._nonce = Timers.now();
            this.addVector(BinaryVector.factory('TimestampVector', this._nonce));
        }
    }

    toString() {
        return 'Message[type='+this._type+']';
    }

    get nonce() {
        return this._nonce;
    }

    get vector() {
        return this._vectors[0];
    }

    decodeVectors() {
        this._nonce = this._vectors[0].toValue();
        return this;
    }
}

module.exports = Ping;