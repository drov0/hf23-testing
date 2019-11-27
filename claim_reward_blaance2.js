var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: 'https://testnet.steemitdev.com/', useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : "0feb08c380aeb483b61a34cccb7271a3a99c47052bea529c4a891622f2c50d75"});
steem.config.set('address_prefix', 'TST')
steem.config.set('chain_id', '0feb08c380aeb483b61a34cccb7271a3a99c47052bea529c4a891622f2c50d75');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
const POSTING = steem.auth.toWif(username,password, 'posting');
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

async function misc()
{



    let account = await steem.api.callAsync('condenser_api.get_accounts', [[username]]);
    let dyn_p = await steem.api.callAsync('database_api.get_dynamic_global_properties', {});
    account = account[0];

    // 1 SBD for now, SBD nai = @@000000013
    let smt_creation_fee = dyn_p.smt_creation_fee;

    let nai_pool = (await steem.api.callAsync('database_api.get_nai_pool', {})).nai_pool;



    let tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':nai_pool[0].nai,'precision' : 3},
                'smt_creation_fee': smt_creation_fee,
                'precision': 3,
            }]]
    };

    console.log(nai_pool[0]);

    let res = await broadcast(tx, ACTIVE)

}

misc()

function test() {
    describe('claim_reward_balance2', () => {
        it('claim_reward_balance2 successful', async () => {



            let ops = [];

            let account = await steem.api.callAsync('condenser_api.get_accounts', [[username]]);
            account = account[0];


            ops.push(['account_update', {
                'account': username,
                memo_key: account.memo_key,
                posting_key: account.posting.key_auths[0][0],
                active_key: account.active.key_auths[0][0],
                owner_key: account.owner.key_auths[0][0],
                'json_metadata': "",
                "posting_json_metadata": ""
            }]);


            let tx = {operations: ops, extensions: []};

            const result = await broadcast(tx, wif);

            assert(result.error);

        });

    });
}

//test();