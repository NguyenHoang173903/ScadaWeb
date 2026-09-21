UPDATE public."Users" a
SET "PasswordHash" = s."PasswordHash",
    "FailedLoginCount" = 0,
    "LockoutUntil" = NULL,
    "UpdatedTime" = now()
FROM public."Users" s
WHERE a."Username" IN ('admin','viewer','operator','technical')
  AND s."Username" = 'smoketest';

SELECT "Username","Role","FailedLoginCount","LockoutUntil" IS NOT NULL AS locked FROM public."Users" ORDER BY "Id";