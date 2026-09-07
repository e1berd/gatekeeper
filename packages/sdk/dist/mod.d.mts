import { RouterContractClient } from "@orpc/contract";
import * as z from "zod";
//#region ../contract/src/schemas.d.ts
declare const AuthResult: z.ZodDiscriminatedUnion<[z.ZodObject<{
  status: z.ZodLiteral<"authenticated">;
  tokens: z.ZodObject<{
    accessToken: z.ZodString;
    tokenType: z.ZodLiteral<"Bearer">;
    expiresIn: z.ZodNumber;
    refreshToken: z.ZodString;
    session: z.ZodObject<{
      id: z.ZodUUID;
      userId: z.ZodUUID;
      aal: z.ZodEnum<{
        aal1: "aal1";
        aal2: "aal2";
        aal3: "aal3";
      }>;
      amr: z.ZodArray<z.ZodString>;
      ip: z.ZodNullable<z.ZodString>;
      userAgent: z.ZodNullable<z.ZodString>;
      createdAt: z.ZodDate;
      refreshedAt: z.ZodDate;
      notAfter: z.ZodNullable<z.ZodDate>;
    }, z.core.$strip>;
    user: z.ZodObject<{
      id: z.ZodUUID;
      realmId: z.ZodUUID;
      email: z.ZodNullable<z.ZodEmail>;
      emailVerified: z.ZodBoolean;
      phone: z.ZodNullable<z.ZodString>;
      phoneVerified: z.ZodBoolean;
      avatarUrl: z.ZodNullable<z.ZodURL>;
      status: z.ZodEnum<{
        disabled: "disabled";
        active: "active";
        pending: "pending";
        locked: "locked";
      }>;
      userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
      serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
      hasPassword: z.ZodBoolean;
      mfaEnabled: z.ZodBoolean;
      lastSignInAt: z.ZodNullable<z.ZodDate>;
      createdAt: z.ZodDate;
      updatedAt: z.ZodDate;
    }, z.core.$strip>;
  }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
  status: z.ZodLiteral<"mfa_required">;
  challengeToken: z.ZodString;
  factors: z.ZodArray<z.ZodObject<{
    id: z.ZodUUID;
    type: z.ZodEnum<{
      totp: "totp";
      webauthn: "webauthn";
      recovery_code: "recovery_code";
    }>;
    name: z.ZodNullable<z.ZodString>;
  }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
  status: z.ZodLiteral<"verification_required">;
  reason: z.ZodEnum<{
    email: "email";
    phone: "phone";
  }>;
}, z.core.$strip>], "status">;
type AuthResult = z.infer<typeof AuthResult>;
//#endregion
//#region ../contract/src/mod.d.ts
declare const contract: {
  health: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
    status: z.ZodEnum<{
      ok: "ok";
      degraded: "degraded";
    }>;
    version: z.ZodString;
    checks: z.ZodRecord<z.ZodString, z.ZodBoolean>;
  }, z.core.$strip>, object>;
  humanVerification: {
    config: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      protectedActions: z.ZodArray<z.ZodEnum<{
        sign_up: "sign_up";
        sign_in_password: "sign_in_password";
        sign_in_otp: "sign_in_otp";
        password_reset: "password_reset";
      }>>;
      fieldName: z.ZodLiteral<"human_verification">;
      provider: z.ZodDiscriminatedUnion<[z.ZodObject<{
        provider: z.ZodLiteral<"disabled">;
      }, z.core.$strip>, z.ZodObject<{
        provider: z.ZodEnum<{
          turnstile: "turnstile";
          hcaptcha: "hcaptcha";
          recaptcha: "recaptcha";
        }>;
        siteKey: z.ZodString;
      }, z.core.$strip>, z.ZodObject<{
        provider: z.ZodLiteral<"altcha">;
        challengeUrl: z.ZodURL;
      }, z.core.$strip>], "provider">;
    }, z.core.$strip>, object>;
  };
  auth: {
    signUp: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      email: z.ZodEmail;
      password: z.ZodString;
      userWritableMetadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
      redirectTo: z.ZodOptional<z.ZodURL>;
      humanVerification: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      EMAIL_TAKEN: {
        message: string;
      };
      SIGN_UP_DISABLED: {
        readonly message: "Registration is closed on this realm";
      };
      EMAIL_DOMAIN_NOT_ALLOWED: {
        readonly message: "Email domain is not allowed on this realm";
        readonly data: z.ZodObject<{
          allowed: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
      };
      WEAK_PASSWORD: {
        readonly message: "Password does not meet the realm policy";
        readonly data: z.ZodObject<{
          minLength: z.ZodNumber;
        }, z.core.$strip>;
      };
      HUMAN_VERIFICATION_REQUIRED: {
        readonly message: "Human verification is required";
      };
      HUMAN_VERIFICATION_FAILED: {
        readonly message: "Human verification failed";
      };
      HUMAN_VERIFICATION_UNAVAILABLE: {
        readonly message: "Human verification provider is temporarily unavailable";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    signInPassword: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      email: z.ZodEmail;
      password: z.ZodString;
      humanVerification: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      HUMAN_VERIFICATION_REQUIRED: {
        readonly message: "Human verification is required";
      };
      HUMAN_VERIFICATION_FAILED: {
        readonly message: "Human verification failed";
      };
      HUMAN_VERIFICATION_UNAVAILABLE: {
        readonly message: "Human verification provider is temporarily unavailable";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    signInOtp: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      channel: z.ZodEnum<{
        email: "email";
        sms: "sms";
      }>;
      identifier: z.ZodString;
      shouldCreateUser: z.ZodDefault<z.ZodBoolean>;
      humanVerification: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
      sent: z.ZodLiteral<true>;
      expiresIn: z.ZodNumber;
    }, z.core.$strip>, {
      HUMAN_VERIFICATION_REQUIRED: {
        readonly message: "Human verification is required";
      };
      HUMAN_VERIFICATION_FAILED: {
        readonly message: "Human verification failed";
      };
      HUMAN_VERIFICATION_UNAVAILABLE: {
        readonly message: "Human verification provider is temporarily unavailable";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    verifyOtp: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      channel: z.ZodEnum<{
        email: "email";
        sms: "sms";
      }>;
      identifier: z.ZodString;
      code: z.ZodString;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    refresh: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      refreshToken: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      accessToken: z.ZodString;
      tokenType: z.ZodLiteral<"Bearer">;
      expiresIn: z.ZodNumber;
      refreshToken: z.ZodString;
      session: z.ZodObject<{
        id: z.ZodUUID;
        userId: z.ZodUUID;
        aal: z.ZodEnum<{
          aal1: "aal1";
          aal2: "aal2";
          aal3: "aal3";
        }>;
        amr: z.ZodArray<z.ZodString>;
        ip: z.ZodNullable<z.ZodString>;
        userAgent: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        refreshedAt: z.ZodDate;
        notAfter: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>;
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    signOut: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      scope: z.ZodDefault<z.ZodEnum<{
        local: "local";
        global: "global";
      }>>;
    }, z.core.$strip>, z.ZodObject<{
      revoked: z.ZodNumber;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    getSession: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
      session: z.ZodObject<{
        id: z.ZodUUID;
        userId: z.ZodUUID;
        aal: z.ZodEnum<{
          aal1: "aal1";
          aal2: "aal2";
          aal3: "aal3";
        }>;
        amr: z.ZodArray<z.ZodString>;
        ip: z.ZodNullable<z.ZodString>;
        userAgent: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        refreshedAt: z.ZodDate;
        notAfter: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    verifyEmail: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      token: z.ZodString;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    requestPasswordReset: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      email: z.ZodEmail;
      redirectTo: z.ZodOptional<z.ZodURL>;
      humanVerification: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
      sent: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      HUMAN_VERIFICATION_REQUIRED: {
        readonly message: "Human verification is required";
      };
      HUMAN_VERIFICATION_FAILED: {
        readonly message: "Human verification failed";
      };
      HUMAN_VERIFICATION_UNAVAILABLE: {
        readonly message: "Human verification provider is temporarily unavailable";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    resetPassword: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      token: z.ZodString;
      password: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      WEAK_PASSWORD: {
        readonly message: "Password does not meet the realm policy";
        readonly data: z.ZodObject<{
          minLength: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    changePassword: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      currentPassword: z.ZodNullable<z.ZodString>;
      newPassword: z.ZodString;
      revokeOtherSessions: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
      revoked: z.ZodNumber;
    }, z.core.$strip>, {
      WEAK_PASSWORD: {
        readonly message: "Password does not meet the realm policy";
        readonly data: z.ZodObject<{
          minLength: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    listSessions: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        userId: z.ZodUUID;
        aal: z.ZodEnum<{
          aal1: "aal1";
          aal2: "aal2";
          aal3: "aal3";
        }>;
        amr: z.ZodArray<z.ZodString>;
        ip: z.ZodNullable<z.ZodString>;
        userAgent: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        refreshedAt: z.ZodDate;
        notAfter: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>>;
      currentSessionId: z.ZodUUID;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    revokeSession: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      sessionId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    oauthStart: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      provider: z.ZodString;
      redirectTo: z.ZodOptional<z.ZodURL>;
      codeChallenge: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
      authorizationUrl: z.ZodURL;
      state: z.ZodString;
    }, z.core.$strip>, {
      PROVIDER_NOT_CONFIGURED: {
        readonly message: "Provider is not configured on this deployment";
        readonly data: z.ZodObject<{
          provider: z.ZodString;
        }, z.core.$strip>;
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    oauthExchange: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      code: z.ZodString;
      codeVerifier: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      EMAIL_TAKEN: {
        message: string;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    verifySignedPayload: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      provider: z.ZodString;
      payload: z.ZodString;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      EMAIL_TAKEN: {
        message: string;
      };
      PROVIDER_NOT_CONFIGURED: {
        readonly message: "Provider is not configured on this deployment";
        readonly data: z.ZodObject<{
          provider: z.ZodString;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    switchOrg: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodNullable<z.ZodUUID>;
    }, z.core.$strip>, z.ZodObject<{
      accessToken: z.ZodString;
      expiresIn: z.ZodNumber;
      activeOrgId: z.ZodNullable<z.ZodUUID>;
      roles: z.ZodArray<z.ZodString>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
  };
  profile: {
    get: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    update: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      userWritableMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    uploadAvatar: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodFile, z.ZodObject<{
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    removeAvatar: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    requestEmailChange: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      newEmail: z.ZodEmail;
      redirectTo: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>, z.ZodObject<{
      sent: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    confirmEmailChange: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      token: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    requestPhoneChange: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      newPhone: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      sent: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    confirmPhoneChange: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      code: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      user: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        email: z.ZodNullable<z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        phone: z.ZodNullable<z.ZodString>;
        phoneVerified: z.ZodBoolean;
        avatarUrl: z.ZodNullable<z.ZodURL>;
        status: z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>;
        userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        hasPassword: z.ZodBoolean;
        mfaEnabled: z.ZodBoolean;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    listIdentities: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        userId: z.ZodUUID;
        provider: z.ZodString;
        providerUserId: z.ZodString;
        email: z.ZodNullable<z.ZodEmail>;
        lastSignInAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    linkProvider: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      provider: z.ZodString;
      redirectTo: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>, z.ZodObject<{
      authorizationUrl: z.ZodURL;
      state: z.ZodString;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
    unlinkProvider: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      identityId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      EMAIL_TAKEN: {
        readonly message: "Email already registered";
      };
      PHONE_TAKEN: {
        readonly message: "Phone number already registered";
      };
      UNSUPPORTED_IMAGE_TYPE: {
        readonly message: "Avatar must be a PNG, JPEG or WebP image";
      };
      IMAGE_TOO_LARGE: {
        readonly message: "Avatar exceeds the maximum allowed size";
        readonly data: z.ZodObject<{
          maxBytes: z.ZodNumber;
        }, z.core.$strip>;
      };
      AVATAR_STORAGE_UNAVAILABLE: {
        readonly message: "Avatar storage is not configured on this deployment";
      };
      IDENTITY_NOT_FOUND: {
        readonly message: "Linked identity not found";
      };
      CANNOT_UNLINK_SOLE_CREDENTIAL: {
        readonly message: "Cannot unlink the only remaining way to sign in";
      };
    }>;
  };
  passkey: {
    registerOptions: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      name: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
      options: z.ZodRecord<z.ZodString, z.ZodUnknown>;
      challengeId: z.ZodUUID;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    registerVerify: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      challengeId: z.ZodUUID;
      response: z.ZodRecord<z.ZodString, z.ZodUnknown>;
      name: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
      passkey: z.ZodObject<{
        id: z.ZodUUID;
        name: z.ZodNullable<z.ZodString>;
        aaguid: z.ZodNullable<z.ZodString>;
        transports: z.ZodArray<z.ZodString>;
        backedUp: z.ZodBoolean;
        createdAt: z.ZodDate;
        lastUsedAt: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    authenticateOptions: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      email: z.ZodOptional<z.ZodEmail>;
    }, z.core.$strip>, z.ZodObject<{
      options: z.ZodRecord<z.ZodString, z.ZodUnknown>;
      challengeId: z.ZodUUID;
    }, z.core.$strip>, {
      readonly TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      readonly INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      readonly USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      readonly ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      readonly EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    authenticateVerify: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      challengeId: z.ZodUUID;
      response: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    list: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        name: z.ZodNullable<z.ZodString>;
        aaguid: z.ZodNullable<z.ZodString>;
        transports: z.ZodArray<z.ZodString>;
        backedUp: z.ZodBoolean;
        createdAt: z.ZodDate;
        lastUsedAt: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    rename: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      passkeyId: z.ZodUUID;
      name: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      passkey: z.ZodObject<{
        id: z.ZodUUID;
        name: z.ZodNullable<z.ZodString>;
        aaguid: z.ZodNullable<z.ZodString>;
        transports: z.ZodArray<z.ZodString>;
        backedUp: z.ZodBoolean;
        createdAt: z.ZodDate;
        lastUsedAt: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    remove: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      passkeyId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
  };
  mfa: {
    enrollTotp: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      name: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
      factorId: z.ZodUUID;
      secret: z.ZodString;
      otpauthUri: z.ZodString;
      qrCodeSvg: z.ZodString;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    verifyTotpEnrolment: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      factorId: z.ZodUUID;
      code: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      factor: z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
        verified: z.ZodBoolean;
        createdAt: z.ZodDate;
        lastUsedAt: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>;
      recoveryCodes: z.ZodArray<z.ZodString>;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    verifyChallenge: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      challengeToken: z.ZodString;
      factorId: z.ZodUUID;
      code: z.ZodString;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
      status: z.ZodLiteral<"authenticated">;
      tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"mfa_required">;
      challengeToken: z.ZodString;
      factors: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      status: z.ZodLiteral<"verification_required">;
      reason: z.ZodEnum<{
        email: "email";
        phone: "phone";
      }>;
    }, z.core.$strip>], "status">, {
      TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    stepUp: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      factorId: z.ZodUUID;
      code: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      accessToken: z.ZodString;
      expiresIn: z.ZodNumber;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    listFactors: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          totp: "totp";
          webauthn: "webauthn";
          recovery_code: "recovery_code";
        }>;
        name: z.ZodNullable<z.ZodString>;
        verified: z.ZodBoolean;
        createdAt: z.ZodDate;
        lastUsedAt: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    removeFactor: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      factorId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    regenerateRecoveryCodes: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      codes: z.ZodArray<z.ZodString>;
    }, z.core.$strip>, {
      MFA_REQUIRED: {
        readonly message: "Multi-factor authentication required";
      };
      INVALID_MFA_CODE: {
        readonly message: "Invalid verification code";
      };
      FACTOR_NOT_FOUND: {
        readonly message: "Factor not found";
      };
      FACTOR_ALREADY_VERIFIED: {
        readonly message: "Factor is already verified";
      };
      STEP_UP_REQUIRED: {
        readonly message: "Action requires a higher authenticator assurance level than this session has";
        readonly data: z.ZodObject<{
          requiredAal: z.ZodEnum<{
            aal2: "aal2";
            aal3: "aal3";
          }>;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
  };
  org: {
    listMine: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        slug: z.ZodString;
        name: z.ZodString;
        ownerId: z.ZodNullable<z.ZodUUID>;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        createdAt: z.ZodDate;
        myRole: z.ZodString;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      readonly INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      readonly TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      readonly SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    create: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      name: z.ZodString;
      slug: z.ZodOptional<z.ZodString>;
      metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
      organization: z.ZodObject<{
        id: z.ZodUUID;
        slug: z.ZodString;
        name: z.ZodString;
        ownerId: z.ZodNullable<z.ZodUUID>;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      QUOTA_EXCEEDED: {
        message: string;
        data: z.ZodObject<{
          key: z.ZodString;
          limit: z.ZodNumber;
          used: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    get: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      organization: z.ZodObject<{
        id: z.ZodUUID;
        slug: z.ZodString;
        name: z.ZodString;
        ownerId: z.ZodNullable<z.ZodUUID>;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
      myRole: z.ZodString;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    update: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
      name: z.ZodOptional<z.ZodString>;
      slug: z.ZodOptional<z.ZodString>;
      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
      organization: z.ZodObject<{
        id: z.ZodUUID;
        slug: z.ZodString;
        name: z.ZodString;
        ownerId: z.ZodNullable<z.ZodUUID>;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    remove: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    listMembers: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      limit: z.ZodDefault<z.ZodNumber>;
      cursor: z.ZodDefault<z.ZodNullable<z.ZodString>>;
      orgId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
        roleKey: z.ZodString;
        joinedAt: z.ZodDate;
        expiresAt: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>>;
      total: z.ZodNumber;
      nextCursor: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    setMemberRole: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
      userId: z.ZodUUID;
      roleKey: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
      membership: z.ZodObject<{
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
        roleKey: z.ZodString;
        joinedAt: z.ZodDate;
        expiresAt: z.ZodNullable<z.ZodDate>;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      LAST_OWNER: {
        message: string;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    removeMember: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
      userId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      LAST_OWNER: {
        message: string;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    leave: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      LAST_OWNER: {
        message: string;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    transferOwnership: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
      toUserId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      organization: z.ZodObject<{
        id: z.ZodUUID;
        slug: z.ZodString;
        name: z.ZodString;
        ownerId: z.ZodNullable<z.ZodUUID>;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    invite: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
      email: z.ZodEmail;
      roleKey: z.ZodDefault<z.ZodString>;
      redirectTo: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>, z.ZodObject<{
      invitation: z.ZodObject<{
        id: z.ZodUUID;
        email: z.ZodEmail;
        roleKey: z.ZodString;
        orgId: z.ZodUUID;
        invitedBy: z.ZodNullable<z.ZodUUID>;
        expiresAt: z.ZodDate;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      ALREADY_MEMBER: {
        message: string;
      };
      QUOTA_EXCEEDED: {
        message: string;
        data: z.ZodObject<{
          key: z.ZodString;
          limit: z.ZodNumber;
          used: z.ZodNumber;
        }, z.core.$strip>;
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    listInvitations: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        email: z.ZodEmail;
        roleKey: z.ZodString;
        orgId: z.ZodUUID;
        invitedBy: z.ZodNullable<z.ZodUUID>;
        expiresAt: z.ZodDate;
        createdAt: z.ZodDate;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    revokeInvitation: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      orgId: z.ZodUUID;
      invitationId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    acceptInvitation: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      token: z.ZodString;
      password: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
      organization: z.ZodObject<{
        id: z.ZodUUID;
        slug: z.ZodString;
        name: z.ZodString;
        ownerId: z.ZodNullable<z.ZodUUID>;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
      roleKey: z.ZodString;
      tokens: z.ZodNullable<z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
        refreshToken: z.ZodString;
        session: z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
  };
  authz: {
    check: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      subject: z.ZodUUID;
      permission: z.ZodString;
      scope: z.ZodDefault<z.ZodObject<{
        type: z.ZodEnum<{
          global: "global";
          org: "org";
          resource: "resource";
        }>;
        id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      allowed: z.ZodBoolean;
      via: z.ZodNullable<z.ZodObject<{
        roleKey: z.ZodString;
        scope: z.ZodObject<{
          type: z.ZodEnum<{
            global: "global";
            org: "org";
            resource: "resource";
          }>;
          id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        inheritedFrom: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    checkBulk: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      checks: z.ZodArray<z.ZodObject<{
        subject: z.ZodUUID;
        permission: z.ZodString;
        scope: z.ZodDefault<z.ZodObject<{
          type: z.ZodEnum<{
            global: "global";
            org: "org";
            resource: "resource";
          }>;
          id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      decisions: z.ZodArray<z.ZodObject<{
        allowed: z.ZodBoolean;
        via: z.ZodNullable<z.ZodObject<{
          roleKey: z.ZodString;
          scope: z.ZodObject<{
            type: z.ZodEnum<{
              global: "global";
              org: "org";
              resource: "resource";
            }>;
            id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
          }, z.core.$strip>;
          inheritedFrom: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    effectivePermissions: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      subject: z.ZodUUID;
      scope: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<{
          global: "global";
          org: "org";
          resource: "resource";
        }>;
        id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
      }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
      permissions: z.ZodArray<z.ZodString>;
      roles: z.ZodArray<z.ZodObject<{
        roleId: z.ZodUUID;
        roleKey: z.ZodString;
        scope: z.ZodObject<{
          type: z.ZodEnum<{
            global: "global";
            org: "org";
            resource: "resource";
          }>;
          id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        expiresAt: z.ZodNullable<z.ZodDate>;
        grantedBy: z.ZodNullable<z.ZodUUID>;
        grantedAt: z.ZodDate;
      }, z.core.$strip>>;
      version: z.ZodNumber;
    }, z.core.$strip>, {
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
    listSubjectsWithPermission: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      permission: z.ZodString;
      scope: z.ZodDefault<z.ZodObject<{
        type: z.ZodEnum<{
          global: "global";
          org: "org";
          resource: "resource";
        }>;
        id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
      }, z.core.$strip>>;
      limit: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      subjects: z.ZodArray<z.ZodUUID>;
    }, z.core.$strip>, {
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
    }>;
  };
  sso: {
    discover: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      email: z.ZodEmail;
    }, z.core.$strip>, z.ZodObject<{
      provider: z.ZodNullable<z.ZodObject<{
        id: z.ZodUUID;
        type: z.ZodEnum<{
          saml: "saml";
          oidc: "oidc";
        }>;
        name: z.ZodString;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      readonly TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      readonly INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      readonly USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      readonly ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      readonly EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    start: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      providerId: z.ZodUUID;
      redirectTo: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>, z.ZodObject<{
      redirectUrl: z.ZodURL;
    }, z.core.$strip>, {
      readonly TOO_MANY_REQUESTS: {
        readonly message: "Rate limit exceeded";
        readonly data: z.ZodObject<{
          retryAfter: z.ZodNumber;
        }, z.core.$strip>;
      };
      readonly INVALID_CREDENTIALS: {
        readonly message: "Invalid credentials";
      };
      readonly USER_NOT_FOUND: {
        readonly message: "User not found";
      };
      readonly ACCOUNT_LOCKED: {
        readonly message: "Account is locked";
        readonly data: z.ZodObject<{
          until: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>;
      };
      readonly EMAIL_NOT_VERIFIED: {
        readonly message: "Email address is not verified";
      };
    }>;
    metadata: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      providerId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      entityId: z.ZodString;
      acsUrl: z.ZodURL;
      metadataXml: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>, {
      readonly FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      readonly NOT_FOUND: {
        readonly message: "Resource not found";
      };
      readonly CONFLICT: {
        readonly message: "Resource already exists";
      };
      readonly IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    create: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodDiscriminatedUnion<[z.ZodObject<{
      type: z.ZodLiteral<"saml">;
      name: z.ZodString;
      domains: z.ZodDefault<z.ZodArray<z.ZodString>>;
      metadataXml: z.ZodOptional<z.ZodString>;
      metadataUrl: z.ZodOptional<z.ZodURL>;
      attributeMapping: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
      type: z.ZodLiteral<"oidc">;
      name: z.ZodString;
      domains: z.ZodDefault<z.ZodArray<z.ZodString>>;
      issuer: z.ZodURL;
      clientId: z.ZodString;
      clientSecret: z.ZodString;
      scopes: z.ZodDefault<z.ZodArray<z.ZodString>>;
      claimMapping: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>], "type">, z.ZodObject<{
      provider: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        type: z.ZodEnum<{
          saml: "saml";
          oidc: "oidc";
        }>;
        name: z.ZodString;
        enabled: z.ZodBoolean;
        domains: z.ZodArray<z.ZodString>;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    list: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        type: z.ZodEnum<{
          saml: "saml";
          oidc: "oidc";
        }>;
        name: z.ZodString;
        enabled: z.ZodBoolean;
        domains: z.ZodArray<z.ZodString>;
        createdAt: z.ZodDate;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    remove: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      providerId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
  };
  hooks: {
    list: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      event: z.ZodOptional<z.ZodEnum<{
        before_sign_up: "before_sign_up";
        after_sign_up: "after_sign_up";
        before_sign_in: "before_sign_in";
        after_sign_in: "after_sign_in";
        before_token_issue: "before_token_issue";
        before_org_create: "before_org_create";
        after_org_create: "after_org_create";
        after_invite_accepted: "after_invite_accepted";
        before_password_change: "before_password_change";
      }>>;
    }, z.core.$strip>, z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        event: z.ZodEnum<{
          before_sign_up: "before_sign_up";
          after_sign_up: "after_sign_up";
          before_sign_in: "before_sign_in";
          after_sign_in: "after_sign_in";
          before_token_issue: "before_token_issue";
          before_org_create: "before_org_create";
          after_org_create: "after_org_create";
          after_invite_accepted: "after_invite_accepted";
          before_password_change: "before_password_change";
        }>;
        kind: z.ZodEnum<{
          sql: "sql";
          http: "http";
        }>;
        target: z.ZodString;
        runsInsideCallerTransaction: z.ZodBoolean;
        timeoutMs: z.ZodNumber;
        priority: z.ZodNumber;
        enabled: z.ZodBoolean;
        createdAt: z.ZodDate;
      }, z.core.$strip>>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    create: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodDiscriminatedUnion<[z.ZodObject<{
      kind: z.ZodLiteral<"sql">;
      event: z.ZodEnum<{
        before_sign_up: "before_sign_up";
        after_sign_up: "after_sign_up";
        before_sign_in: "before_sign_in";
        after_sign_in: "after_sign_in";
        before_token_issue: "before_token_issue";
        before_org_create: "before_org_create";
        after_org_create: "after_org_create";
        after_invite_accepted: "after_invite_accepted";
        before_password_change: "before_password_change";
      }>;
      target: z.ZodString;
      runsInsideCallerTransaction: z.ZodDefault<z.ZodBoolean>;
      priority: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"http">;
      event: z.ZodEnum<{
        before_sign_up: "before_sign_up";
        after_sign_up: "after_sign_up";
        before_sign_in: "before_sign_in";
        after_sign_in: "after_sign_in";
        before_token_issue: "before_token_issue";
        before_org_create: "before_org_create";
        after_org_create: "after_org_create";
        after_invite_accepted: "after_invite_accepted";
        before_password_change: "before_password_change";
      }>;
      target: z.ZodURL;
      signingSecret: z.ZodString;
      timeoutMs: z.ZodDefault<z.ZodNumber>;
      priority: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>], "kind">, z.ZodObject<{
      hook: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        event: z.ZodEnum<{
          before_sign_up: "before_sign_up";
          after_sign_up: "after_sign_up";
          before_sign_in: "before_sign_in";
          after_sign_in: "after_sign_in";
          before_token_issue: "before_token_issue";
          before_org_create: "before_org_create";
          after_org_create: "after_org_create";
          after_invite_accepted: "after_invite_accepted";
          before_password_change: "before_password_change";
        }>;
        kind: z.ZodEnum<{
          sql: "sql";
          http: "http";
        }>;
        target: z.ZodString;
        runsInsideCallerTransaction: z.ZodBoolean;
        timeoutMs: z.ZodNumber;
        priority: z.ZodNumber;
        enabled: z.ZodBoolean;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    update: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      hookId: z.ZodUUID;
      enabled: z.ZodOptional<z.ZodBoolean>;
      priority: z.ZodOptional<z.ZodNumber>;
      timeoutMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      hook: z.ZodObject<{
        id: z.ZodUUID;
        realmId: z.ZodUUID;
        event: z.ZodEnum<{
          before_sign_up: "before_sign_up";
          after_sign_up: "after_sign_up";
          before_sign_in: "before_sign_in";
          after_sign_in: "after_sign_in";
          before_token_issue: "before_token_issue";
          before_org_create: "before_org_create";
          after_org_create: "after_org_create";
          after_invite_accepted: "after_invite_accepted";
          before_password_change: "before_password_change";
        }>;
        kind: z.ZodEnum<{
          sql: "sql";
          http: "http";
        }>;
        target: z.ZodString;
        runsInsideCallerTransaction: z.ZodBoolean;
        timeoutMs: z.ZodNumber;
        priority: z.ZodNumber;
        enabled: z.ZodBoolean;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    remove: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      hookId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      ok: z.ZodLiteral<true>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    listDeliveries: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      limit: z.ZodDefault<z.ZodNumber>;
      cursor: z.ZodDefault<z.ZodNullable<z.ZodString>>;
      hookId: z.ZodOptional<z.ZodUUID>;
      status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        delivered: "delivered";
        exhausted: "exhausted";
      }>>;
    }, z.core.$strip>, z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{
        id: z.ZodUUID;
        hookId: z.ZodUUID;
        event: z.ZodEnum<{
          before_sign_up: "before_sign_up";
          after_sign_up: "after_sign_up";
          before_sign_in: "before_sign_in";
          after_sign_in: "after_sign_in";
          before_token_issue: "before_token_issue";
          before_org_create: "before_org_create";
          after_org_create: "after_org_create";
          after_invite_accepted: "after_invite_accepted";
          before_password_change: "before_password_change";
        }>;
        status: z.ZodEnum<{
          pending: "pending";
          delivered: "delivered";
          exhausted: "exhausted";
        }>;
        attempts: z.ZodNumber;
        lastError: z.ZodNullable<z.ZodString>;
        nextAttemptAt: z.ZodDate;
        deliveredAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
      }, z.core.$strip>>;
      total: z.ZodNumber;
      nextCursor: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
    retryDelivery: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
      deliveryId: z.ZodUUID;
    }, z.core.$strip>, z.ZodObject<{
      delivery: z.ZodObject<{
        id: z.ZodUUID;
        hookId: z.ZodUUID;
        event: z.ZodEnum<{
          before_sign_up: "before_sign_up";
          after_sign_up: "after_sign_up";
          before_sign_in: "before_sign_in";
          after_sign_in: "after_sign_in";
          before_token_issue: "before_token_issue";
          before_org_create: "before_org_create";
          after_org_create: "after_org_create";
          after_invite_accepted: "after_invite_accepted";
          before_password_change: "before_password_change";
        }>;
        status: z.ZodEnum<{
          pending: "pending";
          delivered: "delivered";
          exhausted: "exhausted";
        }>;
        attempts: z.ZodNumber;
        lastError: z.ZodNullable<z.ZodString>;
        nextAttemptAt: z.ZodDate;
        deliveredAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
      }, z.core.$strip>;
    }, z.core.$strip>, {
      INVALID_TOKEN: {
        readonly message: "Token is invalid or expired";
      };
      TOKEN_REUSE_DETECTED: {
        readonly message: "Refresh token was replayed; every session in the family is revoked";
      };
      SESSION_REVOKED: {
        readonly message: "Session has been revoked";
      };
      FORBIDDEN: {
        readonly message: "Insufficient permissions";
      };
      NOT_FOUND: {
        readonly message: "Resource not found";
      };
      CONFLICT: {
        readonly message: "Resource already exists";
      };
      IMMUTABLE: {
        readonly message: "Resource cannot be modified";
      };
    }>;
  };
  admin: {
    users: {
      list: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        limit: z.ZodDefault<z.ZodNumber>;
        cursor: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        query: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>>;
        roleKey: z.ZodOptional<z.ZodString>;
      }, z.core.$strip>, z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>>;
        total: z.ZodNumber;
        nextCursor: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      get: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
      }, z.core.$strip>, z.ZodObject<{
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
        roles: z.ZodArray<z.ZodObject<{
          roleId: z.ZodUUID;
          roleKey: z.ZodString;
          scope: z.ZodObject<{
            type: z.ZodEnum<{
              global: "global";
              org: "org";
              resource: "resource";
            }>;
            id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
          }, z.core.$strip>;
          expiresAt: z.ZodNullable<z.ZodDate>;
          grantedBy: z.ZodNullable<z.ZodUUID>;
          grantedAt: z.ZodDate;
        }, z.core.$strip>>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      create: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        email: z.ZodOptional<z.ZodEmail>;
        phone: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        emailVerified: z.ZodDefault<z.ZodBoolean>;
        userWritableMetadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        serverOnlyMetadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        sendInvite: z.ZodDefault<z.ZodBoolean>;
      }, z.core.$strip>, z.ZodObject<{
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      update: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
        email: z.ZodOptional<z.ZodEmail>;
        phone: z.ZodOptional<z.ZodString>;
        emailVerified: z.ZodOptional<z.ZodBoolean>;
        status: z.ZodOptional<z.ZodEnum<{
          disabled: "disabled";
          active: "active";
          pending: "pending";
          locked: "locked";
        }>>;
        userWritableMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        serverOnlyMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
      }, z.core.$strip>, z.ZodObject<{
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      remove: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
        hard: z.ZodDefault<z.ZodBoolean>;
      }, z.core.$strip>, z.ZodObject<{
        ok: z.ZodLiteral<true>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      ban: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
        until: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
        reason: z.ZodOptional<z.ZodString>;
      }, z.core.$strip>, z.ZodObject<{
        user: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          email: z.ZodNullable<z.ZodEmail>;
          emailVerified: z.ZodBoolean;
          phone: z.ZodNullable<z.ZodString>;
          phoneVerified: z.ZodBoolean;
          avatarUrl: z.ZodNullable<z.ZodURL>;
          status: z.ZodEnum<{
            disabled: "disabled";
            active: "active";
            pending: "pending";
            locked: "locked";
          }>;
          userWritableMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          serverOnlyMetadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          hasPassword: z.ZodBoolean;
          mfaEnabled: z.ZodBoolean;
          lastSignInAt: z.ZodNullable<z.ZodDate>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      setPassword: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
        password: z.ZodString;
        revokeSessions: z.ZodDefault<z.ZodBoolean>;
      }, z.core.$strip>, z.ZodObject<{
        ok: z.ZodLiteral<true>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      listSessions: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
      }, z.core.$strip>, z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
          id: z.ZodUUID;
          userId: z.ZodUUID;
          aal: z.ZodEnum<{
            aal1: "aal1";
            aal2: "aal2";
            aal3: "aal3";
          }>;
          amr: z.ZodArray<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          createdAt: z.ZodDate;
          refreshedAt: z.ZodDate;
          notAfter: z.ZodNullable<z.ZodDate>;
        }, z.core.$strip>>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      revokeSessions: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
      }, z.core.$strip>, z.ZodObject<{
        revoked: z.ZodNumber;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      impersonate: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
        ttl: z.ZodDefault<z.ZodNumber>;
      }, z.core.$strip>, z.ZodObject<{
        accessToken: z.ZodString;
        expiresIn: z.ZodNumber;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
    };
    roles: {
      list: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        limit: z.ZodDefault<z.ZodNumber>;
        cursor: z.ZodDefault<z.ZodNullable<z.ZodString>>;
      }, z.core.$strip>, z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          key: z.ZodString;
          name: z.ZodString;
          description: z.ZodNullable<z.ZodString>;
          isSystem: z.ZodBoolean;
          createdAt: z.ZodDate;
        }, z.core.$strip>>;
        total: z.ZodNumber;
        nextCursor: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      get: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        roleKey: z.ZodString;
      }, z.core.$strip>, z.ZodObject<{
        role: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          key: z.ZodString;
          name: z.ZodString;
          description: z.ZodNullable<z.ZodString>;
          isSystem: z.ZodBoolean;
          createdAt: z.ZodDate;
        }, z.core.$strip>;
        permissions: z.ZodArray<z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          resource: z.ZodString;
          action: z.ZodString;
          description: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        inherits: z.ZodArray<z.ZodString>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      create: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        key: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        permissions: z.ZodDefault<z.ZodArray<z.ZodString>>;
        inherits: z.ZodDefault<z.ZodArray<z.ZodString>>;
      }, z.core.$strip>, z.ZodObject<{
        role: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          key: z.ZodString;
          name: z.ZodString;
          description: z.ZodNullable<z.ZodString>;
          isSystem: z.ZodBoolean;
          createdAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      update: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        roleKey: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        permissions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        inherits: z.ZodOptional<z.ZodArray<z.ZodString>>;
      }, z.core.$strip>, z.ZodObject<{
        role: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          key: z.ZodString;
          name: z.ZodString;
          description: z.ZodNullable<z.ZodString>;
          isSystem: z.ZodBoolean;
          createdAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      remove: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        roleKey: z.ZodString;
      }, z.core.$strip>, z.ZodObject<{
        ok: z.ZodLiteral<true>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
    };
    permissions: {
      list: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        limit: z.ZodDefault<z.ZodNumber>;
        cursor: z.ZodDefault<z.ZodNullable<z.ZodString>>;
      }, z.core.$strip>, z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          resource: z.ZodString;
          action: z.ZodString;
          description: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        total: z.ZodNumber;
        nextCursor: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      create: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        resource: z.ZodString;
        action: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
      }, z.core.$strip>, z.ZodObject<{
        permission: z.ZodObject<{
          id: z.ZodUUID;
          realmId: z.ZodUUID;
          resource: z.ZodString;
          action: z.ZodString;
          description: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      remove: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        permissionId: z.ZodUUID;
      }, z.core.$strip>, z.ZodObject<{
        ok: z.ZodLiteral<true>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
    };
    grants: {
      grant: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
        roleKey: z.ZodString;
        scope: z.ZodDefault<z.ZodObject<{
          type: z.ZodEnum<{
            global: "global";
            org: "org";
            resource: "resource";
          }>;
          id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>;
        expiresAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
      }, z.core.$strip>, z.ZodObject<{
        assignment: z.ZodObject<{
          roleId: z.ZodUUID;
          roleKey: z.ZodString;
          scope: z.ZodObject<{
            type: z.ZodEnum<{
              global: "global";
              org: "org";
              resource: "resource";
            }>;
            id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
          }, z.core.$strip>;
          expiresAt: z.ZodNullable<z.ZodDate>;
          grantedBy: z.ZodNullable<z.ZodUUID>;
          grantedAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      revoke: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
        roleKey: z.ZodString;
        scope: z.ZodDefault<z.ZodObject<{
          type: z.ZodEnum<{
            global: "global";
            org: "org";
            resource: "resource";
          }>;
          id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>;
      }, z.core.$strip>, z.ZodObject<{
        ok: z.ZodLiteral<true>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      listForUser: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        userId: z.ZodUUID;
      }, z.core.$strip>, z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
          roleId: z.ZodUUID;
          roleKey: z.ZodString;
          scope: z.ZodObject<{
            type: z.ZodEnum<{
              global: "global";
              org: "org";
              resource: "resource";
            }>;
            id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
          }, z.core.$strip>;
          expiresAt: z.ZodNullable<z.ZodDate>;
          grantedBy: z.ZodNullable<z.ZodUUID>;
          grantedAt: z.ZodDate;
        }, z.core.$strip>>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
    };
    realms: {
      list: import("@orpc/contract").ProcedureContractBuilderWithOutput<z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
          id: z.ZodUUID;
          slug: z.ZodString;
          name: z.ZodString;
          createdAt: z.ZodDate;
        }, z.core.$strip>>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      create: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        slug: z.ZodString;
        name: z.ZodString;
      }, z.core.$strip>, z.ZodObject<{
        realm: z.ZodObject<{
          id: z.ZodUUID;
          slug: z.ZodString;
          name: z.ZodString;
          createdAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
      update: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        realmId: z.ZodUUID;
        name: z.ZodOptional<z.ZodString>;
        settings: z.ZodOptional<z.ZodObject<{
          password: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
            minLength: z.ZodDefault<z.ZodNumber>;
            requireBreachCheck: z.ZodDefault<z.ZodBoolean>;
            argon2MemoryKib: z.ZodDefault<z.ZodNumber>;
            argon2TimeCost: z.ZodDefault<z.ZodNumber>;
            argon2Parallelism: z.ZodDefault<z.ZodNumber>;
          }, z.core.$strip>>>;
          tokens: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
            audience: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            accessTokenTtl: z.ZodDefault<z.ZodNumber>;
            refreshTokenTtl: z.ZodDefault<z.ZodNumber>;
            sessionIdleTimeout: z.ZodDefault<z.ZodNumber>;
            sessionAbsoluteTimeout: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
          }, z.core.$strip>>>;
          rateLimit: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
            perIpPerMinute: z.ZodDefault<z.ZodNumber>;
            perIdentifierPerMinute: z.ZodDefault<z.ZodNumber>;
          }, z.core.$strip>>>;
          lockout: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
            maxFailedAttempts: z.ZodDefault<z.ZodNumber>;
            baseBackoffSeconds: z.ZodDefault<z.ZodNumber>;
            maxBackoffSeconds: z.ZodDefault<z.ZodNumber>;
          }, z.core.$strip>>>;
          signUp: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            requireEmailVerification: z.ZodDefault<z.ZodBoolean>;
            allowedEmailDomains: z.ZodDefault<z.ZodArray<z.ZodString>>;
          }, z.core.$strip>>>;
          mfa: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
            requirement: z.ZodDefault<z.ZodEnum<{
              optional: "optional";
              off: "off";
              required: "required";
            }>>;
            allowedFactors: z.ZodDefault<z.ZodArray<z.ZodEnum<{
              totp: "totp";
              webauthn: "webauthn";
              recovery_code: "recovery_code";
            }>>>;
            requireForAdmins: z.ZodDefault<z.ZodBoolean>;
          }, z.core.$strip>>>;
        }, z.core.$strip>>;
      }, z.core.$strip>, z.ZodObject<{
        realm: z.ZodObject<{
          id: z.ZodUUID;
          slug: z.ZodString;
          name: z.ZodString;
          createdAt: z.ZodDate;
        }, z.core.$strip>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
    };
    audit: {
      list: import("@orpc/contract").ProcedureContractBuilderWithInputOutput<z.ZodObject<{
        limit: z.ZodDefault<z.ZodNumber>;
        cursor: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        actorId: z.ZodOptional<z.ZodUUID>;
        action: z.ZodOptional<z.ZodString>;
        from: z.ZodOptional<z.ZodDate>;
        to: z.ZodOptional<z.ZodDate>;
      }, z.core.$strip>, z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
          id: z.ZodUUID;
          actorId: z.ZodNullable<z.ZodUUID>;
          action: z.ZodString;
          target: z.ZodNullable<z.ZodString>;
          ip: z.ZodNullable<z.ZodString>;
          userAgent: z.ZodNullable<z.ZodString>;
          payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          createdAt: z.ZodDate;
        }, z.core.$strip>>;
        total: z.ZodNumber;
        nextCursor: z.ZodNullable<z.ZodString>;
      }, z.core.$strip>, {
        INVALID_TOKEN: {
          readonly message: "Token is invalid or expired";
        };
        TOKEN_REUSE_DETECTED: {
          readonly message: "Refresh token was replayed; every session in the family is revoked";
        };
        SESSION_REVOKED: {
          readonly message: "Session has been revoked";
        };
        FORBIDDEN: {
          readonly message: "Insufficient permissions";
        };
        NOT_FOUND: {
          readonly message: "Resource not found";
        };
        CONFLICT: {
          readonly message: "Resource already exists";
        };
        IMMUTABLE: {
          readonly message: "Resource cannot be modified";
        };
      }>;
    };
  };
};
//#endregion
//#region src/storage.d.ts
/**
 * Where the SDK keeps tokens between calls.
 *
 * Implement this to control persistence — a cookie jar during SSR, secure
 * storage on mobile, or an encrypted store. Every method may be synchronous or
 * return a promise.
 */
interface TokenStorage {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}
/**
 * Browser storage backed by the asynchronous Cookie Store API.
 *
 * Cookies are scoped to the current origin, use `SameSite=Strict`, and are
 * available to JavaScript. Use the `/form/*` flow when tokens must be HttpOnly.
 *
 * @param prefix Namespace for the cookie names, so several clients can coexist.
 * @param store Cookie Store for the current window or service worker.
 */
export declare function cookieStoreAdapter(prefix?: string, store?: CookieStore): TokenStorage;
/**
 * Browser storage that survives a page reload, scoped to one origin.
 *
 * Used as a fallback when the Cookie Store API is unavailable. Tokens are
 * readable by any script on the origin, so prefer the cookie-based `/form/*`
 * flow when that matters.
 *
 * @param prefix Namespace for the keys, so several clients can coexist.
 */
export declare function localStorageAdapter(prefix?: string): TokenStorage;
/**
 * Storage that lives only as long as the object.
 *
 * The default outside browsers, and the right choice on a server, where one
 * instance per request keeps sessions from leaking between users.
 */
export declare function memoryStorage(): TokenStorage;
//#endregion
//#region src/mod.d.ts
/** Every procedure in the Gatekeeper contract. */
export type GatekeeperClient = RouterContractClient<typeof contract>;
type PasskeysApi = Omit<GatekeeperClient['passkey'], 'authenticateVerify'> & {
  authenticateVerify: (input: Parameters<GatekeeperClient['passkey']['authenticateVerify']>[0]) => Promise<AuthResult>;
};
type MfaApi = Omit<GatekeeperClient['mfa'], 'stepUp' | 'verifyChallenge'> & {
  verifyChallenge: (input: Parameters<GatekeeperClient['mfa']['verifyChallenge']>[0]) => Promise<AuthResult>;
  stepUp: (input: Parameters<GatekeeperClient['mfa']['stepUp']>[0]) => Promise<Awaited<ReturnType<GatekeeperClient['mfa']['stepUp']>>>;
};
export interface GatekeeperOptions {
  /** Realm slug. Defaults to the automatically created `master` realm. */
  realm?: string;
  /**
   * BCP 47 language tag sent as `Accept-Language`. The server localizes typed
   * error messages to it; `code` and `data` are unaffected.
   */
  language?: string;
  /** Storage for the access and refresh tokens. */
  storage?: TokenStorage;
  /** Seconds before expiry at which the access token is refreshed. @default 30 */
  refreshSkew?: number;
}
export interface LegacyGatekeeperOptions extends GatekeeperOptions {
  /** Base URL of the Gatekeeper deployment. */
  url: string | URL;
  /** Called when the session ends. Use the `signout` event on new clients. */
  onSignOut?: () => void;
}
/** A browser or server-side client for one Gatekeeper deployment and realm. */
export declare class Gatekeeper extends EventTarget {
  #private;
  readonly auth: {
    signUp: (input: Parameters<GatekeeperClient['auth']['signUp']>[0]) => Promise<AuthResult>;
    signIn: (input: Parameters<GatekeeperClient['auth']['signInPassword']>[0]) => Promise<AuthResult>;
    requestOtp: GatekeeperClient['auth']['signInOtp'];
    verifyOtp: (input: Parameters<GatekeeperClient['auth']['verifyOtp']>[0]) => Promise<AuthResult>;
    verifySignedPayload: (input: Parameters<GatekeeperClient['auth']['verifySignedPayload']>[0]) => Promise<AuthResult>;
    verifyPasskey: (input: Parameters<GatekeeperClient['passkey']['authenticateVerify']>[0]) => Promise<AuthResult>;
    complete: (result: AuthResult) => Promise<AuthResult>;
    getSession: GatekeeperClient['auth']['getSession'];
    getMe: GatekeeperClient['profile']['get'];
    verifyEmail: (input: Parameters<GatekeeperClient['auth']['verifyEmail']>[0]) => Promise<AuthResult>;
    requestPasswordReset: GatekeeperClient['auth']['requestPasswordReset'];
    resetPassword: GatekeeperClient['auth']['resetPassword'];
    changePassword: GatekeeperClient['auth']['changePassword'];
    signOut: (scope?: 'local' | 'global') => Promise<void>;
    switchOrg: (orgId: string | null) => Promise<Awaited<ReturnType<GatekeeperClient['auth']['switchOrg']>>>;
    getAccessToken: () => Promise<string | null>;
    isAuthenticated: () => Promise<boolean>;
    oauth: {
      start: GatekeeperClient['auth']['oauthStart'];
      exchange: (input: Parameters<GatekeeperClient['auth']['oauthExchange']>[0]) => Promise<AuthResult>;
    };
    sessions: {
      list: GatekeeperClient['auth']['listSessions'];
      revoke: GatekeeperClient['auth']['revokeSession'];
    };
    profile: GatekeeperClient['profile'];
    passkeys: PasskeysApi;
    mfa: MfaApi;
  };
  readonly sso: {
    discover: GatekeeperClient['sso']['discover'];
    start: GatekeeperClient['sso']['start'];
    providers: {
      create: GatekeeperClient['sso']['create'];
      list: GatekeeperClient['sso']['list'];
      remove: GatekeeperClient['sso']['remove'];
      metadata: GatekeeperClient['sso']['metadata'];
    };
  };
  readonly health: GatekeeperClient['health'];
  readonly humanVerification: GatekeeperClient['humanVerification'];
  readonly org: GatekeeperClient['org'];
  readonly authz: GatekeeperClient['authz'];
  readonly hooks: GatekeeperClient['hooks'];
  readonly admin: GatekeeperClient['admin'];
  constructor(url: string | URL, options?: GatekeeperOptions);
}
/** Creates a {@link Gatekeeper} using the pre-0.2 options-object API. */
export declare function createGatekeeper(options: LegacyGatekeeperOptions): Gatekeeper;
//#endregion
export type { TokenStorage };