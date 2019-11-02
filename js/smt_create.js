var steem = require('steem');
steem.api.setOptions({url: 'https://testnet.steemitdev.com/', useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : "0feb08c380aeb483b61a34cccb7271a3a99c47052bea529c4a891622f2c50d75"});
steem.config.set('address_prefix', 'TST')
steem.config.set('chain_id', '0feb08c380aeb483b61a34cccb7271a3a99c47052bea529c4a891622f2c50d75');

const assert = require("assert");


var username = "howo-testnet";
var password = "modepassesecret";


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

function claim_reward_blance_2_tx(op_data)
{
    return new Promise(async resolve => {
        const wif = steem.auth.toWif(username, password, 'posting');

        let ops = [];

        ops.push(['claim_reward_balance2', op_data]);

        let tx = {operations: ops, extensions: []};

        return resolve({tx, wif})

    });
}

function test() {
    describe('accountupdate and accountupdate2', () => {
        it('accountupdate', async () => {
            const wif = steem.auth.toWif(username, password, 'active');

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
        // Fails for some reason with the same params above
        it('accountupdate2', async () => {
            const wif = steem.auth.toWif(username, password, 'posting');

            let ops = [];

            let account = await steem.api.callAsync('condenser_api.get_accounts', [[username]]);
            account = account[0];


            ops.push(['account_update2', {
                'account': username,
                memo_key: account.memo_key,
                'json_metadata': "",
                "posting_json_metadata": ""
            }]);


            let tx = {operations: ops, extensions: []};

            const result = await broadcast(tx, wif);
            assert(result.error);
        });
    });
}

test();