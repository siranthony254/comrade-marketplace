// POST /api/auth/register   (multipart/form-data)
// Creates a student account in PENDING_REVIEW. The ID photo and selfie are stored privately
// and an admin approves them (see /admin/verification-queue). Until then the user can sign in
// but cannot buy, sell or list.
//
// Trust model: NOTHING about verification comes from the client. There is no "faceVerified" flag.
//
// No phone OTP here on purpose: it would make signup depend on an SMS provider being
// configured (Africa's Talking), and ID review already gates buying/selling. Phone ownership
// can instead be verified any time afterwards, self-service, at /account/phone.

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, ApiError } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { savePrivateImage } from "@/lib/storage";
import { PLATFORM } from "@/lib/constants/platform";

export const POST = handle(async (req) => {
  const form = await req.formData();
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const data = registerSchema.parse(fields);

  const idFile = form.get("idPhoto");
  const selfieFile = form.get("selfie");
  if (!(idFile instanceof File) || !(selfieFile instanceof File)) {
    throw new ApiError(400, "Please upload a photo of your student ID and a selfie holding it.");
  }

  const school = await prisma.school.findFirst({ where: { id: data.schoolId, isActive: true } });
  if (!school) throw new ApiError(400, "Please choose your school.");

  // Cheap uniqueness checks BEFORE spending the OTP or uploading files.
  const [emailTaken, phoneTaken, idTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: data.email }, select: { id: true } }),
    prisma.user.findUnique({ where: { phone: data.phone }, select: { id: true } }),
    prisma.studentProfile.findUnique({
      where: { schoolId_idNumber: { schoolId: school.id, idNumber: data.studentIdNumber } },
      select: { id: true },
    }),
  ]);
  if (emailTaken) throw new ApiError(409, "That email already has an account.");
  if (phoneTaken) throw new ApiError(409, "That phone number already has an account.");
  if (idTaken) throw new ApiError(409, "That student ID is already registered at this school.");

  const [idPhotoKey, selfieKey] = await Promise.all([
    savePrivateImage("student-id", Buffer.from(await idFile.arrayBuffer())),
    savePrivateImage("selfie", Buffer.from(await selfieFile.arrayBuffer())),
  ]);

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: "STUDENT",
        status: "PENDING_REVIEW",
        studentProfile: {
          create: {
            fullName: data.fullName,
            schoolId: school.id,
            idNumber: data.studentIdNumber,
            courseOfStudy: data.courseOfStudy,
            yearOfStudy: data.yearOfStudy,
            idPhotoKey,
            selfieKey,
          },
        },
        notifications: {
          create: {
            type: "SYSTEM",
            title: "Welcome to Comrade Market",
            body: "We're checking your student ID. This usually takes under 24 hours. You'll be able to buy and sell once it's approved.",
            link: "/seller",
          },
        },
      },
    });
  } catch (e) {
    // Lost a race with a concurrent signup for the same email/phone/ID.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ApiError(409, "An account with those details already exists.");
    }
    throw e;
  }

  return ok({ next: data.wantsToSell ? "/seller/storefront" : "/buyer/discover", reviewHours: 24, note: PLATFORM.name });
});
