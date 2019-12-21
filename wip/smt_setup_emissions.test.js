var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: 'https://testnet.steemitdev.com/', useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : "abc93c9021bbd9a8dd21c438ee3c480a661ca1966b5e4e838326dcf42a3dac2d"});
steem.config.set('address_prefix', 'TST')
steem.config.set('chain_id', 'abc93c9021bbd9a8dd21c438ee3c480a661ca1966b5e4e838326dcf42a3dac2d');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
const ACTIVE = steem.auth.toWif(username,password, 'active');


function broadcast(tx, wif)
{
    return new Promise(resolve => {
        steem.broadcast.send(tx, {wif}, async function (result, err) {
            if (!err) {
                return resolve({error : false, result})
            } else {
                return resolve({error : true , err})
            }
        });
    });
}

async function setup_emission(nai, precision) {

    let tx = {
        'operations': [[
            'smt_setup_emissions', {
                'control_account' : username,
                'symbol' : {'nai':nai,'precision':precision},
                'schedule_time' : '2019-12-21T09:47:05',
                'emissions_unit' : {
                    'token_unit' : [
                        ['$market_maker',1],
                        ['$rewards',1],
                        ['$vesting',1],
                        ['petanque',1],
                    ]
                },
                'interval_seconds' : 21600,
                'interval_count' : 1,
                'lep_time' : '1970-01-01T00:00:00',
                'rep_time' : '1970-01-01T00:00:00',
                'lep_abs_amount' : 0,
                'rep_abs_amount': 0,
                'lep_rel_amount_numerator' : 1,
                'rep_rel_amount_numerator' : 0,
                'rel_amount_denom_bits' : 0,
                'remove' : false,
                'floor_emissions' : false,
                'extensions':[]
            }]]
    };


    let result = await broadcast(tx, ACTIVE);

     assert(result.error);
}



async function test() {
    setup_emission("@@280090049", 0)
}

test();


