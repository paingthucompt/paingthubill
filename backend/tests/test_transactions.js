(async () => {
  const base = 'http://localhost:5000';
  const adminCreds = { email: 'admin@example.com', password: 'admin123' };

  function ok(cond, msg) {
    if (!cond) {
      console.error('TEST FAILED:', msg);
      process.exit(2);
    }
  }

  // helper for fetch
  async function post(url, body, token) {
    const res = await fetch(base + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { json = text; }
    return { status: res.status, body: json };
  }

  async function put(url, body, token) {
    const res = await fetch(base + url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { json = text; }
    return { status: res.status, body: json };
  }

  async function login(creds) {
    const r = await post('/api/auth/login', creds);
    ok(r.status === 200, 'Login failed for ' + creds.email + ' status=' + r.status + ' body=' + JSON.stringify(r.body));
    return r.body;
  }

  console.log('Logging in as admin...');
  const admin = await login(adminCreds);
  const adminToken = admin.token;

  console.log('Creating test user via admin...');
  const newUserEmail = `testtxn+${Date.now()}@example.com`;
  const createRes = await post('/api/admin/users', { email: newUserEmail, password: 'test123', role: 'user', subscription_days: 30 }, adminToken);
  ok(createRes.status === 201, 'Create user failed: ' + JSON.stringify(createRes));
  const testUser = createRes.body;

  console.log('Logging in as test user...');
  const userLogin = await login({ email: newUserEmail, password: 'test123' });
  const userToken = userLogin.token;

  console.log('Creating client for test user...');
  const clientRes = await post('/api/clients', { name: 'Test Client', commission_percentage: 10, preferred_payout_currency: 'THB' }, userToken);
  ok(clientRes.status === 201, 'Create client failed: ' + JSON.stringify(clientRes));
  const client = clientRes.body;

  console.log('1) Try creating transaction without client_id -> expect 400');
  const t1 = await post('/api/transactions', { incoming_amount_thb: 1000, payout_amount: 1000, payout_currency: 'THB', transaction_date: new Date().toISOString() }, userToken);
  ok(t1.status === 400, 'Missing client_id should return 400, got ' + t1.status + ' body=' + JSON.stringify(t1.body));

  console.log('2) Try creating transaction with negative payout_amount -> expect 400');
  const t2 = await post('/api/transactions', { client_id: client.id, incoming_amount_thb: 1000, payout_amount: -50, payout_currency: 'THB', transaction_date: new Date().toISOString() }, userToken);
  ok(t2.status === 400, 'Negative payout_amount should return 400, got ' + t2.status + ' body=' + JSON.stringify(t2.body));

  console.log('3) Create valid transaction -> expect 201');
  const t3 = await post('/api/transactions', { client_id: client.id, incoming_amount_thb: 1500, payout_amount: 1400, payout_currency: 'THB', transaction_date: new Date().toISOString(), source_platform: 'test' }, userToken);
  ok(t3.status === 201, 'Valid transaction should return 201, got ' + t3.status + ' body=' + JSON.stringify(t3.body));

  console.log('All transaction edge-case checks passed.');
  process.exit(0);
})();
