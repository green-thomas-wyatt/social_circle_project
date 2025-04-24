const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');

describe('Store Route', () => {
  it('should reject unauthenticated store access', async () => {
    const res = await request(app).get('/store');
    expect(res.status).to.equal(302); // redirect to login
  });
});
