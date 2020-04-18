/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var request = require('request');
const MONGODB_CONNECTION_STRING = process.env.DB;
const mongoose = require('mongoose');
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const StockLike = require('../models/stocklike.js')
module.exports = function (app) {

  const getStockURL = (stockTicket) => {
    return process.env.STOCKPRICE_API.replace("[symbol]",stockTicket);
  } 

  const addCount = (response, dataToSend, symbols) => {
    let likes = [];
    StockLike.aggregate()
    .match({symbol:{$in:symbols}})
    .group({_id: "$symbol",likeAgent: {$sum: 1}})
    .exec((err,results)=>{
      //console.log(results,"==============")
      if(results.length===0){

        for(var emptylikes = 0 ; emptylikes < symbols.length; emptylikes++){
          likes.push({likeAgent:0})
        }
      }
      else{
        likes = results
      }
      //console.log(likes,"------------------------------>")
      //console.log("dataToSend: ",dataToSend,"\nLikes:",likes)

      dataToSend.stockData.forEach( x => {
        let foundStock = (likes.find(e => e._id === x.stock));
        if(foundStock===undefined){
          x.likes = 0;
        }
        else {
          x.likes =foundStock.likeAgent
        }
        //console.log(x,foundStock, likes,"=====================")//.likes = x.likeAgent;
      })


      //console.log(dataToSend,"here")
      
      if (dataToSend.stockData.length===1){
        response.json({'stockData':dataToSend.stockData[0]})
      }
      else{
        let l0 = dataToSend.stockData[0].likes;
        let l1 = dataToSend.stockData[1].likes;
        dataToSend.stockData[1].likes = l0 - dataToSend.stockData[1].likes;
        dataToSend.stockData[0].likes = l1 - dataToSend.stockData[0].likes; 

        response.json(dataToSend)
      }      
    })
  }

  const determineResults = (req,res,stockInfo) => {

    let data = {"stockData":[]};// template : {"stock":"GOOG","price":1281.37,"likes":1}

    let symbolsToStore = [];
    stockInfo.forEach(stock => {
      //console.log(stock)
      symbolsToStore.push(stock.symbol)
      data['stockData'].push({stock:stock.symbol,price:stock.latestPrice}) // Add: stock,price component
    });

    if(req.query.like!==undefined && req.query.like==='true'){
      var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
      let itemsToStore = [];
      symbolsToStore.forEach(stockTicket => {
        itemsToStore.push({symbol:stockTicket,likeAgent:ip})
      });
      StockLike.insertMany(itemsToStore,{ordered:false},(err,docs)=>{
        //console.log(docs,itemsToStore)
        addCount(res,data,symbolsToStore)
      })
    }
    else {
      addCount(res,data,symbolsToStore)
    }
  } 

  app.route('/api/stock-prices')
    .get(function (req, res){
      let stockInfo = []
      let stockResquested = 0;
      let stocksToProcess;
      if (req.query.stock !== undefined){
        if(req.query.stock instanceof Array === true){
          stocksToProcess = req.query.stock
        }
        else{
          stocksToProcess = [req.query.stock]
        }
        
        stocksToProcess.forEach(symbol => { //request . external api
          request({method:'GET',uri:getStockURL(symbol)},(stockApiRes,stockApiReq,stockApiBody)=>{
            stockResquested += 1;
            stockInfo.push(JSON.parse(stockApiBody)) 
            if(stockResquested===stocksToProcess.length){
              determineResults(req,res,stockInfo);
            }
          })
        });
      }
      else {
        res.json("please provide some stocks")
      }
    
    });
    
};
