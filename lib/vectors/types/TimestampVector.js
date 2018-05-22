const rfr = require('rfr');
const {EventEmitter, HashMap, Timers, Storage} = require('fizzyflow-utils');
const _ = require('lodash');
const bignum = require('bignum');

const BinaryVector = rfr('lib/vectors/BinaryVector.js');

class TimestampVector extends BinaryVector {
    constructor(datetime) {
        super('TimestampVector');

        this._timestamp = Timers.anythingToTimestamp(datetime);

        if (!bignum.isBigNum(this._timestamp)) {
            throw new Error('Invalid datetime parameter');            
        }
    }

    toValue() {
        return this._timestamp.toNumber();
    }

    toBinary() {
        return this.decorateBinary(this._timestamp.toBuffer());
    }

    static fromBinary(binary) {
        return new TimestampVector( bignum.fromBuffer(binary.slice(2)) );
    }
}

module.exports = TimestampVector;