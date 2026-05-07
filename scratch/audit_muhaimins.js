const admin = require('firebase-admin');

const serviceAccount = {
  projectId: "codep-pulse",
  clientEmail: "firebase-adminsdk-fbsvc@codep-pulse.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDWNKJKEq1Yk/8D\nopEM59Fr7wciHy36dvSIB0r/PaIgknRytxv2oWPne62hutIaeUH48RO04mSUi2/K\nxcK5YCbfB53gfh7aofzvuCtIftt5nZy4bcbDRxsN6WqaPgaL/iXkViitP5Cc8ytK\nPzeVH2Mw507wCJzBYzlH5Q2EmWMUCa0skLHpMqZ8E2uvQ0KHwldAXb2/XG2WivgN\n8Yjq2pgzZGmVf40VarLiTbs/Wu1TIg7ra20c/fD/H5mVKSpbOHDLYiza/PKt/6nH\nelrLUElmeXjRjQvFyceJLW0qy9qRn01punjV3uagqNBKd911x7bU3F2rHzHg6dZ5\n81HJMeRBAgMBAAECggEAC9KnY3nA7hrrECcMpP71kOTGSsSYS9L9f7WRVuGuvWf/\n++Xt6fCx/DCYHo1ac+Id+VDLEuiM/yLsFm/QZd1v/87ikKW9a7lVpeCPKQbxc7a2\nk/phJl2aGWw4+U7zmw35xu7Xe2p+/56vVL+FAJrVJXma4oZDKqxgmL6Efr1dmdkt\n7bKZ58EuMoEzZ4QwTvI9QSwtaG6kZYTKrFNkpPfo8TeE5wzZTa2SY0tf0QG+P3Dr\IotgMQEUBlEZf3L8bbuNDYzM/gM35SS4QoAK6Ne/druGVNFZALFyjYuXihNpa2XN\n9z0vvm/pJlp0i16QGtyTuJgtUJM7mwdEjpN47diFHQKBgQD/t7jXwqff62xBHo+5\ngSjiT0eyiTWge3f3R9QPfN200NJwV/IV/oUV9FQhnxJycCJm5B3guMdLW09Uf3Ru\niQzfd8x9XQrC6y1tyHMO97pKXYwY9hPrrCC8u8JMKUdUo6VSEMrQX0AGFtrKra4M\nvvc5LZcVK+6M32b881sOlx0ylQKBgQDWcS26B8ANe7GqJtruqZoGxg/B0C7qrVQ0\scyDZo2NcPCNSmFCwGwg0ppi3+uuDzyxG4+GzxhxaudxcAwuXh+NNu6yLUTNPQ3U\ny4nFUJNot28hYHVwtOb3zPdE6SzxchwRdegRqD0QZZjzPekv0b97ZO3Zzy08FeuN\nA7w7Y2CL/QKBgAp5/3OvgOs2nPfKBb9m4ELtVpWk83KAvHiAE9sSlY6743NA1yU5\niUBOA0hhWQMhPveSLvsu9tNKiWR/2EhTCxj4soMMVc2IjxLpXHVnhtVXIc8//a7x\nHWI+Gwa9xjNchQBoubZxwJC/TPVyyiexhzVrfb4bT6mr2W9RlRBy9npFAoGANKXQ\nzi1871KBCf9EHPgywpr532GXQzKOy+kjBte0xRcHWAj83ACWC3DpSoEjQban9euI\nT1ak76OJcwZJV1DweiEUdVY74A+vR6E5D+J6bmkqtY0TCDrBwfDmfFqrGBQl4/uI\noF0nsNDgvkdi6sSaOFdNNf5xYqEXFaXnHsWFPJkCgYEAiOHZVxje+gxbnd4hRjOK\nOrHW3KubDUf/K2yCs3daVAR+OrNFBY+A45kNplGA63aI6N2Y5rvHSifpcUkf0Rkl\nzzxKyhvJy3ZtlmV3Uoy6Kjm33Avk5ACXOpyKX9RZtpwFZRvZQtihJojZbemjQHdt\nD+Eky7BK6sGIxn+GGGOAWoo=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n')
};

if (!admin.apps.length) admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount) 
});
const db = admin.firestore();

async function listMuhaimins() {
  const snap = await db.collection('users').get();
  const matches = snap.docs.filter(d => {
    const name = d.data().full_name || '';
    return name.toLowerCase().includes('muhaimin');
  });
  
  for (const m of matches) {
     const orders = await db.collection('orders').where('buyer_id', '==', m.id).get();
     const txs = await db.collection('transactions').where('buyer_id', '==', m.id).get();
     console.log(`MATCH: ${m.id} | Name: ${m.data().full_name} | Orders: ${orders.size} | Legacy Txs: ${txs.size}`);
  }
  process.exit(0);
}

listMuhaimins();
