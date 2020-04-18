var chaiHttp = require('chai-http');
var chai = require('chai');

const deleteTable = (server, dburl, next) => {
    chai.request(server)
        .delete(dburl)
        .end((err, res) => {
            console.log("books deleted.")
            next()
        })
}
module.exports = {deleteTable:deleteTable}
