const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../app'); // Make sure this exports your Express app

describe('Authentication Routes', () => {
    it('should sign up a new user with a unique username', async () => {
      const randomUsername = 'test_user_' + Math.floor(Math.random() * 100000);
      const res = await request(app)
        .post('/signup')
        .send({ username: randomUsername, password: 'pass123' });
  
      expect(res.status).to.satisfy(s => [200, 302].includes(s));
    });

  it('should reject empty signup', async () => {
    const res = await request(app).post('/signup').send({});
    expect(res.status).to.equal(400);
    expect(res.body.message).to.include('required');
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'test_user1', password: 'wrongpass' });

    expect(res.status).to.equal(401);
  });
});
