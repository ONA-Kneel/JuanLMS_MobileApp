import e from 'express';
import database from '../connect.cjs';
import { ObjectId } from 'mongodb';
import { ticketSchema, messageSchema } from '../models/Ticket.js';

const ticketsRouter = e.Router();

function generateTicketNumber() {
  let num = '';
  for (let i = 0; i < 12; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return `SJDD${num}`;
}

// Create a new ticket
// POST /api/tickets
// Body: { userId, subject, description }
ticketsRouter.post('/', async (req, res) => {
  const db = database.getDb();
  const { userId, subject, description } = req.body;
  const now = new Date();
  const ticket = {
    userId,
    subject,
    description,
    number: generateTicketNumber(),
    status: 'new',
    createdAt: now,
    updatedAt: now,
    messages: [{
      sender: 'user',
      senderId: userId,
      message: description,
      timestamp: now
    }]
  };
  const result = await db.collection('Tickets').insertOne(ticket);
  // Real-time: emit to admins
  req.app.get('io')?.emit('new_ticket', { ...ticket, _id: result.insertedId });
  res.status(201).json({ ...ticket, _id: result.insertedId });
});

// Get all tickets for a user
// GET /api/tickets/user/:userId
ticketsRouter.get('/user/:userId', async (req, res) => {
  const db = database.getDb();
  const tickets = await db.collection('Tickets').find({ userId: req.params.userId }).toArray();
  res.json(tickets);
});

// Reply to a ticket (user or admin)
// POST /api/tickets/:ticketId/reply
// Body: { sender, senderId, message }
ticketsRouter.post('/:ticketId/reply', async (req, res) => {
  const db = database.getDb();
  const { sender, senderId, message } = req.body;
  const now = new Date();
  const update = {
    $push: { messages: { sender, senderId, message, timestamp: now } },
    $set: { updatedAt: now }
  };
  const result = await db.collection('Tickets').findOneAndUpdate(
    { _id: new ObjectId(req.params.ticketId) },
    update,
    { returnDocument: 'after' }
  );
  req.app.get('io')?.emit('ticket_reply', result.value);
  res.json(result.value);
});

// Get all tickets (admin, with optional status filter)
// GET /api/tickets?status=new|opened|closed
ticketsRouter.get('/', async (req, res) => {
  const db = database.getDb();
  const { status } = req.query;
  const VALID_STATUSES = ['new', 'opened', 'closed'];
  let query = {};
  if (status && VALID_STATUSES.includes(status)) {
    query.status = status;
  }
  const tickets = await db.collection('Tickets').find(query).toArray();
  res.json(tickets);
});

// Mark ticket as opened (admin)
// POST /api/tickets/:ticketId/open
ticketsRouter.post('/:ticketId/open', async (req, res) => {
  const db = database.getDb();
  const now = new Date();
  const result = await db.collection('Tickets').findOneAndUpdate(
    { _id: new ObjectId(req.params.ticketId) },
    { $set: { status: 'opened', updatedAt: now } },
    { returnDocument: 'after' }
  );
  req.app.get('io')?.emit('ticket_status', result.value);
  res.json(result.value);
});

// Mark ticket as closed (admin)
// POST /api/tickets/:ticketId/close
ticketsRouter.post('/:ticketId/close', async (req, res) => {
  const db = database.getDb();
  const now = new Date();
  const result = await db.collection('Tickets').findOneAndUpdate(
    { _id: new ObjectId(req.params.ticketId) },
    { $set: { status: 'closed', updatedAt: now } },
    { returnDocument: 'after' }
  );
  req.app.get('io')?.emit('ticket_status', result.value);
  res.json(result.value);
});

// GET /api/tickets/number/:number
// Fetch a ticket by its number
// Returns 404 if not found
ticketsRouter.get('/number/:number', async (req, res) => {
  const db = database.getDb();
  const ticket = await db.collection('Tickets').findOne({ number: req.params.number });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// Migration endpoint to add ticket numbers to existing tickets without one
// GET /api/tickets/migrate/add-numbers
// Only run once for migration

ticketsRouter.get('/migrate/add-numbers', async (req, res) => {
  const db = database.getDb();
  const tickets = await db.collection('Tickets').find({ number: { $exists: false } }).toArray();
  let updated = 0;
  for (const ticket of tickets) {
    const number = generateTicketNumber();
    await db.collection('Tickets').updateOne({ _id: ticket._id }, { $set: { number } });
    updated++;
  }
  res.json({ updated });
});

export default ticketsRouter; 