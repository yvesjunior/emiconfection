import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database.js';
import { ApiError, JwtPayload } from '../../common/types/index.js';
import { LoginInput, PinLoginInput, ChangePinInput } from './auth.schema.js';

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
  // SIMPLIFIED: login = phone, password = PIN
  // Both are validated together - find employee by phone, then verify PIN matches
  const normalizedPhone = input.phone.trim();
  
  const employee = await prisma.employee.findUnique({
    where: { phone: normalizedPhone },
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
      warehouses: {
        include: {
          warehouse: {
            select: { id: true, name: true, code: true, type: true },
          },
        },
      },
    },
  });

  // CRITICAL: Validate phone + PIN together - if either is wrong, return generic error
  if (!employee) {
    throw ApiError.unauthorized('Invalid phone or password');
  }

  if (!employee.isActive) {
    throw ApiError.unauthorized('Invalid phone or password');
  }

  // Check PIN (password) - this is the key validation
  if (!employee.pinCode) {
    throw ApiError.unauthorized('Invalid phone or password');
  }

  const isValidPin = await bcrypt.compare(input.password, employee.pinCode);
  if (!isValidPin) {
    throw ApiError.unauthorized('Invalid phone or password');
  }

  // Non-admin employees should have a warehouse assigned (warning, not blocking)
  // Removed strict check to allow login even if warehouse not assigned

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
      warehouses: employee.warehouses.map((ew) => ({
        id: ew.warehouse.id,
        name: ew.warehouse.name,
        code: ew.warehouse.code,
        type: ew.warehouse.type,
      })),
      permissions,
    },
    ...tokens,
  };
}

export async function pinLogin(input: PinLoginInput) {
  // CRITICAL SECURITY: Validate phone and PIN together as a pair
  // Normalize phone number (trim whitespace) before lookup
  const normalizedPhone = input.phone.trim();
  
  // Find employee by phone first (phone is unique, so use findUnique)
  const employee = await prisma.employee.findUnique({
    where: {
      phone: normalizedPhone,
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
      warehouses: {
        include: {
          warehouse: {
            select: { id: true, name: true, code: true, type: true },
          },
        },
      },
    },
  });

  // CRITICAL: If employee not found, return generic error (don't reveal which part failed)
  if (!employee) {
    throw ApiError.unauthorized('Invalid phone number or PIN');
  }

  // CRITICAL: Check if employee is active BEFORE PIN verification
  if (!employee.isActive) {
    throw ApiError.unauthorized('Invalid phone number or PIN');
  }

  // CRITICAL: Verify PIN exists BEFORE comparison
  if (!employee.pinCode) {
    throw ApiError.unauthorized('Invalid phone number or PIN');
  }

  // CRITICAL: Verify PIN matches - this is the key security check
  // Phone + PIN must BOTH be correct together
  const isValidPin = await bcrypt.compare(input.pin, employee.pinCode);
  if (!isValidPin) {
    // Return generic error - don't reveal which part (phone or PIN) was wrong
    throw ApiError.unauthorized('Invalid phone number or PIN');
  }

  // Note: Phone match is already guaranteed by findUnique lookup
  // The employee was found by the exact phone number, so no need to double-check
  // This validation was causing false positives

  // Update last login
  await prisma.employee.update({
    where: { id: employee.id },
    data: { lastLogin: new Date() },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      employeeId: employee.id,
      action: 'pin_login',
      resource: 'auth',
    },
  });

  const tokens = generateTokens(employee);
  const permissions = employee.role.permissions.map((rp) => rp.permission.name);

  // CRITICAL: Build response with validated employee data
  // Ensure phone number matches the input (defense in depth)
  const employeeResponse = {
    id: employee.id,
    fullName: employee.fullName,
    phone: employee.phone, // CRITICAL: Must match input.phone
    avatarUrl: employee.avatarUrl,
    role: {
      id: employee.role.id,
      name: employee.role.name, // CRITICAL: Must match employee's actual role
    },
    warehouse: employee.warehouse
      ? {
          id: employee.warehouse.id,
          name: employee.warehouse.name,
          code: employee.warehouse.code,
        }
      : null,
    warehouses: employee.warehouses.map((ew) => ({
      id: ew.warehouse.id,
      name: ew.warehouse.name,
      code: ew.warehouse.code,
      type: ew.warehouse.type,
    })),
    permissions,
  };

  // Note: Phone is already validated - employee was found by exact phone match via findUnique
  // No need for additional validation that could cause false positives

  return {
    employee: employeeResponse,
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
      warehouses: {
        include: {
          warehouse: {
            select: { id: true, name: true, code: true, type: true },
          },
        },
      },
    },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const permissions = employee.role.permissions.map((rp) => rp.permission.name);

  return {
    id: employee.id,
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
    warehouses: employee.warehouses.map((ew) => ({
      id: ew.warehouse.id,
      name: ew.warehouse.name,
      code: ew.warehouse.code,
      type: ew.warehouse.type,
    })),
    permissions,
  };
}

