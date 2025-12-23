import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database.js';
import { ApiError, JwtPayload } from '../../common/types/index.js';
import { LoginInput, PinLoginInput, ChangePinInput, ChangePasswordInput } from './auth.schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(employee: {
  id: string;
  phone: string;
  roleId: string;
  role: { name: string };
  warehouseId: string | null;
}) {
  const payload: Omit<JwtPayload, 'type'> = {
    employeeId: employee.id,
    phone: employee.phone,
    roleId: employee.roleId,
    roleName: employee.role.name,
    warehouseId: employee.warehouseId,
  };

  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  const employee = await prisma.employee.findUnique({
    where: { phone: input.phone },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      warehouse: true,
    },
  });

  if (!employee) {
    throw ApiError.unauthorized('Invalid phone or password');
  }

  if (!employee.isActive) {
    throw ApiError.unauthorized('Account is inactive');
  }

  // Non-admin employees must have a warehouse assigned
  const isAdmin = employee.role.name === 'Admin';
  if (!isAdmin && !employee.warehouseId) {
    throw ApiError.unauthorized('No warehouse assigned. Contact your administrator.');
  }

  const isValidPassword = await bcrypt.compare(input.password, employee.password);
  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid phone or password');
  }

  // Update last login
  await prisma.employee.update({
    where: { id: employee.id },
    data: { lastLogin: new Date() },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      employeeId: employee.id,
      action: 'login',
      resource: 'auth',
    },
  });

  const tokens = generateTokens(employee);
  const permissions = employee.role.permissions.map((rp) => rp.permission.name);

  return {
    employee: {
      id: employee.id,
      email: employee.email,
      fullName: employee.fullName,
      phone: employee.phone,
      avatarUrl: employee.avatarUrl,
      role: {
        id: employee.role.id,
        name: employee.role.name,
      },
      warehouse: employee.warehouse
        ? {
            id: employee.warehouse.id,
            name: employee.warehouse.name,
            code: employee.warehouse.code,
          }
        : null,
      permissions,
    },
    ...tokens,
  };
}

export async function pinLogin(input: PinLoginInput) {
  // Find employee by PIN
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      pinCode: { not: null },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      warehouse: true,
    },
  });

  // Find matching employee by comparing hashed PINs
  let matchedEmployee = null;
  for (const employee of employees) {
    if (employee.pinCode) {
      const isValidPin = await bcrypt.compare(input.pin, employee.pinCode);
      if (isValidPin) {
        // If employeeId is provided, verify it matches
        if (input.employeeId && employee.id !== input.employeeId) {
          continue;
        }
        matchedEmployee = employee;
        break;
      }
    }
  }

  if (!matchedEmployee) {
    throw ApiError.unauthorized('Invalid PIN');
  }

  // Update last login
  await prisma.employee.update({
    where: { id: matchedEmployee.id },
    data: { lastLogin: new Date() },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      employeeId: matchedEmployee.id,
      action: 'pin_login',
      resource: 'auth',
    },
  });

  const tokens = generateTokens(matchedEmployee);
  const permissions = matchedEmployee.role.permissions.map((rp) => rp.permission.name);

  return {
    employee: {
      id: matchedEmployee.id,
      email: matchedEmployee.email,
      fullName: matchedEmployee.fullName,
      phone: matchedEmployee.phone,
      avatarUrl: matchedEmployee.avatarUrl,
      role: {
        id: matchedEmployee.role.id,
        name: matchedEmployee.role.name,
      },
      warehouse: matchedEmployee.warehouse
        ? {
            id: matchedEmployee.warehouse.id,
            name: matchedEmployee.warehouse.name,
            code: matchedEmployee.warehouse.code,
          }
        : null,
      permissions,
    },
    ...tokens,
  };
}

export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;

    if (decoded.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid token type');
    }

    const employee = await prisma.employee.findUnique({
      where: { id: decoded.employeeId },
      include: {
        role: true,
      },
    });

    if (!employee || !employee.isActive) {
      throw ApiError.unauthorized('Employee not found or inactive');
    }

    const tokens = generateTokens(employee);
    return tokens;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Refresh token expired');
    }
    throw error;
  }
}

export async function changePin(employeeId: string, input: ChangePinInput) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // If employee has existing PIN, verify current PIN
  if (employee.pinCode && input.currentPin) {
    const isValidPin = await bcrypt.compare(input.currentPin, employee.pinCode);
    if (!isValidPin) {
      throw ApiError.unauthorized('Current PIN is incorrect');
    }
  }

  const hashedPin = await bcrypt.hash(input.newPin, 10);

  await prisma.employee.update({
    where: { id: employeeId },
    data: { pinCode: hashedPin },
  });

  return { message: 'PIN updated successfully' };
}

export async function changePassword(employeeId: string, input: ChangePasswordInput) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const isValidPassword = await bcrypt.compare(input.currentPassword, employee.password);
  if (!isValidPassword) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, 10);

  await prisma.employee.update({
    where: { id: employeeId },
    data: { password: hashedPassword },
  });

  return { message: 'Password updated successfully' };
}

export async function getMe(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      warehouse: true,
    },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const permissions = employee.role.permissions.map((rp) => rp.permission.name);

  return {
    id: employee.id,
    email: employee.email,
    fullName: employee.fullName,
    phone: employee.phone,
    avatarUrl: employee.avatarUrl,
    role: {
      id: employee.role.id,
      name: employee.role.name,
    },
    warehouse: employee.warehouse
      ? {
          id: employee.warehouse.id,
          name: employee.warehouse.name,
          code: employee.warehouse.code,
        }
      : null,
    permissions,
  };
}

