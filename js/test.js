require('dotenv').config();
var steem = require('steem');
steem.api.setOptions({url: 'https://testnet.steemitdev.com/', useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : "0feb08c380aeb483b61a34cccb7271a3a99c47052bea529c4a891622f2c50d75"});
steem.config.set('address_prefix', 'TST')
steem.config.set('chain_id', '0feb08c380aeb483b61a34cccb7271a3a99c47052bea529c4a891622f2c50d75');

const assert = require("assert");


var username = process.env.USER;
var password = process.env.PASSWORD;

function transfer(wif, from, to, amount, memo)
{
    steem.broadcast.transfer(wif, from, to, amount, memo, function(err, result) {
        console.log(err, result);
    });
}
// example (note, you can send transfers to yourself)
transfer("wif", "howo", "howo", "0.001 SBD", "You are awesome ! take some tokens")


test();