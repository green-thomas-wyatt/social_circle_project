const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');

describe('Game Route', () => {
  it('should reject access without authentication', async () => {
    const res = await request(app).get('/game');
    expect(res.status).to.equal(302); // redirects to login
  });

});
