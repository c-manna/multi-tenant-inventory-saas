import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/User";
import { Tenant } from "../models/Tenant";
import { ApiError } from "../utils/apiError";
import { verifyPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";

const loginSchema = z.object({
  slug: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(4)
});

export const login = asyncHandler(async (req, res) => {
  const { slug, email, password } = loginSchema.parse(req.body);

  const tenant = await Tenant.findOne({ slug });
  if (!tenant) throw new ApiError(401, "Invalid tenant");

  const user = await User.findOne({ tenantId: tenant._id, email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = signJwt({ sub: user._id.toString(), tenantId: tenant._id.toString(), role: user.role });

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug }
  });
});
