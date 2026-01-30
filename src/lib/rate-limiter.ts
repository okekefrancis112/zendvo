type RateLimitStore = {
  [key: string]: {
    count: number;
    startTime: number;
  };
};

const store: RateLimitStore = {};

export const isRateLimited = (
  ip: string,
  limit: number = 5,
  windowMs: number = 3600000, // 1 hour
): boolean => {
  const now = Date.now();
  const userData = store[ip];

  if (!userData) {
    store[ip] = { count: 1, startTime: now };
    return false;
  }

  if (now - userData.startTime > windowMs) {
    store[ip] = { count: 1, startTime: now };
    return false;
  }

  userData.count += 1;
  return userData.count > limit;
};
