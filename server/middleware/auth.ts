import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

declare module 'express-session' {
  interface SessionData {
    employeeId?: string;
    role?: string;
  }
}

export async function authenticateEmployee(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.employeeId) {
    return res.status(401).json({ message: 'Non autenticato' });
  }

  const employee = await storage.getEmployee(req.session.employeeId);
  if (!employee) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Sessione non valida' });
  }

  req.user = employee;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Accesso negato - privilegi amministratore richiesti' });
  }
  next();
}

export async function loginEmployee(username: string, password: string) {
  const employee = await storage.getEmployeeByUsername(username);
  if (!employee) {
    return null;
  }

  const isValid = await bcrypt.compare(password, employee.password);
  if (!isValid) {
    return null;
  }

  return employee;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}
