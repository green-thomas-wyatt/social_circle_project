const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');

describe('Leaderboard Route', () => {
  it('should redirect unauthenticated access', async () => {
    const res = await request(app).get('/leaderboard');
    expect(res.status).to.equal(302);
  });
});
