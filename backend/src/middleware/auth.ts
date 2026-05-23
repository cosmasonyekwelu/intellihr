import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  file?: any;
  user?: {
    id: string;
    userId: string;
    name: string;
    email: string;
    companyId: string;
    role: 'hr' | 'employee';
    employeeId?: string;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'intellihr_default_jwt_secret_key_12345';

  jwt.verify(token, secret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }

    if (!decoded.companyId || !decoded.role || !['hr', 'employee'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Forbidden: Invalid tenant session' });
    }

    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      name: decoded.name,
      email: decoded.email,
      companyId: decoded.companyId,
      role: decoded.role,
      employeeId: decoded.employeeId
    };
    next();
  });
};

export const requireRoles = (roles: Array<'hr' | 'employee'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
