const generalCorsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://aqua-track-frontend-rouge.vercel.app",
  ],
  credentials: true,
};

const publicCorsOptions = {
  origin: "*",
  credentials: false,
};

export { generalCorsOptions, publicCorsOptions };
