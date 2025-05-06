const request = require('supertest');
const app = require('../app');
const functions = require('../functions/index_functions');
const { expect } = require('chai');
var connection = require('../database/connection'); 

describe('Store Route', () => {
  it('should reject unauthenticated store access', async () => {
    const res = await request(app).get('/store');
    expect(res.status).to.equal(302); // redirect to login
  });
});

describe('Store Buying Test', async () => {
  it('Require ID', async () => {
    const res = await functions.purchaseItem(120, null, connection);
    expect(res.status).to.satisfy(s => [400].includes(s));
  });
  it('Bad Item', async () => {
    const res = await functions.purchaseItem(120, -1, connection);
    expect(res.status).to.satisfy(s => [404].includes(s));
    expect(res.send).to.include('Item not found');
  });
  it('Not enough points', async () => {
    const res = await functions.purchaseItem(120, 2, connection); //Fire name is 30 points. Only 21 points in the DB
    expect(res.status).to.satisfy(s => [302].includes(s));
    expect(res.send).to.include("<script>alert('Not enough points to purchase!'); window.location.href='/store';</script>");
  });
  it('Enough points', async () => {
    const res = await functions.purchaseItem(120, 1, connection); //Fire name is 30 points. Only 21 points in the DB
    expect(res.status).to.satisfy(s => [302].includes(s));
    console.log("==================================================");
    console.log(res.send);
    console.log("==================================================");
    expect(res.send).to.include("<script>alert('Style applied successfully!'); window.location.href='/store';</script>");
  });
  resetPoints(); // Reset points to 21 for the next test

});

function resetPoints() {
  const query = `
    UPDATE users 
    SET points = 21 
    WHERE user_id = 120
  `;

  connection.query(query, (err, result) => {
    if (err) {
      console.error('Error updating points:', err);
    } else {
      console.log('Points updated successfully:', result.affectedRows);
    }
  });

}