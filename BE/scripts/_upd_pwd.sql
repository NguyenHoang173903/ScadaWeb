UPDATE public."Users"
SET "PasswordHash" = '$argon2id$v=19$m=65536,t=3,p=4$shw7Ed89uW0gHXiinBcs9g$Aej6ROO0P2B02Pytj/cA7pjGpbkmx1cQ81USjeLnXrQ',
    "FailedLoginCount" = 0,
    "LockoutUntil" = NULL,
    "MustChangePassword" = false,
    "PasswordUpdatedAt" = now(),
    "UpdatedTime" = now()
WHERE "Username" IN ('admin','viewer','operator','technical');

SELECT "Username", left("PasswordHash",55) AS prefix, "FailedLoginCount" FROM public."Users" ORDER BY "Id";