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

async function smt_setup(nai, precision, max_supply) {
    let tx = {
        'operations': [[
            'smt_setup', {
                'control_account' : username,
                'symbol' : {'nai':nai,'precision': precision},
                'max_supply' : max_supply,
                'contribution_begin_time' : '2020-12-21T00:00:00',
                'contribution_end_time' : '2021-12-21T00:00:00',
                'launch_time' : '2021-12-22T00:00:00',
                'steem_units_min' : 0,
                'min_unit_ratio' : 0,
                'max_unit_ratio' : 0,
                'extensions':[]
            }
        ]]
    }


    let result = await broadcast(tx, ACTIVE);

     assert(result.error);
}



async function test() {
    smt_setup("@@280090049", 0,500000000)
}

test();


