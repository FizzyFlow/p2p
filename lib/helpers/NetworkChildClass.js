const {EventEmitter, HashMap, Timers, Storage} = require('fizzyflow-utils');

class NetworkChildClass extends EventEmitter {
    constructor(params = {}) {
        super();
        if (!params.network) {
            throw new Error("params.network is required for NetworkChildClass");
        }
        this._network = params.network;
    }
    
    log(level, str) {
        this._network.log(level, str);
    }

    get networkSettings() {
        return this._network.settings;
    }

    get network() {
        return this._network;
    }
}

module.exports = NetworkChildClass;