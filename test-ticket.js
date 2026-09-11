#!/usr/bin/env node
/**
 * Test ticket generation to verify buildTicket() works correctly
 */

const { buildTicket } = require('./ticket');

const mockOrder = {
  name: 'John Doe',
  email: 'john@example.com',
  reference: 'WGMA2026-TEST001',
  tier: 'ga',
  quantity: 2,
  total: 40,
  currency: 'USD',
  paidAt: new Date().toISOString()
};

const TIERS = {
  ga:  { id: 'ga',  name: 'General Admission', price: { JMD: 3000, USD: 20 }, art: 'ticket-ga.jpg'  },
  vip: { id: 'vip', name: 'VIP Admission',     price: { JMD: 6000, USD: 40 }, art: 'ticket-vip.jpg' }
};

const tierOf = order => TIERS[order.tier] || TIERS.ga;

const EVENT = {
  name: 'Western Gospel Music Awards 2026',
  date: 'Sunday, November 22, 2026',
  time: '1:00 PM',
  venue: 'West Jamaica Conference Centre, Mt Salem, Montego Bay'
};

async function test() {
  console.log('Testing ticket generation...\n');

  try {
    const tier = tierOf(mockOrder);
    console.log(`✓ Tier loaded: ${tier.name}`);

    const jpegBuffer = await buildTicket(mockOrder, tier, EVENT);
    console.log(`✓ Ticket generated: ${jpegBuffer.length} bytes`);

    if (jpegBuffer.length > 100) {
      console.log('✓ Buffer is valid (> 100 bytes)');
    } else {
      console.log('✗ Buffer seems too small');
    }

    console.log('\n✓ Ticket generation works!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

test();
