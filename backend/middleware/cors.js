// CORS Middleware for Mobile App
const corsMiddleware = (req, res, next) => {
  // Allow all origins
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow specific methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept, Cache-Control');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

export default corsMiddleware;
