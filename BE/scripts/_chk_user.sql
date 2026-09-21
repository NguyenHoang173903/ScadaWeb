SELECT "Username", length("PasswordHash") AS len, left("PasswordHash", 60) AS prefix FROM public."Users" WHERE "Username"='admin';
