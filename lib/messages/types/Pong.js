const rfr = require('rfr');
const Message = rfr('lib/messages/Message.js');
const PeerAddress = rfr('lib/PeerAddress.js');

const BinaryVector = rfr('lib/vectors/BinaryVector.js');

class Pong extends Message {
    constructor(options) {
        super('Pong');
        
        this._typeId = 2;
        
        options = options || {};
        if (options.vector) {
            this.addVector(options.vector);
        }
    }

    toString() {
        return 'Message[type='+this._type+']';
    }

    get nonce() {
        return this._nonce;
    }

    decodeVectors() {
        this._nonce = this._vectors[0].toValue();
        return this;
    }
}

module.exports = Pong;