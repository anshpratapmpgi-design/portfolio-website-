const { PrismaClient } = require("@prisma/client");

// Reuse a single PrismaClient instance across the app (and across hot reloads
// in dev) instead of opening a new DB connection pool per request.
const prisma = global.__workoraPrisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__workoraPrisma = prisma;

module.exports = prisma;
