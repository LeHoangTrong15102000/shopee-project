// Auto-initialize replica set on first container start.
// MongoDB runs this script inside docker-entrypoint-initdb.d/ after the
// MONGO_INITDB_ROOT_USERNAME/PASSWORD credentials are applied.
// Transactions require at least a single-node replica set (rs0).

rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }],
})
