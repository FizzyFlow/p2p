const rfr = require('rfr');

const ChannelHandlerTypes = rfr('lib/handlers/ChannelHandlerTypes.js');

class ChannelHandlerFactory {
    constructor() {
    }

    static factory(type, options) {
        if (ChannelHandlerTypes.isTypeAvailable(type)) {
            return new ChannelHandlerTypes._classes[type](options);
        } else {
            throw "Invalid ChannelHandler Type: "+type;
        }
    }
}

module.exports = ChannelHandlerFactory;