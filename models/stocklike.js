const mongoose = require('mongoose')

var stocklikeSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true
    },
    likeAgent: {
        type: String,
        required: true
    }
});
stocklikeSchema.index({symbol:1,likeAgent:1},{unique: true})

module.exports = mongoose.model('StockLike',stocklikeSchema )